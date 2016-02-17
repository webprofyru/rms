module.exports = (ngModule = angular.module 'app', [
  'ui.router' # static/libs/angular-ui/ui-router-0.2.13/angular-ui-router.js
  'ui.select' # static/libs/ui-select-0.10.0/select.js

  require './ui/ui'
  require './data/dsDataService'
  require './svc/emails/emails'
#  require './svc/people/people'
#  require './svc/config/config'
#  require './svc/data/data'
  require './db'
]).name

ngModule.run ['config', '$rootScope', 'db', ((config, $rootScope, db)->
  $rootScope.Math = Math
  $rootScope.taskModal = {}
#  db.logQuota()
  return)]

ngModule.config [
  '$urlRouterProvider', '$stateProvider', '$locationProvider',
  (($urlRouterProvider, $stateProvider, $locationProvider) ->
    $locationProvider.html5Mode true
    $urlRouterProvider.otherwise '/'
    return)]
