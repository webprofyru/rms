module.exports = (ngModule = angular.module 'ui/views/view2/View2', [
  require '../../../data/dsChanges'
  require '../../../data/dsDataService'
  require '../../../dscommon/DSView'
  require '../view1/View1'
  require '../../tasks/addCommentAndSave'
]).name

assert = require('../../../dscommon/util').assert

DSDigest = require '../../../dscommon/DSDigest'

# Global models
Task = require('../../../models/Task')

# View specific models
TaskView = require('../view1/models/TaskView')

ngModule.controller 'View2', ['$scope', 'View2', (($scope, View2) ->
  $scope.view = new View2 $scope, 'view2'
  $scope.tasksHeight = ((row)->
    return '' if !row.expand || _.isEmpty row.tasks
    return "height:#{52 * _.max(row.tasks, 'y').y + 100}px")
  return)]

ngModule.factory 'View2', ['View1', 'DSView', '$rootScope', '$log', ((View1, DSView, $rootScope, $log) ->

  return class View2 extends DSView
    @begin 'View2'

    @propData 'tasksOverdue', Task, {filter: 'overdue', watch: ['duedate', 'plan', 'estimate']}
    @propData 'tasksNotAssigned', Task, {filter: 'notassigned', watch: ['duedate', 'split', 'plan', 'estimate']}

    @propList 'tasksOverdue', Task

    @propPool 'poolTasksNotassignedViews', TaskView
    @propList 'tasksNotAssigned', TaskView
    @propNum  'tasksNotAssignedHeight', 0

    @ds_dstr.push (->
      @__unwatchA()
      return)

    constructor: (($scope, key) ->
      DSView.call @, $scope, key

      @__unwatchA = $scope.$watch (-> [$scope.$parent.view.startDate?.valueOf(), $scope.mode]), ((args) =>
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
        tasksOverdue.sort View1.tasksSortRule
        @get('tasksOverdueList').merge @, tasksOverdue

      if !((status = @get('data').get('tasksNotAssignedStatus')) == 'ready' || status == 'update')
        @get('tasksNotAssignedList').merge @, []
        @set 'tasksNotAssignedHeight', 0
      else
        poolTasksNotassignedViews = @get('poolTasksNotassignedViews')
        tasksNotAssigned = @get('tasksNotAssignedList').merge @, _.map @get('data').get('tasksNotAssigned'), ((task) =>
          taskView = poolTasksNotassignedViews.find @, task.$ds_key
          taskView.set 'task', task
          return taskView)

        @set 'tasksNotAssignedHeight', View1.layoutTaskView startDate, tasksNotAssigned

      return)

    @end())]

ngModule.directive 'rmsView2DayDropTask', [
  'dsChanges', '$rootScope', 'addCommentAndSave',
  ((dsChanges, $rootScope, addCommentAndSave) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->
      element.on 'dragover', ((e)->
        return false)
      element.on 'drop', ((e)->
        addCommentAndSave $rootScope.modal.task, e.shiftKey, # Zork: I turned this over - now you have to keep shift, if you need to make a comment
          responsible: null
          duedate: $scope.day.get 'date'
          plan: false
        $rootScope.$digest()
        return false)
      return)
  )]
