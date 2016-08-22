DSObject = require('../../../../../dscommon/DSObject')
validate = require('../../../../../dscommon/util').validate

Person = require('../../../../models/Person')
Project = require('../../../../models/Project')
ProjectView = require('./ProjectView')
TodoListView = require('./TodoListView')

Row = require('../../view1/models/Row')

module.exports = class PersonView extends DSObject
  @begin 'PersonView'

  @propDoc  'row', Row
  @propPool 'poolProjects', ProjectView
  @propList 'projects', TodoListView

  @end()

