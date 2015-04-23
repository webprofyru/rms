module.exports = (ngModule = angular.module 'data/teamwork/TWTasks', [
  require '../../dscommon/DSDataSource'
  require '../../dscommon/DSDataSimple'
]).name

assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

time = require '../../ui/time'

Task = require '../../models/Task'
Person = require '../../models/Person'
TodoList = require '../../models/TodoList'
Project = require '../../models/Project'

DSData = require '../../dscommon/DSData'
DSDigest = require '../../dscommon/DSDigest'

TaskSplit = require '../../models/types/TaskSplit'
RMSData = require '../../utils/RMSData'

ngModule.factory 'TWTasks', ['DSDataSimple', 'DSDataSource', '$q', ((DSDataSimple, DSDataSource, $q) ->

  return class TWTasks extends DSData

    @begin 'TWTasks'

    @addPool()

    @propDoc 'source', DSDataSource
    @propStr 'request'

    @propSet 'tasks', Task

    @propObj 'cancel', null

    @ds_dstr.push (->
      cancel.resolve() if cancel = @get('cancel')
      @__unwatch1()
      @__unwatch2()
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
          throw new Error "Not supported filter: #{params.filter}")

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
          item.addRef @
          tasksSet.add @, item if !tasksSet.items.hasOwnProperty item.$ds_key
        else
          tasksSet.remove item if tasksSet.items.hasOwnProperty item.$ds_key
        return)
      @__unwatch2 = DSDataSource.setLoadAndRefresh.call @, dsDataService
      @init = null
      return)

    loadInProgress = true

    load: (->
      if assert
        if !@get('source')
          throw new Error 'load(): Source is not specified'

      return if !@_startLoad()

      taskMap = {}
      peopleMap = {}
      projectMap = {}
      todoListMap = {}

      importResponse = ((json) =>
  
        count = 0

        Task.pool.enableWatch false

        try
          for jsonTask in json['todo-items']

            count++

            task = Task.pool.find @, "#{jsonTask['id']}", taskMap
            person = Person.pool.find @, "#{jsonTask['creator-id']}", peopleMap
            project = Project.pool.find @, "#{jsonTask['project-id']}", projectMap
            todoList = TodoList.pool.find @, "#{jsonTask['todo-list-id']}", projectMap
            todoList.set 'project', project

            task.set 'id', parseInt jsonTask['id']
            task.set 'creator', person
            task.set 'project', project
            task.set 'todoList', todoList
            task.set 'title', jsonTask['content']
            task.set 'estimate', if (estimate = jsonTask['estimated-minutes']) then moment.duration(estimate, 'minutes') else null
            task.set 'duedate', if (duedateStr = jsonTask['due-date']) then moment(duedateStr, 'YYYYMMDD') else null
            task.set 'startDate', if (date = jsonTask['start-date']) then moment(date, 'YYYYMMDD') else null
            desc = jsonTask['description']
            data = RMSData.get desc
            if data != null
              desc = RMSData.clear desc
              task.set 'split', split = new TaskSplit data.split if data.hasOwnProperty('split') && duedateStr != null
            task.set 'description', desc

            # Note: First person is taken as responsible
            # Note: In 'notassigned' case this property not exist
            if jsonTask['responsible-party-ids']
              task.set 'responsible', if (resp = jsonTask['responsible-party-ids'].split(',')).length > 0 then Person.pool.find @, "#{resp[0]}", peopleMap else null

            person.set 'id', parseInt jsonTask['creator-id']
  # Note: Data below comes with from people.json, and making it different causes unwanted visual effects
  #          person.set 'name', "#{jsonTask['creator-firstname']} #{jsonTask['creator-lastname']}".trim()
  #          person.set 'avatar', jsonTask['creator-avatar-url']

            todoList.set 'id', parseInt jsonTask['todo-list-id']
            todoList.set 'name', jsonTask['todo-list-name']

            project.set 'id', parseInt jsonTask['project-id']
            project.set 'name', jsonTask['project-name']

        finally
          Task.pool.enableWatch true

        return count == 250)

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
                v.release @ for k, v of peopleMap
                v.release @ for k, v of todoListMap
                v.release @ for k, v of projectMap
                return)
              @_endLoad true
          return),
        (=> # error
          @set 'cancel', null
          v.release @ for k, v of taskMap
          v.release @ for k, v of peopleMap
          v.release @ for k, v of todoListMap
          v.release @ for k, v of projectMap
          @_endLoad false
          return))
        return)).call @, 1

      return)

    @end())]
