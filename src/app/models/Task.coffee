assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

time = require('../ui/time')

DSDocument = require('../../dscommon/DSDocument')

Project = require('./Project')
Person = require('./Person')
TodoList = require('./TodoList')
TaskTimeTracking = require('./TaskTimeTracking')
Tag = require './Tag'

DSTags = require('../../dscommon/DSTags')

Comments = require('./types/Comments')
TaskSplit = require('./types/TaskSplit')

module.exports = class Task extends DSDocument
  @begin 'Task'

  Comments.addPropType @
  TaskSplit.addPropType @
  DSTags.addPropType @

  @defaultTag = defaultTag = {name: '[default]', priority: 100}

  @addPool true

  processTagsEditable =
    __onChange: (task, propName, val, oldVal) ->
      switch propName
        when 'plan' # sync tags with prop 'plan' value
          tags = task.get('tags')
          if tags
            tags = tags.clone @
            if val
              tags.set Task.planTag, (planTag = Tag.pool.find @, Task.planTag)
              planTag.release @
              task.set 'tags', tags
            else
              tags.set Task.planTag, false
              task.set 'tags', if tags.empty() then null else tags
            tags.release @
          else
            (newTags = {})[Task.planTag] = planTag = Tag.pool.find @, Task.planTag
            tags = new DSTags @, newTags
            planTag.release @
            task.set 'tags', tags
            tags.release @
          Task.TWTask.calcTaskPriority task
        when 'tags'
          # Note: Task.TWTask will be defined in TWTask code
          Task.TWTask.calcTaskPriority task
      return

  processTagsOriginal =
    __onChange: (task, propName, val, oldVal) =>
      if propName == 'tags'
        Task.TWTask.calcTaskPriority task
      return

  @ds_ctor.push ->
    if @__proto__.constructor.ds_editable # work only for editable version
      if @hasOwnProperty '$ds_evt' then @$ds_evt.push processTagsEditable else @$ds_evt = [processTagsEditable]
    else
      if @hasOwnProperty '$ds_evt' then @$ds_evt.push processTagsOriginal else @$ds_evt = [processTagsOriginal]
    return

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

  @propBool 'plan' # TODO: Remove - replace by tags
  @propDSTags 'tags'

  # calculated props
  @propNum 'priority', 100, null, true
  @propObj 'style', (-> defaultTag), null, true

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

  grade: (->
    return '' if (estimate = @get('estimate')) == null
    return 'easy' if (estimate.asMinutes() < 60)
    return 'medium' if (estimate.asMinutes() >= 60 && estimate.asMinutes() < 240)
    return 'hard' if (estimate.asMinutes() >= 240 && estimate.asMinutes() < 480)
    return 'complex' if (estimate.asMinutes() >= 480))

  setVisible: ((isVisible) ->
    if isVisible
      if (@__visCount = (@__visCount || 0) + 1) == 1
        @get('timeTracking')?.setVisible true
    else if --@__visCount == 0
        @get('timeTracking')?.setVisible false
    return)

  @end()

  originalEditableInit = @Editable::init

  @Editable::init = ->
    originalEditableInit.apply @, arguments
    Task.TWTask.calcTaskPriority @
    return


