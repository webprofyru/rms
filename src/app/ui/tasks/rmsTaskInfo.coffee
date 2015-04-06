module.exports = (ngModule = angular.module 'ui/tasks/rmsTaskInfo', []).name

assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

DSObject = require('../../dscommon/DSObject')

ngModule.directive 'rmsTaskInfo', ['$rootScope', '$window', (($rootScope, $window) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->

      modal = $rootScope.modal

      if ($(window).height() > (modal.pos.top + 150))
        $scope.top = Math.ceil(modal.pos.top + 50)
      else
        $scope.top = Math.ceil(modal.pos.top - 100)

      if ($(window).width() - $('#sidebar').innerWidth() > modal.pos.left )
        $scope.left = Math.ceil(modal.pos.left + 95)
      else
        $scope.left = Math.ceil(modal.pos.left - 300)

      $scope.task = modal.task
      $scope.close = close = (->
        $rootScope.modal = {type: null}
        return)

      element.on 'click.rms-task', ((e)-> e.stopPropagation(); return)
      $(window).on 'click.rms-task', (-> close(); return)
      $scope.$on '$destroy', (->
        element.off 'click.rms-task'
        $($window).off 'click.rms-task'
        return)


      return)

    )]
