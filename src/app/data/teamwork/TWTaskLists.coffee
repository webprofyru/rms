module.exports = (ngModule = angular.module 'data/teamwork/TWTaskLists', [
  require '../../../dscommon/DSDataSource'
  require './DSDataTeamworkPaged'
]).name

assert = require('../../../dscommon/util').assert
error = require('../../../dscommon/util').error

Project = require '../../models/Project'
TaskList = require '../../models/TaskList'

ngModule.factory 'TWTaskLists', ['DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$q', ((DSDataTeamworkPaged, DSDataSource, $rootScope, $q) ->

  return class TWTaskLists extends DSDataTeamworkPaged

    @begin 'TWTaskLists'

    @addPool()

    @propSet 'taskLists', TaskList
    @propDoc 'project', Project

    @ds_dstr.push (->
      @__unwatch2()
      return)

    init: ((dsDataService) ->
      @set 'project', project = @get('params').project
      @set 'request', "projects/#{@project.get('id')}/tasklists.json"
      @__unwatch2 = DSDataSource.setLoadAndRefresh.call @, dsDataService
      @init = null
      return)

    startLoad: ->

      @taskListsMap = {}

    importResponse: (json) ->

      cnt = 0

      project = @get 'project'

      for jsonTaskList in json['tasklists']

        ++cnt

        taskList = TaskList.pool.find @, "#{jsonTaskList['id']}", @taskListsMap

        taskList.set 'id', parseInt jsonTaskList['id']
        taskList.set 'name', jsonTaskList['name']
        taskList.set 'project', project
        taskList.set 'position', jsonTaskList['position']

      cnt

    finalizeLoad: ->
      @get('taskListsSet').merge @, @taskListsMap
      delete @taskListsMap
      return

    @end())]
