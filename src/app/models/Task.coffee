assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

time = require('../ui/time')

DSDocument = require('../dscommon/DSDocument')

Project = require('./Project')
Person = require('./Person')
TodoList = require('./TodoList')
TaskTimeTracking = require('./TaskTimeTracking')

Comments = require('./types/Comments')
TaskSplit = require('./types/TaskSplit')

module.exports = class Task extends DSDocument
  @begin 'Task'

  @addPool true
  Comments.addPropType @
  TaskSplit.addPropType @

  @str = ((v) -> if v == null then '' else v.get('title'))

  @propNum 'id', 0
  @propStr 'title'
  (@propDuration 'estimate').str = ((v) ->
    hours = Math.floor v.asHours()
    minutes = v.minutes()
    res = if hours then "#{hours}h" else ''
    res += " #{minutes}m" if minutes
    res = '0' if !res
    return res)
  (@propMoment 'duedate').str = ((v) -> if v == null then '' else v.format 'DD.MM.YYYY')
  (@propMoment 'startDate').str = ((v) -> if v == null then '' else v.format 'DD.MM.YYYY')

  @propDoc 'creator', Person
  # TODO: No support for multiple persons
  @propDoc 'responsible', Person
  @propDoc 'todoList', TodoList
  @propDoc 'project', Project
  @propTaskRelativeSplit 'split'

  @propStr 'description'
  @propComments 'comments'

  # Note: null - time tracking is not expected, (timeTracking.isReady == false) - time data is not loaded yet
  @propDoc 'timeTracking', TaskTimeTracking
  @propStr 'firstTimeEntryId'

  @propBool 'completed'
  @propBool 'isReady'

  #  @propCalc 'isOverdue', (-> (duedate = @get('duedate')) != null && duedate < time.today)
  isOverdue: (-> (duedate = @get('duedate')) != null && duedate < time.today)

  timeWithinEstimate: (->
    return 0 if (estimate = @get('estimate')) == null
    return Math.min(100, Math.round(@get('timeTracking').get('totalMin') * 100 / estimate.asMinutes())))

  timeAboveEstimate: (->
    return 0 if (estimate = @get('estimate')) == null
    return if ((percent = Math.round(@get('timeTracking').get('totalMin') * 100 / estimate.asMinutes())) <= 100) then 0 else if percent > 200 then 100 else (percent - 100))

  timeReported: (->
    return '' if (estimate = @get('estimate')) == null
    return if ((percent = Math.round(@get('timeTracking').get('totalMin') * 100 / estimate.asMinutes())) > 200) then "#{percent} %" else '')

  setVisible: ((isVisible) ->
    if isVisible
      if (@__visCount = (@__visCount || 0) + 1) == 1
        @get('timeTracking')?.setVisible true
    else if --@__visCount == 0
        @get('timeTracking')?.setVisible false
    return)

  @end()

