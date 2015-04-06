module.exports = (ngModule = angular.module 'ui/views/changes/ViewChanges', [
  require '../../../data/dsChanges'
  require('../../../dscommon/DSView')
]).name

assert = require('../../../dscommon/util').assert

DSObject = require('../../../dscommon/DSObject')

Task = require('../../../models/Task')
Person = require('../../../models/Person')
Change = require('./models/Change')

ngModule.run ['$rootScope', (($rootScope) ->
  $rootScope.showChanges = (->
    $rootScope.modal = if $rootScope.modal.type != 'changes' then {type: 'changes'} else {type: null}
    return)
  return)]

ngModule.controller 'ViewChanges', ['$scope', 'ViewChanges', 'dsChanges', '$rootScope', (($scope, ViewChanges, dsChanges, $rootScope) ->
  $scope.view = new ViewChanges $scope, 'viewChanges'
  $scope.save = (-> dsChanges.save().then(-> $rootScope.modal = {type: null}; return); return)
  $scope.reset = (-> dsChanges.reset(); $rootScope.modal = {type: null}; return)
  return)]

ngModule.directive 'viewChangesFix', [
  (() ->
    restrict: 'A'
    link: (($scope, element, attrs) ->
      header = $('.main-table.header', element)
      data = $('.main-table.data', element)
      header.width data.width()
      return))]

ngModule.factory 'ViewChanges', ['DSView', '$log', ((DSView, $log) ->

  return class ViewChange extends DSView
    @begin 'ViewChange'

    @propData 'tasks', Task, {mode: 'changes'}

    @propPool 'poolChanges', Change
    @propList 'changes', Change

    constructor: (($scope, key) ->
      DSView.call @, $scope, key
      @dataUpdate {}
      return)

    render: (->
      if !((tasksStatus = @get('data').get('tasksStatus')) == 'ready' || tasksStatus == 'update')
        @get('changesList').merge @, []
        return

      poolChanges = @get 'poolChanges'
      changes = []
      props = (tasksSet = @get('data').get('tasksSet')).type::__props
      for taskKey, task of tasksSet.items
        for propName, propChange of task.__change
          prop = props[propName]
          changes.push(change = poolChanges.find @, "#{task.$ds_key}.#{propName}")
          change.set 'doc', task
          change.set 'prop', propName
          change.set 'value',
            if (v = propChange.v) == null then ' -' else prop.str(propChange.v)
          change.set 'conflict',
            if prop.equal((conflictValue = task.$ds_doc.get(propName)), propChange.s) then null
            else if conflictValue == null then ' -' else prop.str(conflictValue)
          change.remove = do (self = @, task, propName) -> (->
            task.set propName, task.$ds_doc.get(propName) # set edited-doc property value to the current prop value of server-doc
            self.__dirty++ # force render(), since if it's not a last change in the task there will be no change-event from changes
            return)

      @get('changesList').merge @, changes
      return)

    @end())]
