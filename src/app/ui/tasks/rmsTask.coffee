module.exports = (ngModule = angular.module 'ui/tasks/rmsTask', []).name

ngModule.run ['$rootScope', (($rootScope) ->
  $rootScope.modal = {type: null}
  return)]

ngModule.directive 'rmsTask', ['$rootScope', '$timeout', (($rootScope, $timeout) ->
    restrict: 'A'
    require: 'ngModel'
    link: (($scope, element, attrs, model) ->

      element.on 'click', ((e)->
        e.stopPropagation()
        if (modal = $rootScope.modal).type != 'task-edit'
          $rootScope.modal =
            type: 'task-edit'
            task: model.$viewValue
            pos: element.offset()
          $rootScope.$digest()
        else if modal.task != model.$viewValue
          $rootScope.modal = {type: null}
          $rootScope.$digest()
          $timeout (-> # TODO: Change to $scope.$evalAsync
            $rootScope.modal =
              type: 'task-edit'
              task: model.$viewValue
              pos: element.offset()
            return), 0
        return)

      element.on 'mouseover', ((e)->
        e.stopPropagation()
        if 0 <= ['task-info', null].indexOf($rootScope.modal.type)
          $rootScope.modal =
            type: 'task-info'
            task:  model.$viewValue
            pos: element.offset()
          $rootScope.$digest()
        return)

      element.on 'mouseleave', ((e)->
        e.stopPropagation()
        if 0 <= ['task-info'].indexOf($rootScope.modal.type)
          $rootScope.modal =
            type: null
          $rootScope.$digest()
        return)

      $scope.$watch "#{attrs.rmsTask}.$u", ((val) ->
        if val
          # The jQuery event object does not have a dataTransfer property
          el = element[0]
          el.draggable = true
          el.addEventListener 'dragstart', ((e)-> # Note: If we use jQuery.on for this event, we don't have e.dataTransfer option
            $rootScope.modal =
              type: 'drag-start'
              task: $scope.$eval attrs.rmsTask
              scope: $scope
            element.addClass 'drag-start'
            $rootScope.$digest()
            e.dataTransfer.setDragImage($('#task-drag-ghost')[0], 20, 20)
            return)
          element.on 'dragend', ((e)->
            $rootScope.modal = {type: null}
            element.removeClass 'drag-start'
            $rootScope.$digest()
            return)
        else
          el = element[0]
          el.draggable = false
          el.removeEventListener 'dragstart'
          element.off 'dragend'
        return)

      return)
    )]

ngModule.directive 'setTaskVisible', [(() ->
    restrict: 'A'
    link: (($scope, element, attrs) ->
      path = attrs.setTaskVisible
      $scope.$eval "#{path}.setVisible(true)"
      $scope.$on '$destroy', (->
        $scope.$eval "#{path}.setVisible(false)"
        return)
      return)
    )]
