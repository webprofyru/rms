assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

DSObject = require('../dscommon/DSObject')

module.exports = class Tag extends DSObject
  @begin 'Tag'

  @addPool()

  @str = ((v) -> if v == null then '' else v.get('name'))

  @propNum 'id', 0
  @propStr 'name'
  @propStr 'color'

  @end()

