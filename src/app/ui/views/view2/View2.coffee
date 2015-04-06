module.exports = (ngModule = angular.module 'ui/views/view2/View2', [
  require '../../../data/dsChanges'
  require '../../../data/dsDataService'
  require('../../../dscommon/DSView')
  require('../view1/View1')
]).name

assert = require('../../../dscommon/util').assert

DSDigest = require '../../../dscommon/DSDigest'

# Global models
Task = require('../../../models/Task')

# View specific models
TaskView = require('../view1/models/TaskView')

ngModule.controller 'View2', ['$scope', 'View2', (($scope, View2) ->
  $scope.view = new View2 $scope, 'view2'
  return)]

ngModule.factory 'View2', ['View1', 'DSView', '$rootScope', '$log', ((View1, DSView, $rootScope, $log) ->

  return class View2 extends DSView
    @begin 'View2'

    @propData 'tasksOverdue', Task, {filter: 'overdue'}
    @propData 'tasksNotassigned', Task, {filter: 'notassigned'}

    @propList 'tasksOverdue', Task

    @propPool 'poolTasksNotassignedViews', TaskView
    @propList 'tasksNotassigned', TaskView

    constructor: (($scope, key) ->
      DSView.call @, $scope, key

      $scope.$watch (-> [$scope.$parent.view.startDate?.valueOf(), $scope.mode]), ((args) =>
        [startDateVal, mode] = args
        @dataUpdate {startDate: moment(startDateVal), endDate: moment(startDateVal).add(6, 'days'), mode}
        return), true

      return)

    render: (->
      startDate = @__scope.$parent.view.startDate

      if !((status = @get('data').get('tasksOverdueStatus')) == 'ready' || status == 'update')
        @get('tasksOverdueList').merge @, []
      else
        tasksOverdue = _.map @get('data').get('tasksOverdue'), ((task) => task.addRef @; return task)
        tasksOverdue.sort((left, right) -> if (l = left.get('duedate').valueOf()) == (r = right.get('duedate').valueOf()) then 0 else r - l)
        @get('tasksOverdueList').merge @, tasksOverdue

      if !((status = @get('data').get('tasksNotassignedStatus')) == 'ready' || status == 'update')
        @get('tasksNotassignedList').merge @, []
      else
        poolTasksNotassignedViews = @get('poolTasksNotassignedViews')
        tasksNotassigned = @get('tasksNotassignedList').merge @, _.map @get('data').get('tasksNotassigned'), ((task) =>
          taskView = poolTasksNotassignedViews.find @, task.$ds_key
          taskView.set 'task', task
          return taskView)

        View1.layoutTaskView startDate, tasksNotassigned

      return)

    @end())]

ngModule.directive 'rmsView2DayDropTask', [
  'dsChanges', '$rootScope',
  ((dsChanges, $rootScope) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->
      element.on 'dragover', ((e)->
        return false)
      element.on 'drop', ((e)->
        e.stopPropagation()
        DSDigest.block (->
          (hist = dsChanges.get('hist')).startBlock()
          try
            (task = $rootScope.modal.task).set 'responsible', null
            task.set 'duedate', $scope.day.get 'date'
          finally
            hist.endBlock()
          return)
        $rootScope.$digest()
        return false)
      return)
  )]



