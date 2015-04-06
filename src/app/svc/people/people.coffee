base64 = require '../../utils/base64'

module.exports = (ngModule = angular.module 'svc-people', [
  'ui.router'
  require '../../config']).name

ngModule.config [
  '$urlRouterProvider', '$stateProvider', '$locationProvider', '$httpProvider'
  (($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider) ->

    $stateProvider.state
      name: 'people'
      url: '/people.html'
      templateUrl: -> return './svc/people/main.html'
      controller: ctrl

    return)]

ctrl = ['$scope', '$http', 'config', (($scope, $http, config) ->

  $scope.json = {}

  $http.get "#{config.get 'teamwork'}/people.json", {headers: Authorization:  "Basic #{base64.encode(config.get 'token')}"}
    .success ((data, status) ->
      roles = [
        {role: 'designer', name: 'Дизайнер'},
        {role: 'copywriter', name: 'Автор'},
        {role: 'manager', name: 'Менеджер'},
        {role: 'tester', name: 'Тестер'}]
      people = _.map data.people, ((v, i) ->
        return {
          id: +v.id
#          role: roles[i % roles.length].role
          role: ''
          name: "#{v['first-name']} #{v['last-name']}".trim()
          email: v['email-address']})
      $scope.json = JSON.stringify {roles, people}, undefined, '  '
      return)

  return)]
