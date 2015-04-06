DSObject = require('../../../../dscommon/DSObject')

module.exports = class Day extends DSObject
  @begin 'Day'
  @propMoment 'date'
  @propNum 'index'
  @propNum 'x'
  @propDuration 'workTime'
  @end()

