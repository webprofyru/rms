assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

DSDocument = require('../dscommon/DSDocument')
DSEnum = require('../dscommon/DSEnum')

module.exports = class Person extends DSDocument
  @begin 'Person'

  DSEnum.addPropType @

  @addPool()

  @str = ((v) -> if v == null then '' else v.get('name'))

  @propNum 'id', 0
  @propStr 'name'
  @propStr 'avatar'
  @propStr 'email'
  @propDSEnum 'roles'

  @propNum 'companyId'

  @propDuration 'contractTime'

  constructor: ((referry, key) ->
    DSDocument.call @, referry, key
    @set 'contractTime', moment.duration(8, 'hours')
    return)

  @end()

