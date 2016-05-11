module.exports = (ngModule = angular.module 'data/teamwork/TWTasks', [
  require '../../../dscommon/DSDataSource'
]).name

assert = require('../../../dscommon/util').assert
error = require('../../../dscommon/util').error

time = require '../../ui/time'

Task = require '../../models/Task'
Tag = require '../../models/Tag'
Person = require '../../models/Person'
TodoList = require '../../models/TodoList'
Project = require '../../models/Project'
TaskTimeTracking = require '../../models/TaskTimeTracking'
PersonTimeTracking = require '../../models/PersonTimeTracking'

DSData = require '../../../dscommon/DSData'
DSDigest = require '../../../dscommon/DSDigest'
DSTags = require '../../../dscommon/DSTags'

TaskSplit = require '../../models/types/TaskSplit'
RMSData = require '../../utils/RMSData'

ngModule.factory 'TWTasks', ['DSDataSource', 'config', '$q', ((DSDataSource, config, $q) ->

  return class TWTasks extends DSData

    @begin 'TWTasks'

    @addPool()

    @propDoc 'source', DSDataSource
    @propStr 'request'

    @propSet 'tasks', Task

    @propPool 'completedTasksPool', Task

    @propObj 'cancel', null

    @ds_dstr.push (->
      cancel.resolve() if cancel = @get('cancel')
      @__unwatch1()
      @__unwatch2()
      return)

    clear: ->
      DSData::clear.call @
      cancel.resolve() if cancel = @get('cancel')
      return # clear

    @propObj 'visiblePersonTTracking', {}

    constructor: (->
      DSData.apply @, arguments

      @peopleMap = {}
      @projectMap = {}
      @todoListMap = {}

      if assert
        console.error "TWTasks:ctor: setVisible expects that their will be only one instance of TWTasks object" if PersonTimeTracking::hasOwnProperty('setVisible')

      outerSelf = @
      visiblePersonTTracking = @get('visiblePersonTTracking')
      completedTasksPool = @get('completedTasksPool')
      taskSet = @get('tasksSet')

      PersonTimeTracking::setVisible = ((isVisible) ->
        if isVisible
          if (@__visCount = (@__visCount || 0) + 1) == 1
            visiblePersonTTracking[@$ds_key] = @
            if (task = @get('task')) == null
              if (task = taskSet.items[taskId = @get('taskId')])
                @set 'task', task
              else
                @set 'task', task = completedTasksPool.find @, "#{taskId}"
                if task.get('timeTracking') == null # it definitly a new Task
                  task.set 'id', taskId
                  task.set 'timeTracking', TaskTimeTracking.pool.find @, task.$ds_key
                  loadCompletedTaskForPersonTimeTracking.call outerSelf
                task.release @
            task.setVisible true
        else if --@__visCount == 0
          delete visiblePersonTTracking[@$ds_key]
          @get('task').setVisible false
        return)
      return)

    isTaskInDatesRange = ((params, task) ->
      return false if (duedate = task.get('duedate')) == null
      return if (split = task.get('split')) == null
        params.startDate <= task.get('duedate') <= params.endDate
      else
        params.startDate <= split.lastDate(duedate = task.get('duedate')) && split.firstDate(duedate) <= params.endDate)

    @filter = ((params) ->
      return switch params.filter
        when 'all'
          if moment.isMoment(params.startDate)
            ((task) -> isTaskInDatesRange(params, task))
          else
            ((task) -> true)
        when 'assigned'
          ((task) -> task.get('responsible') != null && isTaskInDatesRange(params, task))
        when 'notassigned'
          ((task) -> task.get('responsible') == null && isTaskInDatesRange(params, task))
        when 'overdue'
          ((task) -> (date = task.get('duedate')) != null && date < time.today)
        when 'noduedate'
          ((task) -> task.get('duedate') == null)
        else
          throw new Error "Not supported filter: #{params.filter}"
      )

    init: ((dsDataService) ->
      @set 'request', switch (params = @get('params')).filter
        when 'all'
          if moment.isMoment(params.startDate)
            "tasks.json?startdate=#{params.startDate.format 'YYYYMMDD'}&enddate=#{params.endDate.format 'YYYYMMDD'}&getSubTasks=no"
          else
            "tasks.json?getSubTasks=no"
        when 'assigned'
          "tasks.json?startdate=#{params.startDate.format 'YYYYMMDD'}&enddate=#{params.endDate.format 'YYYYMMDD'}&responsible-party-ids=-1&getSubTasks=no"
        when 'notassigned'
          "tasks.json?startdate=#{params.startDate.format 'YYYYMMDD'}&enddate=#{params.endDate.format 'YYYYMMDD'}&responsible-party-ids=0&getSubTasks=no"
        when 'overdue'
          "tasks.json?filter=overdue&getSubTasks=no"
        when 'noduedate'
          "tasks.json?filter=nodate&include=noduedate&getSubTasks=no"
        else
          throw new Error "Unexpected filter: #{params.filter}"

      filter = TWTasks.filter(@params)
      tasksSet = @get('tasksSet')
      @__unwatch1 = Task.pool.watch @, ((item) =>
        if filter(item)
                    tasksSet.add @, item.addRef @ if !tasksSet.items.hasOwnProperty item.$ds_key
        else
          tasksSet.remove item if tasksSet.items.hasOwnProperty item.$ds_key
        return)
      @__unwatch2 = DSDataSource.setLoadAndRefresh.call @, dsDataService
      @init = null
      return)

    releaseMaps = (->
      (v.release @; delete @peopleMap[k]) for k, v of @peopleMap
      (v.release @; delete @todoListMap[k]) for k, v of @todoListMap
      (v.release @; delete @projectMap[k]) for k, v of @projectMap
      return)

    importTask = ((task, jsonTask) ->

      person = Person.pool.find @, "#{jsonTask['creator-id']}", @peopleMap
      project = Project.pool.find @, "#{jsonTask['project-id']}", @projectMap
      todoList = TodoList.pool.find @, "#{jsonTask['todo-list-id']}", @todoListMap
      todoList.set 'project', project

      task.set 'creator', person
      task.set 'project', project
      task.set 'todoList', todoList
      task.set 'title', jsonTask['content']
      task.set 'estimate', if (estimate = jsonTask['estimated-minutes']) then moment.duration(estimate, 'minutes') else null
      task.set 'duedate', if (duedateStr = jsonTask['due-date']) then moment(duedateStr, 'YYYYMMDD') else null
      task.set 'startDate', if (date = jsonTask['start-date']) then moment(date, 'YYYYMMDD') else null
      task.set 'completed', jsonTask['completed']
      task.set 'isReady', true
      if timeIsLogged = jsonTask['timeIsLogged']
        task.set 'firstTimeEntryId', timeIsLogged
      desc = jsonTask['description']
      data = RMSData.get desc
      if data != null
        desc = RMSData.clear desc
        task.set 'split', split = new TaskSplit data.split if data.hasOwnProperty('split') && duedateStr != null
      task.set 'description', desc

      # Note: First person is taken as responsible
      # Note: In 'notassigned' case this property not exist
      if jsonTask['responsible-party-ids']
        task.set 'responsible', if (resp = jsonTask['responsible-party-ids'].split(',')).length > 0 then Person.pool.find @, "#{resp[0]}", @peopleMap else null

      person.set 'id', parseInt jsonTask['creator-id']
      # Note: Data below comes with from people.json, and making it different causes unwanted visual effects
      #          person.set 'name', "#{jsonTask['creator-firstname']} #{jsonTask['creator-lastname']}".trim()
      #          person.set 'avatar', jsonTask['creator-avatar-url']

      if !jsonTask.hasOwnProperty 'tags'
        task.set 'tags', null
        task.set 'plan', false
      else
        tags = null
        plan = false
        for tag in jsonTask['tags']
          if tag.name == config.planTag # Note: It's hardcoded tag name
            plan = true
          else
            tagDoc = (tags ?= {})[tag.name] = Tag.pool.find @, tag.name
            tagDoc.set 'id', tag.id
            tagDoc.set 'name', tag.name
            tagDoc.set 'color', tag.color
            (tags ||= {})[tag.name] = tagDoc
        task.set 'plan', plan
        if tags == null
          task.set 'tags', null
        else
          task.set 'tags', dstags = new DSTags @, '' + ++DSTags.nextTags, tags
          dstags.release @
          v.release @ for k, v of tags

      todoList.set 'id', parseInt jsonTask['todo-list-id']
      todoList.set 'name', jsonTask['todo-list-name']

      project.set 'id', parseInt jsonTask['project-id']
      project.set 'name', jsonTask['project-name']
      return)

    load: (->
      if assert
        if !@get('source')
          throw new Error 'load(): Source is not specified'

      return if !@_startLoad()

      taskMap = {}

      importResponse = ((json) =>

        Task.pool.enableWatch false

        try
          for jsonTask in (todoItems = json['todo-items'])
            task = Task.pool.find @, "#{jsonTask['id']}", taskMap
            task.set 'id', parseInt jsonTask['id']
            importTask.call @, task, jsonTask

        finally
          Task.pool.enableWatch true

        return todoItems.length == 250)

      onError = ((error, isCancelled) =>
        if !isCancelled
          console.error 'error: ', error
          @set 'cancel', null
        v.release @ for k, v of taskMap
        releaseMaps.call @
        @_endLoad false
        return)

      cancel.resolve() if cancel = @get('cancel') # stop any ongoing load

      (pageLoad = ((page) ->
        @get('source').httpGet("#{@get('request')}&page=#{page}&pageSize=250", @set('cancel', $q.defer()))
        .then(((resp) => # ok
          if (resp.status == 200) # 0 means that request was canceled
            @set 'cancel', null
            if DSDigest.block (-> importResponse(resp.data, resp.status))
              pageLoad.call @, page + 1
            else
              DSDigest.block (=>
                @get('tasksSet').merge @, taskMap
                releaseMaps.call @
                return)
              @_endLoad true
              loadCompletedTaskForPersonTimeTracking.call @ # load completed tasks, requested while update phase
          else onError(resp, resp.status == 0)
          return), onError)
        return)).call @, 1

      return)

    loadCompletedTaskForPersonTimeTracking = (->

      return if @get('cancel') !=  null # another operation is in progress

      task = null
      for k, v of @get('visiblePersonTTracking') # find first personTimeTracking without task
        if !(t = v.get('task')).get('isReady')
          task = t
          break
      return if task == null

      onError = ((error, isCancelled) =>
        if !isCancelled
          console.error 'error: ', error
          @set 'cancel', null
        task.release @
        releaseMaps.call @
        @_endLoad false
        return)

      @get('source').httpGet("/tasks/#{task.id}.json", @set('cancel', $q.defer()))
      .then(((resp) => # ok
        if (resp.status == 200) # 0 means that request was canceled
          @set 'cancel', null
          DSDigest.block (=>
            importTask.call @, task, resp.data['todo-item']
            releaseMaps.call @
            loadCompletedTaskForPersonTimeTracking.call @ # look for next personTimeTracking
            return)
        else onError(resp, resp.status == 0)
        return), onError)

      return)

    @end())]
