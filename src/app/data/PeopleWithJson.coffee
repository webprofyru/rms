module.exports = (ngModule = angular.module 'data/PeopleWithJson', [
  require '../dscommon/DSDataSimple'
]).name

assert = require('../dscommon/util').assert
error = require('../dscommon/util').error

DSSet = require '../dscommon/DSSet'
DSEnum = require '../dscommon/DSEnum'
DSData = require '../dscommon/DSData'
DSDigest = require '../dscommon/DSDigest'
DSDataServiceBase = require '../dscommon/DSDataServiceBase'

Person = require '../models/Person'

ngModule.factory 'PeopleWithJson', [
  'DSDataSimple', 'DSDataSource', '$rootScope', '$http', '$q',
  ((DSDataSimple, DSDataSource, $rootScope, $http, $q) ->

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

        (teamworkPeople = @set 'teamworkPeople', dsDataService.findDataSet @, (_.assign {}, @params, {type: 'TeamworkPeople'})).release @
        people = @get 'peopleSet'

        load = (=>
          return if !@_startLoad()
          cancel = @set('cancel', $q.defer())
          $http.get 'data/people.json', cancel
          .then(
            ((resp) => # ok
              if (resp.status == 200) # 0 means that request was canceled
                @set 'cancel', null
                DSDigest.block (=>
                  $rootScope.peopleRoles = resp.data.roles # set roles to those who are in the list
                  for personInfo in resp.data.people
                    if teamworkPeople.items.hasOwnProperty(personKey = "#{personInfo.id}")
                      teamworkPeople.items[personKey].set 'roles', new DSEnum personInfo.role
                  map = {} # copy whole list of people
                  for personKey, person of teamworkPeople.items
                    map[personKey] = person; person.addRef @
                  people.merge @, map
                  @_endLoad true
                  return)
              return),
            (=> # error
              @set 'cancel', null
              @_endLoad false
              return))
          return)

        updateStatus = ((source, status) =>
          if !(status == (prevStatus = @get('status')))
            switch status
              when 'ready' then DSDigest.block load
              when 'update' then DSDigest.block load
              when 'nodata' then @set 'status', 'nodata'
          return)

        @_unwatchA = teamworkPeople.watchStatus @, updateStatus

        @init = null
        return)

      @end())]