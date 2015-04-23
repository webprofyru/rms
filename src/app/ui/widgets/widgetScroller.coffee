module.exports = (ngModule = angular.module 'ui/widgets/widgetScroller', []).name

ngModule.directive 'widgetScroller',
['$rootScope', '$timeout',
(($rootScope, $timeout) ->
  restrict: 'A'
  link: (($scope, element, attrs, model) ->
    options = $scope.$eval attrs.widgetScroller
    element.mCustomScrollbar options
    $scope.$on '$destroy', (->
      element.mCustomScrollbar 'destroy'
      return)
    return))]
