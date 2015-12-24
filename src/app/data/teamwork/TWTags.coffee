module.exports = (ngModule = angular.module 'data/teamwork/TWTags', [
  require '../../dscommon/DSDataSource'
  require '../../dscommon/DSDataSimple'
]).name

assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

Tag = require '../../models/Tag'

# Zork: Note: This code is not in use.  Instead we are loading tags right with loading tasks.  Might be later this code will be used in task tags editing.

ngModule.factory 'TWTags', ['DSDataSimple', 'DSDataSource', '$rootScope', '$q', ((DSDataSimple, DSDataSource, $rootScope, $q) ->

  return class TWTags extends DSDataSimple

    @begin 'TWTags'

    @addPool()

    @propSet 'tags', Tag

    @ds_dstr.push (->
      @__unwatch2()
      return)

    init: ((dsDataService) ->
      @set 'request', "tags.json"
      @__unwatch2 = DSDataSource.setLoadAndRefresh.call @, dsDataService
      @init = null
      return)

    importResponse: ((json) ->

      tagsMap = {}

      for jsonTag in json['tags']

        person = Tag.pool.find @, jsonTag['name'], tagsMap

        person.set 'id', parseInt jsonTag['id']
        person.set 'name', jsonTag['name']
        person.set 'color', jsonTag['color']

      @get('tagsSet').merge @, tagsMap

      return true)

    @end())]


