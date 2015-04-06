module.exports = (ngModule = angular.module 'data/dsDataService', [
  require './PeopleWithJson'
  require './teamwork/TWPeople'
  require './teamwork/TWTasks'
  require './PersonDayStatData'
  require './dsChanges'
  require '../dscommon/DSDataSource'
  require '../config'
]).name

assert = require('../dscommon/util').assert
serviceOwner = require('../dscommon/util').serviceOwner
error = require('../dscommon/util').error

DSObject = require '../dscommon/DSObject'
DSDataServiceBase = require '../dscommon/DSDataServiceBase'
DSChangesBase = require '../dscommon/DSChangesBase'
DSDataEditable = require '../dscommon/DSDataEditable'
DSDataFiltered = require '../dscommon/DSDataFiltered'

Person = require '../models/Person'
Task = require '../models/Task'

ngModule.run ['dsDataService', '$rootScope', ((dsDataService, $rootScope) ->
  $rootScope.dataService = dsDataService
  return)]

ngModule.factory 'dsDataService', [
 'TWPeople', 'TWTasks', 'PeopleWithJson', 'PersonDayStatData', 'DSDataSource', 'dsChanges', 'config', '$http', '$rootScope',
 ((TWPeople, TWTasks, PeopleWithJson, PersonDayStatData, DSDataSource, dsChanges, config, $http, $rootScope) ->

   class DSDataService extends DSDataServiceBase
      @begin 'DSDataService'

      @propDoc 'dataSource', DSDataSource

      @propPool 'editedPeople', DSDataEditable(Person.Editable)
      @propPool 'editedTasks', DSDataEditable(Task.Editable)

      @propPool 'tasksPool', DSDataFiltered(Task)

      @propDoc 'changes', DSChangesBase

      @ds_dstr.push (->
        @__unwatch2()
        return)

      constructor: (->
        DSDataServiceBase.apply @, arguments
        (@set 'dataSource', new DSDataSource(@, 'dataSource')).release @
        @__unwatch2 = $rootScope.$watch (-> [config.get('teamwork'), config.get('token')]), ((connect) =>
          if connect[0] && connect[1]
            @get('dataSource').setConnection(connect[0], connect[1])
          else
            @get('dataSource').setConnection(null, null)
          return), true
        (@set 'changes', dsChanges).init @
        return)

      refresh: (->
        @get('dataSource').refresh()
        return)

      findDataSet: ((owner, params) ->
       if assert
         error.invalidArg 'owner' if !((typeof owner == 'object' && owner != window) || typeof owner == 'function')
         error.invalidArg 'params' if typeof params != 'object'
        DSDataServiceBase::findDataSet.call @, owner, params
        if params.type == 'PersonDayStat'
          (data = PersonDayStatData.pool.find @, params).init? @
          (set = data.get('personDayStatsSet')).addRef owner; data.release @
          return set
        else switch params.mode
          when 'edited'
            switch params.type
              when 'Person'
                return @findDataSet owner, _.assign({}, params, {mode:'original'})
              when 'Task'
                if (data = @get('editedTasks').find(@, params)).init
                  data.init(
                    originalSet = @findDataSet @, _.assign({}, params, {mode:'original'})
                    changesSet = @findDataSet @, _.assign({}, params, {mode:'changes'})
                    TWTasks.filter(params))
                  originalSet.release @
                  changesSet.release @
                (set = data.get('itemsSet')).addRef owner; data.release @
                return set
              else
                throw new Error "Not supported model type: #{v.type}"
          when 'changes'
            switch params.type
              when 'Task'
                return (set = @get('changes').get('tasksSet')).addRef owner
              else
                throw new Error "Not supported model type: #{v.type}"
          when 'original'
            switch (if params.type != 'Person' then params.type else if config.get('hasRoles') then 'PeopleWithJson' else 'TeamworkPeople')
              when 'PeopleWithJson'
                (data = PeopleWithJson.pool.find(@, params)).init? @
                (set = data.get('peopleSet')).addRef owner; data.release @
                return set
              when 'TeamworkPeople'
                (data = TWPeople.pool.find(@, params)).init? @
                (set = data.get('peopleSet')).addRef owner; data.release @
                return set
              when 'Task'
# Version 2 - request all non-completed tasks at once.  This resolves plenty of issues
                if params.filter == 'all' && !params.hasOwnProperty('startDate')
                  (data = TWTasks.pool.find(@, params)).init? @
                  (set = data.get('tasksSet')).addRef owner; data.release @
                else
                  if (data = @get('tasksPool').find(@, params)).init
                    data.init(
                      originalSet = @findDataSet @, {type: Task.name, filter: 'all', mode: 'original'}
                      TWTasks.filter(params))
                    originalSet.release @
                  (set = data.get('itemsSet')).addRef owner; data.release @
                return set
# Version 1 - week by week teamwork requests
#                (data = TWTasks.pool.find(@, params)).init? @
#                (set = data.get('tasksSet')).addRef owner; data.release @
#                return set
              else
                throw new Error "Not supported model type: #{v.type}"
        return)

      requestSources: ((owner, params, sources) ->
        DSDataServiceBase::requestSources.call @, owner, params, sources
        # Process request, if source should not be changed then returns already existing one
        # Relese sources that were replaced
        for k, v of sources
          srcParams = _.assign {}, v.params, params
          requestParams = {type: typeName = v.type.name, mode: mode = srcParams.mode}
          switch typeName
            when 'Person'
              undefined
            when 'PersonDayStat'
              requestParams.startDate = srcParams.startDate || params.startDate
              requestParams.endDate = srcParams.endDate || params.endDate
            when 'Task'
              if mode != 'changes'
                if assert
                  if !(typeof srcParams.filter == 'string' && 0 <= ['all', 'assigned', 'notassigned', 'overdue', 'noduedate'].indexOf(srcParams.filter))
                    throw new Error "Unexpected filter: #{srcParams.filter}"
                requestParams.filter = srcParams.filter
                if srcParams.filter == 'all' || srcParams.filter == 'assigned' || srcParams.filter == 'notassigned'
                  requestParams.startDate = srcParams.startDate || params.startDate
                  requestParams.endDate = srcParams.endDate || params.endDate
            else
              throw new Error "Not supported model type: #{v.type}"
          newSet = @findDataSet owner, requestParams
          if typeof (set = v.set) == 'undefined' || set != newSet
            v.newSet = newSet
          else
            newSet.release owner
        return)

      @end()

    return serviceOwner.add(new DSDataService serviceOwner, 'dataService'))]
