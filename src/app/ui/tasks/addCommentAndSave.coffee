assert = require('../../dscommon/util').assert
error = require('../../dscommon/util').error

serviceOwner = require('../../dscommon/util').serviceOwner

DSObject = require '../../dscommon/DSObject'
DSDocument = require '../../dscommon/DSDocument'
DSDigest = require '../../dscommon/DSDigest'

Comments = require '../../models/types/Comments'

Person = require '../../models/Person'

module.exports = (ngModule = angular.module 'ui/tasks/addCommentAndSave', [
  require '../../config'
  require '../../data/dsDataService'
  require '../../data/dsChanges'
]).name

ngModule.run ['$rootScope', (($rootScope) ->
  $rootScope.AddCommentAndSave = null
  return)]

ngModule.factory 'addCommentAndSave', [
  'dsDataService', 'dsChanges', 'config', '$rootScope', '$q',
  ((dsDataService, dsChanges, config, $rootScope, $q) ->

    class AddCommentAndSave extends DSObject
      @begin 'AddCommentAndSave'

      @propDoc 'currentUser', Person
      @propDoc 'document', DSDocument
      @propList 'documents', DSDocument
      @propObj 'changes'
      @propStr 'reason', ''
      @propBool 'plansChange'

      show: ((document, showDialog, changes) ->
        if assert
          error.invalidArg 'document' if !(document != null && ((Array.isArray(document) && document.length > 0 && document[0] instanceof DSDocument) ||  document instanceof DSDocument))
          error.invalidArg 'showDialog' if !(typeof showDialog == 'boolean')
          error.invalidArg 'changes' if !(changes != null && typeof changes == 'object')

        @__deferred =  $q.defer()

        # set plansChange to true, only if new plan value is false and there is at least one document with plan equal to true
        if changes.hasOwnProperty('plan') && !changes.plan
          if Array.isArray(document)
            for doc in document when doc.get('plan')
              plansChange = @set 'plansChange', true
              break
          else if document.get('plan')
            plansChange = @set 'plansChange', true

        if Array.isArray(document)
          doc.addRef @ for doc in document
          @get('documentsList').merge @, document
          document = @set 'document', document[0]
        else @set 'document', document

        newChanges = []; anyChange = false
        for propName, propDesc of document.__props
          if changes.hasOwnProperty propName
            if !document.$u.hasOwnProperty propName
              console.error "Doc #{document.toString()}: Prop #{propName}: Property is not editable"
              continue
            if typeof(propDesc.valid (value = changes[propName])) == 'undefined'
              console.error "Doc #{document.toString()}: Prop #{propName}: Invalid value '#{value}'"
              continue
            if !propDesc.equal(document.get(propName), value = changes[propName])
              anyChange = true
              newChanges.push {propName, value,  text: (if value == null then '-' else propDesc.str(value))}
            delete changes[propName]
        for propName of changes
          console.error "Doc #{document.toString()}: Has no property '#{propName}'"

        promise = @__deferred.promise

        if !anyChange
          @set 'document', null
          @get('documentsList').merge @, []
          @__deferred.resolve true
          delete @__deferred
        else

          people = dsDataService.findDataSet @, {type: Person, mode: 'original'}
          @set 'currentUser', people.items[config.get('currentUserId')]
          people.release @

          @set 'changes', newChanges

          if showDialog || plansChange
            $rootScope.addCommentAndSave = @
          else
            @saveWOComment()
            @freeDocs()

        return promise)

      save: (->
        @addCommentAndSave()
        $rootScope.addCommentAndSave = null
        return)

      cancel: (->
        @freeDocs()
        $rootScope.addCommentAndSave = null
        @__deferred.resolve false
        delete @__deferred
        return)

      freeDocs: (->
        @set 'currentUser', null
        @set 'reason', ''
        @set 'document', null
        @get('documentsList').merge @, []
        @set 'changes', null
        return)

      addCommentAndSave: (->
        DSDigest.block (=>
          (hist = dsChanges.get('hist')).startBlock()
          try
            doc = @get('document')
            docs = null if (docs = @get('documents')).length == 0
            comment = ''
            for change in @get('changes')
              comment += '<br/>' if comment.length > 0
              comment += "<b>#{change.propName}</b>: #{change.text}"
              if docs
                doc.set change.propName, change.value for doc in docs
              else doc.set change.propName, change.value
            if (note = @get('reason').trim()).length > 0
              comment += '<br/>' if comment.length > 0
              comment += "<b>reason</b>:<br/><p>#{@get('reason')}</p>"

            setComment = ((doc) =>
              comments = if (comments = doc.get('comments')) == null then new Comments else comments.clone()
              comments.add comment
              doc.set 'comments', comments
              return)

            if docs then setComment doc for doc in docs
            else setComment doc

          finally
            hist.endBlock()
          return)

        @freeDocs()

        @__deferred.resolve true
        delete @__deferred
        return)

      saveWOComment: (->
        DSDigest.block (=>
          (hist = dsChanges.get('hist')).startBlock()
          try
            doc = @get('document')
            docs = null if (docs = @get('documents')).length == 0
            for change in @get('changes')
              if docs
                doc.set change.propName, change.value for doc in docs
              else doc.set change.propName, change.value
          finally
            hist.endBlock()
          return)
        @freeDocs()
        @__deferred.resolve true
        delete @__deferred
        return)

      @end()

    instance = new AddCommentAndSave serviceOwner, 'addCommentAndSave';

    return ((document, showDialog, changes) -> instance.show(document, showDialog, changes)))]
