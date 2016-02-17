DSObject = require('../../dscommon/DSObject')

Person = require '../../app/models/Person'
Project = require '../../app/models/Project'

module.exports = class PeriodTimeTracking extends DSObject
  @begin 'PeriodTimeTracking'

  @addPool()

  @propDoc 'person', Person
  @propDoc 'project', Project

  @propNum 'totalMin', 0

  @end()
