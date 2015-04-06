DSObject = require('../../../../dscommon/DSObject')
validate = require('../../../../dscommon/util').validate

Task = require('../../../../models/Task')
TodoList = require('../../../../models/TodoList')

module.exports = class TodoListView extends DSObject
  @begin 'TodoListView'

  @propDoc  'todoList', TodoList
  @propList 'tasks', Task
  @propNum  'tasksCount', 0
  @propDuration 'totalEstimate'
  @propBool 'isExpand', true

  @end()

