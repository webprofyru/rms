module.exports = (ngModule = angular.module 'ui/account/rmsAccount', [
  require '../../config'
]).name

ngModule.run ['$rootScope', (($rootScope) ->
  $rootScope.isShowAccount = false
  $rootScope.showAccount = (->
    $rootScope.isShowAccount = !$rootScope.isShowAccount
    return)
  return)]

ngModule.directive 'rmsAccount', ['config', '$rootScope', ((config, $rootScope) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->
      $scope.$evalAsync (-> $($('input', element)[1]).select(); return)
      $scope.url = config.teamwork
      $scope.token = config.token
      $scope.refreshPeriod = config.refreshPeriod
      $scope.save = (->
        url = $scope.url.trim()
        token = $scope.token.trim()
        if url.length > 0
          if url.charAt(url.length - 1) != '/'
            url += '/'
        config.teamwork = url
        config.token = token
        config.refreshPeriod = $scope.refreshPeriod
        close()
        return)
      $scope.close = close = (->
        $rootScope.isShowAccount = false
        return)
      return)
    )]
