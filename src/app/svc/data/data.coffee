module.exports = (ngModule = angular.module 'svc-data', [
]).name

#Task = require '../../models/Task'
#Person = require '../../models/Person'

ngModule.config [
  '$urlRouterProvider', '$stateProvider', '$locationProvider', '$httpProvider'
  (($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider) ->

    $stateProvider.state
      name: 'data'
      url: '/data.html'
      templateUrl: -> return './svc/data/main.html'

    return)]

ngModule.run [
  'View1', 'View2', 'config', 'dsDataService', '$log', '$q', '$rootScope',
  ((View1, View2, config, dsDataService, $log, $q, $rootScope) ->

#    view = new View1 'view1', $rootScope
#    view.set 'startDate', moment('2015-01-20')

    return)]