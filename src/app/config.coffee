assert = require('./dscommon/util').assert
validate = require('./dscommon/util').validate
serviceOwner = require('./dscommon/util').serviceOwner

DSObject = require './dscommon/DSObject'


module.exports = (ngModule = angular.module 'config', [
  'LocalStorageModule'
]).name

ngModule.config ['localStorageServiceProvider', ((localStorageServiceProvider) ->
  localStorageServiceProvider.setPrefix 'rms'
  return)]

ngModule.run ['$rootScope', 'config', (($rootScope, config) ->
  $rootScope.config = config
  return)]

ngModule.factory 'config',
  ['$http', 'localStorageService',
  (($http, localStorageService) ->

    class Config extends DSObject
      @begin 'Config'

      @propStr 'token', null, validate.trimString
      @propStr 'teamwork', 'http://teamwork.webprofy.ru/'
      @propCalc 'hasRoles', (-> @teamwork == 'http://teamwork.webprofy.ru/')

      @propNum 'hResizer'
      @propNum 'vResizer'

      @onAnyPropChange ((item, propName, newVal, oldVal) -> # save to local storage
        if typeof newVal != 'undefined'
          localStorageService.set propName, newVal
        else
          localStorageService.remove propName
        return)

      hasFilter: (->
        url = @get 'teamwork'
        return url=='http://teamwork.webprofy.ru/' || url=='https://delightsoft.teamworkpm.net/')

      @end()

    config = serviceOwner.add(new Config serviceOwner, 'config')

    for name, desc of Config::__props # load from local storage
      if !desc.readonly && typeof (v = localStorageService.get name) != 'undefined'
        if name != 'teamworkNotFormatted'
          config.set name, v if v

    return config)]

