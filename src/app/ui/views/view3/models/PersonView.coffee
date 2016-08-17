DSObject = require('../../../../../dscommon/DSObject')
validate = require('../../../../../dscommon/util').validate

Person = require('../../../../models/Person')
Project = require('../../../../models/Project')
TodoListView = require('./TodoListView')

module.exports = class ProjectView extends DSObject
  @begin 'ProjectView'

  @propDoc  'person', Person
  @propPool 'poolProjects', ProjectView
  @propList 'projects', TodoListView

  @end()

