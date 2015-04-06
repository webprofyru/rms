module.exports = (ngModule  = angular.module  'ui-layout', []).name

ngModule .factory 'uiLayout', [
  (->
    uiLayout =
      height: () -> $(window).height()
      width: () -> $(window).width()
      content: $('#main-wrapper').find('#content')
      sidebar: $('#main-wrapper').find('#sidebar')
      sidebarWidth: ()-> $('#main-wrapper').find('#sidebar').width()
      topBlock: $('#main-wrapper #content').find('#top-block')
      bottomBlock:  $('#main-wrapper #content').find('#bottom-block')
      peopleBlock: $('#main-wrapper').find('.people')
      handlerH:  $('#main-wrapper #content').find('.handler-horiz')
      handlerV: $('#main-wrapper').find('.handler-vertical')
      fixContentHeight: (->
        $('#main-wrapper').css(width: @width()).css(height: @height())
        @content.css height: @height(), width: (@width() * 0.62)
        @sidebar.css height: @height(), width: (@width() * 0.38)
        @topBlock.css height: (@height() * 0.62)
        @bottomBlock.css height: (@height() * 0.38)
        @handlerH.css bottom: (@height() * 0.38 - @handlerH.height() / 2), left: (@content.width() / 2)
        @handlerV.css right: (@width() * 0.38 - @handlerV.width() / 2), top: (@topBlock.height() / 2 - @handlerV.height() / 2)
        @bottomBlock.find('.task-grid').css height: "#{@bottomBlock.innerHeight() - 50}px"
        @bottomBlock.find('.task-grid .col-not-assigned-tasks .tasks').css height: "#{@bottomBlock.innerHeight() - 50}px"
        @sidebar.find('.tasks-block').css height: "#{@height() - 100}px"
        @peopleBlock.css height: ($('#top-block', '#main-wrapper #content').height() - $('#top-block .header').height() - $('#top-block .sub-header').height())
        return)

    return uiLayout)]

