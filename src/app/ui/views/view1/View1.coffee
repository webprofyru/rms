module.exports = (ngModule = angular.module 'ui/views/view1/View1', [
  require '../../../config'
  require '../../../data/dsChanges'
  require '../../../data/dsDataService'
  require('../../../dscommon/DSView')
]).name

assert = require('../../../dscommon/util').assert

DSDigest = require '../../../dscommon/DSDigest'

# Global models
Task = require('../../../models/Task')
Person = require('../../../models/Person')
PersonDayStat = require('../../../models/PersonDayStat')

# View specific models
Day = require('./models/Day')
Row = require('./models/Row')
TaskView = require('./models/TaskView')

ngModule.controller 'View1', ['$scope', 'View1', '$rootScope', (($scope, View1, $rootScope) ->
  $rootScope.view1 = $scope.view = new View1 $scope, 'view1'
  $scope.$on '$destroy', (-> delete $rootScope.view1; return)
  $scope.expandHeight = ((row)->
    height = ''
    if(row.expand && !_.isEmpty row.tasks)
      task = _.max row.tasks, 'y'
      height = 'height: ' + (52 * task.y + 110) + 'px' if task.y > 0
    return height)
  return)]

ngModule.factory 'View1', ['DSView', 'config', '$rootScope', '$log', ((DSView, config, $rootScope, $log) ->

  return class View1 extends DSView
    @begin 'View1'

    @propData 'people', Person, {}
    @propData 'tasks', Task, {filter: 'assigned'}
    @propData 'personDayStat', PersonDayStat, {}

    @propMoment 'startDate'
    @propList 'days', Day

    @propPool 'poolRows', Row
    @propList 'rows', Row

    @propObj 'hiddenPeople', {}

    constructor: (($scope, key) ->
      DSView.call @, $scope, key

      @scope = $scope
      @set 'startDate', moment().startOf('week')

      $scope.selectedRole = null
      $scope.selectedCompany = null
      $scope.selectedLoad = null

      $scope.filterLoad = [
        $scope.selectedLoad = {id: 0, name: 'All'}
        {id: -1, name: 'Underload'}
        {id: 1, name: 'Overload'}]

      if config.hasRoles # it's webProfy

        $scope.filterCompanies = [
          {id: null, name: 'All'}
          $scope.selectedCompany = {id: 23872, name: 'WebProfy'}]

      $scope.$watch (=> [@get('startDate')?.valueOf(), $scope.mode]), ((args) =>
        [startDateVal, mode] = args
        @dataUpdate {startDate: moment(startDateVal), endDate: moment(startDateVal).add(6, 'days'), mode}
        return), true

      $scope.$watch (-> [$scope.selectedRole, $scope.selectedCompany, $scope.selectedLoad]), (=> @__dirty++), true

      return)

    periodChange: ((num) ->
      @set 'startDate', @startDate.add(num, 'week')
      return)

    hideRow: ((row) ->
      @get('hiddenPeople')[row.$ds_key] = true
      @__dirty++
      return)

    render: (->
      if !((peopleStatus = @get('data').get('peopleStatus')) == 'ready' || peopleStatus == 'update')
        @get('rowsList').merge @, []
        return

      startDate = @get 'startDate'

      days = @get('daysList').merge @, _.map [0..6], ((dayIndex, index) =>
          date = moment(startDate).add(dayIndex, 'days')
          day = new Day @, date.format()
          day.set 'date', date
          day.set 'index', index
          day.set 'x', dayIndex
          return day)

      filter = (-> true)
      hiddenPeople = @get('hiddenPeople')
      for k of hiddenPeople
        filter = ((person) -> !hiddenPeople.hasOwnProperty(person.$ds_key))
        break

      if config.get('hasRoles')

        if @scope.selectedCompany?.id
          companyId = @scope.selectedCompany.id
          f0 = filter
          filter = ((person) -> f0(person) && person.get('companyId') == companyId)
        else
          f0 = filter

        if @scope.selectedRole?.role
          selectedRole = @scope.selectedRole
          f1 = filter
          if selectedRole.hasOwnProperty('roles')
            rolesMap = {}
            for r in selectedRole.roles.split(',')
              rolesMap[r.trim()] = true
            filter = ((person) -> f1(person) && person.get('roles')?.any(rolesMap))
          else if selectedRole.hasOwnProperty('special')
            switch selectedRole.special
              when 'notSupervisors'
                rolesMap = {}
                rolesMap[r.role] = true for r in @scope.peopleRoles when !r.supervisor && (!r.special && !r.roles)
                filter = ((person) -> f1(person) && person.get('roles')?.any(rolesMap))
              else
                console.error "Unexpected role.special value: #{role.special}", selectedRole
          else
            role = selectedRole.role
            filter = ((person) -> f1(person) && person.get('roles')?.get(role))

        if @scope.selectedLoad?.id != 0
          retrun if @get('data').get('personDayStatStatus') != 'ready'
          personDayStat = @get('data').get('personDayStat')
          loadFilter = if @scope.selectedLoad.id == 1
            ((person) ->
              (return true if dayStat.get('timeLeft') < 0) for dayStat in personDayStat[person.$ds_key].get('dayStats')
              return false)
          else # underload
            ((person) ->
              for dayStat in personDayStat[person.$ds_key].get('dayStats')
                return true if dayStat.get('timeLeft').valueOf() / dayStat.get('contract').valueOf() > 0.2 # loaded less then 80%
              return false)
          f2 = filter
          filter = ((person) -> f2(person) && loadFilter(person))

        selectedPeople = _.filter @data.get('people'), filter

      else
        selectedPeople = _.map @data.get('people'), _.identity # it's map to list conversion

      selectedPeople.sort ((left, right) -> if (leftLC = left.name.toLowerCase()) < (rightLC = right.name.toLowerCase()) then -1 else if leftLC > rightLC then 1 else 0)

      poolRows = @get 'poolRows'
      rows = @get('rowsList').merge @, _.map selectedPeople, ((person) =>
          row = poolRows.find @, person.$ds_key
          row.set 'person', person
          return row)

      # Tenmp array for calculate total work time by days
      daysTemp =  _.map [0..6], (-> moment.duration(0))

      if !(((tasksStatus = @get('data').get('tasksStatus')) == 'ready' || tasksStatus == 'update') &&
           ((personDayStatStatus = @get('data').get('personDayStatStatus')) == 'ready' || personDayStatStatus == 'update'))
        _.forEach rows, ((row) =>
          row.get('tasksList').merge @, []
          row.set 'personDayStat', null
          return)
      else
        tasksByPerson = _.groupBy @data.tasks, ((task) -> task.get('responsible').$ds_key)
        _.forEach rows, ((row) =>

          # fill totals
          row.set 'personDayStat', personDayStat = @data.get('personDayStat')[row.$ds_key]
          daysTemp[i].add ds.get('tasksTotal') for ds, i in dayStats = personDayStat.get('dayStats')

          # create collection of taskView
          tasksPool = row.get 'tasksPool'
          taskViews = row.get('tasksList').merge @, _.map tasksByPerson[row.$ds_key], ((task) =>
            taskView = tasksPool.find @, task.$ds_key
            taskView.set 'task', task
            return taskView)

          View1.layoutTaskView startDate, taskViews

          return)

        # fill total work time by days
        _.forEach days, ((day, index) ->
          day.set 'workTime', daysTemp[index]
          return)
      return)

    tasksSortRule = ((left, right) ->
      leftLen = if (leftSplit = (leftTask = left.get('task')).get('split')) == null then 1 else moment.duration(moment(leftSplit.lastDate(leftTask.get('duedate'))).diff(leftSplit.startDate)).asDays()
      rightLen = if (rightSplit = (rightTask = right.get('task')).get('split')) == null then 1 else moment.duration(moment(rightSplit.lastDate(rightTask.get('duedate'))).diff(rightSplit.startDate)).asDays()
      return leftLen - rightLen if leftLen != rightLen
      return rightTask.get('id') - leftTask.get('id'))

    positionTaskView = ((pos, taskView, taskStartDate, day) ->
      taskView.set 'x', day
      dayPos = pos[day]
      if day == 0 then y = dayPos.length
      else
        break for v, y in dayPos when typeof v == 'undefined'
      taskView.set 'y', y
      if (split = (task = taskView.get('task')).get('split')) == null
        taskView.set 'split', null
        taskView.set 'len', 1 # one day task - no split
        dayPos.length++ if y == dayPos.length
        dayPos[y] = true
      else # note: task with split also could be one day length
        len = taskView.set 'len', Math.min(moment.duration(moment(split.lastDate(task.get('duedate'))).diff(taskStartDate)).asDays() + 1, 7 - day)
        viewSplit = taskView.set 'split', []
        for s in [0...len] # mark next days
          if (plan = split.get(task.duedate, if s == 0 then taskStartDate else moment(taskStartDate).add(s, 'day'))) != null
            viewSplit.push {x: s, plan}
          dpos.length = y if (dpos = pos[day + s]).length <= y
          dpos[y] = true
      return)

    # It's common functionality used in View1 and View2
    @layoutTaskView = ((startDate, taskViews) ->
      # fill taskViews with respect to split
      if !_.some taskViews, ((taskView) -> taskView.get('task').get('split')) # simple case, then all taskViews are one day long
        tasksByDay = _.groupBy taskViews, ((taskView) -> taskView.get('task').get('duedate').valueOf())
        _.forEach tasksByDay, ((taskViews, date) ->
          x = moment.duration(taskViews[0].get('task').get('duedate').diff(startDate)).asDays()
          taskViews.sort ((left, right) -> right.get('task').get('id') - left.get('task').get('id'))
          _.forEach taskViews, ((task, i) ->
            task.set 'x', x
            task.set 'y', i
            task.set 'len', 1
            task.set 'split', null
            return)
          return)
      else # there are long taskViews, so we should place them with respect to split.firstDate and make sure that taskViews are not get overlapped
        tasksByDay = _.groupBy taskViews, ((taskView) -> duedate = (task = taskView.get('task')).get('duedate'); (if (split = task.get('split')) != null then split.firstDate(duedate) else duedate).valueOf())
        pos = ([] for i in [0..6]) # matrix there we will mark that positions is busy
        groupDates = (+t for t of tasksByDay).sort()
        for d in groupDates # process taskViews started before the startDate
          (tasksForTheDay = tasksByDay[d]).sort tasksSortRule
          day = moment.duration((taskStartDate = moment(d)).diff(startDate)).asDays()
          if day < 0
            day = 0
            taskStartDate = startDate
          _.forEach tasksForTheDay, ((taskView) -> positionTaskView pos, taskView, taskStartDate, day; return)
      return)

    @end())]

ngModule.directive 'rmsView1DropTask', [
  '$rootScope', 'dsChanges',
  (($rootScope, dsChanges) ->
    restrict: 'A'
    scope: true
    link: (($scope, element, attrs) ->
      element.on 'dragover', ((e)->
        return false)
      element.on 'drop', ((e)->
        elArr = $(element).find('.drop-zone')
        i = _.findIndex elArr, ((value)->
          return $(value).offset().left > e.originalEvent.clientX)
        day = switch
          when i < 0 then $(_.last(elArr)).attr("data-day")
          when i < 3 then day = -1
          else $(elArr[i - 1]).attr("data-day")

        if(day < 0)
          (task = $rootScope.modal.task).set 'responsible', $scope.row.get 'person'
        else
          DSDigest.block (->
            (hist = dsChanges.get('hist')).startBlock()
            try
              (task = $rootScope.modal.task).set 'responsible', $scope.row.get 'person'
              task.set 'duedate', $scope.view.get('days')[day].get('date')
            finally
              hist.endBlock()
            return)

        $rootScope.$digest()
        return false)
      return))]

