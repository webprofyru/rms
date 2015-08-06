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
              peopleSet = @get('dataService').findDataSet @, {type: Person, mode: 'original'}
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

      save: do (saveInProgress = null) => ((tasks) ->
        return saveInProgress.promise if saveInProgress && !tasks
        if !tasks # it's first task in the line, so let's record others
          saveInProgress = $q.defer()
          tasks = (task.addRef @ for taskKey, task of @get('tasks'))
        newReponsible = null
        upd = {'todo-item': taskUpd = {}}

        if !(task = tasks.shift()) # it's nothing to save
          if (tasks = (task.addRef @ for taskKey, task of @get('tasks') when !task.__change.__error)).length > 0
            @save(tasks) # save new non-error tasks, if any new had apperes while save procedure
            return
          allTasksSaved = true
          for k of @get('tasks') # if any task left, it's error task
            allTasksSaved = false
            break
          saveInProgress.resolve(allTasksSaved)
          promise = saveInProgress.promise
          saveInProgress = null
          return promise
        change = _.clone task.__change # clone() makes possible to continue to edit data while updates gets saved to the server
        taskUpd['content'] = task.get('title') # required by TeamworkAPI
        commentsOrSplit = false
        for propName, propChange of change when propName != '__error' && propName != '__refreshView'
          switch propName
            when 'title' then undefined
            when 'comments' then undefined
            when 'split'
              taskUpd['description'] = RMSData.put task.get('description'), if split = propChange.v then {split: propChange.v.valueOf()} else null
              taskUpd['start-date'] = if split == null || (duedate = task.get('duedate')) == null then '' else split.firstDate(duedate).format('YYYYMMDD')
            when 'duedate'
              taskUpd['due-date'] = dueDateStr = if propChange.v then propChange.v.format('YYYYMMDD') else ''
              taskUpd['start-date'] = dueDateStr if (startDate = task.get('startDate')) != null && startDate > task.get('duedate')
            when 'estimate'
              taskUpd['estimated-minutes'] = if propChange.v then Math.floor propChange.v.asMinutes() else '0'
            when 'responsible'
              taskUpd['responsible-party-id'] = if (newReponsible = propChange.v) then [propChange.v.get('id')] else []
            else
              console.error "change.save(): Property #{propName} not expected to be changed"

        actionError = ((error, isCancelled) =>
          if !isCancelled
            console.error 'error: ', error
            @set 'cancel', null
          task.release @
          saveInProgress.reject()
          saveInProgress = null
          return)

        saveTaskAction = (=>
          @get('source').httpPut("tasks/#{task.get('id')}.json", upd, @set('cancel', $q.defer()))
          .then(
            ((resp) =>
              @set 'cancel', null
              if (resp.status == 200) # 0 means that request was canceled
                delete change.__error
                DSDigest.block (=>
                  for propName, propChange of change when propName != '__refreshView'
                    task.$ds_doc.set propName, propChange.v # states that change was delivered to the server, and now server object SHOULD has this val
                  return)

                # add comments, if any
                if (comments = task.get('comments')) != null
                  (saveComment = (=>
                    if !(nextComment = comments.shift())
                      task.release @
                      @save(tasks) # save next edited object, if any
                    else # save nextComment
                      upd =
                        comment:
                          'content-type': 'html'
                          body: nextComment
                          isprivate: false
                      @get('source').httpPost("tasks/#{task.get('id')}/comments.json", upd, @set('cancel', $q.defer()))
                      .then ((resp) =>
                        @set 'cancel', null
                        if (resp.status == 201) # 0 means that request was canceled
                          saveComment.call @
                        else actionError(resp, resp.status == 0)
                        return), actionError
                    return)).call @
                else
                  task.release @
                  @save(tasks) # save next edited object, if any
              else
                task.__change.__error = resp.data.MESSAGE
                task.__change.__refreshView?()
                task.release @
                @save(tasks) # save next edited object, if any
              return), actionError))

        if newReponsible == null
          saveTaskAction()
        else if (projectPeople = (project = task.get('project')).get('people')) == null # we do not know yet list of people on project
          @get('source').httpGet("projects/#{project.get('id')}/people.json", @set('cancel', $q.defer()))
          .then(
            ((resp) => # ok
              @set 'cancel', null
              if (resp.status == 200) # 0 means that request was canceled
                project.set 'people', projectPeople = {}
                projectPeople[p.id] = true for p in resp.data.people
                @addPersonToProject project, newReponsible, saveTaskAction, actionError
              else actionError(resp, resp.status == 0)
              return), actionError)
        else if !projectPeople.hasOwnProperty(newReponsible.get('id')) # person is not on a project
          @addPersonToProject project, newReponsible, saveTaskAction
        else saveTaskAction()

        return saveInProgress.promise);

      addPersonToProject: ((project, person, nextAction, actionError) ->
        @get('source').httpPost("projects/#{project.get('id')}/people/#{person.get('id')}.json", null, @set('cancel', $q.defer()))
        .then(
          ((resp) => # ok
            @set 'cancel', null
            if (resp.status == 200 || resp.status == 409) # 0 - means that request was canceled, 409 - User is already on project
              project.get('people')[person.get('id')] = true
              nextAction()
            else actionError(resp, resp.status == 0)
            return), actionError)
        return)

      @end()

    return serviceOwner.add(new DSChanges serviceOwner, 'dataChanges'))]
