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

VER_MAJOR = 1
VER_MINOR = 0

ngModule.factory 'config',
  ['$http', 'localStorageService',
  (($http, localStorageService) ->

    class Config extends DSObject
      @begin 'Config'

      @propStr 'token', null, validate.trimString
      @propStr 'teamwork', 'http://teamwork.webprofy.ru/'
      @propCalc 'hasRoles', (-> @teamwork == 'http://teamwork.webprofy.ru/')
      @propCalc 'hasTimeReports', (-> @teamwork == 'http://teamwork.webprofy.ru/' || @teamwork == 'http://delightsoft.teamworkpm.net/')

      @propNum 'hResizer'
      @propNum 'vResizer'

      @propStr 'currentUserId'

      @propObj 'selectedRole'
      @propObj 'selectedCompany'
      @propObj 'selectedLoad'

      @propNum 'histStart', -1 # first page of time-entries history within time.historyLimit range

      @onAnyPropChange ((item, propName, newVal, oldVal) -> # save to local storage
        if propName == 'teamwork' || propName == 'token'
          @set 'histStart', -1
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

    keepConnection = true
    keepOtherOptions = true

    verMajor = 1
    verMinor = 0

    if typeof (ver = localStorageService.get 'ver') == 'string'
      if (verParts = ver.split('\.')).length = 2
        verMajor = parseInt(verParts[0])
        verMinor = parseInt(verParts[1])

    if !(keepConnection = (verMajor == VER_MAJOR)) then keepOtherOptions = false
    else keepOtherOptions = verMinor == VER_MINOR
    localStorageService.set 'ver', "#{VER_MAJOR}.#{VER_MINOR}" if !keepOtherOptions

    if keepConnection
      for name, desc of Config::__props # load from local storage
        if keepOtherOptions || name == 'teamwork' || name == 'token'
          if !desc.readonly && typeof (v = localStorageService.get name) != 'undefined'
            config.set name, v if v

    return config)]

