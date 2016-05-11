assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

DSDocument = require('../../dscommon/DSDocument')

module.exports = class Tag extends DSDocument
  @begin 'Tag'

  @addPool()

  @propNum 'id', 0
  @propStr 'name'
  @propStr 'color'

  @end()

