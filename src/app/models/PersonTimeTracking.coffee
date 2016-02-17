DSObject = require('../../dscommon/DSObject')

Task = require('../models/Task')

module.exports = class PersonTimeTracking extends DSObject
  @begin 'PersonTimeTracking'

  @addPool true

  @propNum 'personId', 0
  @propMoment 'date'

  @propNum 'taskId', 0
  @propDoc 'task', Task

  @propNum 'timeMin', 0

  # setVisible(isVisible) is implemented in the TWTask

  @end()
