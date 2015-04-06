module.exports = (ngModule  = angular.module 'ui-resizer', []).name

ngModule .directive 'resizer', [
  '$document', 'uiLayout'
  (($document, uiLayout) ->
    restrict: 'A'
    link: (($scope, element, attrs) ->
      element.on 'mousedown', ((event) ->
        event.preventDefault()
        $document.on 'mousemove', mousemove
        $document.on 'mouseup', mouseup
        return)

      mousemove = ((event)->
        handlerHeight = $(element).height()
        handlerWidth = $(element).width()
        if _.indexOf(attrs.class.split(' '), 'handler-horiz') > 0
          y = ->
            if event.pageY > 200
              return event.pageY
            else
              return 200
          uiLayout.topBlock.css height: "#{y()}px"
          uiLayout.bottomBlock.css height: "#{window.innerHeight - y()}px"
          element.css bottom: "#{window.innerHeight - y() - handlerHeight / 2}px"
          uiLayout.handlerV.css top: ((uiLayout.topBlock.height() / 2 - uiLayout.handlerV.height() / 2))
          uiLayout.bottomBlock.find('.task-grid').css height: "#{uiLayout.bottomBlock.innerHeight() - 50}px"
          uiLayout.bottomBlock.find('.task-grid .col-not-assigned-tasks .tasks').css height: "#{uiLayout.bottomBlock.innerHeight() - 50}px"
          uiLayout.peopleBlock.css height: ($('#top-block', '#main-wrapper #content').height() - $('#top-block .header').height() - $('#top-block .sub-header').height())
        else
          x = ->
            if event.pageX > 800 && (window.innerWidth - event.pageX) > 400
              return event.pageX
            if event.pageX < 800
              return 800
            if (window.innerWidth - event.pageX) < 400
              return  window.innerWidth - 400

          uiLayout.sidebar.css(width: (window.innerWidth - x()) + 'px')
          uiLayout.content.css(width: x() + 'px')
          element.css(right: ((window.innerWidth - x()) - handlerWidth/2) + 'px')
          uiLayout.handlerH.css(left: uiLayout.content.width()/2 - uiLayout.handlerH.width()/2)
          if(event.pageX <900) then uiLayout.topBlock.addClass('narrow') else uiLayout.topBlock.removeClass('narrow')
          if((window.innerWidth - event.pageX) <500) then uiLayout.sidebar.addClass('narrow') else uiLayout.sidebar.removeClass('narrow')
          actionBtnsChange()

        return)

      mouseup =((event)->
        $document.unbind 'mousemove', mousemove
        $document.unbind 'mouseup', mouseup
        return)

      actionBtnsChange=(->
        if(uiLayout.sidebar.innerWidth() < 500)
          $('#sidebar .actions-buttons').addClass('short-version')
        else
          $('#sidebar .actions-buttons').removeClass('short-version')
        return)

      return)

  )]


