DSObject = require('../../../../dscommon/DSObject')
validate = require('../../../../dscommon/util').validate

Project = require('../../../../models/Project')
TodoListView = require('./TodoListView')

module.exports = class ProjectView extends DSObject
  @begin 'ProjectView'

  @propDoc  'project', Project
  @propPool 'poolTodoLists', TodoListView
  @propList 'todoLists', TodoListView

  @end()

