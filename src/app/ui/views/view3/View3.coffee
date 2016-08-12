module.exports = (ngModule = angular.module 'ui/views/view3/View3', [
  require '../../../config'
  require '../../../data/dsDataService'
  require('../../../../dscommon/DSView')
  require '../../tasks/addCommentAndSave'
]).name

assert = require('../../../../dscommon/util').assert
error = require('../../../../dscommon/util').error

# Global models
Task = require('../../../models/Task')
TodoList = require('../../../models/TodoList')
Project = require('../../../models/Project')

# View specific models
ProjectView = require('./models/ProjectView')
TodoListView = require('./models/TodoListView')

ngModule.controller 'View3', ['$scope', 'View3', (($scope, View3) ->
  $scope.view = new View3 $scope, 'view3'
  return)]

ngModule.factory 'View3', ['DSView', 'config', '$rootScope', '$log', ((DSView, config, $rootScope, $log) ->

  return class View3 extends DSView
    @begin 'View3'

    @propData 'tasks', Task, {}

    @propPool 'poolProjects', ProjectView
    @propList 'projects', ProjectView

    @ds_dstr.push (->
      @__unwatchA()
      return)

    constructor: (($scope, key) ->
      DSView.call @, $scope, key

      @expandedProj = {}

      @__unwatchA = $scope.$watch (-> [$scope.mode, $scope.$parent.view.startDate?.valueOf(), $scope.sidebarTabs.active]),
        ((args) =>
          [mode, startDateVal, active] = args
          $rootScope.startDateVal = startDateVal
          $rootScope.view3ActiveTab = active
          switch active
            when 0 # no duedate
              @dataUpdate {filter: 'noduedate', mode}
            when 1 # next week
              if typeof startDateVal != 'number'
                $scope.sidebarTabs.active = 0
              else
                nextWeekStartDate = moment(startDateVal).add 1, 'week'
                nextWeekEndDate = moment(nextWeekStartDate).endOf 'week'
                @dataUpdate {filter: 'all', mode, startDate: nextWeekStartDate, endDate: nextWeekEndDate}
            when 2 # all tasks by project
              @dataUpdate {filter: 'all', mode}
          return), true

      $scope.toggleProjectExpanded = ((project) =>
        if assert
          error.invalidArg 'project' if !(project instanceof ProjectView)
        viewExpandedProj = if !(expandedProj = @expandedProj).hasOwnProperty (active = $scope.sidebarTabs.active)
            expandedProj[active] = viewExpandedProject = {}
          else expandedProj[active]
        return if viewExpandedProj.hasOwnProperty(projectKey = project.$ds_key)
            viewExpandedProj[projectKey] = !viewExpandedProj[projectKey]
          else viewExpandedProj[projectKey] = !(active != 2)) # 2 - all by project

      $scope.isProjectExpanded = ((project) =>
        if assert
          error.invalidArg 'project' if !(project instanceof ProjectView)
        if (expandedProj = @expandedProj).hasOwnProperty (active = $scope.sidebarTabs.active)
          if (viewExpandedProj = expandedProj[active]).hasOwnProperty(projectKey = project.$ds_key)
            return viewExpandedProj[projectKey]
        return active != 2) # 2 - all by project

      return)

    render: (->

      if !((status = @get('data').get('tasksStatus')) == 'ready' || status == 'update')
        @get('projectsList').merge @, []
        return

      tasksByTodoList = _.groupBy @get('data').get('tasks'), ((task) -> task.get('todoList').$ds_key)
      tasksByProject = _.groupBy tasksByTodoList, ((todoList) -> todoList[0].get('project').$ds_key)

      poolProjects = @get 'poolProjects'
      projects = @get('projectsList').merge @, (_.map tasksByProject, ((projectGroup, projectKey) =>
        projectView = poolProjects.find @, projectKey
        projectView.set 'project', Project.pool.items[projectKey]
        projectView.get('todoListsList').merge @, _.map projectGroup, ((todoListGroup) =>
          todoListKey = todoListGroup[0].get('todoList').$ds_key
          todoListView = projectView.poolTodoLists.find @, todoListKey
          todoListView.set 'todoList', TodoList.pool.items[todoListKey]
          todoListView.set 'tasksCount', _.size todoListGroup
          todoListView.set 'totalEstimate', _.reduce todoListGroup, ((sum, task) -> if (estimate = task.get('estimate')) then sum.add estimate else sum), moment.duration(0)
          todoListView.get('tasksList').merge @, _.map todoListGroup, ((task) => task.addRef @)
          return todoListView)
        return projectView)).sort ((left, right) ->
          if (leftLC = left.get('project').get('name').toLowerCase()) < (rightLC = right.get('project').get('name').toLowerCase()) then -1 else if leftLC > rightLC then 1 else 0)
      return)

    @end())]

ngModule.directive 'rmsView3DropTask', [
  '$rootScope', 'addCommentAndSave', 'getDropTasksGroup',
  ($rootScope, addCommentAndSave, getDropTasksGroup) ->
    restrict: 'A'
    scope: true
    link: ($scope, element, attrs) ->

      el = element[0]

      activeTab = if attrs.rmsView3DropTask.length > 0 then (do (tab = parseInt(attrs.rmsView3DropTask)) -> -> tab) else (-> $rootScope.view3ActiveTab)

      el.addEventListener 'dragover', (ev) ->
        ev.preventDefault()
        activeTab() == 2 # (ev) ->

      el.addEventListener 'drop', (ev) ->

        unless ev.ctrlKey && !(modal = $rootScope.modal).task.split && modal.task.duedate != null
          tasks = [$rootScope.modal.task]
        else # group movement, if task has no split and 'ctrl' key is pressed while operation
          tasks = getDropTasksGroup()

        addCommentAndSave tasks, ev.shiftKey, # You have to keep shift, if you need to make a comment
          duedate: if activeTab() == 0 then null else moment($rootScope.startDateVal).add(1, 'week')
          plan: false

        $rootScope.$digest()
        ev.stopPropagation()
        return false # (ev) ->

      return # link:
    ] # ($rootScope, addCommentAndSave) ->





