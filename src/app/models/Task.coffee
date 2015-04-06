assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

DSDocument = require('../dscommon/DSDocument')

Project = require('./Project')
Person = require('./Person')
TodoList = require('./TodoList')

TaskSplit = require('./types/TaskSplit')

module.exports = class Task extends DSDocument
  @begin 'Task'

  @addPool true
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
#  (@propMoment 'startDate').str = ((v) -> if v == null then '' else v.format 'DD.MM.YYYY')

  @propDoc 'creator', Person
  # TODO: No support for multiple persons
  @propDoc 'responsible', Person
  @propDoc 'todoList', TodoList
  @propDoc 'project', Project
  @propTaskRelativeSplit 'split'

  @propStr 'description'

  @end()

