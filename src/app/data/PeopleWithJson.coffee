module.exports = (ngModule = angular.module 'data/PeopleWithJson', [
]).name

assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

DSSet = require '../../dscommon/DSSet'
DSTags = require '../../dscommon/DSTags'
DSData = require '../../dscommon/DSData'
DSDigest = require '../../dscommon/DSDigest'
DSDataServiceBase = require '../../dscommon/DSDataServiceBase'

Person = require '../models/Person'

ngModule.factory 'PeopleWithJson', [
  'DSDataSource', 'config', '$rootScope', '$http', '$q',
  ((DSDataSource, config, $rootScope, $http, $q) ->

    return class PeopleWithJson extends DSData

      @begin 'PeopleWithJson'

      @addPool()

      @propDoc 'teamworkPeople', DSSet
      @propObj 'cancel', null

      @propSet 'people', Person

      @ds_dstr.push (->
        cancel.resolve() if cancel = @get('cancel')
        @_unwatchA?()
        return)

      clear: (->
        DSData::clear.call @
        cancel.resolve() if cancel = @get('cancel')
        return)

      init: ((dsDataService) ->
        if assert
          error.invalidArg 'dsDataService' if !(dsDataService instanceof DSDataServiceBase)

        (teamworkPeople = @set 'teamworkPeople', dsDataService.findDataSet @, (_.assign {}, @params, {type: Person, source: true})).release @
        people = @get 'peopleSet'

        onError = ((error, isCancelled) =>
          if !isCancelled
            console.error 'error: ', error
            @set 'cancel', null
          @_endLoad false
          return)
        
        load = (=>
          return unless @_startLoad()
          cancel = @set('cancel', $q.defer())
          $http.get "data/people.json?t=#{new Date().getTime()}", cancel
          .then(
            ((resp) => # ok
              if (resp.status == 200) # 0 means that request was canceled
                @set 'cancel', null
                DSDigest.block (=>
                  peopleRoles = $rootScope.peopleRoles = resp.data.roles # set roles to those who are in the list
                  if (selectedRole = config.get('selectedRole'))
                    for i in peopleRoles when i.role == selectedRole
                      $rootScope.selectedRole = i
                  for personInfo in resp.data.people
                    if teamworkPeople.items.hasOwnProperty(personKey = "#{personInfo.id}")
                      teamworkPeople.items[personKey].set 'roles', new DSTags personInfo.role
                  map = {} # copy whole list of people
                  for personKey, person of teamworkPeople.items
                    map[personKey] = person; person.addRef @
                  people.merge @, map
                  @_endLoad true
                  return)
              else onError(resp, resp.status == 0)
              return), onError)
          return)

        @_unwatchA = teamworkPeople.watchStatus @, ((source, status) =>
          if !(status == (prevStatus = @get('status')))
            switch status
              when 'ready' then DSDigest.block load
              when 'update' then DSDigest.block load
              when 'nodata' then @set 'status', 'nodata'
          return)

        @init = null
        return)

      @end())]