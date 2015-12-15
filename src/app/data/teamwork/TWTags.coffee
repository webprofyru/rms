module.exports = (ngModule = angular.module 'data/teamwork/TWTags', [
  require '../../dscommon/DSDataSource'
  require '../../dscommon/DSDataSimple'
]).name

assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

Tag = require '../../models/Tag'

ngModule.factory 'TWTags', ['DSDataSimple', 'DSDataSource', '$q', ((DSDataSimple, DSDataSource, $q) ->

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

        tag = Tag.pool.find @, "#{jsonTag['id']}", tagMap

        tag.set 'id', +jsonTag['id']
        tag.set 'name', jsonTag['name']
        tag.set 'color', jsonTag['color']

      @get('tagSet').merge @, tagMap

      return true)

    @end())]
