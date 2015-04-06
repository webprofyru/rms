assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

DSDocument = require('../dscommon/DSDocument')

module.exports = class Project extends DSDocument
  @begin 'Project'

  @addPool()

  @str = ((v) -> if v == null then '' else v.get('name'))

  @propNum 'id', 0
  @propStr 'name'

  @end()

