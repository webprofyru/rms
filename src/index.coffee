# source: https://habrahabr.ru/post/187582/

module.exports = ngModule = angular.module 'app', [
]

ngModule.directive 'dropElement', [
  '$rootScope',
  ($rootScope) -> # ($rootScope) ->
    restrict: 'CA'
    link: ($scope, element, attrs, model) ->
      el = element[0]
      el.draggable = true
      el.addEventListener 'dragstart', (ev) ->
        console.info 'dragstart:', ev
        $rootScope.dropText = element.text()
        $rootScope.$digest()
        ev.dataTransfer.effectAllowed = 'move'
        #ev.dataTransfer.setData "Text", 'data' #ev.target.getAttribute('id')
        ev.dataTransfer.setData 'task', 123
        #ev.dataTransfer.setDragImage ev.target, 20, 20
        ev.dataTransfer.setDragImage $('#drop-ghost')[0], 20, 20
        true
      el.addEventListener 'dragend', (ev) ->
        console.info 'dragend:', ev
        true
      return] # link:

ngModule.directive 'dropTarget', [
  () -> # () ->
    restrict: 'CA'
    link: ($scope, element, attrs, model) ->
      el = element[0]
      el.draggable = true
      el.addEventListener 'dragenter', (ev) ->
        console.info 'dragenter:', ev
        ev.preventDefault()
        true
      el.addEventListener 'dragleave', (ev) ->
        console.info 'dragleave:', ev
        ev.preventDefault()
        true
      el.addEventListener 'dragover', (ev) ->
        #console.info 'dragover:', ev
        ev.preventDefault()
        true
      el.addEventListener 'dragdrop', (ev) ->
        console.info 'drop:', ev
        ev.stopPropagation()
        false
      return] # link:
