module.exports = (ngModule = angular.module 'ui/tasks/rmsTaskEdit', [
  require '../../data/dsChanges'
  require '../../data/dsDataService'
  require './TaskSplitWeekView'
]).name

assert = require('../../dscommon/util').assert

DSDigest = require '../../dscommon/DSDigest'

Person = require '../../models/Person'
TaskSplit = require '../../models/types/TaskSplit'
PersonDayStat = require '../../models/PersonDayStat'

splitViewWeeksCount = 3

ngModule.directive 'rmsTaskEdit', [
  'TaskSplitWeekView', 'dsDataService', 'dsChanges', '$rootScope', '$window', '$timeout',
  ((TaskSplitWeekView, dsDataService, dsChanges, $rootScope, $window, $timeout) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->

      modal = $rootScope.modal

      $scope.edit = edit = {}

      unwatchSplitLastDate = null

      newTaskSplitWeekView = ((monday) ->
        return new TaskSplitWeekView(
          $scope
          "TaskSplitWeekView #{monday.format()}"
          (-> edit.splitDuedate)
          edit.split, monday))

      makeSplitView = (->
        monday = edit.firstWeek
        edit.splitView = (for w in [0...splitViewWeeksCount]
          view = newTaskSplitWeekView monday
          (monday = moment(monday)).add(1, 'week')
          view)
        unwatchSplitLastDate = $scope.$watch (-> edit.split.lastDate(edit.splitDuedate)?.valueOf()), ((lastDateValue) ->
          return if !typeof lastDateValue == 'number'
          edit.split.shift (lastDate = moment(lastDateValue)), edit.splitDuedate
          edit.splitDuedate = lastDate
          return)
        return)

      releaseSplitView = (->
        v.release $scope for v in edit.splitView
        edit.splitView = null
        unwatchSplitLastDate()
        return)

      $scope.$evalAsync (-> $($('input', element)[1]).select(); return)

      $scope.people = _.map Person.pool.items, ((person)-> person)
      $scope.task = task = modal.task
      $scope.today = today = moment().startOf('day')

      edit.title = task.get('title')
      edit.duedate = duedate = task.get('duedate')
      edit.estimate = task.get('estimate')
      edit.responsible = task.get('responsible')
      edit.splitDiff = null
      edit.firstWeek = thisWeek = moment().startOf('week')
      edit.splitDuedate = if duedate != null then duedate else moment().startOf('day')
      if edit.isSplit = (edit.split = if (split = task.get('split')) != null then split.clone() else null) != null
        first = moment(split.firstDate(duedate)).startOf('week')
        last = moment(split.lastDate(duedate)).startOf('week')
        if (weeks = moment.duration(last.diff(first)).asWeeks()) < splitViewWeeksCount # can fit
          if first.isBefore(thisWeek) then edit.firstWeek = first # start prior current week
          else if !(moment.duration(last.diff(thisWeek)).asWeeks() <= splitViewWeeksCount) then edit.firstWeek = last.subtract(splitViewWeeksCount - 1, 'week') # cannot start from current week, to show last split
        else
          edit.firstWeek = first # cannot fit, so let's show from first split week
        makeSplitView()
      else
        edit.splitView = null

      if !($scope.viewonly = !task.$u || _.isEmpty(task.$u))
        $scope.changes = false
        $scope.$watch (->
            res = [ # watch all possible changes, except isSplit that has special logic
              edit.title
              if (duedate = edit.duedate) == null then null else duedate.valueOf()
              if (estimate = edit.estimate) == null then null else estimate.valueOf()
              if (responsible = edit.responsible) == null then null else responsible.$ds_key]
            res = res.concat val if (split = edit.split) != null && (val = split.valueOf()).length > 0 # append split if there is some. intentionally not taking edit.isSplit
            return res), ((val, oldVal) -> $scope.changes = (val != oldVal); return), true
        $scope.$watch (-> edit.isSplit), ((isSplit) -> # watch isSplit
          if isSplit
            edit.split = new TaskSplit() if edit.split == null
            makeSplitView() if edit.splitView == null
          else
            releaseSplitView() if edit.splitView != null
          $scope.changes = true if edit.split?.valueOf().length > 0 # it's non empty split
          return)
        $scope.$watch (-> edit.duedate?.valueOf()),
          ((duedateValue, oldDuedateValue) -> # shift task.split on duedate change, if suitable
            return if duedateValue == oldDuedateValue || !typeof duedateValue == 'number'
            $scope.changes = true
            if edit.split != null && duedateValue != null && oldDuedateValue != null
              edit.splitDuedate.add (duedateValue - oldDuedateValue)
            return)
        $scope.$watch (-> [edit.estimate?.valueOf(), edit.isSplit, edit.split]), (([estimateVal, isSplit, split]) -> # calculate difference between estimate and task.split
          if typeof estimateVal == 'number' && isSplit && split != null
            newVal = (newDiff = moment.duration(split.total).subtract(estimateVal)).valueOf()
            edit.splitDiff = if newVal != 0 && ((splitDiff = edit.splitDiff) == null || splitDiff.valueOf() != newVal) then newDiff else null
          else edit.splitDiff = null
          return), true
        $scope.splitPrevWeek = (-> # click on left arrow on task.split
          edit.firstWeek.subtract(1, 'week')
          edit.splitView.unshift newTaskSplitWeekView edit.firstWeek
          edit.splitView.pop().release $scope
          return)
        $scope.splitNextWeek = (-> # click on right arrow on task.split
          monday = moment(edit.firstWeek.add(1, 'week')).add(splitViewWeeksCount - 1, 'week')
          edit.splitView.push newTaskSplitWeekView monday
          edit.splitView.shift().release $scope
          return)

      $scope.close = close = (->
        $rootScope.modal = {type: null}
        return)
      $scope.save = (->
        # Fix duedate, estimate if split
        if (split = edit.split) != null && (lastSplitDate = split.lastDate(edit.splitDuedate)) != null
          # Rule: If split then duedate is last date of split
          edit.duedate = lastSplitDate

          # TODO: Think of: We should keep estimate, duedate and split consisted, but this could ruine by removing changes one-by-one
          # TODO: I need the same logic while saving on server

          # Rule: If total split not equal to estimate, then split gets fixed

          splitTotal = split.total
          if (estimate = edit.estimate) == null
            # Rule: if estimate is not defined it becomes a sum of splitted time
            edit.estimate = splitTotal
          else if (diff = (estimate.valueOf() - splitTotal.valueOf())) != 0
            # Rule: Original estimate wons split
            split.fixEstimate diff

        # Actual save...
        (hist = dsChanges.get('hist')).startBlock()
        try
          DSDigest.block (=>
            task.set 'title', edit.title
            task.set 'duedate', edit.duedate
            task.set 'estimate', edit.estimate
            task.set 'responsible', edit.responsible
            task.set 'split', if edit.isSplit && edit.split.valueOf().length > 0 then edit.split else null
            return)
        finally
          hist.endBlock()
        close()
        return)
      $scope.showTimeLeft = ((dayModel) ->
        return '' if (timeLeft = dayModel.get('timeLeft')) == null
        plan = dayModel.get('plan')
        initPlan = dayModel.get('initPlan')
        diff = moment.duration timeLeft
        diff.add initPlan if initPlan != null && $scope.task.get('responsible') == edit.responsible
        diff.subtract val if (val = plan.val) != null
        res = if (val = diff.valueOf()) < 0 then (diff = moment.duration(-val); '- ') else ''
        hours = Math.floor diff.asHours()
        minutes = diff.minutes()
        res += "#{hours}h #{if minutes < 10 then '0' + minutes else minutes}m"
        return res)
      $scope.$on '$destroy', (->
        $scope._unwatch?()
        return)
      $scope.autoSplitInProgress = false
      $scope.autoSplit = (->
        if assert
          throw new Error "Invalid duedate: #{edit.duedate?.format()}" if !(edit.duedate != null && today <= edit.duedate)
          throw new Error "Invalid value 'edit.responsible': #{edit.responsible}" if !(edit.responsible != null)
          throw new Error "Invalid value 'edit.estimate': #{edit.estimate?.valueOf()}" if !(edit.estimate != null && edit.estimate > 0)

        $scope.autoSplitInProgress = true

        reponsibleKey = edit.responsible.$ds_key
        d = moment(duedate = edit.duedate)
        e = moment.duration(edit.estimate)
        (split = edit.split).clear()
        edit.splitDuedate = moment(d)
        initDuedate = $scope.task.get('duedate')
        initSplit = if initDuedate != null && $scope.edit.responsible == $scope.task.get('responsible') then $scope.task.get('split') else null

        splitWithinWeek = (->
          personDayStatSet = dsDataService.findDataSet $scope,
            type: PersonDayStat.name
            mode: 'edited'
            startDate: weekStart = moment(d).startOf 'week'
            endDate: moment(d).endOf 'week'
          $scope._unwatch = personDayStatSet.watchStatus $scope, ((set, status, prevStatus, unwatch) ->
            return if status != 'ready'
            dayStats = set.items[reponsibleKey].get('dayStats')
            while e > 0 && today <= d && weekStart <= d
              timeLeft = (dayStat = dayStats[moment.duration(d.diff(weekStart)).asDays()]).timeLeft
              if initSplit != null
                (timeLeft = moment.duration(timeLeft)).add initPlan if (initPlan = initSplit.get initDuedate, d) != null
              if timeLeft > 0
                split.set duedate, d, (dayTime = moment.duration(Math.min(timeLeft.valueOf(), e.valueOf())))
                e.subtract dayTime
              d.subtract 1, 'day'
            unwatch() # Note: personDayStatSet cannot be used after this operation, since it's released
            delete $scope._unwatch
            if e > 0 && today <= d
              # Note: At the moment we hardcode that sat&sun are weekends, and we do not split tasks on them
              d.subtract 2, 'days'
              splitWithinWeek() # split on previouse week
            else $scope.autoSplitInProgress = false
            return)
          personDayStatSet.release $scope
          return)

        splitWithinWeek()

        return)
    ))]
