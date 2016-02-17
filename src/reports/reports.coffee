MSExcelBuilder = require '../../static/libs/msexcel-builder/msexcel-builder'
FileSaver = require '../../static/libs/FileSaver.js/FileSaver'

serviceOwner = require('../dscommon/util').serviceOwner

PeriodTimeTracking = require './models/PeriodTimeTracking'

module.exports = (ngModule = angular.module 'reports-app', [
  'ui.bootstrap'
  require './showSpinner'
  require './data/dsDataService'
  require './data/teamwork/TWPeriodTimeTracking'
]).name

ngModule.run ->
  console.info 'running...'

ngModule.directive 'reports', [
  'TWPeriodTimeTracking', 'dsDataService', '$rootScope',
  (TWPeriodTimeTracking, dsDataService, $rootScope) ->
    restrict: 'A'
    scope: true
    link: ($scope, element, attrs) ->

      # Hack: TODO: uibDateParser within Angular UI wrongly use MONTH instead pf STANDALONEMONTH in 'month' mode.  So, I've quick fix it
      # $locale.DATETIME_FORMATS.MONTH = $locale.DATETIME_FORMATS.STANDALONEMONTH
      # ...but this didn't work - it fails to parse proper period string

      console.info 'reports directive ...'

      # TODO: Build the report

      $scope.progressMessage = null
      $scope.period = moment().startOf('month').add(-1, 'month').toDate()
      $scope.selectPeriod = false

      $scope.generateReport = ->

        $scope.progressMessage = 'Идет загрузка данных...'
        from = moment $scope.period
        to = moment(from).add 1, 'month'
        periodTimeTrackingSet = dsDataService.findDataSet serviceOwner, type: PeriodTimeTracking, mode: 'original', from: from, to: to

        unwatch = periodTimeTrackingSet.watchStatus serviceOwner, (set, status) ->

          return unless status == 'ready'

          unwatch()

          console.info "Loaded #{Object.keys(periodTimeTrackingSet.items).length} person@project"

          peopleMap = {}
          projectsMap = {}

          for k, tt of periodTimeTrackingSet.items
            if not peopleMap.hasOwnProperty (personId = (person = tt.get('person')).get('id'))
              peopleMap[personId] = person
            if not projectsMap.hasOwnProperty (projectId = (project = tt.get('project')).get('id'))
              projectsMap[projectId] = project

          people = (person for personId, person of peopleMap).sort (left, right) ->
            if (leftMissing = left.get('missing')) != (rightMissing = right.get('missing'))
              return (if leftMissing then 1 else -1)
            if !leftMissing
              return -1 if (leftName = left.get('name')) < (rightName = right.get('name'))
              return 1 if leftName > rightName
            return (if left.get('id') < right.get('id') then -1 else 1)

          projects = (project for projectId, project of projectsMap).sort (left, right) ->
            return -1 if (leftName = left.get('name')) < (rightName = right.get('name'))
            return 1 if leftName > rightName
            return (if left.get('id') < right.get('id') then -1 else 1)

          $scope.progressMessage = 'Формируем MS Excel файл ...'
          $rootScope.$digest() unless $rootScope.$$phase

          $scope.$evalAsync ->
            workbook = MSExcelBuilder.createWorkbook '.', 'Часы по людям по проектам'
            sheet1 = workbook.createSheet moment($scope.period).format('MM.YYYY'), (1 + people.length), (1 + projects.length)
            sheet1.width 1, 35
            for person, i in people
              sheet1.width 2 + i, 15
              sheet1.set 2 + i, 1, (if person.get('missing') then person.get('id') else person.get('name'))
              sheet1.font 2 + i, 1, bold: true

            for project, i in projects
              sheet1.set 1, 2 + i, project.get('name')
              sheet1.font 1, 2 + i, bold: true
              for person, j in people
                if (tt = periodTimeTrackingSet.items["#{person.get('id')}-#{project.get('id')}"])
                  sheet1.set 2 + j, 2 + i, tt.get('totalMin') %% 60

            workbook.generate (err, zip) ->
              blob = zip.generate type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

              periodTimeTrackingSet.release serviceOwner
              dsDataService.refresh() # to remove any cached data

              $scope.progressMessage = null
              $rootScope.$digest() unless $rootScope.$$phase

              fileSaver = FileSaver.saveAs blob, "Часы по людям по проектам за #{moment($scope.period).format('MM.YYYY')}.xlsx", false

          return # watchStatus

        return

      return]
