FileSaver = require '../../static/libs/FileSaver.js/FileSaver'

serviceOwner = require('../dscommon/util').serviceOwner

PeriodTimeTracking = require './models/PeriodTimeTracking'

module.exports = (ngModule = angular.module 'reports-app', [
  'ui.bootstrap'
  require './showSpinner'
  require './data/dsDataService'
  require './data/teamwork/TWPeriodTimeTracking'
]).name

class WorkSheet

  END_OF_XIX = new Date Date.UTC 1899, 11, 30

  constructor: (@name) ->
    @range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }}
    @ws = {}
    return

  set: (c, r, v, formatIndex) ->
    range.s.r = r if (range = @range).s.r > r
    range.s.c = c if range.s.c > c
    range.e.r = r if range.e.r < r
    range.e.c = c if range.e.c < c
    cell_ref = XLSX.utils.encode_cell c: c, r: r
    if value == null
      delete @ws[cell_ref]
    else if (isMoment = moment.isMoment value) || (value instanceof Date)
      value = value.asDate() if isMoment
      @ws[cell_ref] =
        v: (v.getTime - END_OF_XIX) / (24 * 60 * 60 * 1000)
        t: 'n'
        z: XLSX.SSF._table[14]
    else
      cell = @ws[cell_ref] =
        v: v
        t: if typeof v == 'number' then 'n' else if typeof v == 'boolean' then 'b' else 's'
      cell.z = XLSX.SSF._table[formatIndex] if typeof formatIndex == 'number' # see 'table_fmt =' in xlsx.js

    return

  build: ->
    @ws['!ref'] = XLSX.utils.encode_range @range
    return

class WorkBook

  constructor: ->
    @sheets = []
    return

  addSheet: (name) ->

    throw new Error 'Invalid argument \'name\'' unless typeof name == 'string' && name.length > 0

    @sheets.push (newWorkSheet = new WorkSheet name)
    newWorkSheet

  build: ->
    SheetNames: (sheet.name for sheet in @sheets)
    Sheets: do =>
      res = {}
      for sheet in @sheets
        sheet.build()
        res[sheet.name] = sheet.ws
      res

  s2ab = (s) ->
    buf = new ArrayBuffer(s.length)
    view = new Uint8Array(buf)
    i = 0
    while i != s.length
      view[i] = s.charCodeAt(i) & 0xFF
      ++i
    buf

  saveFromBrowser: (filename, beforeSave) ->

    throw new Error 'Invalid argument \'filename\'' unless typeof filename == 'string' && filename.length > 0
    throw new Error 'Invalid argument \'beforeSave\'' unless typeof beforeSave == 'undefined' || typeof beforeSave == 'function'

    wopts =
      bookType: 'xlsx'
      bookSST: false
      type: 'binary'
    wbout = XLSX.write(@build(), wopts)

    beforeSave?()

    FileSaver.saveAs new Blob([s2ab(wbout)], type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), filename

    return

ngModule.directive 'reports', [
  'TWPeriodTimeTracking', 'dsDataService', '$rootScope',
  (TWPeriodTimeTracking, dsDataService, $rootScope) ->
    restrict: 'A'
    scope: true
    link: ($scope, element, attrs) ->

      # Hack: TODO: uibDateParser within Angular UI wrongly use MONTH instead pf STANDALONEMONTH in 'month' mode.  So, I've quick fix it
      # $locale.DATETIME_FORMATS.MONTH = $locale.DATETIME_FORMATS.STANDALONEMONTH
      # ...but this didn't work - it fails to parse proper period string

      $scope.progressMessage = null
      $scope.period = moment().startOf('month').add(-1, 'month').toDate()
      $scope.selectPeriod = false

      $scope.generateReport = ->

#        wb = new WorkBook
#
#        sheet1 = wb.addSheet 'Страница 1'
#
#        sheet1.set 0, 1, 'Пользователь 1'
#        sheet1.set 0, 2, 'Пользователь 2'
#
#        sheet1.set 1, 0, 'Проект 1'
#        sheet1.set 2, 0, 'Проект 2'
#        sheet1.set 3, 0, 'Проект 3'
#
#        sheet1.set 1, 1, 12.2
#        sheet1.set 2, 2, 20
#
#        console.info 'wb: ',  wb.build()
#
#        wb.saveFromBrowser()
#
#        return

        $scope.progressMessage = 'Идет загрузка данных...'
        from = moment $scope.period
        to = moment(from).add 1, 'month'
        periodTimeTrackingSet = dsDataService.findDataSet serviceOwner, type: PeriodTimeTracking, mode: 'original', from: from, to: to

        unwatch = periodTimeTrackingSet.watchStatus serviceOwner, (set, status) ->

          return unless status == 'ready'

          unwatch()

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

            wb = new WorkBook()
            sheet1 = wb.addSheet moment($scope.period).format('MM.YYYY')

            # TODO: Add fonts & columns width

            for person, i in people
              sheet1.set 1 + i, 0, (if person.get('missing') then person.get('id') else person.get('name'))

            for project, i in projects
              sheet1.set 0, 1 + i, project.get('name')
              for person, j in people
                if (tt = periodTimeTrackingSet.items["#{person.get('id')}-#{project.get('id')}"])
                  sheet1.set 1 + j, 1 + i, tt.get('totalMin') / 60, 2

            wb.saveFromBrowser "Часы по людям по проектам за #{moment($scope.period).format('MM.YYYY')}.xlsx", ->

              $scope.progressMessage = null
              $rootScope.$digest() unless $rootScope.$$phase

              return # wb.saveFile

            return # $scope.$evalAsync

#            workbook.generate (err, zip) ->
#              blob = zip.generate type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#
#              periodTimeTrackingSet.release serviceOwner
#              dsDataService.refresh() # to remove any cached data
#
#              $scope.progressMessage = null
#              $rootScope.$digest() unless $rootScope.$$phase
#
#              fileSaver = FileSaver.saveAs blob, "Часы по людям по проектам за #{moment($scope.period).format('MM.YYYY')}.xlsx", false

          return # watchStatus

        return # $scope.generateReport

      return]
