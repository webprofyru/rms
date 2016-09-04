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

ngModule.factory 'TWTasks', [
  'DSDataSource', 'dsChanges', 'config', '$injector', '$http', '$q',
  (DSDataSource, dsChanges, config, $injector, $http, $q) ->

    class TWTasks extends DSData

      Task.TWTask = @
      Task.planTag = config.planTag

      @begin 'TWTasks'

      @addPool()

      @propDoc 'source', DSDataSource
      @propStr 'request'

      @propSet 'tasks', Task

      @propPool 'completedTasksPool', Task

      @propObj 'cancel', init: null
      @propObj 'cancel2', init: null

      @ds_dstr.push (->
        cancel.resolve() if cancel = @get('cancel')
        @__unwatch1()
        @__unwatch2()
        return)

      clazz = @

      @calcTaskPriority = initCalcTaskPriority = ((task) ->
        task.__setCalcPriority Task.defaultTag.priority
        task.__setCalcStyle Task.defaultTag
        return)

      clear: ->
        DSData::clear.call @
        cancel.resolve() if cancel = @get('cancel')
        return # clear

      @propObj 'visiblePersonTTracking', init: {}

      constructor: (->

        DSData.apply @, arguments

        @peopleMap = {}
        @projectMap = {}
        @todoListMap = {}

        if assert
          console.error "TWTasks:ctor: setVisible expects that their will be only one instance of TWTasks object" if PersonTimeTracking::hasOwnProperty('setVisible')

        visiblePersonTTracking = @get('visiblePersonTTracking')
        completedTasksPool = @get('completedTasksPool')
        taskSet = @get('tasksSet')

        self = @

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
                    loadCompletedTaskForPersonTimeTracking.call self
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

      alwaysTrue = ((task) -> true)

      @filter = ((params) ->
        return switch params.filter
          when 'all'
            if moment.isMoment(params.startDate)
              ((task) -> isTaskInDatesRange(params, task))
            else
              alwaysTrue
          when 'assigned'
            ((task) -> task.get('responsible') != null && isTaskInDatesRange(params, task))
          when 'notassigned'
            ((task) -> task.get('responsible') == null && isTaskInDatesRange(params, task))
          when 'overdue'
            ((task) -> (date = task.get('duedate')) != null && date < time.today)
          when 'noduedate'
            ((task) -> task.get('duedate') == null)
          when 'clipboard'
            ((task) -> task.get('clipboard'))
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
        @allTasksSet = filter == alwaysTrue
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
            plan = true if tag.name == config.planTag # Note: It's hardcoded tag name
            tagDoc = (tags ?= {})[tag.name] = Tag.pool.find @, tag.name
            tagDoc.set 'id', tag.id
            tagDoc.set 'name', tag.name
            tagDoc.set 'color', tag.color
            (tags ||= {})[tag.name] = tagDoc
          task.set 'plan', plan
          if tags == null
            task.set 'tags', null
          else
            (task.set 'tags', new DSTags @, tags).release @
            v.release @ for k, v of tags

          clazz.calcTaskPriority task # calc priority based on task tags

        todoList.set 'id', parseInt jsonTask['todo-list-id']
        todoList.set 'name', jsonTask['todo-list-name']

        project.set 'id', parseInt jsonTask['project-id']
        project.set 'name', jsonTask['project-name']
        return)

      clazz = @

      loadTagsJson = ->
        clazz.calcTaskPriority = initCalcTaskPriority
        onError2 = (error, isCancelled) =>
          if !isCancelled
            console.error 'error: ', error
            @set 'cancel2', null
          return # onError2 =
        $http.get "data/tags.json?t=#{new Date().getTime()}", @set('cancel2', $q.defer())
        .then(
          ((resp) => # ok
            if (resp.status == 200) # 0 means that request was canceled
              @set 'cancel2', null
              tags = resp.data
              # check data format
              unless Array.isArray(tags)
                console.error 'invalid tags.json'
                return
              err = false
              for t, i in tags
                unless typeof t.name == 'string' && t.name.length >= 0
                  err = true; console.error "invalid tags.json: invalid 'name'", t
                if t.hasOwnProperty('priority')
                  unless typeof t.priority == 'number'
                    err = true; console.error "invalid tags.json: invalid 'priority'", t
                else
                  t.priority = i
                unless !t.hasOwnProperty('color') || typeof t.color == 'string' && t.color.length >= 0
                  err = true; console.error "invalid tags.json: invalid 'color'", t
                unless !t.hasOwnProperty('border') || typeof t.border == 'string' && t.border.length >= 0
                  err = true; console.error "invalid tags.json: invalid 'border'", t
              return if err
              # define globally available method of task prioritization
              clazz.calcTaskPriority = calcTaskPriority = (task) ->
                if (taskTags = task.get('tags'))
                  for tag, i in tags when taskTags.get(tag.name)
                    task.__setCalcPriority tag.priority
                    task.__setCalcStyle tag
                    return
                task.__setCalcPriority Task.defaultTag.priority
                task.__setCalcStyle Task.defaultTag
                return
              # apply to already existing tasks
              calcTaskPriority(t) for k, t of Task.pool.items # original Task docs
              calcTaskPriority(t) for k, t of dsChanges.get('tasksSet').$ds_pool.items # edited Task docs
            else onError2(resp, resp.status == 0)
            return), onError2)
        return

      load: (->
        if assert
          if !@get('source')
            throw new Error 'load(): Source is not specified'

        return if !@_startLoad()

        clipboardTasks = null
        $injector.invoke ['clipboardTasks', (_clipboardTasks) -> clipboardTasks = _clipboardTasks; return]

        taskMap = {}

        importResponse = ((json) =>

          Task.pool.enableWatch false

          try
            for jsonTask in (todoItems = json['todo-items'])
              task = Task.pool.find @, taskId = "#{jsonTask['id']}", taskMap
              task.set 'id', parseInt jsonTask['id']
              importTask.call @, task, jsonTask
              task.clipboard = true if clipboardTasks.hasOwnProperty(taskId)

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
        cancel2.resolve() if cancel2 = @get('cancel2')

        loadTagsJson.call @ if @allTasksSet

        (pageLoad = ((page) ->
          @get('source').httpGet("#{@get('request')}&page=#{page}&pageSize=250", @set('cancel', $q.defer()))
          .then(((resp) => # ok
            if (resp.status == 200) # 0 means that request was canceled
              @set 'cancel', null
              if DSDigest.block (-> importResponse(resp.data, resp.status))
                pageLoad.call @, page + 1
              else
                DSDigest.block (=>
                  clearChangesForClosedTasks.call @
                  @get('tasksSet').merge @, taskMap
                  releaseMaps.call @
                  return)
                @_endLoad true
                loadCompletedTaskForPersonTimeTracking.call @ # load completed tasks, requested while update phase
            else onError(resp, resp.status == 0)
            return), onError)
          return)).call @, 1

        clearChangesForClosedTasks = ->
          for taskKey, task of dsChanges.tasks
            unless taskMap.hasOwnProperty(taskKey)
              task._clearChanges()
          return # clearChangesForClosedTasks =

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

      # 1. more prior tasks comes first
      # 2. longer tasks comes first
      # 3. older tasks (smaller id) comes firts
      @tasksSortRule = ((leftTask, rightTask) ->

        if (leftPrior = leftTask.get('priority')) != (rightPrior = rightTask.get('priority'))
          return leftPrior - rightPrior

        if (leftEstimate = leftTask.get('estimate')?.valueOf()) != (rightEstimate = rightTask.get('estimate')?.valueOf())
          return 1 if leftEstimate == undefined
          return -1 if rightEstimate == undefined
          return rightEstimate - leftEstimate

        return leftTask.get('id') - rightTask.get('id'))

      @end()]
