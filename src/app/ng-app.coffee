module.exports = (ngModule = angular.module 'app', [
  'ui.router' # static/libs/angular-ui/ui-router-0.2.13/angular-ui-router.js
  'ui.select' # static/libs/ui-select-0.10.0/select.js

  'LocalStorageModule' # from https://github.com/grevory/angular-local-storage/blob/master/src/angular-local-storage.js

  require './ui/ui'
  require './data/dsDataService'
  require './svc/people/people'
  require './svc/config/config'
  require './svc/data/data'
]).name

ngModule.run ['config', '$rootScope', ((config, $rootScope)->
  $rootScope.Math = Math
  $rootScope.taskModal = {}
  return)]

ngModule.config [
  '$urlRouterProvider', '$stateProvider', '$locationProvider',
  (($urlRouterProvider, $stateProvider, $locationProvider) ->
    $locationProvider.html5Mode true
    $urlRouterProvider.otherwise '/'
    return)]
