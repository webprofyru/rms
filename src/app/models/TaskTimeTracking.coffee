DSObject = require('../dscommon/DSObject')

module.exports = class TaskTimeTracking extends DSObject
  @begin 'TaskTimeTracking'

  @addPool true

  @propNum 'taskId', 0

  @propBool 'isReady'

  @propNum 'totalMin', 0
  @propNum 'priorTodayMin', 0

  @propObj 'timeEntries', {}

  # setVisible(isVisible) is implemented in the TWTimeTracking

  @end()
