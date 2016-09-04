assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

DSObject = require('../../dscommon/DSObject')
Project = require('./Project')

module.exports = class TodoList extends DSObject
  @begin 'TodoList'

  @addPool()

  @str = ((v) -> if v == null then '' else v.get('name'))

  @propNum 'id', init: 0
  @propStr 'name'
  @propDoc 'project', Project

  @end()

