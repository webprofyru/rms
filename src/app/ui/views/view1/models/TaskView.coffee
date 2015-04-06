DSObject = require('../../../../dscommon/DSObject')
validate = require('../../../../dscommon/util').validate

Task = require('../../../../models/Task')

module.exports = class TaskView extends DSObject
  @begin 'TaskView'

  @propDoc 'task', Task
  @propNum 'x', 0, validate.required
  @propNum 'y', 0, validate.required
  @propNum 'len', 1, validate.required
  @propObj 'split'

  @end()

