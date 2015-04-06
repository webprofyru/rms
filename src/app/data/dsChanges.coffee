module.exports = (ngModule = angular.module 'data/dsDataChanges', [
  'LocalStorageModule'
  require('../dscommon/DSDataSource')
]).name

assert = require('../dscommon/util').assert
serviceOwner = require('../dscommon/util').serviceOwner
error = require('../dscommon/util').error

DSDigest = require('../dscommon/DSDigest')
DSChangesBase = require('../dscommon/DSChangesBase')
DSDataEditable = require('../dscommon/DSDataEditable')

Person = require('../models/Person')
Task = require('../models/Task')

RMSData = require('../utils/RMSData')

ngModule.run ['dsChanges', '$rootScope', ((dsChanges, $rootScope) ->
  $rootScope.changes = dsChanges
  return)]

CHANGES_PERSISTANCE_VER = 1 # increase every time then compatibility with previous version of format is lost

ngModule.factory 'dsChanges', [
  'DSDataSource', 'config', 'localStorageService', '$http', '$timeout', '$q',
  ((DSDataSource, config, localStorageService, $http, $timeout, $q) ->
    class DSChanges extends DSChangesBase
      @begin 'DSChanges'

  # Note: Below is commeted out, since at the moment we don't have editable people
  #    @propSet 'people', Person.Editable
      @propSet 'tasks', Task.Editable

      @propObj 'dataService' # Note: It's propObj (not Doc) cause dsChanges must not have ref+1 to dsDataService
      @propDoc 'source', DSDataSource
      @propObj 'cancel', null

      @ds_dstr.push (->
        @__unwatch2()
        @__unwatchStatus1?()
        @__unwatchStatus2?()
        cancel.resolve() if cancel = @get('cancel')
        return)

      constructor: ((referry, key) ->
        DSChangesBase.call @, referry, key
        return)

      init: ((dataService) ->
        @__unwatch2 = DSDataSource.setLoadAndRefresh.call @, (@set 'dataService', dataService)
        return)

      clear: (->
        @__unwatchStatus2?(); delete @__unwatchStatus2
        @reset()
        return)

      load: (->
        if @get('status') != 'ready'
          return if !@_startLoad()
          $u = DSDataEditable(Task.Editable).$u # TODO: Make this comes from project rights
          if (changes = localStorageService.get('changes'))
            if changes.ver == CHANGES_PERSISTANCE_VER && changes.source.url == config.get('teamwork') && changes.source.token == config.get('token')
              peopleSet = @get('dataService').findDataSet @, {type: Person.docType, mode: 'original'}
              @__unwatchStatus2 = peopleSet.watchStatus @, ((source, status, prevStatus, unwatch) =>
                return if !(status == 'ready')
                unwatch() # only once
                DSDigest.block (=>
                  Task.pool.enableWatch false
                  step1 = @mapToChanges(changes.changes)
                  for personKey, loadList of step1.load.Person # step 2
                    if !peopleSet.items.hasOwnProperty(personKey)
                      console.error 'Person #{personKey} missing in server data'
                    else
                      person = peopleSet.items[personKey]
                      f(person) for f in loadList
                  tasksSetPool = (tasksSet = @get 'tasksSet').$ds_pool
                  set = {}
                  for taskKey, taskChange of step1.changes.tasks # step 3
                    if Task.pool.items.hasOwnProperty(taskKey) then (task = Task.pool.items[taskKey]).addRef @
                    else (task = Task.pool.find(@, taskKey)).readMap(changes.tasks[taskKey]) # restore server task from local storage
                    (taskEditable = tasksSetPool.find(@, taskKey, set)).init(task, tasksSet, taskChange)
                    taskEditable.$u = $u
                    task.release @
                  tasksSet.merge @, set
                  Task.pool.enableWatch true
                  @_endLoad true
                  return)
                return)
              peopleSet.release @
            else
              localStorageService.remove('changes') # those changes from another account
              @_endLoad true
          else
            @_endLoad true # no changes in the local storage
        return)

      persist: (->
        if !@hasOwnProperty('__persist')
          @__persist = $timeout (=>
            delete @__persist
            @saveToLocalStorage()
            return)
        return)

      saveToLocalStorage: (->
        if !@anyChange()
          localStorageService.remove 'changes'
        else
          changes = @changesToMap()
          tasks = {}
          for taskKey of changes.tasks
            tasks[taskKey] = Task.pool.items[taskKey].writeMap()
          localStorageService.set 'changes', {
            ver: CHANGES_PERSISTANCE_VER
            changes
            source: {url: config.get('teamwork'), token: config.get('token')}
            tasks}
        return)

      save: do (saveInProgress = null) => ((isContinue) ->
        return saveInProgress.promise if saveInProgress && !isContinue
        saveInProgress = $q.defer() if !isContinue
        upd = {'todo-item': taskUpd = {}}
        task = change = null
        for taskKey, nextTask of @get('tasks')
          task = nextTask
          change = _.clone task.__change # clone() makes possible to continue to edit data while updates gets saved to the server
          taskUpd['content'] = task.get('title') # required by TeamworkAPI
          for propName, propChange of change
            switch propName
              when 'title' then undefined
              when 'split'
                taskUpd['description'] = RMSData.put task.get('description'), if split = propChange.v then {split: propChange.v.valueOf()} else null
                taskUpd['start-date'] = if split == null || (duedate = task.get('duedate')) == null then '' else split.firstDate(duedate).format('YYYYMMDD')
              when 'duedate'
                taskUpd['due-date'] = dueDateStr = if propChange.v then propChange.v.format('YYYYMMDD') else ''
                taskUpd['start-date'] = dueDateStr if (startDate = task.get('startDate')) != null && startDate > task.get('duedate')
              when 'estimate'
                taskUpd['estimated-minutes'] = if propChange.v then Math.floor propChange.v.asMinutes() else '0'
              when 'responsible'
                taskUpd['responsible-party-id'] = if propChange.v then [propChange.v.get('id')] else []
              else console.error "change.save(): Property #{propName} not expected to be changed"
          break # process only one first task
        if !task # it's nothing to save
          saveInProgress.resolve()
          promise = saveInProgress.promise
          saveInProgress = null
          return promise
        task.addRef @
        do (task, change) =>
          @get('source').httpPut("tasks/#{task.get('id')}.json", upd, @set('cancel', $q.defer()))
          .then(
            ((resp) => # ok
              @set 'cancel', null
              if (resp.status == 200) # 0 means that request was canceled
                DSDigest.block (=>
                  for propName, propChange of change
                    task.$ds_doc.set propName, propChange.v # states that change was delivered to the server, and now server object SHOULD has this val
                  task.release @
                  return)
                @save(true) # save next edited object, if any
              else
                task.release @
                saveInProgress.reject()
                saveInProgress = null
              return),
            (=> # error
              # TODO: Add error visualization
              @set 'cancel', null
              task.release @
              saveInProgress.reject()
              saveInProgress = null
              return))
        return saveInProgress.promise)

      @end()

    return serviceOwner.add(new DSChanges serviceOwner, 'dataChanges'))]
