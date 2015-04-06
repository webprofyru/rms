module.exports = (ngModule = angular.module 'svc-config', [
  require '../../config']).name

ngModule.config [
  '$urlRouterProvider', '$stateProvider', '$locationProvider', '$httpProvider'
  (($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider) ->

    $stateProvider.state
      name: 'config'
      url: '/config.html'
      templateUrl: -> return './svc/config/main.html'
      controller: ctrl

    return)]

ctrl =
  ['$scope', 'config',
  (($scope, config) ->

    $scope.config = config

    $scope.formatJson = ((json) -> JSON.stringify json, undefined, '  ')

    return)]


