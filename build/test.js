(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./test/test.coffee":[function(require,module,exports){
require('../src/app/utils/angular-local-storage.js');

require('./100 Basic/110 DSObject.beginEnd');

require('./100 Basic/112 DSObject.prop');

require('./100 Basic/116 DSObject.map');

require('./100 Basic/120 DSEnum');

require('./100 Basic/140 DSPool');

require('./100 Basic/150 DSSet');

require('./100 Basic/160 DSList');

require('./100 Basic/170 DSDocument');

require('./100 Basic/172 DSDocument.serverChanges');

require('./100 Basic/174 DSDocument.DSDocumentValues');

require('./100 Basic/180 DSDataEdited');

require('./100 Basic/190 DSChanges');

require('./100 Basic/192 DSChanges.persistAndRestore');

require('./200 Views/210 View');

require('./200 Views/220 View.IntegratedStatus');

require('./200 Views/230 ViewChanges');

require('./300 TaskSplit/310 TaskSplit.coffee');

require('./300 TaskSplit/320 TaskSplitSaveData.coffee');



},{"../src/app/utils/angular-local-storage.js":"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\angular-local-storage.js","./100 Basic/110 DSObject.beginEnd":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\110 DSObject.beginEnd.coffee","./100 Basic/112 DSObject.prop":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\112 DSObject.prop.coffee","./100 Basic/116 DSObject.map":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\116 DSObject.map.coffee","./100 Basic/120 DSEnum":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\120 DSEnum.coffee","./100 Basic/140 DSPool":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\140 DSPool.coffee","./100 Basic/150 DSSet":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\150 DSSet.coffee","./100 Basic/160 DSList":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\160 DSList.coffee","./100 Basic/170 DSDocument":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\170 DSDocument.coffee","./100 Basic/172 DSDocument.serverChanges":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\172 DSDocument.serverChanges.coffee","./100 Basic/174 DSDocument.DSDocumentValues":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\174 DSDocument.DSDocumentValues.coffee","./100 Basic/180 DSDataEdited":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\180 DSDataEdited.coffee","./100 Basic/190 DSChanges":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\190 DSChanges.coffee","./100 Basic/192 DSChanges.persistAndRestore":"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\192 DSChanges.persistAndRestore.coffee","./200 Views/210 View":"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\210 View.coffee","./200 Views/220 View.IntegratedStatus":"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\220 View.IntegratedStatus.coffee","./200 Views/230 ViewChanges":"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\230 ViewChanges.coffee","./300 TaskSplit/310 TaskSplit.coffee":"C:\\SVN\\_WebProfyManagement\\test\\300 TaskSplit\\310 TaskSplit.coffee","./300 TaskSplit/320 TaskSplitSaveData.coffee":"C:\\SVN\\_WebProfyManagement\\test\\300 TaskSplit\\320 TaskSplitSaveData.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\config.coffee":[function(require,module,exports){
var DSObject, assert, ngModule, serviceOwner, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./dscommon/util').assert;

validate = require('./dscommon/util').validate;

serviceOwner = require('./dscommon/util').serviceOwner;

DSObject = require('./dscommon/DSObject');

module.exports = (ngModule = angular.module('config', ['LocalStorageModule'])).name;

ngModule.config([
  'localStorageServiceProvider', (function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('rms');
  })
]);

ngModule.run([
  '$rootScope', 'config', (function($rootScope, config) {
    $rootScope.config = config;
  })
]);

ngModule.factory('config', [
  '$http', 'localStorageService', (function($http, localStorageService) {
    var Config, config, desc, name, ref, v;
    Config = (function(superClass) {
      extend(Config, superClass);

      function Config() {
        return Config.__super__.constructor.apply(this, arguments);
      }

      Config.begin('Config');

      Config.propStr('token', null, validate.trimString);

      Config.propStr('teamwork', 'http://teamwork.webprofy.ru/');

      Config.propCalc('hasRoles', (function() {
        return this.teamwork === 'http://teamwork.webprofy.ru/';
      }));

      Config.onAnyPropChange((function(item, propName, newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
          localStorageService.set(propName, newVal);
        } else {
          localStorageService.remove(propName);
        }
      }));

      Config.prototype.hasFilter = (function() {
        var url;
        url = this.get('teamwork');
        return url === 'http://teamwork.webprofy.ru/' || url === 'https://delightsoft.teamworkpm.net/';
      });

      Config.end();

      return Config;

    })(DSObject);
    config = serviceOwner.add(new Config(serviceOwner, 'config'));
    ref = Config.prototype.__props;
    for (name in ref) {
      desc = ref[name];
      if (!desc.readonly && typeof (v = localStorageService.get(name)) !== 'undefined') {
        if (name !== 'teamworkNotFormatted') {
          if (v) {
            config.set(name, v);
          }
        }
      }
    }
    return config;
  })
]);



},{"./dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\PeopleWithJson.coffee":[function(require,module,exports){
var DSData, DSDataServiceBase, DSDigest, DSEnum, DSSet, Person, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/PeopleWithJson', [require('../dscommon/DSDataSimple')])).name;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSSet = require('../dscommon/DSSet');

DSEnum = require('../dscommon/DSEnum');

DSData = require('../dscommon/DSData');

DSDigest = require('../dscommon/DSDigest');

DSDataServiceBase = require('../dscommon/DSDataServiceBase');

Person = require('../models/Person');

ngModule.factory('PeopleWithJson', [
  'DSDataSimple', 'DSDataSource', '$rootScope', '$http', '$q', (function(DSDataSimple, DSDataSource, $rootScope, $http, $q) {
    var PeopleWithJson;
    return PeopleWithJson = (function(superClass) {
      extend(PeopleWithJson, superClass);

      function PeopleWithJson() {
        return PeopleWithJson.__super__.constructor.apply(this, arguments);
      }

      PeopleWithJson.begin('PeopleWithJson');

      PeopleWithJson.addPool();

      PeopleWithJson.propDoc('teamworkPeople', DSSet);

      PeopleWithJson.propObj('cancel', null);

      PeopleWithJson.propSet('people', Person);

      PeopleWithJson.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        if (typeof this._unwatchA === "function") {
          this._unwatchA();
        }
      }));

      PeopleWithJson.prototype.clear = (function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      });

      PeopleWithJson.prototype.init = (function(dsDataService) {
        var load, people, teamworkPeople, updateStatus;
        if (assert) {
          if (!(dsDataService instanceof DSDataServiceBase)) {
            error.invalidArg('dsDataService');
          }
        }
        (teamworkPeople = this.set('teamworkPeople', dsDataService.findDataSet(this, _.assign({}, this.params, {
          type: 'TeamworkPeople'
        })))).release(this);
        people = this.get('peopleSet');
        load = ((function(_this) {
          return function() {
            var cancel;
            if (!_this._startLoad()) {
              return;
            }
            cancel = _this.set('cancel', $q.defer());
            $http.get('data/people.json', cancel).then((function(resp) {
              if (resp.status === 200) {
                _this.set('cancel', null);
                DSDigest.block((function() {
                  var i, len, map, person, personInfo, personKey, ref, ref1;
                  $rootScope.peopleRoles = resp.data.roles;
                  ref = resp.data.people;
                  for (i = 0, len = ref.length; i < len; i++) {
                    personInfo = ref[i];
                    if (teamworkPeople.items.hasOwnProperty(personKey = "" + personInfo.id)) {
                      teamworkPeople.items[personKey].set('roles', new DSEnum(personInfo.role));
                    }
                  }
                  map = {};
                  ref1 = teamworkPeople.items;
                  for (personKey in ref1) {
                    person = ref1[personKey];
                    map[personKey] = person;
                    person.addRef(_this);
                  }
                  people.merge(_this, map);
                  _this._endLoad(true);
                }));
              }
            }), (function() {
              _this.set('cancel', null);
              _this._endLoad(false);
            }));
          };
        })(this));
        updateStatus = ((function(_this) {
          return function(source, status) {
            var prevStatus;
            if (!(status === (prevStatus = _this.get('status')))) {
              switch (status) {
                case 'ready':
                  DSDigest.block(load);
                  break;
                case 'update':
                  DSDigest.block(load);
                  break;
                case 'nodata':
                  _this.set('status', 'nodata');
              }
            }
          };
        })(this));
        this._unwatchA = teamworkPeople.watchStatus(this, updateStatus);
        this.init = null;
      });

      PeopleWithJson.end();

      return PeopleWithJson;

    })(DSData);
  })
]);



},{"../dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../dscommon/DSDataServiceBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataServiceBase.coffee","../dscommon/DSDataSimple":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSimple.coffee","../dscommon/DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","../dscommon/DSEnum":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSEnum.coffee","../dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\PersonDayStatData.coffee":[function(require,module,exports){
var DSData, DSDataServiceBase, DSDigest, DSDocument, DSSet, Person, PersonDayStat, Task, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/PersonDayStatData', [])).name;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSDocument = require('../dscommon/DSDocument');

DSDataServiceBase = require('../dscommon/DSDataServiceBase');

DSData = require('../dscommon/DSData');

DSDigest = require('../dscommon/DSDigest');

DSSet = require('../dscommon/DSSet');

Person = require('../models/Person');

Task = require('../models/Task');

PersonDayStat = require('../models/PersonDayStat');

ngModule.factory('PersonDayStatData', [
  (function() {
    var PersonDayStatData;
    return PersonDayStatData = (function(superClass) {
      extend(PersonDayStatData, superClass);

      function PersonDayStatData() {
        return PersonDayStatData.__super__.constructor.apply(this, arguments);
      }

      PersonDayStatData.begin('PersonDayStatData');

      PersonDayStatData.addPool();

      PersonDayStatData.propDoc('tasks', DSSet);

      PersonDayStatData.propDoc('people', DSSet);

      PersonDayStatData.propSet('personDayStats', PersonDayStat);

      PersonDayStatData.ds_dstr.push((function() {
        if (typeof this._unwatchA === "function") {
          this._unwatchA();
        }
        if (typeof this._unwatchB === "function") {
          this._unwatchB();
        }
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
        if (typeof this._unwatch2 === "function") {
          this._unwatch2();
        }
      }));

      PersonDayStatData.prototype.clear = (function() {
        DSData.prototype.clear.call(this);
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
        delete this._unwatch1;
        if (typeof this._unwatch2 === "function") {
          this._unwatch2();
        }
        delete this._unwatch2;
      });

      PersonDayStatData.prototype.init = (function(dsDataService) {
        var load, people, peopleItems, personDayStats, sets, tasks, tasksItems, updateStatus;
        if (assert) {
          if (!(dsDataService instanceof DSDataServiceBase)) {
            error.invalidArg('dsDataService');
          }
        }
        (tasks = this.set('tasks', dsDataService.findDataSet(this, _.assign({}, this.params, {
          type: 'Task',
          filter: 'assigned'
        })))).release(this);
        tasksItems = tasks.items;
        (people = this.set('people', dsDataService.findDataSet(this, {
          type: 'Person',
          mode: this.params.mode
        }))).release(this);
        peopleItems = people.items;
        personDayStats = this.get('personDayStats');
        load = ((function(_this) {
          return function() {
            var calcOnePersonStat, change, d, days, daysCount, digestRecalc, endDate, i, person, personKey, personRecalc, r, startDate, statMap, tasksByPerson;
            if (!_this._startLoad()) {
              return;
            }
            tasksByPerson = _.groupBy(tasksItems, (function(task) {
              return task.get('responsible').$ds_key;
            }));
            daysCount = moment.duration((endDate = _this.params.endDate).diff(startDate = _this.params.startDate)).asDays();
            d = startDate;
            days = (function() {
              var j, ref, results;
              results = [];
              for (i = j = 0, ref = daysCount; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                results.push(((d = moment(r = d)).add(1, 'day'), r));
              }
              return results;
            })();
            calcOnePersonStat = (function(personDayStat) {
              var contractTime, dayStats, duedate, estimate, j, k, l, len, len1, len2, n, person, personKey, personTasks, ref, s, split, splitVal, task, tasksCounts, tasksTotal, totalPeriodTime, ttotal;
              tasksCounts = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = days.length; j < len; j++) {
                  d = days[j];
                  results.push(0);
                }
                return results;
              })();
              tasksTotal = (function() {
                var j, len, results;
                results = [];
                for (j = 0, len = days.length; j < len; j++) {
                  d = days[j];
                  results.push(moment.duration(0));
                }
                return results;
              })();
              dayStats = personDayStat.get('dayStats');
              if (tasksByPerson.hasOwnProperty(personKey = (person = personDayStat.get('person')).$ds_key)) {
                personTasks = tasksByPerson[personKey];
                for (j = 0, len = personTasks.length; j < len; j++) {
                  task = personTasks[j];
                  duedate = task.duedate;
                  if ((split = task.get('split')) !== null) {
                    ref = (splitVal = split.list);
                    for (i = k = 0, len1 = ref.length; k < len1; i = k += 2) {
                      d = ref[i];
                      n = Math.floor(moment(duedate).add(d).diff(startDate) / (24 * 60 * 60 * 1000));
                      if ((0 <= n && n < dayStats.length)) {
                        tasksTotal[n].add(splitVal[i + 1]);
                        tasksCounts[n]++;
                      }
                    }
                  } else {
                    n = Math.floor((task.get('duedate').valueOf() - startDate.valueOf()) / (24 * 60 * 60 * 1000));
                    if ((0 <= n && n < dayStats.length)) {
                      if ((estimate = task.get('estimate')) !== null) {
                        tasksTotal[n].add(estimate);
                      }
                      tasksCounts[n]++;
                    }
                  }
                }
              }
              contractTime = person.get('contractTime');
              totalPeriodTime = moment.duration(0);
              for (i = l = 0, len2 = dayStats.length; l < len2; i = ++l) {
                s = dayStats[i];
                s.set('tasksCount', tasksCounts[i]);
                s.set('contract', contractTime);
                s.set('tasksTotal', ttotal = tasksTotal[i]);
                s.set('timeLeft', moment.duration(contractTime).subtract(ttotal));
                totalPeriodTime.add(ttotal);
              }
              personDayStat.set('totalPeriodTime', totalPeriodTime);
            });
            statMap = {};
            for (personKey in peopleItems) {
              person = peopleItems[personKey];
              calcOnePersonStat((statMap[personKey] = new PersonDayStat(_this, person.$ds_key, person, days)));
            }
            _this.get('personDayStatsSet').merge(_this, statMap);
            digestRecalc = (function(personKey) {
              if (!personDayStats.hasOwnProperty(personKey)) {
                return;
              }
              calcOnePersonStat(personDayStats[personKey]);
            });
            personRecalc = (function(person) {
              if (assert) {
                if (!(person instanceof Person)) {
                  error.invalidArg('person');
                }
              }
              DSDigest.render(_this.$ds_key, person.$ds_key, digestRecalc);
            });
            _this._unwatch1 = tasks.watch(_this, {
              change: change = (function(task, propName, val, oldVal) {
                if (propName === 'estimate' || propName === 'split' || propName === 'duedate') {
                  if ((person = task.get('responsible')) !== null && task.get('duedate') !== null) {
                    personRecalc(person);
                  }
                } else if (propName === 'responsible') {
                  if (oldVal !== null && tasksByPerson.hasOwnProperty(personKey = oldVal.$ds_key)) {
                    if ((_.remove(tasksByPerson[personKey], task)).length > 0) {
                      personRecalc(oldVal);
                    }
                  }
                  if (val !== null) {
                    tasks = tasksByPerson.hasOwnProperty(personKey = val.$ds_key) ? tasksByPerson[personKey] : tasksByPerson[personKey] = [];
                    if (!_.find(tasks, task)) {
                      tasks.push(task);
                      personRecalc(val);
                    }
                  }
                }
              }),
              add: (function(task) {
                change(task, 'responsible', task.get('responsible'), null);
              }),
              remove: (function(task) {
                if ((person = task.get('responsible')) !== null && tasksByPerson.hasOwnProperty(personKey = person.$ds_key)) {
                  _.remove(tasksByPerson[personKey], task);
                  personRecalc(person);
                }
              })
            });
            _this._unwatch2 = people.watch(_this, {
              add: (function(person) {
                var key, s;
                s = new PersonDayStat(_this, (key = person.$ds_key), person, days);
                s.get('dayStatsList').merge(_this, (function() {
                  var j, len, results;
                  results = [];
                  for (i = j = 0, len = days.length; j < len; i = ++j) {
                    d = days[i];
                    results.push(((r = new PersonDayStat.DayStat(this, "personKey_" + i)).set('day', d), r));
                  }
                  return results;
                }).call(_this));
                _this.get('personDayStatsSet').add(_this, s);
                personRecalc(person);
              }),
              remove: (function(person) {
                _this.get('personDayStatsSet').remove(_this.get('personDayStats')[person.$ds_key]);
              }),
              change: (function(person, propName, val, oldVal) {
                if (propName === 'contractTime') {
                  personRecalc(person);
                }
              })
            });
            _this._endLoad(true);
          };
        })(this));
        sets = [tasks, people];
        updateStatus = ((function(_this) {
          return function(source, status) {
            var newStatus, prevStatus;
            if (!((newStatus = DSDocument.integratedStatus(sets)) === (prevStatus = _this.get('status')))) {
              switch (newStatus) {
                case 'ready':
                  DSDigest.block(load);
                  break;
                case 'update':
                  if (_this._startLoad()) {
                    _this._endLoad(true);
                  }
                  break;
                case 'nodata':
                  _this.set('status', 'nodata');
              }
            }
          };
        })(this));
        this._unwatchA = people.watchStatus(this, updateStatus);
        this._unwatchB = tasks.watchStatus(this, updateStatus);
        this.init = null;
      });

      PersonDayStatData.end();

      return PersonDayStatData;

    })(DSData);
  })
]);



},{"../dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../dscommon/DSDataServiceBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataServiceBase.coffee","../dscommon/DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","../models/PersonDayStat":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\PersonDayStat.coffee","../models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\dsChanges.coffee":[function(require,module,exports){
var CHANGES_PERSISTANCE_VER, DSChangesBase, DSDataEditable, DSDigest, Person, RMSData, Task, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataChanges', ['LocalStorageModule', require('../dscommon/DSDataSource')])).name;

assert = require('../dscommon/util').assert;

serviceOwner = require('../dscommon/util').serviceOwner;

error = require('../dscommon/util').error;

DSDigest = require('../dscommon/DSDigest');

DSChangesBase = require('../dscommon/DSChangesBase');

DSDataEditable = require('../dscommon/DSDataEditable');

Person = require('../models/Person');

Task = require('../models/Task');

RMSData = require('../utils/RMSData');

ngModule.run([
  'dsChanges', '$rootScope', (function(dsChanges, $rootScope) {
    $rootScope.changes = dsChanges;
  })
]);

CHANGES_PERSISTANCE_VER = 1;

ngModule.factory('dsChanges', [
  'DSDataSource', 'config', 'localStorageService', '$http', '$timeout', '$q', (function(DSDataSource, config, localStorageService, $http, $timeout, $q) {
    var DSChanges;
    DSChanges = (function(superClass) {
      var class1;

      extend(DSChanges, superClass);

      function DSChanges() {
        return class1.apply(this, arguments);
      }

      DSChanges.begin('DSChanges');

      DSChanges.propSet('tasks', Task.Editable);

      DSChanges.propObj('dataService');

      DSChanges.propDoc('source', DSDataSource);

      DSChanges.propObj('cancel', null);

      DSChanges.ds_dstr.push((function() {
        var cancel;
        this.__unwatch2();
        if (typeof this.__unwatchStatus1 === "function") {
          this.__unwatchStatus1();
        }
        if (typeof this.__unwatchStatus2 === "function") {
          this.__unwatchStatus2();
        }
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      }));

      class1 = (function(referry, key) {
        DSChangesBase.call(this, referry, key);
      });

      DSChanges.prototype.init = (function(dataService) {
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, this.set('dataService', dataService));
      });

      DSChanges.prototype.clear = (function() {
        if (typeof this.__unwatchStatus2 === "function") {
          this.__unwatchStatus2();
        }
        delete this.__unwatchStatus2;
        this.reset();
      });

      DSChanges.prototype.load = (function() {
        var $u, changes, peopleSet;
        if (this.get('status') !== 'ready') {
          if (!this._startLoad()) {
            return;
          }
          $u = DSDataEditable(Task.Editable).$u;
          if ((changes = localStorageService.get('changes'))) {
            if (changes.ver === CHANGES_PERSISTANCE_VER && changes.source.url === config.get('teamwork') && changes.source.token === config.get('token')) {
              peopleSet = this.get('dataService').findDataSet(this, {
                type: Person.docType,
                mode: 'original'
              });
              this.__unwatchStatus2 = peopleSet.watchStatus(this, ((function(_this) {
                return function(source, status, prevStatus, unwatch) {
                  if (!(status === 'ready')) {
                    return;
                  }
                  unwatch();
                  DSDigest.block((function() {
                    var f, i, len, loadList, person, personKey, ref, ref1, set, step1, task, taskChange, taskEditable, taskKey, tasksSet, tasksSetPool;
                    Task.pool.enableWatch(false);
                    step1 = _this.mapToChanges(changes.changes);
                    ref = step1.load.Person;
                    for (personKey in ref) {
                      loadList = ref[personKey];
                      if (!peopleSet.items.hasOwnProperty(personKey)) {
                        console.error('Person #{personKey} missing in server data');
                      } else {
                        person = peopleSet.items[personKey];
                        for (i = 0, len = loadList.length; i < len; i++) {
                          f = loadList[i];
                          f(person);
                        }
                      }
                    }
                    tasksSetPool = (tasksSet = _this.get('tasksSet')).$ds_pool;
                    set = {};
                    ref1 = step1.changes.tasks;
                    for (taskKey in ref1) {
                      taskChange = ref1[taskKey];
                      if (Task.pool.items.hasOwnProperty(taskKey)) {
                        (task = Task.pool.items[taskKey]).addRef(_this);
                      } else {
                        (task = Task.pool.find(_this, taskKey)).readMap(changes.tasks[taskKey]);
                      }
                      (taskEditable = tasksSetPool.find(_this, taskKey, set)).init(task, tasksSet, taskChange);
                      taskEditable.$u = $u;
                      task.release(_this);
                    }
                    tasksSet.merge(_this, set);
                    Task.pool.enableWatch(true);
                    _this._endLoad(true);
                  }));
                };
              })(this)));
              peopleSet.release(this);
            } else {
              localStorageService.remove('changes');
              this._endLoad(true);
            }
          } else {
            this._endLoad(true);
          }
        }
      });

      DSChanges.prototype.persist = (function() {
        if (!this.hasOwnProperty('__persist')) {
          this.__persist = $timeout(((function(_this) {
            return function() {
              delete _this.__persist;
              _this.saveToLocalStorage();
            };
          })(this)));
        }
      });

      DSChanges.prototype.saveToLocalStorage = (function() {
        var changes, taskKey, tasks;
        if (!this.anyChange()) {
          localStorageService.remove('changes');
        } else {
          changes = this.changesToMap();
          tasks = {};
          for (taskKey in changes.tasks) {
            tasks[taskKey] = Task.pool.items[taskKey].writeMap();
          }
          localStorageService.set('changes', {
            ver: CHANGES_PERSISTANCE_VER,
            changes: changes,
            source: {
              url: config.get('teamwork'),
              token: config.get('token')
            },
            tasks: tasks
          });
        }
      });

      DSChanges.prototype.save = (function(saveInProgress) {
        return function(isContinue) {
          var change, dueDateStr, duedate, nextTask, promise, propChange, propName, ref, split, startDate, task, taskKey, taskUpd, upd;
          if (saveInProgress && !isContinue) {
            return saveInProgress.promise;
          }
          if (!isContinue) {
            saveInProgress = $q.defer();
          }
          upd = {
            'todo-item': taskUpd = {}
          };
          task = change = null;
          ref = this.get('tasks');
          for (taskKey in ref) {
            nextTask = ref[taskKey];
            task = nextTask;
            change = _.clone(task.__change);
            taskUpd['content'] = task.get('title');
            for (propName in change) {
              propChange = change[propName];
              switch (propName) {
                case 'title':
                  void 0;
                  break;
                case 'split':
                  taskUpd['description'] = RMSData.put(task.get('description'), (split = propChange.v) ? {
                    split: propChange.v.valueOf()
                  } : null);
                  taskUpd['start-date'] = split === null || (duedate = task.get('duedate')) === null ? '' : split.firstDate(duedate).format('YYYYMMDD');
                  break;
                case 'duedate':
                  taskUpd['due-date'] = dueDateStr = propChange.v ? propChange.v.format('YYYYMMDD') : '';
                  if ((startDate = task.get('startDate')) !== null && startDate > task.get('duedate')) {
                    taskUpd['start-date'] = dueDateStr;
                  }
                  break;
                case 'estimate':
                  taskUpd['estimated-minutes'] = propChange.v ? Math.floor(propChange.v.asMinutes()) : '0';
                  break;
                case 'responsible':
                  taskUpd['responsible-party-id'] = propChange.v ? [propChange.v.get('id')] : [];
                  break;
                default:
                  console.error("change.save(): Property " + propName + " not expected to be changed");
              }
            }
            break;
          }
          if (!task) {
            saveInProgress.resolve();
            promise = saveInProgress.promise;
            saveInProgress = null;
            return promise;
          }
          task.addRef(this);
          (function(_this) {
            return (function(task, change) {
              return _this.get('source').httpPut("tasks/" + (task.get('id')) + ".json", upd, _this.set('cancel', $q.defer())).then((function(resp) {
                _this.set('cancel', null);
                if (resp.status === 200) {
                  DSDigest.block((function() {
                    for (propName in change) {
                      propChange = change[propName];
                      task.$ds_doc.set(propName, propChange.v);
                    }
                    task.release(_this);
                  }));
                  _this.save(true);
                } else {
                  task.release(_this);
                  saveInProgress.reject();
                  saveInProgress = null;
                }
              }), (function() {
                _this.set('cancel', null);
                task.release(_this);
                saveInProgress.reject();
                saveInProgress = null;
              }));
            });
          })(this)(task, change);
          return saveInProgress.promise;
        };
      })(null);

      DSChanges.end();

      return DSChanges;

    })(DSChangesBase);
    return serviceOwner.add(new DSChanges(serviceOwner, 'dataChanges'));
  })
]);



},{"../dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../dscommon/DSDataSource":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSource.coffee","../dscommon/DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","../models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee","../utils/RMSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\RMSData.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\dsDataService.coffee":[function(require,module,exports){
var DSChangesBase, DSDataEditable, DSDataFiltered, DSDataServiceBase, DSObject, Person, Task, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataService', [require('./PeopleWithJson'), require('./teamwork/TWPeople'), require('./teamwork/TWTasks'), require('./PersonDayStatData'), require('./dsChanges'), require('../dscommon/DSDataSource'), require('../config')])).name;

assert = require('../dscommon/util').assert;

serviceOwner = require('../dscommon/util').serviceOwner;

error = require('../dscommon/util').error;

DSObject = require('../dscommon/DSObject');

DSDataServiceBase = require('../dscommon/DSDataServiceBase');

DSChangesBase = require('../dscommon/DSChangesBase');

DSDataEditable = require('../dscommon/DSDataEditable');

DSDataFiltered = require('../dscommon/DSDataFiltered');

Person = require('../models/Person');

Task = require('../models/Task');

ngModule.run([
  'dsDataService', '$rootScope', (function(dsDataService, $rootScope) {
    $rootScope.dataService = dsDataService;
  })
]);

ngModule.factory('dsDataService', [
  'TWPeople', 'TWTasks', 'PeopleWithJson', 'PersonDayStatData', 'DSDataSource', 'dsChanges', 'config', '$http', '$rootScope', (function(TWPeople, TWTasks, PeopleWithJson, PersonDayStatData, DSDataSource, dsChanges, config, $http, $rootScope) {
    var DSDataService;
    DSDataService = (function(superClass) {
      var class1;

      extend(DSDataService, superClass);

      function DSDataService() {
        return class1.apply(this, arguments);
      }

      DSDataService.begin('DSDataService');

      DSDataService.propDoc('dataSource', DSDataSource);

      DSDataService.propPool('editedPeople', DSDataEditable(Person.Editable));

      DSDataService.propPool('editedTasks', DSDataEditable(Task.Editable));

      DSDataService.propPool('tasksPool', DSDataFiltered(Task));

      DSDataService.propDoc('changes', DSChangesBase);

      DSDataService.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      class1 = (function() {
        DSDataServiceBase.apply(this, arguments);
        (this.set('dataSource', new DSDataSource(this, 'dataSource'))).release(this);
        this.__unwatch2 = $rootScope.$watch((function() {
          return [config.get('teamwork'), config.get('token')];
        }), ((function(_this) {
          return function(connect) {
            if (connect[0] && connect[1]) {
              _this.get('dataSource').setConnection(connect[0], connect[1]);
            } else {
              _this.get('dataSource').setConnection(null, null);
            }
          };
        })(this)), true);
        (this.set('changes', dsChanges)).init(this);
      });

      DSDataService.prototype.refresh = (function() {
        this.get('dataSource').refresh();
      });

      DSDataService.prototype.findDataSet = (function(owner, params) {
        var base, base1, base2, base3, changesSet, data, originalSet, set;
        if (assert) {
          if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
            error.invalidArg('owner');
          }
          if (typeof params !== 'object') {
            error.invalidArg('params');
          }
        }
        DSDataServiceBase.prototype.findDataSet.call(this, owner, params);
        if (params.type === 'PersonDayStat') {
          if (typeof (base = (data = PersonDayStatData.pool.find(this, params))).init === "function") {
            base.init(this);
          }
          (set = data.get('personDayStatsSet')).addRef(owner);
          data.release(this);
          return set;
        } else {
          switch (params.mode) {
            case 'edited':
              switch (params.type) {
                case 'Person':
                  return this.findDataSet(owner, _.assign({}, params, {
                    mode: 'original'
                  }));
                case 'Task':
                  if ((data = this.get('editedTasks').find(this, params)).init) {
                    data.init(originalSet = this.findDataSet(this, _.assign({}, params, {
                      mode: 'original'
                    })), changesSet = this.findDataSet(this, _.assign({}, params, {
                      mode: 'changes'
                    })), TWTasks.filter(params));
                    originalSet.release(this);
                    changesSet.release(this);
                  }
                  (set = data.get('itemsSet')).addRef(owner);
                  data.release(this);
                  return set;
                default:
                  throw new Error("Not supported model type: " + v.type);
              }
              break;
            case 'changes':
              switch (params.type) {
                case 'Task':
                  return (set = this.get('changes').get('tasksSet')).addRef(owner);
                default:
                  throw new Error("Not supported model type: " + v.type);
              }
              break;
            case 'original':
              switch ((params.type !== 'Person' ? params.type : config.get('hasRoles') ? 'PeopleWithJson' : 'TeamworkPeople')) {
                case 'PeopleWithJson':
                  if (typeof (base1 = (data = PeopleWithJson.pool.find(this, params))).init === "function") {
                    base1.init(this);
                  }
                  (set = data.get('peopleSet')).addRef(owner);
                  data.release(this);
                  return set;
                case 'TeamworkPeople':
                  if (typeof (base2 = (data = TWPeople.pool.find(this, params))).init === "function") {
                    base2.init(this);
                  }
                  (set = data.get('peopleSet')).addRef(owner);
                  data.release(this);
                  return set;
                case 'Task':
                  if (params.filter === 'all' && !params.hasOwnProperty('startDate')) {
                    if (typeof (base3 = (data = TWTasks.pool.find(this, params))).init === "function") {
                      base3.init(this);
                    }
                    (set = data.get('tasksSet')).addRef(owner);
                    data.release(this);
                  } else {
                    if ((data = this.get('tasksPool').find(this, params)).init) {
                      data.init(originalSet = this.findDataSet(this, {
                        type: Task.name,
                        filter: 'all',
                        mode: 'original'
                      }), TWTasks.filter(params));
                      originalSet.release(this);
                    }
                    (set = data.get('itemsSet')).addRef(owner);
                    data.release(this);
                  }
                  return set;
                default:
                  throw new Error("Not supported model type: " + v.type);
              }
          }
        }
      });

      DSDataService.prototype.requestSources = (function(owner, params, sources) {
        var k, mode, newSet, requestParams, set, srcParams, typeName, v;
        DSDataServiceBase.prototype.requestSources.call(this, owner, params, sources);
        for (k in sources) {
          v = sources[k];
          srcParams = _.assign({}, v.params, params);
          requestParams = {
            type: typeName = v.type.name,
            mode: mode = srcParams.mode
          };
          switch (typeName) {
            case 'Person':
              void 0;
              break;
            case 'PersonDayStat':
              requestParams.startDate = srcParams.startDate || params.startDate;
              requestParams.endDate = srcParams.endDate || params.endDate;
              break;
            case 'Task':
              if (mode !== 'changes') {
                if (assert) {
                  if (!(typeof srcParams.filter === 'string' && 0 <= ['all', 'assigned', 'notassigned', 'overdue', 'noduedate'].indexOf(srcParams.filter))) {
                    throw new Error("Unexpected filter: " + srcParams.filter);
                  }
                }
                requestParams.filter = srcParams.filter;
                if (srcParams.filter === 'all' || srcParams.filter === 'assigned' || srcParams.filter === 'notassigned') {
                  requestParams.startDate = srcParams.startDate || params.startDate;
                  requestParams.endDate = srcParams.endDate || params.endDate;
                }
              }
              break;
            default:
              throw new Error("Not supported model type: " + v.type);
          }
          newSet = this.findDataSet(owner, requestParams);
          if (typeof (set = v.set) === 'undefined' || set !== newSet) {
            v.newSet = newSet;
          } else {
            newSet.release(owner);
          }
        }
      });

      DSDataService.end();

      return DSDataService;

    })(DSDataServiceBase);
    return serviceOwner.add(new DSDataService(serviceOwner, 'dataService'));
  })
]);



},{"../config":"C:\\SVN\\_WebProfyManagement\\src\\app\\config.coffee","../dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../dscommon/DSDataFiltered":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataFiltered.coffee","../dscommon/DSDataServiceBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataServiceBase.coffee","../dscommon/DSDataSource":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSource.coffee","../dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","../models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee","./PeopleWithJson":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\PeopleWithJson.coffee","./PersonDayStatData":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\PersonDayStatData.coffee","./dsChanges":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\dsChanges.coffee","./teamwork/TWPeople":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\teamwork\\TWPeople.coffee","./teamwork/TWTasks":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\teamwork\\TWTasks.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\teamwork\\TWPeople.coffee":[function(require,module,exports){
var Person, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWPeople', [require('../../dscommon/DSDataSource'), require('../../dscommon/DSDataSimple')])).name;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

Person = require('../../models/Person');

ngModule.factory('TWPeople', [
  'DSDataSimple', 'DSDataSource', (function(DSDataSimple, DSDataSource) {
    var TWPeople;
    return TWPeople = (function(superClass) {
      extend(TWPeople, superClass);

      function TWPeople() {
        return TWPeople.__super__.constructor.apply(this, arguments);
      }

      TWPeople.begin('TWPeople');

      TWPeople.addPool();

      TWPeople.propSet('people', Person);

      TWPeople.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      TWPeople.prototype.init = (function(dsDataService) {
        this.set('request', "people.json");
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      TWPeople.prototype.importResponse = (function(json) {
        var i, jsonPerson, len, peopleMap, person, ref;
        peopleMap = {};
        ref = json['people'];
        for (i = 0, len = ref.length; i < len; i++) {
          jsonPerson = ref[i];
          person = Person.pool.find(this, "" + jsonPerson['id'], peopleMap);
          person.set('id', +jsonPerson['id']);
          person.set('name', (jsonPerson['last-name'] + " " + (jsonPerson['first-name'].charAt(0).toUpperCase()) + ".").trim());
          person.set('avatar', jsonPerson['avatar-url']);
          person.set('email', jsonPerson['email-address']);
          person.set('companyId', +jsonPerson['company-id']);
        }
        this.get('peopleSet').merge(this, peopleMap);
        return true;
      });

      TWPeople.end();

      return TWPeople;

    })(DSDataSimple);
  })
]);



},{"../../dscommon/DSDataSimple":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSimple.coffee","../../dscommon/DSDataSource":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSource.coffee","../../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\teamwork\\TWTasks.coffee":[function(require,module,exports){
var DSData, DSDigest, Person, Project, RMSData, Task, TaskSplit, TodoList, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTasks', [require('../../dscommon/DSDataSource'), require('../../dscommon/DSDataSimple')])).name;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

Task = require('../../models/Task');

Person = require('../../models/Person');

TodoList = require('../../models/TodoList');

Project = require('../../models/Project');

DSData = require('../../dscommon/DSData');

DSDigest = require('../../dscommon/DSDigest');

TaskSplit = require('../../models/types/TaskSplit');

RMSData = require('../../utils/RMSData');

ngModule.factory('TWTasks', [
  'DSDataSimple', 'DSDataSource', '$q', (function(DSDataSimple, DSDataSource, $q) {
    var TWTasks;
    return TWTasks = (function(superClass) {
      var isTaskInDatesRange, loadInProgress;

      extend(TWTasks, superClass);

      function TWTasks() {
        return TWTasks.__super__.constructor.apply(this, arguments);
      }

      TWTasks.begin('TWTasks');

      TWTasks.addPool();

      TWTasks.propDoc('source', DSDataSource);

      TWTasks.propStr('request');

      TWTasks.propSet('tasks', Task);

      TWTasks.propObj('cancel', null);

      TWTasks.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        this.__unwatch1();
        this.__unwatch2();
      }));

      isTaskInDatesRange = (function(params, task) {
        var duedate, ref, split;
        if ((duedate = task.get('duedate')) === null) {
          return false;
        }
        if ((split = task.get('split')) === null) {
          return (params.startDate <= (ref = task.get('duedate')) && ref <= params.endDate);
        } else {
          return params.startDate <= split.lastDate(duedate = task.get('duedate')) && split.firstDate(duedate) <= params.endDate;
        }
      });

      TWTasks.filter = (function(params) {
        switch (params.filter) {
          case 'all':
            if (moment.isMoment(params.startDate)) {
              return function(task) {
                return isTaskInDatesRange(params, task);
              };
            } else {
              return function(task) {
                return true;
              };
            }
            break;
          case 'assigned':
            return function(task) {
              return task.get('responsible') !== null && isTaskInDatesRange(params, task);
            };
          case 'notassigned':
            return function(task) {
              return task.get('responsible') === null && isTaskInDatesRange(params, task);
            };
          case 'overdue':
            return function(task) {
              var date;
              return (date = task.get('duedate')) !== null && date < moment().startOf('day');
            };
          case 'noduedate':
            return function(task) {
              return task.get('duedate') === null;
            };
          default:
            throw new Error("Not supported filter: " + params.filter);
        }
      });

      TWTasks.prototype.init = (function(dsDataService) {
        var filter, params, tasksSet;
        this.set('request', (function() {
          switch ((params = this.get('params')).filter) {
            case 'all':
              if (moment.isMoment(params.startDate)) {
                return "tasks.json?startdate=" + (params.startDate.format('YYYYMMDD')) + "&enddate=" + (params.endDate.format('YYYYMMDD')) + "&getSubTasks=no";
              } else {
                return "tasks.json?getSubTasks=no";
              }
              break;
            case 'assigned':
              return "tasks.json?startdate=" + (params.startDate.format('YYYYMMDD')) + "&enddate=" + (params.endDate.format('YYYYMMDD')) + "&responsible-party-ids=-1&getSubTasks=no";
            case 'notassigned':
              return "tasks.json?startdate=" + (params.startDate.format('YYYYMMDD')) + "&enddate=" + (params.endDate.format('YYYYMMDD')) + "&responsible-party-ids=0&getSubTasks=no";
            case 'overdue':
              return "tasks.json?filter=overdue&getSubTasks=no";
            case 'noduedate':
              return "tasks.json?filter=nodate&include=noduedate&getSubTasks=no";
            default:
              throw new Error("Unexpected filter: " + params.filter);
          }
        }).call(this));
        filter = TWTasks.filter(this.params);
        tasksSet = this.get('tasksSet');
        this.__unwatch1 = Task.pool.watch(this, ((function(_this) {
          return function(item) {
            if (filter(item)) {
              item.addRef(_this);
              if (!tasksSet.items.hasOwnProperty(item.$ds_key)) {
                tasksSet.add(_this, item);
              }
            } else {
              if (tasksSet.items.hasOwnProperty(item.$ds_key)) {
                tasksSet.remove(item);
              }
            }
          };
        })(this)));
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      loadInProgress = true;

      TWTasks.prototype.load = (function() {
        var importResponse, pageLoad, peopleMap, projectMap, taskMap, todoListMap;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        taskMap = {};
        peopleMap = {};
        projectMap = {};
        todoListMap = {};
        importResponse = ((function(_this) {
          return function(json) {
            var count, data, date, desc, duedateStr, estimate, i, jsonTask, len, person, project, ref, resp, split, task, todoList;
            count = 0;
            Task.pool.enableWatch(false);
            try {
              ref = json['todo-items'];
              for (i = 0, len = ref.length; i < len; i++) {
                jsonTask = ref[i];
                count++;
                task = Task.pool.find(_this, "" + jsonTask['id'], taskMap);
                person = Person.pool.find(_this, "" + jsonTask['creator-id'], peopleMap);
                project = Project.pool.find(_this, "" + jsonTask['project-id'], projectMap);
                todoList = TodoList.pool.find(_this, "" + jsonTask['todo-list-id'], projectMap);
                todoList.set('project', project);
                task.set('id', parseInt(jsonTask['id']));
                task.set('creator', person);
                task.set('project', project);
                task.set('todoList', todoList);
                task.set('title', jsonTask['content']);
                task.set('estimate', (estimate = jsonTask['estimated-minutes']) ? moment.duration(estimate, 'minutes') : null);
                task.set('duedate', (duedateStr = jsonTask['due-date']) ? moment(duedateStr, 'YYYYMMDD') : null);
                task.set('startDate', (date = jsonTask['start-date']) ? moment(date, 'YYYYMMDD') : null);
                desc = jsonTask['description'];
                data = RMSData.get(desc);
                if (data !== null) {
                  desc = RMSData.clear(desc);
                  if (data.hasOwnProperty('split') && duedateStr !== null) {
                    task.set('split', split = new TaskSplit(data.split));
                  }
                }
                task.set('description', desc);
                if (jsonTask['responsible-party-ids']) {
                  task.set('responsible', (resp = jsonTask['responsible-party-ids'].split(',')).length > 0 ? Person.pool.find(_this, "" + resp[0], peopleMap) : null);
                }
                person.set('id', parseInt(jsonTask['creator-id']));
                todoList.set('id', parseInt(jsonTask['todo-list-id']));
                todoList.set('name', jsonTask['todo-list-name']);
                project.set('id', parseInt(jsonTask['project-id']));
                project.set('name', jsonTask['project-name']);
              }
            } finally {
              Task.pool.enableWatch(true);
            }
            return count === 250;
          };
        })(this));
        (pageLoad = (function(page) {
          this.get('source').httpGet((this.get('request')) + "&page=" + page + "&pageSize=250", this.set('cancel', $q.defer())).then(((function(_this) {
            return function(resp) {
              if (resp.status === 200) {
                _this.set('cancel', null);
                if (DSDigest.block((function() {
                  return importResponse(resp.data, resp.status);
                }))) {
                  pageLoad.call(_this, page + 1);
                } else {
                  DSDigest.block((function() {
                    var k, v;
                    _this.get('tasksSet').merge(_this, taskMap);
                    for (k in peopleMap) {
                      v = peopleMap[k];
                      v.release(_this);
                    }
                    for (k in todoListMap) {
                      v = todoListMap[k];
                      v.release(_this);
                    }
                    for (k in projectMap) {
                      v = projectMap[k];
                      v.release(_this);
                    }
                  }));
                  _this._endLoad(true);
                }
              }
            };
          })(this)), ((function(_this) {
            return function() {
              var k, v;
              _this.set('cancel', null);
              for (k in taskMap) {
                v = taskMap[k];
                v.release(_this);
              }
              for (k in peopleMap) {
                v = peopleMap[k];
                v.release(_this);
              }
              for (k in todoListMap) {
                v = todoListMap[k];
                v.release(_this);
              }
              for (k in projectMap) {
                v = projectMap[k];
                v.release(_this);
              }
              _this._endLoad(false);
            };
          })(this)));
        })).call(this, 1);
      });

      TWTasks.end();

      return TWTasks;

    })(DSData);
  })
]);



},{"../../dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../dscommon/DSDataSimple":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSimple.coffee","../../dscommon/DSDataSource":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSource.coffee","../../dscommon/DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","../../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","../../models/Project":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Project.coffee","../../models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee","../../models/TodoList":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\TodoList.coffee","../../models/types/TaskSplit":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\types\\TaskSplit.coffee","../../utils/RMSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\RMSData.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee":[function(require,module,exports){
var DSChangesBase, DSData, DSDocument, DSHistory, DSPool, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSHistory = require('./DSHistory');

DSPool = require('./DSPool');

DSData = require('./DSData');

DSDocument = require('./DSDocument');

module.exports = DSChangesBase = (function(superClass) {
  var class1, loadOneDoc;

  extend(DSChangesBase, superClass);

  function DSChangesBase() {
    return class1.apply(this, arguments);
  }

  DSChangesBase.begin('DSChangesBase');

  DSChangesBase.noCache();

  DSChangesBase.propDoc('hist', DSHistory);

  DSChangesBase.propNum('count', 0);

  class1 = (function(referry, key) {
    var countChanges, hist, i, len, ref, set, setName, unwatch;
    DSData.call(this, referry, key, {});
    (hist = this.set('hist', new DSHistory(this, key + ".hist"))).release(this);
    countChanges = {
      add: ((function(_this) {
        return function() {
          _this.count++;
          _this.persist();
        };
      })(this)),
      change: ((function(_this) {
        return function() {
          _this.persist();
        };
      })(this)),
      remove: ((function(_this) {
        return function() {
          _this.count--;
          _this.persist();
        };
      })(this))
    };
    this.__unwatch2 = unwatch = [];
    ref = this.__proto__.__sets;
    for (i = 0, len = ref.length; i < len; i++) {
      setName = ref[i];
      (set = this["_" + setName]).$ds_hist = hist;
      (set.$ds_pool = new DSPool(this, key + "." + setName + ".pool", set.type)).release(this);
      set.watch(this, countChanges, true);
    }
  });

  DSChangesBase.prototype.saveToLocalStorage = _.noop;

  DSChangesBase.prototype.persist = (function() {});

  DSChangesBase.prototype.anyChange = (function() {
    return this.get('count') > 0;
  });

  DSChangesBase.prototype.reset = (function() {
    var hist, i, item, j, l, len, len1, len2, originalItem, propName, ref, ref1, ref2, s, set;
    (hist = this.get('hist')).startReset();
    try {
      ref = this.__proto__.__sets;
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        ref1 = _.map((set = this["_" + s]).items, (function(v) {
          return v;
        }));
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          item = ref1[j];
          originalItem = item.$ds_doc;
          ref2 = (function() {
            var results;
            results = [];
            for (propName in item.__change) {
              results.push(propName);
            }
            return results;
          })();
          for (l = 0, len2 = ref2.length; l < len2; l++) {
            propName = ref2[l];
            item.set(propName, originalItem.get(propName));
          }
        }
      }
    } finally {
      hist.endReset();
    }
  });

  DSChangesBase.prototype.changesToMap = (function() {
    var i, item, itemChanges, itemKey, len, propChange, propName, props, ref, ref1, ref2, res, resSet, set, setName, write;
    res = {};
    ref = this.__proto__.__sets;
    for (i = 0, len = ref.length; i < len; i++) {
      setName = ref[i];
      props = (set = this["_" + setName]).type.prototype.__props;
      res[setName] = (resSet = {});
      ref1 = set.items;
      for (itemKey in ref1) {
        item = ref1[itemKey];
        resSet[itemKey] = (itemChanges = {});
        ref2 = item.__change;
        for (propName in ref2) {
          propChange = ref2[propName];
          if ((write = props[propName].write)) {
            itemChanges[propName] = {
              v: propChange.v === null ? null : write(propChange.v),
              s: propChange.s === null ? null : write(propChange.s)
            };
          }
        }
      }
    }
    return res;
  });

  loadOneDoc = (function(propChange, load, type, change, propName) {
    var docType, loadList, typeLoad;
    typeLoad = !load.hasOwnProperty(docType = type.docType) ? load[docType] = {} : load[docType];
    typeLoad[propChange[propName]] = loadList = !typeLoad.hasOwnProperty(propChange[propName]) ? typeLoad[propChange[propName]] = [] : typeLoad[propChange[propName]];
    loadList.push((function(type, key, change) {
      return function(doc) {
        if (assert) {
          if (!(doc !== null && doc.__proto__.constructor === type && doc.$ds_key === key)) {
            error.invalidArg('doc');
          }
        }
        change[propName] = doc;
      };
    })(type, propChange[propName], change));
  });

  DSChangesBase.prototype.mapToChanges = (function(map) {
    var change, changes, i, item, itemChanges, itemKey, len, load, prop, propChange, propName, props, read, ref, ref1, res, resSet, setName, type;
    res = {
      load: load = {},
      changes: changes = {}
    };
    ref = this.__proto__.__sets;
    for (i = 0, len = ref.length; i < len; i++) {
      setName = ref[i];
      props = this["_" + setName].type.prototype.__props;
      changes[setName] = resSet = {};
      ref1 = map[setName];
      for (itemKey in ref1) {
        item = ref1[itemKey];
        resSet[itemKey] = (itemChanges = {});
        for (propName in item) {
          propChange = item[propName];
          itemChanges[propName] = (function() {
            if (typeof (type = (prop = props[propName]).type) === 'function') {
              change = {
                v: null,
                s: null
              };
              if (propChange.v) {
                loadOneDoc(propChange, load, type, change, 'v');
              }
              if (propChange.s) {
                loadOneDoc(propChange, load, type, change, 's');
              }
              return change;
            } else if ((read = prop.read)) {
              return {
                v: propChange.v === null ? null : read(propChange.v),
                s: propChange.s === null ? null : read(propChange.s)
              };
            } else {
              throw new Error("Unsupported type " + type);
            }
          })();
        }
      }
    }
    return res;
  });

  DSChangesBase.end();

  if (assert) {
    DSChangesBase.end = (function() {
      var k, ref, v;
      DSData.end.call(this);
      ref = this.prototype.__props;
      for (k in ref) {
        v = ref[k];
        if (v.type === 'set' && !v.itemType.ds_editable) {
          throw new Error("Type '" + this.name + "': propSet '" + k + "' has non-editable item type");
        }
      }
    });
  }

  return DSChangesBase;

})(DSData);



},{"./DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","./DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","./DSHistory":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSHistory.coffee","./DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee":[function(require,module,exports){
var DSData, DSObject, assert, error, modeReleaseDataOnReload, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

serviceOwner = require('./util').serviceOwner;

modeReleaseDataOnReload = require('./util').modeReleaseDataOnReload;

DSObject = require('./DSObject');

module.exports = DSData = (function(superClass) {
  var class1;

  extend(DSData, superClass);

  function DSData() {
    return class1.apply(this, arguments);
  }

  DSData.begin('DSData');

  DSData.propObj('params');

  DSData.noCache = (function(enable) {
    if (arguments.length === 0 || enable) {
      this.ds_noCache = true;
    } else {
      delete this.ds_noCache;
    }
  });

  DSData.addDataSource((function(status, prevStatus) {
    var i, len, ref, setName;
    ref = this.__proto__.__sets;
    for (i = 0, len = ref.length; i < len; i++) {
      setName = ref[i];
      this["_" + setName].set('status', status);
    }
    if (status === 'update' && this.$ds_ref === 1 && modeReleaseDataOnReload && !this.ds_noCache) {
      serviceOwner.remove(this.release(serviceOwner));
      return;
    }
    if (status === 'nodata') {
      this.clear();
    }
  }));

  DSData.prototype._startLoad = (function() {
    var status;
    switch ((status = this.get('status'))) {
      case 'load':
        return false;
      case 'update':
        return false;
    }
    this.set('status', (function() {
      switch (status) {
        case 'nodata':
          return 'load';
        case 'ready':
          return 'update';
      }
    })());
    return this.$ds_ref > 0;
  });

  DSData.prototype._endLoad = (function(isSuccess) {
    this.set('status', isSuccess ? 'ready' : 'nodata');
  });

  class1 = (function(referry, key, params) {
    DSObject.call(this, referry, key);
    if (assert) {
      if (this.__proto__.constructor === DSData) {
        throw new Error('Cannot instantiate DSData directly');
      }
      if (typeof params !== 'object') {
        error.invalidArg('params');
      }
    }
    this.set('params', params);
    this.__busySets = 0;
    if (modeReleaseDataOnReload && !this.__proto__.constructor.ds_noCache) {
      serviceOwner.add(this.addRef(serviceOwner));
    }
  });

  DSData.prototype.clear = (function() {
    var i, len, ref, setName;
    ref = this.__proto__.__sets;
    for (i = 0, len = ref.length; i < len; i++) {
      setName = ref[i];
      this["_" + setName].clear();
    }
  });

  DSData.prototype.refresh = (function() {
    this.load();
  });

  DSData.end();

  DSData.end = (function() {
    var setName, v;
    DSObject.end.call(this);
    this.prototype.__sets = (function() {
      var ref, results;
      ref = this.prototype.__props;
      results = [];
      for (setName in ref) {
        v = ref[setName];
        if (v.type === 'set') {
          results.push(setName);
        }
      }
      return results;
    }).call(this);
  });

  return DSData;

})(DSObject);



},{"./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee":[function(require,module,exports){
var DSData, DSDigest, DSDocument, DSSet, assert, classes, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSDocument = require('./DSDocument');

DSData = require('./DSData');

DSDigest = require('./DSDigest');

DSSet = require('./DSSet');

classes = {};

module.exports = (function(itemType) {
  var DSDataEditable, clazz;
  if (assert) {
    if (!(itemType !== null && itemType.ds_editable)) {
      error.invalidArg('itemType');
    }
  }
  if (classes.hasOwnProperty(itemType.docType) && (clazz = classes[itemType.docType]).itemType === itemType) {
    return clazz;
  } else {
    return classes[itemType.name] = DSDataEditable = (function(superClass) {
      var $u, k;

      extend(DSDataEditable, superClass);

      function DSDataEditable() {
        return DSDataEditable.__super__.constructor.apply(this, arguments);
      }

      DSDataEditable.begin("DSDataEditable<" + itemType.name + ">");

      DSDataEditable.propDoc('original', DSSet);

      DSDataEditable.propDoc('changes', DSSet);

      DSDataEditable.propSet('items', DSDataEditable.itemType = itemType);

      DSDataEditable.ds_dstr.push((function() {
        if (typeof this._unwatchA === "function") {
          this._unwatchA();
        }
        if (typeof this._unwatchB === "function") {
          this._unwatchB();
        }
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
        if (typeof this._unwatch2 === "function") {
          this._unwatch2();
        }
      }));

      DSDataEditable.prototype.clear = (function() {
        DSData.prototype.clear.call(this);
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
        delete this._unwatch1;
        if (typeof this._unwatch2 === "function") {
          this._unwatch2();
        }
        delete this._unwatch2;
      });

      DSDataEditable.$u = $u = {};

      for (k in itemType.__super__.__props) {
        $u[k] = true;
      }

      DSDataEditable.prototype.init = (function(original, changes, filter) {
        var changesItems, editablePool, items, itemsSet, load, originalItems, sets, updateStatus;
        if (assert) {
          if (!(changes instanceof DSSet)) {
            error.invalidArg('changes');
          }
          if (!(original instanceof DSSet)) {
            error.invalidArg('original');
          }
          if (!(typeof filter === 'function' || typeof filter === 'undefined')) {
            error.invalidArg('filter');
          }
          if (!(!original.type.ds_editable)) {
            throw new Error("'original' expected to have non DSDocument.Editable items");
          }
          if (!(itemType === changes.type)) {
            throw new Error("'itemType' and 'changes' must have same DSDocument.Editable type");
          }
          if (!(original.type.Editable === changes.type)) {
            throw new Error("'original' and 'changes' must base on same DSDocument type");
          }
          if (!(changes.hasOwnProperty('$ds_pool'))) {
            throw new Error("'changes' must be set instantiated as a field of DSChanges object");
          }
        }
        this.set('original', original);
        this.set('changes', changes);
        itemsSet = this.get('itemsSet');
        items = itemsSet.items;
        editablePool = changes.$ds_pool;
        originalItems = original.items;
        changesItems = changes.items;
        load = ((function(_this) {
          return function() {
            var filterItem, filterItemIfChanged, findEdtItem, getEdtItem, renderItem;
            if (!_this._startLoad()) {
              return;
            }
            getEdtItem = (function(srcItem) {
              if (assert) {
                if (!editablePool.items.hasOwnProperty(srcItem.$ds_key)) {
                  throw new Error('Missing editable item');
                }
              }
              return editablePool.items[srcItem.$ds_key];
            });
            findEdtItem = (function(srcItem) {
              var edtItem;
              if ((edtItem = editablePool.find(_this, srcItem.$ds_key)).init) {
                edtItem.init(srcItem, changes);
                edtItem.$u = $u;
              }
              return edtItem;
            });
            if (filter) {
              _.forEach(originalItems, (function(srcItem) {
                var key;
                if (!changesItems.hasOwnProperty(key = srcItem.$ds_key)) {
                  itemsSet.add(_this, findEdtItem(srcItem));
                }
              }));
              _.forEach(changesItems, (function(edtItem) {
                if (filter.call(_this, edtItem)) {
                  itemsSet.add(_this, edtItem.addRef(_this));
                }
              }));
              renderItem = (function(itemKey) {
                if (assert) {
                  if (!changesItems.hasOwnProperty(itemKey)) {
                    throw new Error('Missing edtItem');
                  }
                }
                filterItem(changesItems[itemKey]);
              });
              filterItem = (function(edtItem) {
                if (filter.call(_this, edtItem)) {
                  if (!items.hasOwnProperty(edtItem.$ds_key)) {
                    itemsSet.add(_this, edtItem.addRef(_this));
                  }
                } else if (items.hasOwnProperty(edtItem.$ds_key)) {
                  itemsSet.remove(edtItem);
                }
              });
              filterItemIfChanged = (function(srcItem) {
                if (!changesItems.hasOwnProperty(srcItem.$ds_key)) {
                  return false;
                }
                filterItem(getEdtItem(srcItem));
                return true;
              });
              _this._unwatch1 = original.watch(_this, {
                add: (function(srcItem) {
                  if (!filterItemIfChanged(srcItem)) {
                    itemsSet.add(_this, findEdtItem(srcItem));
                  }
                }),
                remove: (function(srcItem) {
                  if (!filterItemIfChanged(srcItem)) {
                    itemsSet.remove(getEdtItem(srcItem));
                    DSDigest.forget(_this.$ds_key, srcItem.$ds_key);
                  }
                })
              });
              _this._unwatch2 = changes.watch(_this, {
                add: (function(edtItem) {
                  DSDigest.render(_this.$ds_key, edtItem.$ds_key, renderItem);
                }),
                change: (function(edtItem) {
                  DSDigest.render(_this.$ds_key, edtItem.$ds_key, renderItem);
                }),
                remove: (function(edtItem) {
                  filterItem.call(_this, edtItem);
                  DSDigest.forget(_this.$ds_key, edtItem.$ds_key);
                })
              });
            } else {
              _.forEach(originalItems, (function(srcItem) {
                itemsSet.add(_this, findEdtItem(srcItem));
              }));
              _this._unwatch1 = original.watch(_this, {
                add: (function(srcItem) {
                  itemsSet.add(_this, findEdtItem(srcItem));
                }),
                remove: (function(srcItem) {
                  itemsSet.remove(getEdtItem(srcItem));
                })
              });
            }
            _this._endLoad(true);
          };
        })(this));
        sets = [original, changes];
        updateStatus = ((function(_this) {
          return function(source, status) {
            var newStatus, prevStatus;
            if (!((newStatus = DSDocument.integratedStatus(sets)) === (prevStatus = _this.get('status')))) {
              switch (newStatus) {
                case 'ready':
                  DSDigest.block(load);
                  break;
                case 'update':
                  if (_this._startLoad()) {
                    _this._endLoad(true);
                  }
                  break;
                case 'nodata':
                  _this.set('status', 'nodata');
              }
            }
          };
        })(this));
        this._unwatchA = original.watchStatus(this, updateStatus);
        this._unwatchB = changes.watchStatus(this, updateStatus);
        this.init = null;
      });

      DSDataEditable.end();

      return DSDataEditable;

    })(DSData);
  }
});



},{"./DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","./DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataFiltered.coffee":[function(require,module,exports){
var DSData, DSDigest, DSObject, DSSet, assert, classes, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSObject = require('./DSObject');

DSData = require('./DSData');

DSDigest = require('./DSDigest');

DSSet = require('./DSSet');

classes = {};

module.exports = (function(itemType) {
  var DSDataFiltered, clazz;
  if (assert) {
    if (!(DSObject.isAssignableFrom(itemType))) {
      error.invalidArg('itemType');
    }
  }
  if (classes.hasOwnProperty(itemType.docType) && (clazz = classes[itemType.docType]).itemType === itemType) {
    return clazz;
  } else {
    return classes[itemType.name] = DSDataFiltered = (function(superClass) {
      var $u, k;

      extend(DSDataFiltered, superClass);

      function DSDataFiltered() {
        return DSDataFiltered.__super__.constructor.apply(this, arguments);
      }

      DSDataFiltered.begin("DSDataFiltered<" + itemType.name + ">");

      DSDataFiltered.propDoc('original', DSSet);

      DSDataFiltered.propSet('items', DSDataFiltered.itemType = itemType);

      DSDataFiltered.ds_dstr.push((function() {
        if (typeof this._unwatchA === "function") {
          this._unwatchA();
        }
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
      }));

      DSDataFiltered.prototype.clear = (function() {
        DSData.prototype.clear.call(this);
        if (typeof this._unwatch1 === "function") {
          this._unwatch1();
        }
        delete this._unwatch1;
      });

      DSDataFiltered.$u = $u = {};

      for (k in itemType.__super__.__props) {
        $u[k] = true;
      }

      DSDataFiltered.prototype.init = (function(original, filter) {
        var items, itemsSet, load, originalItems;
        if (assert) {
          if (!(original instanceof DSSet)) {
            error.invalidArg('original');
          }
          if (!(typeof filter === 'function')) {
            error.invalidArg('filter');
          }
          if (!(itemType === original.type)) {
            throw new Error("'itemType' and 'original' must have same DSObject type");
          }
        }
        this.set('original', original);
        itemsSet = this.get('itemsSet');
        items = itemsSet.items;
        originalItems = original.items;
        load = ((function(_this) {
          return function() {
            var item, itemKey, renderItem;
            if (!_this._startLoad()) {
              return;
            }
            for (itemKey in originalItems) {
              item = originalItems[itemKey];
              if (filter(item)) {
                item.addRef(_this);
                itemsSet.add(_this, item);
              }
            }
            renderItem = (function(itemKey) {
              if (items.hasOwnProperty(itemKey)) {
                if (!filter(item = originalItems[itemKey])) {
                  itemsSet.remove(item);
                }
              } else if (filter(item = originalItems[itemKey])) {
                item.addRef(_this);
                itemsSet.add(_this, item);
              }
            });
            _this._unwatch1 = original.watch(_this, {
              add: (function(item) {
                DSDigest.render(_this.$ds_key, item.$ds_key, renderItem);
              }),
              change: (function(item) {
                DSDigest.render(_this.$ds_key, item.$ds_key, renderItem);
              }),
              remove: (function(item) {
                itemsSet.remove(item);
                DSDigest.forget(_this.$ds_key, item.$ds_key);
              })
            });
            _this._endLoad(true);
          };
        })(this));
        this._unwatchA = original.watchStatus(this, ((function(_this) {
          return function(source, status) {
            var newStatus, prevStatus;
            if (!((newStatus = original.get('status')) === (prevStatus = _this.get('status')))) {
              switch (newStatus) {
                case 'ready':
                  DSDigest.block(load);
                  break;
                case 'update':
                  if (_this._startLoad()) {
                    _this._endLoad(true);
                  }
                  break;
                case 'nodata':
                  _this.set('status', 'nodata');
              }
            }
          };
        })(this)));
        this.init = null;
      });

      DSDataFiltered.end();

      return DSDataFiltered;

    })(DSData);
  }
});



},{"./DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataServiceBase.coffee":[function(require,module,exports){
var DSDataServiceBase, DSObject, DSPool, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSObject = require('./DSObject');

DSPool = require('./DSPool');

module.exports = DSDataServiceBase = (function(superClass) {
  extend(DSDataServiceBase, superClass);

  function DSDataServiceBase() {
    return DSDataServiceBase.__super__.constructor.apply(this, arguments);
  }

  DSDataServiceBase.begin('DSDataService');

  DSDataServiceBase.prototype.findDataSet = (function(owner, params) {
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (!(typeof params === 'object' && params !== null && params.hasOwnProperty('type'))) {
        error.invalidArg('params');
      }
      if (!(params.hasOwnProperty('mode') && ['original', 'edited', 'changes'].indexOf(params.mode) >= 0)) {
        error.invalidArg('params.mode');
      }
    }
  });

  DSDataServiceBase.prototype.requestSources = (function(owner, params, sources) {
    var k, k2, v, v2;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (typeof params !== 'object') {
        error.invalidArg('params');
      }
      if (typeof sources !== 'object' || sources === null) {
        error.invalidArg('sources');
      }
      for (k in sources) {
        v = sources[k];
        if (typeof v !== 'object' || v === null) {
          error.invalidArg('sources');
        }
        for (k2 in v) {
          v2 = v[k2];
          switch (k2) {
            case 'name':
              void 0;
              break;
            case 'type':
              if (!v2 instanceof DSObject) {
                error.invalidArg('sources');
              }
              break;
            case 'set':
              if (!v2 instanceof DSObject) {
                error.invalidArg('sources');
              }
              break;
            case 'params':
              if (typeof v2 !== 'object' || v2 === null) {
                error.invalidArg('sources');
              }
              break;
            case 'watch':
              void 0;
              break;
            case 'unwatch':
              void 0;
              break;
            case 'unwatchStatus':
              void 0;
              break;
            case 'listener':
              void 0;
              break;
            case 'index':
              void 0;
              break;
            default:
              error.invalidArg('sources');
          }
        }
      }
    }
  });

  DSDataServiceBase.end();

  return DSDataServiceBase;

})(DSObject);



},{"./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSimple.coffee":[function(require,module,exports){
var DSData, DSDigest, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('dscommon/DSDataSimple', [])).name;

assert = require('./util').assert;

error = require('./util').error;

DSData = require('./DSData');

DSDigest = require('./DSDigest');

ngModule.factory('DSDataSimple', [
  'DSDataSource', '$rootScope', '$q', (function(DSDataSource, $rootScope, $q) {
    var DSDataSimple;
    return DSDataSimple = (function(superClass) {
      extend(DSDataSimple, superClass);

      function DSDataSimple() {
        return DSDataSimple.__super__.constructor.apply(this, arguments);
      }

      DSDataSimple.begin('DSDataSimple');

      DSDataSimple.propDoc('source', DSDataSource);

      DSDataSimple.propObj('cancel', null);

      DSDataSimple.propEnum('method', ['httpGet', 'httpPost', 'httpPut']);

      DSDataSimple.propStr('request');

      DSDataSimple.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      }));

      DSDataSimple.prototype.clear = (function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      });

      DSDataSimple.prototype.load = (function() {
        var cancel, method, request;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
          if (!(typeof (request = this.get('request')) === 'string' && request.length > 0)) {
            throw new Error('load(): Request is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        cancel = this.set('cancel', $q.defer());
        return ((function() {
          switch ((method = this.get('method'))) {
            case 'httpGet':
              return this.get('source').httpGet(this.get('request'), cancel);
            case 'httpPost':
              return this.get('source').httpPost(this.get('request'), null, cancel);
            case 'httpPut':
              return this.get('source').httpPut(this.get('request'), null, cancel);
          }
        }).call(this)).then(((function(_this) {
          return function(resp) {
            if (resp.status === 200) {
              _this.set('cancel', null);
              _this._endLoad(DSDigest.block((function() {
                return _this.importResponse(resp.data, resp.status);
              })));
            }
          };
        })(this)), ((function(_this) {
          return function() {
            _this.set('cancel', null);
            _this._endLoad(false);
          };
        })(this)));
      });

      DSDataSimple.end();

      return DSDataSimple;

    })(DSData);
  })
]);



},{"./DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataSource.coffee":[function(require,module,exports){
var DSDigest, DSObject, assert, base64, error, modeReleaseDataOnReload, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('dscommon/DSDataSource', [])).name;

serviceOwner = require('./util').serviceOwner;

modeReleaseDataOnReload = require('./util').modeReleaseDataOnReload;

assert = require('./util').assert;

error = require('./util').error;

base64 = require('../utils/base64');

DSObject = require('./DSObject');

DSDigest = require('./DSDigest');

ngModule.factory('DSDataSource', [
  '$q', '$http', (function($q, $http) {
    var DSDataSource;
    return DSDataSource = (function(superClass) {
      var class1;

      extend(DSDataSource, superClass);

      function DSDataSource() {
        return class1.apply(this, arguments);
      }

      DSDataSource.begin('DSDataSource');

      DSDataSource.addDataSource();

      DSDataSource.setLoadAndRefresh = (function(dsDataService) {
        var dataSource;
        this.set('source', (dataSource = dsDataService.get('dataSource')));
        return dataSource.watchStatus(this, ((function(_this) {
          return function(source, status, prevStatus) {
            switch (status) {
              case 'ready':
                DSDigest.block((function() {
                  return _this.load();
                }));
                break;
              case 'nodata':
                _this.set('status', 'nodata');
            }
          };
        })(this)));
      });

      class1 = (function(referry, key) {
        DSObject.call(this, referry, key);
        this.cancelDefers = [];
      });

      DSDataSource.prototype.setConnection = (function(url, token) {
        var cancel, i, len, ref;
        if (assert) {
          if (!(url === null || (typeof url === 'string' && url.length > 0))) {
            error.invalidArg('url');
          }
          if (!(typeof token === 'undefined' || token === null || (typeof token === 'string' && token.length > 0))) {
            error.invalidArg('token');
          }
        }
        if (url && (typeof token === 'undefined' || token)) {
          if (this.url !== url || this.token !== token) {
            ref = this.cancelDefers;
            for (i = 0, len = ref.length; i < len; i++) {
              cancel = ref[i];
              cancel.resolve();
            }
            this.cancelDefers.length = 0;
            this.set('status', 'nodata');
            this.url = url;
            this.authHeader = token ? "Basic " + (base64.encode(token)) : null;
            this.set('status', 'ready');
          }
        } else {
          this.set('status', 'nodata');
        }
      });

      DSDataSource.prototype.refresh = (function() {
        if (this.get('status') === 'ready') {
          this.set('status', 'update');
          this.set('status', 'ready');
        }
      });

      DSDataSource.prototype.httpGet = (function(requestUrl, cancelDefer) {
        var opts, removeCancelDefer;
        this.cancelDefers.push(cancelDefer);
        removeCancelDefer = ((function(_this) {
          return function(resp) {
            _.remove(_this.cancelDefers, cancelDefer);
            return resp;
          };
        })(this));
        opts = {
          timeout: cancelDefer.promise
        };
        if (this.authHeader) {
          opts.headers = {
            Authorization: this.authHeader
          };
        }
        return $http.get("" + this.url + requestUrl, opts).then(removeCancelDefer, removeCancelDefer);
      });

      DSDataSource.prototype.httpPost = (function(postUrl, payload, cancelDefer) {
        var opts, removeCancelDefer;
        this.cancelDefers.push(cancelDefer);
        removeCancelDefer = ((function(_this) {
          return function(resp) {
            _.remove(_this.cancelDefers, cancelDefer);
            return resp;
          };
        })(this));
        opts = {
          timeout: cancelDefer.promise
        };
        if (this.authHeader) {
          opts.headers = {
            Authorization: this.authHeader
          };
        }
        return $http.post("" + this.url + postUrl, payload, opts).then(removeCancelDefer, removeCancelDefer);
      });

      DSDataSource.prototype.httpPut = (function(postUrl, payload, cancelDefer) {
        var opts, removeCancelDefer;
        this.cancelDefers.push(cancelDefer);
        removeCancelDefer = ((function(_this) {
          return function(resp) {
            _.remove(_this.cancelDefers, cancelDefer);
            return resp;
          };
        })(this));
        opts = {
          timeout: cancelDefer.promise
        };
        if (this.authHeader) {
          opts.headers = {
            Authorization: this.authHeader
          };
        }
        return $http.put("" + this.url + postUrl, payload, opts).then(removeCancelDefer, removeCancelDefer);
      });

      DSDataSource.end();

      return DSDataSource;

    })(DSObject);
  })
]);



},{"../utils/base64":"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\base64.coffee","./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee":[function(require,module,exports){
var DSDigest, assert, error;

assert = require('./util').assert;

error = require('./util').error;

module.exports = DSDigest = (function() {
  var block, level, map, renderMap;

  function DSDigest() {}

  level = 0;

  block = 0;

  map = {};

  renderMap = (function() {
    var dsdataKey, dsdataMap, func, isEmpty, k, key, oldMap;
    isEmpty = true;
    for (k in map) {
      isEmpty = false;
      break;
    }
    if (isEmpty) {
      return;
    }
    block++;
    oldMap = map;
    map = {};
    for (dsdataKey in oldMap) {
      dsdataMap = oldMap[dsdataKey];
      for (key in dsdataMap) {
        func = dsdataMap[key];
        func(key);
      }
    }
    block--;
    renderMap();
  });

  DSDigest.block = (function(func) {
    if (assert) {
      if (!typeof func === 'function') {
        error.invalidArg('func');
      }
    }
    block++;
    try {
      return func();
    } finally {
      if (--block === 0) {
        renderMap();
      }
    }
  });

  DSDigest.render = (function(dsdataKey, key, func) {
    var dsdataMap;
    if (assert) {
      if (!(typeof dsdataKey === 'string' && dsdataKey.length > 0)) {
        error.invalidArg('dataDataKey');
      }
      if (!(typeof key === 'string' && key.length > 0)) {
        error.invalidArg('key');
      }
      if (!(typeof func === 'function')) {
        error.invalidArg('func');
      }
    }
    if (block === 0) {
      func(key);
    } else {
      dsdataMap = map.hasOwnProperty(dsdataKey) ? map[dsdataKey] : (map[dsdataKey] = {});
      dsdataMap[key] = func;
    }
  });

  DSDigest.forget = (function(dsdataKey, key) {
    var dsdataMap;
    if (assert) {
      if (!(typeof dsdataKey === 'string' && dsdataKey.length > 0)) {
        error.invalidArg('dataDataKey');
      }
      if (!(typeof key === 'string' && key.length > 0)) {
        error.invalidArg('key');
      }
    }
    if (block !== 0 && map.hasOwnProperty(dsdataKey)) {
      dsdataMap = map[dsdataKey];
      delete dsdataMap[key];
    }
  });

  return DSDigest;

})();



},{"./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee":[function(require,module,exports){
var DSDocument, DSObject, DSObjectBase, DSSet, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

DSObject = require('./DSObject');

DSSet = require('./DSSet');

module.exports = DSDocument = (function(superClass) {
  var class1;

  extend(DSDocument, superClass);

  function DSDocument() {
    return class1.apply(this, arguments);
  }

  DSDocument.begin('DSDocument');

  class1 = (function(referry, key) {
    DSObject.call(this, referry, key);
    if (assert) {
      if (this.__proto__.constructor === DSDocument) {
        throw new Error('Cannot instantiate DSDocument directly');
      }
    }
  });

  DSDocument.propPool = (function(name, itemType) {
    throw new Error("This property type is not supported in DSDocument");
  });

  DSDocument.propSet = (function(name, itemType) {
    throw new Error("This property type is not supported in DSDocument");
  });

  DSDocument.propList = (function(name, itemType) {
    throw new Error("This property type is not supported in DSDocument");
  });

  DSDocument.end();

  DSDocument.end = (function() {
    var Editable, originalDocClass;
    DSObject.end.call(this);
    originalDocClass = this;
    this.Editable = Editable = (function(superClass1) {
      var k, prop, props, ref;

      extend(Editable, superClass1);

      function Editable() {
        return Editable.__super__.constructor.apply(this, arguments);
      }

      Editable.begin(originalDocClass.docType + ".Editable");

      delete Editable.prototype.$ds_docType;

      Editable.ds_editable = true;

      Editable.prototype.__init = null;

      Editable.ds_dstr.push((function() {
        var change, propMap, propName, s, v;
        if (assert) {
          if (!_.find(this.$ds_doc.$ds_evt, ((function(_this) {
            return function(lst) {
              return lst === _this;
            };
          })(this)))) {
            console.error('Not an event listener');
          }
        }
        _.remove(this.$ds_doc.$ds_evt, this);
        this.$ds_doc.release(this);
        if ((change = this.__change)) {
          for (propName in change) {
            propMap = change[propName];
            if ((s = propMap.s) instanceof DSObjectBase) {
              s.release(this);
            }
            if ((v = propMap.v) instanceof DSObjectBase) {
              v.release(this);
            }
          }
        }
      }));

      Editable.prototype.init = (function(serverDoc, changesSet, changes) {
        var changePair, propName, ref, s, v;
        if (assert) {
          if (!(serverDoc !== null && serverDoc.__proto__.constructor === originalDocClass)) {
            error.invalidArg('serverDoc');
          }
          if (!(changesSet !== null && changesSet instanceof DSSet)) {
            error.invalidArg('changesSet');
          }
          if (!(arguments.length === 2 || typeof changes === 'object')) {
            error.invalidArg('changes');
          }
        }
        (this.$ds_doc = serverDoc).addRef(this);
        this.$ds_chg = changesSet;
        if (changes) {
          ref = (this.__change = changes);
          for (propName in ref) {
            changePair = ref[propName];
            if ((v = changePair.v) instanceof DSObject) {
              v.addRef(this);
            }
            if ((s = changePair.s) instanceof DSObject) {
              s.addRef(this);
            }
          }
          this.addRef(this);
          changesSet.add(this, this);
        }
        if (!serverDoc.hasOwnProperty('$ds_evt')) {
          serverDoc.$ds_evt = [this];
        } else {
          if (assert) {
            if (_.find(serverDoc.$ds_evt, ((function(_this) {
              return function(lst) {
                return lst === _this;
              };
            })(this)))) {
              console.error('Already a listener');
            }
          }
          serverDoc.$ds_evt.push(this);
        }
        this.init = null;
      });

      Editable.prototype.__onChange = (function(item, propName, value, oldVal) {
        var change, i, lst, prop, ref, s, val;
        if ((change = this.__change) && change.hasOwnProperty(propName) && (val = (prop = change[propName]).v) === value) {
          this.$ds_chg.$ds_hist.setSameAsServer(this, propName);
          if ((s = prop.s) instanceof DSObjectBase) {
            s.release(this);
          }
          if (val instanceof DSObjectBase) {
            val.release(this);
          }
          delete change[propName];
          if (_.isEmpty(change)) {
            delete this.__change;
            this.$ds_chg.remove(this);
          }
        } else if (this.$ds_evt) {
          ref = this.$ds_evt;
          for (i = ref.length - 1; i >= 0; i += -1) {
            lst = ref[i];
            lst.__onChange.call(lst, this, propName, value, oldVal);
          }
        }
      });

      props = Editable.prototype.__props = originalDocClass.prototype.__props;

      Editable.prototype.get = (function(propName) {
        if (assert) {
          if (!props.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName];
      });

      Editable.prototype.set = (function(propName, value) {
        if (assert) {
          if (!props.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName] = value;
      });

      ref = originalDocClass.prototype.__props;
      for (k in ref) {
        prop = ref[k];
        if (!prop.noneditable) {
          (function(propName, valid, equal) {
            var getValue;
            return Object.defineProperty(Editable.prototype, propName, {
              get: getValue = (function() {
                var change;
                change = this.__change;
                if (change && change.hasOwnProperty(propName)) {
                  return change[propName].v;
                }
                return this.$ds_doc[propName];
              }),
              set: (function(value) {
                var change, changePair, i, j, lst, oldVal, ref1, ref2, s, serverValue, v;
                if (assert) {
                  if (typeof (value = valid(v = value)) === 'undefined') {
                    error.invalidValue(this, propName, v);
                  }
                }
                if (!equal((oldVal = getValue.call(this)), value)) {
                  if (value instanceof DSObject) {
                    value.addRef(this);
                  }
                  if (!(change = this.__change)) {
                    change = this.__change = {};
                    if (oldVal instanceof DSObject) {
                      oldVal.addRef(this);
                    }
                    change[propName] = {
                      v: value,
                      s: oldVal
                    };
                    this.addRef(this);
                    this.$ds_chg.add(this, this);
                    this.$ds_chg.$ds_hist.add(this, propName, value, void 0);
                  } else if (equal((serverValue = this.$ds_doc[propName]), value)) {
                    this.$ds_chg.$ds_hist.add(this, propName, void 0, (changePair = change[propName]).v);
                    if ((v = changePair.v) instanceof DSObject) {
                      v.release(this);
                    }
                    if ((s = changePair.s) instanceof DSObject) {
                      s.release(this);
                    }
                    delete change[propName];
                    if (_.isEmpty(change)) {
                      if (this.$ds_evt) {
                        ref1 = this.$ds_evt;
                        for (i = ref1.length - 1; i >= 0; i += -1) {
                          lst = ref1[i];
                          lst.__onChange.call(lst, this, propName, value, oldVal);
                        }
                      }
                      delete this.__change;
                      this.$ds_chg.remove(this);
                      return;
                    }
                  } else if ((changePair = change[propName])) {
                    this.$ds_chg.$ds_hist.add(this, propName, value, changePair.v);
                    if ((v = changePair.v) instanceof DSObject) {
                      v.release(this);
                    }
                    changePair.v = value;
                  } else {
                    if (serverValue instanceof DSObject) {
                      serverValue.addRef(this);
                    }
                    change[propName] = {
                      v: value,
                      s: serverValue
                    };
                    this.$ds_chg.$ds_hist.add(this, propName, value, void 0);
                  }
                  if (this.$ds_evt) {
                    ref2 = this.$ds_evt;
                    for (j = ref2.length - 1; j >= 0; j += -1) {
                      lst = ref2[j];
                      lst.__onChange.call(lst, this, propName, value, oldVal);
                    }
                  }
                }
              })
            });
          })(prop.name, prop.valid, prop.equal);
        }
      }

      DSObject.end.call(Editable);

      return Editable;

    })(originalDocClass);
  });

  return DSDocument;

})(DSObject);



},{"./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSEnum.coffee":[function(require,module,exports){
var DSEnum, assert, error;

assert = require('./util').assert;

error = require('./util').error;

module.exports = DSEnum = (function() {
  var class1;

  function DSEnum() {
    return class1.apply(this, arguments);
  }

  DSEnum.addPropType = (function(clazz) {
    clazz.propDSEnum = (function(name, valid) {
      var q;
      if (assert) {
        if (!typeof name === 'string') {
          error.invalidArg('name');
        }
        if (valid && typeof valid !== 'function') {
          error.invalidArg('valid');
        }
      }
      valid = (q = valid) ? (function(value) {
        if ((value === null || (typeof value === 'object' && value instanceof DSEnum)) && q(value)) {
          return value;
        } else {
          return void 0;
        }
      }) : (function(value) {
        if (value === null || value instanceof DSEnum) {
          return value;
        } else {
          return void 0;
        }
      });
      return clazz.prop({
        name: name,
        type: 'taskRelativeSplit',
        valid: valid,
        read: (function(v) {
          if (v !== null) {
            return new DSEnum(v);
          } else {
            return null;
          }
        }),
        str: (function() {
          return 'split';
        }),
        init: null
      });
    });
  });

  class1 = (function(enums) {
    var i, k, len, map, ref, src, v;
    if (assert) {
      if (arguments.length === 1 && typeof (src = arguments[0]) === 'object' && src.__proto__ === DSEnum.prototype) {
        void 0;
      } else if (!(typeof enums === 'string')) {
        error.invalidArg('enums');
      }
    }
    if (arguments.length === 1 && typeof (src = arguments[0]) === 'object' && src.__proto__ === DSEnum.prototype) {
      this.map = _.clone(src.map);
    } else {
      this.map = map = {};
      if (typeof enums === 'string') {
        ref = enums.split(',');
        for (i = 0, len = ref.length; i < len; i++) {
          v = ref[i];
          map[v.trim()] = true;
        }
      }
      this.value = (_.sortBy((function() {
        var results;
        results = [];
        for (k in map) {
          results.push(k);
        }
        return results;
      })())).join();
    }
  });

  DSEnum.prototype.toString = (function() {
    return this.value;
  });

  DSEnum.prototype.valueOf = (function() {
    return this.value;
  });

  DSEnum.prototype.clone = (function() {
    return new DSEnum(this);
  });

  DSEnum.prototype.set = (function(enumValue, isTrue) {
    var k, map;
    if (assert) {
      if (!(typeof enumValue === 'string')) {
        error.invalidArg('enumValue');
      }
      if (!(typeof isTrue === 'boolean')) {
        error.invalidArg('isTrue');
      }
    }
    if (isTrue) {
      if (!(map = this.map).hasOwnProperty(enumValue)) {
        map[enumValue] = true;
        this.value = (_.sortBy((function() {
          var results;
          results = [];
          for (k in map) {
            results.push(k);
          }
          return results;
        })())).join();
      }
    } else if ((map = this.map).hasOwnProperty(enumValue)) {
      delete this.map[enumValue];
      this.value = (_.sortBy((function() {
        var results;
        results = [];
        for (k in map) {
          results.push(k);
        }
        return results;
      })())).join();
    }
    return this;
  });

  DSEnum.prototype.get = (function(enumValue) {
    if (assert) {
      if (!(typeof enumValue === 'string')) {
        error.invalidArg('enumValue');
      }
    }
    return this.map.hasOwnProperty(enumValue);
  });

  DSEnum.prototype.any = (function(map) {
    var k;
    for (k in map) {
      if (this.map.hasOwnProperty(k)) {
        return true;
      }
    }
    return false;
  });

  DSEnum.prototype.diff = (function(src) {
    var k, map, srcMap;
    if (assert) {
      if (!(typeof src === 'object' && src.__proto__ === DSEnum.prototype)) {
        error.invalidArg('src');
      }
    }
    srcMap = src.map;
    return ((function() {
      var results;
      results = [];
      for (k in (map = this.map)) {
        if (!srcMap.hasOwnProperty(k)) {
          results.push("+" + k);
        }
      }
      return results;
    }).call(this)).concat((function() {
      var results;
      results = [];
      for (k in srcMap) {
        if (!map.hasOwnProperty(k)) {
          results.push("-" + k);
        }
      }
      return results;
    })()).join(', ');
  });

  return DSEnum;

})();



},{"./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSHistory.coffee":[function(require,module,exports){
var DSDigest, DSDocument, DSHistory, DSObject, DSObjectBase, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

DSObject = require('./DSObject');

DSDigest = require('./DSDigest');

DSDocument = require('./DSDocument');

module.exports = DSHistory = (function(superClass) {
  var _reset, blockCount, blockId, class1, hasRedo, skipAdd;

  extend(DSHistory, superClass);

  function DSHistory() {
    return class1.apply(this, arguments);
  }

  DSHistory.begin('DSHistory');

  DSHistory.ds_dstr.push((function() {
    _reset.call(this);
  }));

  class1 = (function(referry, key) {
    DSObject.call(this, referry, key);
    this.hist = [];
    this.histTop = 0;
  });

  _reset = (function() {
    var h, j, len, ref, val;
    ref = this.hist;
    for (j = 0, len = ref.length; j < len; j++) {
      h = ref[j];
      h.i.release(this);
      if (typeof (val = h.o) === 'object' && val instanceof DSObjectBase) {
        val.release(this);
      }
      if (typeof (val = h.n) === 'object' && val instanceof DSObjectBase) {
        val.release(this);
      }
    }
    this.hist = [];
    this.histTop = 0;
  });

  skipAdd = false;

  blockId = null;

  blockCount = 0;

  DSHistory.prototype.startBlock = (function() {
    blockId = ++blockCount;
  });

  DSHistory.prototype.endBlock = (function() {
    blockId = null;
  });

  DSHistory.prototype.startReset = (function() {
    skipAdd = true;
    _reset.call(this);
  });

  DSHistory.prototype.endReset = (function() {
    skipAdd = false;
  });

  DSHistory.prototype.add = (function(item, prop, newVal, oldVal) {
    var h, hist, j, len, m, ref, val;
    if (assert) {
      if (!(item !== null && item.__proto__.constructor.ds_editable)) {
        error.invalidArg('item');
      }
      if (!(typeof prop === 'string' && prop.length > 0)) {
        error.invalidArg('prop');
      }
      if (!(0 <= ['string', 'number', 'boolean', 'object', 'undefined'].indexOf(typeof newVal))) {
        error.invalidArg('newVal');
      }
      if (!(0 <= ['string', 'number', 'boolean', 'object', 'undefined'].indexOf(typeof oldVal))) {
        error.invalidArg('oldVal');
      }
    }
    if (!skipAdd) {
      if ((hist = this.hist).length > this.histTop) {
        ref = hist.slice(this.histTop);
        for (j = 0, len = ref.length; j < len; j++) {
          h = ref[j];
          h.i.release(this);
          if (typeof (val = h.o) === 'object' && val instanceof DSObjectBase) {
            val.release(this);
          }
          if (typeof (val = h.n) === 'object' && val instanceof DSObjectBase) {
            val.release(this);
          }
        }
        hist.length = this.histTop;
      }
      item.addRef(this);
      if (newVal instanceof DSObjectBase) {
        newVal.addRef(this);
      }
      if (oldVal instanceof DSObjectBase) {
        oldVal.addRef(this);
      }
      hist.push(m = {
        i: item,
        p: prop,
        n: newVal,
        o: oldVal
      });
      if (blockId) {
        m.b = blockId;
      }
      this.histTop = hist.length;
    }
  });

  DSHistory.prototype.setSameAsServer = (function(item, prop) {
    var h, i, j, ref, val;
    if (assert) {
      if (!(item !== null && item.__proto__.constructor.ds_editable)) {
        error.invalidArg('item');
      }
      if (!(typeof prop === 'string' && prop.length > 0)) {
        error.invalidArg('prop');
      }
    }
    ref = this.hist.slice(0, this.histTop);
    for (i = j = ref.length - 1; j >= 0; i = j += -1) {
      h = ref[i];
      if (h.i === item && h.p === prop) {
        if (typeof (val = h.n) === 'object' && val instanceof DSObjectBase) {
          val.release(this);
        }
        if (typeof h.o === 'undefined') {
          item.release(this);
          this.hist.splice(i, 1);
          this.histTop--;
        } else {
          h.n = void 0;
        }
        break;
      }
    }
  });

  DSHistory.prototype.hasUndo = (function() {
    return this.histTop > 0;
  });

  DSHistory.prototype.undo = (function() {
    var b, h, hist, histTop, oldVal;
    if (!((histTop = this.histTop) > 0)) {
      return;
    }
    skipAdd = true;
    try {
      h = (hist = this.hist)[this.histTop = --histTop];
      if (typeof (b = h.b) !== 'number' || histTop === 0 || hist[histTop - 1].b !== b) {
        if (typeof (oldVal = h.o) === 'undefined') {
          h.i.set(h.p, h.i.$ds_doc[h.p]);
        } else {
          h.i.set(h.p, oldVal);
        }
      } else {
        DSDigest.block(((function(_this) {
          return function() {
            while (true) {
              if (typeof (oldVal = h.o) === 'undefined') {
                h.i.set(h.p, h.i.$ds_doc[h.p]);
              } else {
                h.i.set(h.p, oldVal);
              }
              if (histTop === 0 || (h = hist[histTop - 1]).b !== b) {
                break;
              }
              _this.histTop = --histTop;
            }
          };
        })(this)));
      }
    } finally {
      skipAdd = false;
    }
  });

  DSHistory.prototype.hasRedo = hasRedo = (function() {
    return this.histTop < this.hist.length;
  });

  DSHistory.prototype.redo = (function() {
    var b, h, hist, histTop, hlen, newVal;
    skipAdd = true;
    if (!((histTop = this.histTop) < (hlen = (hist = this.hist).length))) {
      return;
    }
    skipAdd = true;
    try {
      h = hist[histTop];
      this.histTop = ++histTop;
      if (typeof (b = h.b) !== 'number' || histTop === hlen || hist[histTop].b !== b) {
        if (typeof (newVal = h.n) === 'undefined') {
          h.i.set(h.p, h.i.$ds_doc[h.p]);
        } else {
          h.i.set(h.p, newVal);
        }
      } else {
        DSDigest.block(((function(_this) {
          return function() {
            while (true) {
              if (typeof (newVal = h.n) === 'undefined') {
                h.i.set(h.p, h.i.$ds_doc[h.p]);
              } else {
                h.i.set(h.p, newVal);
              }
              if (histTop === hlen || (h = hist[histTop]).b !== b) {
                break;
              }
              _this.histTop = ++histTop;
            }
          };
        })(this)));
      }
    } finally {
      skipAdd = false;
    }
  });

  DSHistory.end();

  return DSHistory;

})(DSObject);



},{"./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSList.coffee":[function(require,module,exports){
var DSList, DSObjectBase, assert, error, totalReleaseVerb, traceRefs, util,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

util = require('./util');

assert = require('./util').assert;

traceRefs = require('./util').traceRefs;

totalReleaseVerb = require('./util').totalReleaseVerb;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

module.exports = DSList = (function(superClass) {
  var class1;

  extend(DSList, superClass);

  function DSList() {
    return class1.apply(this, arguments);
  }

  DSList.begin('DSList');

  class1 = (function(referry, key, type) {
    DSObjectBase.call(this, referry, key);
    if (assert) {
      if (!type instanceof DSObjectBase) {
        error.notDSObjectClass(type);
      }
    }
    this.type = type;
    this.items = [];
  });

  DSList.ds_dstr.push((function() {
    var j, len, ref, v;
    ref = this.items;
    for (j = 0, len = ref.length; j < len; j++) {
      v = ref[j];
      v.release(this);
    }
  }));

  DSList.prototype.merge = (function(owner, newList) {
    var i, index, item, items, j, k, len, len1, refs, type;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (!_.isArray(newList)) {
        error.invalidArg('newList');
      }
    }
    items = this.items;
    type = this.type;
    for (j = 0, len = items.length; j < len; j++) {
      item = items[j];
      item.release(this);
    }
    items.length = 0;
    for (i = k = 0, len1 = newList.length; k < len1; i = ++k) {
      item = newList[i];
      if (!item instanceof type) {
        error.invalidListValue(this, i, item);
      }
      if (traceRefs) {
        refs = item.$ds_referries;
        if (refs.length === 0) {
          console.error((DSObjectBase.desc(DSDitem)) + ": Empty $ds_referries");
        } else if ((index = refs.lastIndexOf(owner)) < 0) {
          console.error((DSObjectBase.desc(this)) + ": Referry not found: " + (DSObjectBase.desc(owner)));
          if (totalReleaseVerb) {
            debugger;
          }
        } else {
          if (totalReleaseVerb) {
            console.info((++util.serviceOwner.msgCount) + ": transfer: " + (DSObjectBase.desc(item)) + ", refs: " + this.$ds_ref + ", from: " + (DSObjectBase.desc(owner)) + ", to: " + (DSObjectBase.desc(this)));
            if (util.serviceOwner.msgCount === window.totalBreak) {
              debugger;
            }
          }
          refs[index] = this;
        }
      }
      items.push(item);
    }
    return items;
  });

  DSList.end();

  return DSList;

})(DSObjectBase);



},{"./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee":[function(require,module,exports){
var DSList, DSObject, DSObjectBase, DSPool, DSSet, assert, error, serviceOwner, totalRelease,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

serviceOwner = require('./util').serviceOwner;

totalRelease = require('./util').totalRelease;

serviceOwner = require('./util').serviceOwner;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

DSSet = require('./DSSet');

DSList = require('./DSList');

DSPool = require('./DSPool');

module.exports = DSObject = (function(superClass) {
  var class1;

  extend(DSObject, superClass);

  function DSObject() {
    return class1.apply(this, arguments);
  }

  DSObject.desc = DSObjectBase.desc = (function(item) {
    if (!item.hasOwnProperty('$ds_key')) {
      if (item === serviceOwner) {
        return 'util.serviceOwner';
      } else if (typeof item === 'function') {
        return item.docType;
      } else if (item.$evalAsync && item.$watch) {
        return "$scope{$id: " + item.$id + "}";
      } else {
        return JSON.stringify(item);
      }
    }
    if (item instanceof DSSet || item instanceof DSList || item instanceof DSPool) {
      if (!totalRelease) {
        return item.$ds_key;
      } else {
        return item.$ds_key + "(" + item.$ds_globalId + ")";
      }
    } else {
      if (!totalRelease) {
        return item.$ds_key + ":" + item.__proto__.constructor.docType;
      } else {
        return item.$ds_key + ":" + item.__proto__.constructor.docType + "(" + item.$ds_globalId + ")";
      }
    }
  });

  class1 = (function(referry, key) {
    DSObjectBase.call(this, referry, key);
    if (assert) {
      if (this.__proto__.constructor === DSObjectBase) {
        throw new Error('Cannot instantiate DSObjectBsse directly');
      }
    }
  });

  DSObject.addPool = (function(watchOn) {
    if (!totalRelease) {
      this.pool = new DSPool(serviceOwner, this.docType + ".pool", this, watchOn);
    } else {
      Object.defineProperty(this, 'pool', {
        get: ((function(_this) {
          return function() {
            if (!_this.hasOwnProperty('__pool')) {
              _this.__pool = new DSPool(serviceOwner, _this.docType + ".pool", _this, watchOn);
              serviceOwner.clearPool((function() {
                _this.__pool.release(serviceOwner);
                delete _this.__pool;
              }));
            }
            return _this.__pool;
          };
        })(this))
      });
    }
  });

  DSObject.propPool = (function(name, itemType, watchOn) {
    var localName, propDecl;
    if (assert) {
      if (!(DSObjectBase.isAssignableFrom(itemType))) {
        error.invalidArg('itemType');
      }
    }
    localName = "_" + name;
    this.ds_dstr.push((function() {
      this[localName].release(this);
      delete this[localName];
    }));
    (propDecl = this.prop({
      name: name,
      type: 'pool',
      init: (function() {
        return new DSPool(this, this.$ds_key + "." + name + ":pool<" + itemType.docType + ">", itemType, watchOn);
      }),
      readonly: true
    })).itemType = itemType;
    return propDecl;
  });

  DSObject.propSet = (function(name, itemType) {
    var localName, propDecl;
    if (assert) {
      if (!(DSObjectBase.isAssignableFrom(itemType))) {
        error.invalidArg('itemType');
      }
    }
    localName = "_" + name;
    this.ds_dstr.push((function() {
      this[localName].release(this);
    }));
    (propDecl = this.prop({
      name: name,
      type: 'set',
      init: (function() {
        return new DSSet(this, this.$ds_key + "." + name + ":set<" + itemType.docType + ">", itemType, this);
      }),
      get: (function() {
        return this[localName].items;
      }),
      set: (function(v) {
        throw new Error("Use " + name + "Set.merge() instead");
      }),
      readonly: true
    })).itemType = itemType;
    this.prop({
      name: name + "Status",
      type: 'calc',
      func: (function() {
        return this[localName].get('status');
      })
    });
    this.prop({
      name: name + "Set",
      type: 'calc',
      func: (function() {
        return this[localName];
      })
    });
    return propDecl;
  });

  DSObject.propList = (function(name, itemType) {
    var localName, propDecl;
    if (assert) {
      if (!(DSObjectBase.isAssignableFrom(itemType))) {
        error.invalidArg('itemType');
      }
    }
    localName = "_" + name;
    this.ds_dstr.push((function() {
      this[localName].release(this);
    }));
    (propDecl = this.prop({
      name: name,
      type: 'list',
      init: (function() {
        return new DSList(this, this.$ds_key + "." + name + ":list<" + itemType.docType + ">", itemType);
      }),
      get: (function() {
        return this[localName].items;
      }),
      set: (function(v) {
        throw new Error("Use " + name + "Set.merge() instead");
      }),
      readonly: true
    })).itemType = itemType;
    this.prop({
      name: name + "List",
      type: 'calc',
      func: (function() {
        return this[localName];
      })
    });
    return propDecl;
  });

  return DSObject;

})(DSObjectBase);



},{"./DSList":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSList.coffee","./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","./DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee":[function(require,module,exports){
var DSObjectBase, assert, error, serviceOwner, totalRelease, totalReleaseVerb, traceData, traceRefs, util;

util = require('./util');

assert = require('./util').assert;

traceData = require('./util').traceData;

serviceOwner = require('./util').serviceOwner;

traceRefs = require('./util').traceRefs;

totalRelease = require('./util').totalRelease;

totalReleaseVerb = require('./util').totalReleaseVerb;

error = require('./util').error;

module.exports = DSObjectBase = (function() {
  var class1, globalId, sequenceId, sourceId, statusByPrior, statusValues, totalPool;

  function DSObjectBase() {
    return class1.apply(this, arguments);
  }

  DSObjectBase.isAssignableFrom = (function(clazz) {
    var up;
    if (!(typeof clazz === 'function')) {
      error.invalidArg('clazz');
    }
    if ((up = clazz) === this) {
      return true;
    }
    while (true) {
      if (!up.hasOwnProperty('__super__')) {
        return false;
      }
      up = up.__super__.constructor;
      if (up === this) {
        return true;
      }
    }
  });

  if (totalRelease) {
    totalPool = globalId = null;
    (window.totalReleaseReset = (function() {
      globalId = 0;
      window.totalPool = totalPool = {};
      util.serviceOwner.start();
      util.serviceOwner.msgCount = 0;
    }))();
    window.totalRelease = (function() {
      util.serviceOwner.stop();
      return totalPool;
    });
  }

  class1 = (function(referry, key) {
    var init, k, v;
    if (assert) {
      if (this.__proto__.constructor === DSObjectBase) {
        throw new Error('Cannot instantiate DSObjectBsse direct');
      }
      if (!((typeof referry === 'object' && referry !== window) || typeof referry === 'function')) {
        error.invalidArg('referry');
      }
      if (typeof key !== 'string') {
        error.invalidArg('key');
      }
    }
    this.$ds_key = key;
    this.$ds_ref = 1;
    if (totalRelease) {
      totalPool[this.$ds_globalId = ++globalId] = this;
      if (totalReleaseVerb) {
        console.info((++util.serviceOwner.msgCount) + ": ctor: " + (DSObjectBase.desc(this)) + ", refs: 1, ref: " + (DSObjectBase.desc(referry)));
        if (util.serviceOwner.msgCount === window.totalBreak) {
          debugger;
        }
      }
    }
    if (traceRefs) {
      this.$ds_referries = [referry];
    }
    if (init = this.__proto__.__init) {
      for (k in init) {
        v = init[k];
        this[k] = typeof v === 'function' ? v.call(this) : v;
      }
    }
    this.__proto__._init.call(this);
  });

  DSObjectBase.prototype.addRef = (function(referry) {
    if (assert) {
      if (!((typeof referry === 'object' && referry !== window) || typeof referry === 'function')) {
        error.invalidArg('referry');
      }
    }
    if (this.$ds_ref === 0) {
      if (totalReleaseVerb) {
        debugger;
      }
      throw new Error('addRef() on already fully released object');
    }
    if (traceRefs) {
      this.$ds_referries.push(referry);
    }
    this.$ds_ref++;
    if (totalReleaseVerb) {
      console.info((++util.serviceOwner.msgCount) + ":addRef: " + (DSObjectBase.desc(this)) + ", refs: " + this.$ds_ref + ", ref: " + (DSObjectBase.desc(referry)));
      if (util.serviceOwner.msgCount === window.totalBreak) {
        debugger;
      }
    }
    return this;
  });

  DSObjectBase.prototype.release = (function(referry) {
    var index, pool;
    if (assert) {
      if (!((typeof referry === 'object' && referry !== window) || typeof referry === 'function')) {
        error.invalidArg('referry');
      }
    }
    if (totalReleaseVerb) {
      console.info((++util.serviceOwner.msgCount) + ": release: " + (DSObjectBase.desc(this)) + ", refs: " + (this.$ds_ref - 1) + ", ref: " + (DSObjectBase.desc(referry)));
      if (util.serviceOwner.msgCount === window.totalBreak) {
        debugger;
      }
    }
    if (this.$ds_ref === 0) {
      if (totalReleaseVerb) {
        debugger;
      }
      throw new Error('release() on already fully released object');
    }
    if (traceRefs) {
      if ((index = this.$ds_referries.indexOf(referry)) < 0) {
        console.error((DSObjectBase.desc(this)) + ": Referry not found: " + (DSObjectBase.desc(referry)));
        if (totalReleaseVerb) {
          debugger;
        }
      } else {
        this.$ds_referries.splice(index, 1);
      }
    }
    if (--this.$ds_ref === 0) {
      if (this.hasOwnProperty('$ds_pool')) {
        if ((pool = this.$ds_pool).watchOn) {
          if (assert) {
            if (!_.find(this.$ds_evt, ((function(_this) {
              return function(lst) {
                return lst === pool;
              };
            })(this)))) {
              console.error('Not an event listener');
            }
          }
          _.remove(this.$ds_evt, pool);
        }
        delete this.$ds_pool.items[this.$ds_key];
      }
      this.__proto__._dstr.call(this);
      if (totalRelease) {
        if (!this.hasOwnProperty('$ds_globalId')) {
          throw new Error("Missing $ds_globalId, which means that something really wrong is going on");
        }
        if (!totalPool.hasOwnProperty(this.$ds_globalId)) {
          throw new Error((DSObjectBase.desc(this)) + ": Object already not in the totalPool");
        }
        delete totalPool[this.$ds_globalId];
      }
    }
    return this;
  });

  DSObjectBase.prototype.toString = (function() {
    return this.__proto__.constructor.name + ":" + this.$ds_key + (typeof this.$ds_pool === 'object' ? '@' + this.$ds_pool : '');
  });

  DSObjectBase.prototype.writeMap = (function() {
    var prop, propName, ref, res;
    res = {};
    ref = this.__proto__.__props;
    for (propName in ref) {
      prop = ref[propName];
      if (prop.hasOwnProperty('write')) {
        res[propName] = prop.write(this["_" + propName]);
      }
    }
    return res;
  });

  DSObjectBase.prototype.readMap = (function(map) {
    var propDesc, propName, props, value;
    props = this.__proto__.__props;
    for (propName in map) {
      value = map[propName];
      if (props.hasOwnProperty(propName) && (propDesc = props[propName]).hasOwnProperty('read')) {
        this[propName] = propDesc.read(value);
      } else {
        console.error("Unexpected property " + propName);
      }
    }
  });

  DSObjectBase.begin = (function(name) {
    var clazz;
    if (assert) {
      if (typeof name !== 'string') {
        error.invalidArg('name');
      }
    }
    clazz = this;
    this.prototype.$ds_docType = this.docType = name;
    this.ds_ctor = this.__super__.constructor.hasOwnProperty('ds_ctor') ? _.clone(this.__super__.constructor.ds_ctor) : [];
    this.ds_dstr = this.__super__.constructor.hasOwnProperty('ds_dstr') ? _.clone(this.__super__.constructor.ds_dstr) : [];
  });

  DSObjectBase.end = (function() {
    var ctor, dstr;
    if (this.ds_ctor.length === 0) {
      this.prototype._init = _.noop;
    } else {
      ctor = this.ds_ctor;
      this.prototype._init = (function() {
        var f, i, len;
        for (i = 0, len = ctor.length; i < len; i++) {
          f = ctor[i];
          f.call(this);
        }
      });
    }
    if (this.ds_dstr.length === 0) {
      this.prototype._dstr = _.noop;
    } else {
      dstr = this.ds_dstr;
      this.prototype._dstr = (function() {
        var f, i;
        for (i = dstr.length - 1; i >= 0; i += -1) {
          f = dstr[i];
          f.call(this);
        }
      });
    }
  });

  DSObjectBase.prop = (function(opts) {
    var equal, func, init, localName, name, propDecl, props, superInit, superProps, valid;
    if (assert) {
      if (!(typeof opts === 'object')) {
        error.invalidArg('opts');
      }
      if (!(opts.hasOwnProperty('name'))) {
        throw new Error('Missing opts.name');
      }
      if (!(typeof opts.name === 'string' && opts.name.length > 0)) {
        throw new Error('Invalid value of opts.name');
      }
      if (!opts.hasOwnProperty('type')) {
        throw new Error('Missing opts.type');
      }
      if (!((typeof opts.type === 'string' && opts.type.length > 0) || typeof opts.type === 'function')) {
        throw new Error('Invalid value of opts.type');
      }
      if (!(!opts.hasOwnProperty('readonly') || typeof opts.readonly === 'boolean')) {
        throw new Error('Invalid value of opts.readonly');
      }
      if (!(!opts.hasOwnProperty('func') || typeof opts.func === 'function')) {
        throw new Error('Invalid value of opts.func');
      }
      if (!(!opts.hasOwnProperty('value') || typeof opts.value !== 'function')) {
        throw new Error('Invalid value of opts.value');
      }
      if (opts.hasOwnProperty('init') && !opts.readonly && !opts.hasOwnProperty('valid')) {
        throw new Error('Missing opts.valid');
      }
      if (opts.hasOwnProperty('valid') && (opts.readonly || !opts.hasOwnProperty('init'))) {
        throw new Error('Unexpected opts.valid');
      }
      if (opts.hasOwnProperty('valid') && opts.valid(typeof (init = opts.init) === 'function' ? init() : init) === void 0) {
        throw new Error("Invalid init value: " + opts.init);
      }
      if (!(!opts.hasOwnProperty('valid') || typeof opts.valid === 'function')) {
        throw new Error('Invalid value of opts.valid');
      }
      if (!(!opts.hasOwnProperty('write') || typeof opts.write === 'function')) {
        throw new Error('Invalid value of opts.write');
      }
      if (!(!opts.hasOwnProperty('read') || typeof opts.read === 'function')) {
        throw new Error('Invalid value of opts.read');
      }
      if (!(!opts.hasOwnProperty('equal') || typeof opts.equal === 'function')) {
        throw new Error('Invalid value of opts.equal');
      }
      if (!(!opts.hasOwnProperty('str') || typeof opts.str === 'function')) {
        throw new Error('Invalid value of opts.str');
      }
      if (!(!opts.hasOwnProperty('get') || typeof opts.get === 'function')) {
        throw new Error('Invalid value of opts.get');
      }
      if (!(!opts.hasOwnProperty('set') || typeof opts.set === 'function')) {
        throw new Error('Invalid value of opts.set');
      }
    }
    if (!this.prototype.hasOwnProperty('__init')) {
      this.prototype.__init = (superInit = this.__super__.__init) ? _.clone(superInit) : {};
      props = this.prototype.__props = (superProps = this.__super__.__props) ? _.clone(superProps) : {};
      this.prototype.get = (function(propName) {
        if (assert) {
          if (!props.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName];
      });
      this.prototype.set = (function(propName, value) {
        if (assert) {
          if (!props.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName] = value;
      });
    } else if (assert) {
      if (this.prototype.__props.hasOwnProperty(opts.name)) {
        error.duplicatedProperty(this, opts.name);
      }
    }
    propDecl = this.prototype.__props[opts.name] = {
      name: opts.name,
      type: opts.type,
      write: opts.write || (function(v) {
        if (v === null) {
          return null;
        } else {
          return v.valueOf();
        }
      }),
      read: opts.read || (function(v) {
        return v;
      }),
      equal: equal = opts.equal || (function(l, r) {
        return (l != null ? l.valueOf() : void 0) === (r != null ? r.valueOf() : void 0);
      }),
      str: opts.str || (function(v) {
        if (v === null) {
          return '';
        } else {
          return v.toString();
        }
      }),
      readonly: opts.readonly || false
    };
    if (opts.hasOwnProperty('init')) {
      valid = propDecl.valid = opts.valid;
      propDecl.init = this.prototype.__init[localName = "_" + (name = opts.name)] = opts.init;
      Object.defineProperty(this.prototype, name, {
        get: opts.get || (function() {
          return this[localName];
        }),
        set: opts.set || (opts.readonly ? (function(v) {
          error.propIsReadOnly(this, name);
        }) : (function(value) {
          var evt, i, lst, oldVal, v;
          if (typeof (value = valid(v = value)) === 'undefined') {
            error.invalidValue(this, name, v);
          }
          if (!equal((oldVal = this[localName]), value)) {
            this[localName] = value;
            if ((evt = this.$ds_evt)) {
              for (i = evt.length - 1; i >= 0; i += -1) {
                lst = evt[i];
                lst.__onChange.call(lst, this, name, value, oldVal);
              }
            }
          }
        }))
      });
    } else if (opts.hasOwnProperty('value')) {
      propDecl.value = opts.value;
      propDecl.readonly = true;
      Object.defineProperty(this.prototype, opts.name, {
        value: value
      });
    } else if (opts.hasOwnProperty('func')) {
      propDecl.func = func = opts.func;
      propDecl.readonly = true;
      Object.defineProperty(this.prototype, name = opts.name, {
        get: opts.get || (function() {
          return func.call(this);
        }),
        set: opts.set || (function(v) {
          error.propIsReadOnly(this, name);
        })
      });
    } else {
      throw new Error('Missing get value');
    }
    return propDecl;
  });

  DSObjectBase.propSimple = (function(type, name, init, valid) {
    var q;
    if (assert) {
      if (!(type === 'number' || type === 'boolean' || type === 'string' || type === 'object')) {
        error.invalidArg('type');
      }
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (valid && typeof valid !== 'function') {
        error.invalidArg('valid');
      }
      if (typeof init !== 'undefined' && init !== null && typeof init !== type) {
        error.invalidArg('init');
      }
    }
    valid = (q = valid) ? (function(value) {
      if ((value === null || typeof value === type) && (value = q(value)) !== void 0) {
        return value;
      } else {
        return void 0;
      }
    }) : (function(value) {
      if (value === null || typeof value === type) {
        return value;
      } else {
        return void 0;
      }
    });
    return this.prop({
      name: name,
      type: type,
      init: typeof init === 'undefined' ? null : type !== 'object' ? init : (function() {
        return _.clone(init);
      }),
      valid: valid,
      write: (function(v) {
        return v;
      }),
      read: (function(v) {
        return v;
      }),
      equal: (function(l, r) {
        return l === r;
      }),
      str: (function(v) {
        if (v === null) {
          return '';
        } else {
          return v.toString();
        }
      })
    });
  });

  DSObjectBase.propNum = (function(name, init, validation) {
    this.propSimple('number', name, init, validation);
  });

  DSObjectBase.propBool = (function(name, init, validation) {
    return this.propSimple('boolean', name, init, validation);
  });

  DSObjectBase.propStr = (function(name, init, validation) {
    return this.propSimple('string', name, init, validation);
  });

  DSObjectBase.propObj = (function(name, init, validation) {
    return this.propSimple('object', name, init, validation);
  });

  DSObjectBase.propDoc = (function(name, type, valid) {
    var localName, q;
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (valid && typeof valid !== 'function') {
        error.invalidArg('valid');
      }
      if (typeof type !== 'function') {
        error.invalidArg('type');
      }
      if (!type instanceof DSObjectBase) {
        error.notDSObjectClass(type);
      }
    }
    valid = (q = valid) ? (function(value) {
      if ((value === null || value instanceof type) && (value = q(value)) !== void 0) {
        return value;
      } else {
        return void 0;
      }
    }) : (function(value) {
      if (value === null || value instanceof type) {
        return value;
      } else {
        return void 0;
      }
    });
    localName = "_" + name;
    this.ds_dstr.push((function() {
      if (this[localName]) {
        this[localName].release(this);
      }
    }));
    return this.prop({
      name: name,
      type: type,
      init: null,
      valid: ((q = valid) ? (function(value) {
        if ((value === null || value instanceof type) && (value = q(value)) !== void 0) {
          return value;
        } else {
          return void 0;
        }
      }) : (function(value) {
        if (value === null || value instanceof type) {
          return value;
        } else {
          return void 0;
        }
      })),
      write: (function(v) {
        if (v !== null) {
          return v.$ds_key;
        } else {
          return null;
        }
      }),
      read: (function(v) {
        return null;
      }),
      equal: (function(l, r) {
        return l === r;
      }),
      str: typeof type.str === 'function' ? type.str : (function(v) {
        if (v === null) {
          return '';
        } else {
          return v.$ds_key;
        }
      }),
      set: (function(value) {
        var evt, i, lst, oldVal, v;
        if (typeof (value = valid(v = value)) === 'undefined') {
          error.invalidValue(this, name, v);
        }
        if ((oldVal = this[localName]) !== value) {
          this[localName] = value;
          if (value) {
            value.addRef(this);
          }
          if ((evt = this.$ds_evt)) {
            for (i = evt.length - 1; i >= 0; i += -1) {
              lst = evt[i];
              lst.__onChange.call(lst, this, name, value, oldVal);
            }
          }
          if (oldVal) {
            oldVal.release(this);
          }
        }
      })
    });
  });

  DSObjectBase.propCalc = (function(name, func) {
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (!func || typeof func !== 'function') {
        error.invalidArg('func');
      }
    }
    return this.prop({
      name: name,
      type: 'calc',
      func: func
    });
  });

  DSObjectBase.propConst = (function(name, value) {
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (typeof value === 'undefined') {
        error.invalidArg('value');
      }
    }
    return this.prop({
      name: name,
      type: 'const',
      value: value
    });
  });

  DSObjectBase.propEnum = (function(name, values) {
    var i, len, q, s, valid;
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (!_.isArray(values) || values.length === 0) {
        error.invalidArg('values');
      }
      for (i = 0, len = values.length; i < len; i++) {
        s = values[i];
        if (!typeof s === 'string') {
          error.invalidArg('values');
        }
      }
    }
    valid = (q = valid) ? (function(value) {
      if ((value === null || values.indexOf(value) >= 0) && q(value)) {
        return value;
      } else {
        return void 0;
      }
    }) : (function(value) {
      if (value === null || values.indexOf(value) >= 0) {
        return value;
      } else {
        return void 0;
      }
    });
    return this.prop({
      name: name,
      type: 'enum',
      init: values[0],
      valid: valid,
      set: (function(value) {
        var j, lst, oldVal, ref, v;
        if (typeof (value = valid(v = value)) === 'undefined') {
          error.invalidValue(this, name, v);
        }
        if ((oldVal = this[localName]) !== value) {
          this[localName] = value;
          if (this.$ds_evt) {
            ref = this.$ds_evt;
            for (j = ref.length - 1; j >= 0; j += -1) {
              lst = ref[j];
              lst.__onChange.call(lst, this, name, value, oldVal);
            }
          }
        }
      })
    });
  });

  DSObjectBase.propMoment = (function(name, valid) {
    var q;
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (valid && typeof valid !== 'function') {
        error.invalidArg('valid');
      }
    }
    valid = (q = valid) ? (function(value) {
      if ((value === null || (typeof value === 'object' && moment.isMoment(value))) && q(value)) {
        return value;
      } else {
        return void 0;
      }
    }) : (function(value) {
      if (value === null || moment.isMoment(value)) {
        return value;
      } else {
        return void 0;
      }
    });
    return this.prop({
      name: name,
      type: 'moment',
      valid: valid,
      read: (function(v) {
        if (v !== null) {
          return moment(v);
        } else {
          return null;
        }
      }),
      init: null
    });
  });

  DSObjectBase.propDuration = (function(name, valid) {
    var q;
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (valid && typeof valid !== 'function') {
        error.invalidArg('valid');
      }
    }
    valid = (q = valid) ? (function(value) {
      if ((value === null || (typeof value === 'object' && moment.isDuration(value))) && q(value)) {
        return value;
      } else {
        return void 0;
      }
    }) : (function(value) {
      if (value === null || moment.isDuration(value)) {
        return value;
      } else {
        return void 0;
      }
    });
    return this.prop({
      name: name,
      type: 'duration',
      valid: valid,
      read: (function(v) {
        if (v !== null) {
          return moment.duration(v);
        } else {
          return null;
        }
      }),
      init: null
    });
  });

  DSObjectBase.onAnyPropChange = (function(listener) {
    if (assert) {
      if (typeof listener !== 'function') {
        error.invalidArg('listener');
      }
    }
    this.ds_ctor.push((function() {
      var converter;
      converter = {
        __onChange: ((function(_this) {
          return function() {
            listener.apply(_this, arguments);
          };
        })(this))
      };
      if (this.hasOwnProperty('$ds_evt')) {
        this.$ds_evt.push(converter);
      } else {
        this.$ds_evt = [converter];
      }
    }));
  });

  statusValues = ['nodata', 'load', 'update', 'ready'];

  statusByPrior = ['ready', 'update', 'nodata', 'load'];

  DSObjectBase.integratedStatus = (function(sources) {
    var i, len, res, t, v;
    if (assert) {
      if (!(_.isArray(sources) && _.some(sources, (function(v) {
        return v.__proto__.constructor.ds_dataSource;
      })))) {
        error.invalidArg('sources');
      }
    }
    res = -1;
    for (i = 0, len = sources.length; i < len; i++) {
      v = sources[i];
      if (v) {
        if (res < (t = statusByPrior.indexOf(v.get('status')))) {
          res = t;
        }
      }
    }
    if (res === -1) {
      return 'nodata';
    } else {
      return statusByPrior[res];
    }
  });

  if (traceData) {
    sourceId = 0;
    sequenceId = 0;
  }

  DSObjectBase.addDataSource = (function(onStatusChange) {
    var propDecl, valid;
    if (assert) {
      if (this.ds_dataSource) {
        throw new Error('This class already has data source mixin in it');
      }
      if (!(arguments.length === 0 || typeof onStatusChange === 'function')) {
        error.invalidArg('onStatusChange');
      }
    }
    this.ds_dataSource = true;
    if (traceData) {
      this.ds_ctor.unshift((function() {
        this.$ds_sourceId = ++sourceId;
        console.info((++sequenceId) + ":ctor: " + (DSObjectBase.desc(this)) + "(" + this.$ds_sourceId + ")");
        if (sequenceId === window.sourceBreak) {
          debugger;
        }
      }));
      this.ds_dstr.push((function() {
        console.info((++sequenceId) + ":dstr: " + (DSObjectBase.desc(this)) + "(" + this.$ds_sourceId + ")");
        if (sequenceId === window.sourceBreak) {
          debugger;
        }
      }));
    }
    valid = (function(value) {
      if (value === null || statusValues.indexOf(value) >= 0) {
        return value;
      } else {
        return void 0;
      }
    });
    propDecl = this.prop({
      name: 'status',
      type: 'status',
      valid: valid,
      init: statusValues[0],
      set: (function(value) {
        var i, lst, oldVal, ref, v;
        if (typeof (value = valid(v = value)) === 'undefined') {
          error.invalidValue(this, 'status', v);
        }
        if ((oldVal = this._status) !== value) {
          if (traceData) {
            console.info((++sequenceId) + ":newStatus: " + (DSObjectBase.desc(this)) + "(" + this.$ds_sourceId + "), new: " + value + ", old: " + oldVal);
            if (sequenceId === window.sourceBreak) {
              debugger;
            }
          }
          this._status = value;
          if (onStatusChange != null) {
            onStatusChange.call(this, value, oldVal);
          }
          ref = this.$ds_statusWatchers;
          for (i = ref.length - 1; i >= 0; i += -1) {
            lst = ref[i];
            lst.lst(this, value, oldVal, lst.unwatch);
          }
        }
      })
    });
    propDecl.statusValues = statusValues;
    this.prototype.__init.$ds_statusWatchers = (function() {
      return [];
    });
    this.prototype.watchStatus = (function(owner, listener) {
      var status, unwatch, w, watchStatus;
      if (assert) {
        if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
          error.invalidArg('referry');
        }
        if (!(typeof listener === 'function')) {
          error.invalidArg('listener');
        }
      }
      (watchStatus = this.$ds_statusWatchers).push(w = {
        lst: listener
      });
      this.addRef(owner);
      w.unwatch = unwatch = (function(_this) {
        return function(used) {
          return function() {
            if (used) {
              return;
            }
            _this.release(owner);
            _.remove(watchStatus, w);
            used = true;
          };
        };
      })(this)(false);
      status = this.get('status');
      if (status === 'update') {
        listener(this, 'ready', 'nodata', unwatch);
        if (_.find(watchStatus, w)) {
          listener(this, 'update', 'ready', unwatch);
        }
      } else {
        listener(this, status, 'nodata', unwatch);
      }
      return unwatch;
    });
  });

  return DSObjectBase;

})();



},{"./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee":[function(require,module,exports){
var DSDigest, DSObjectBase, DSPool, assert, error, traceWatch,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

traceWatch = require('./util').traceWatch;

DSObjectBase = require('./DSObjectBase');

DSDigest = require('./DSDigest');

module.exports = DSPool = (function(superClass) {
  var class1, renderItem;

  extend(DSPool, superClass);

  function DSPool() {
    return class1.apply(this, arguments);
  }

  DSPool.begin('DSPool');

  DSPool.ds_dstr.push((function() {
    if (!_.isEmpty(this.items)) {
      console.error("Pool " + (DSObjectBase.desc(this)) + " is not empty. Items: ", this.items);
    }
  }));

  class1 = (function(referry, key, type, watchOn) {
    var items;
    DSObjectBase.call(this, referry, key);
    if (assert) {
      if (!DSObjectBase.isAssignableFrom(type)) {
        error.notDSObjectClass(type);
      }
    }
    items = this.items = {};
    this.type = type;
    if (watchOn) {
      this.watchOn = true;
      this.evt = [];
    }
  });

  renderItem = (function(itemKey) {
    var e, i, item, items, ref;
    if (!(items = this.items).hasOwnProperty(itemKey)) {
      return;
    }
    item = items[itemKey];
    ref = this.evt;
    for (i = ref.length - 1; i >= 0; i += -1) {
      e = ref[i];
      e.lst(item);
    }
  });

  DSPool.prototype.__onChange = (function(item) {
    if (this.watchOn && this.evt.length > 0) {
      DSDigest.render(this.$ds_key, item.$ds_key, ((function(_this) {
        return function(itemKey) {
          renderItem.call(_this, itemKey);
        };
      })(this)));
    }
  });

  DSPool.prototype.find = (function(referry, key, map) {
    var item, params;
    if (assert) {
      if (!(typeof key === 'string' || (typeof key === 'object' && key !== null))) {
        error.invalidArg('key');
      }
      if (!(typeof map === 'undefined' || (typeof map === 'object' && map !== null))) {
        error.invalidArg('map');
      }
    }
    if (typeof key === 'object') {
      key = JSON.stringify((params = key));
    }
    if (map && map.hasOwnProperty(key)) {
      return map[key];
    }
    if (this.items.hasOwnProperty(key)) {
      (item = this.items[key]).addRef(referry);
    } else {
      item = this.items[key] = new this.type(referry, key, params);
      item.$ds_pool = this;
      if (this.evt) {
        if (!item.hasOwnProperty('$ds_evt')) {
          item.$ds_evt = [this];
        } else {
          if (assert) {
            if (_.find(item.$ds_evt, ((function(_this) {
              return function(lst) {
                return lst === _this;
              };
            })(this)))) {
              console.error('Already a listener');
            }
          }
          item.$ds_evt.push(this);
        }
        this.__onChange(item);
      }
    }
    if (map) {
      return map[key] = item;
    } else {
      return item;
    }
  });

  DSPool.prototype.enableWatch = (function(enable) {
    if (assert) {
      if (!this.evt) {
        throw new Error("Pool '" + (DSObjectBase.desc(this)) + "' watch functionality is not enabled");
      }
    }
    this.watchOn = enable;
  });

  DSPool.prototype.watch = (function(owner, listener) {
    var evt, k, v, w;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (!(typeof listener === 'function')) {
        error.invalidArg('listener');
      }
      for (k in listener) {
        v = listener[k];
        if (k !== 'change' && k !== 'add' && k !== 'remove') {
          throw new Error("Unexpected event listener: " + k);
        }
      }
      if (traceWatch) {
        listener.owner = owner;
      }
      if (!this.evt) {
        throw new Error("Pool '" + (DSObjectBase.desc(this)) + "' watch functionality is not enabled");
      }
    }
    (evt = this.evt).push(w = {
      lst: listener
    });
    this.addRef(owner);
    return ((function(_this) {
      return function() {
        _this.release(owner);
        _.remove(evt, w);
      };
    })(this));
  });

  DSPool.end();

  return DSPool;

})(DSObjectBase);



},{"./DSDigest":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDigest.coffee","./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee":[function(require,module,exports){
var DSObjectBase, DSSet, assert, error, modeReleaseDataOnReload, totalReleaseVerb, traceRefs, traceWatch, util,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

util = require('./util');

assert = require('./util').assert;

traceRefs = require('./util').traceRefs;

traceWatch = require('./util').traceWatch;

totalReleaseVerb = require('./util').totalReleaseVerb;

modeReleaseDataOnReload = require('./util').modeReleaseDataOnReload;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

module.exports = DSSet = (function(superClass) {
  var _add, _remove, class1;

  extend(DSSet, superClass);

  function DSSet() {
    return class1.apply(this, arguments);
  }

  DSSet.begin('DSSet');

  DSSet.addDataSource();

  DSSet.ds_dstr.push((function() {
    var items, k, ref, v;
    ref = (items = this.items);
    for (k in ref) {
      v = ref[k];
      v.release(this);
      delete items[k];
    }
  }));

  class1 = (function(referry, key, type, data) {
    DSObjectBase.call(this, referry, key);
    if (assert) {
      if (!type instanceof DSObjectBase) {
        error.notDSObjectClass(type);
      }
      if (!(typeof data === 'object' || data === void 0)) {
        error.invalidArg('data');
      }
    }
    this.data = data;
    this.type = type;
    this.evt = [];
    this.items = {};
  });

  DSSet.prototype.__onChange = (function() {
    var evt, i, ref, ref1;
    ref = this.evt;
    for (i = ref.length - 1; i >= 0; i += -1) {
      evt = ref[i];
      if ((ref1 = evt.change) != null) {
        ref1.apply(evt, arguments);
      }
    }
  });

  DSSet.prototype.merge = (function(owner, newMap) {
    var item, key, ref;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (!(typeof newMap === 'object')) {
        error.invalidArg('newMap');
      }
    }
    ref = this.items;
    for (key in ref) {
      item = ref[key];
      if (!newMap.hasOwnProperty(key)) {
        _remove.call(this, item);
      }
    }
    for (key in newMap) {
      item = newMap[key];
      if (assert) {
        if (key !== item.$ds_key) {
          throw new Error("Invalid source map.  key: " + key + "; item.$ds_key: " + item.$ds_key);
        }
      }
      _add.call(this, owner, item);
    }
    return this.items;
  });

  DSSet.prototype.reset = (function() {
    var evt, i, items, k, len;
    evt = this.evt;
    _.forEach((items = this.items), ((function(_this) {
      return function(item) {
        var e, i, len;
        for (i = 0, len = evt.length; i < len; i++) {
          e = evt[i];
          if (typeof e.remove === "function") {
            e.remove(item);
          }
        }
        item.release(_this);
      };
    })(this)));
    for (i = 0, len = items.length; i < len; i++) {
      k = items[i];
      delete items[k];
    }
  });

  DSSet.prototype.remove = (function(item) {
    if (this.items.hasOwnProperty(item.$ds_key)) {
      _remove.call(this, item);
    }
  });

  _remove = (function(item) {
    var e, i, ref;
    if (item.hasOwnProperty('$ds_evt')) {
      if (assert) {
        if (!_.find(item.$ds_evt, this)) {
          console.error('Not an event listener');
        }
      }
      _.remove(item.$ds_evt, this);
    }
    delete this.items[item.$ds_key];
    ref = this.evt;
    for (i = ref.length - 1; i >= 0; i += -1) {
      e = ref[i];
      if (typeof e.remove === "function") {
        e.remove(item);
      }
    }
    item.release(this);
  });

  DSSet.prototype.add = _add = (function(owner, item) {
    var e, i, index, items, ref, refs;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (!(item instanceof this.type)) {
        error.invalidMapElementType(this, item);
      }
    }
    if (!(items = this.items).hasOwnProperty(item.$ds_key)) {
      if (!item.hasOwnProperty('$ds_evt')) {
        item.$ds_evt = [this];
      } else {
        if (assert) {
          if (_.find(item.$ds_evt, ((function(_this) {
            return function(lst) {
              return lst === _this;
            };
          })(this)))) {
            console.error('Already a listener');
          }
        }
        item.$ds_evt.push(this);
      }
      items[item.$ds_key] = item;
      if (traceRefs) {
        refs = item.$ds_referries;
        if (refs.length === 0) {
          console.error((DSObjectBase.desc(item)) + ": Empty $ds_referries");
        } else if ((index = refs.lastIndexOf(owner)) < 0) {
          console.error((DSObjectBase.desc(this)) + ": Referry not found: " + (DSObjectBase.desc(owner)));
          if (totalReleaseVerb) {
            debugger;
          }
        } else {
          if (totalReleaseVerb) {
            console.info((++util.serviceOwner.msgCount) + ": transfer: " + (DSObjectBase.desc(item)) + ", refs: " + this.$ds_ref + ", from: " + (DSObjectBase.desc(owner)) + ", to: " + (DSObjectBase.desc(this)));
            if (util.serviceOwner.msgCount === window.totalBreak) {
              debugger;
            }
          }
          refs[index] = this;
        }
      }
      ref = this.evt;
      for (i = ref.length - 1; i >= 0; i += -1) {
        e = ref[i];
        if (typeof e.add === "function") {
          e.add(item);
        }
      }
    } else {
      item.release(owner);
    }
  });

  DSSet.prototype.clear = (function() {
    this.merge(this, {});
    this.set('status', 'nodata');
  });

  DSSet.prototype.watch = (function(owner, listener, isOwnerDSData) {
    var evt, k, v;
    if (assert) {
      if (!((typeof owner === 'object' && owner !== window) || typeof owner === 'function')) {
        error.invalidArg('owner');
      }
      if (typeof listener !== 'object') {
        error.invalidArg('listener');
      }
      for (k in listener) {
        v = listener[k];
        if (k !== 'change' && k !== 'add' && k !== 'remove') {
          throw new Error("Unexpected event listener: " + k);
        }
      }
      if (traceWatch) {
        listener.owner = owner;
      }
    }
    if (_.find(this.evt, (function(v) {
      return v === listener;
    }))) {
      listener = _.clone(listener);
    }
    (evt = this.evt).push(listener);
    if (isOwnerDSData) {
      return;
    }
    this.addRef(owner);
    return ((function(_this) {
      return function() {
        _this.release(owner);
        _.remove(evt, (function(v) {
          return v === listener;
        }));
      };
    })(this));
  });

  DSSet.prototype.addRef = (function(referry) {
    var data;
    if (this.$ds_ref === 1 && (data = this.data)) {
      if (++data.__busySets === 1) {
        data.addRef((data.__backRef = this));
      }
    }
    DSSet.__super__.addRef.call(this, referry);
    return this;
  });

  DSSet.prototype.release = (function(referry) {
    var data;
    DSSet.__super__.release.call(this, referry);
    if (this.$ds_ref === 1 && (data = this.data)) {
      if (--data.__busySets === 0) {
        data.release(data.__backRef);
      }
    }
    return this;
  });

  DSSet.end();

  return DSSet;

})(DSObjectBase);



},{"./DSObjectBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObjectBase.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSView.coffee":[function(require,module,exports){
var DSObject, DSSet, assert, error, ngModule, traceView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('dscommon/DSView', [require('../data/dsDataService')])).name;

traceView = require('./util').traceView;

assert = require('./util').assert;

error = require('./util').error;

DSObject = require('./DSObject');

DSSet = require('./DSSet');

ngModule.factory('DSView', [
  'dsDataService', '$log', (function(dsDataService, $log) {
    var DSView, Data;
    Data = (function() {
      function Data() {}

      Data.prototype.get = (function(propName) {
        if (assert) {
          if (!this.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName];
      });

      Data.prototype.set = (function(propName, value) {
        if (assert) {
          if (!this.hasOwnProperty(propName)) {
            error.invalidProp(this, propName);
          }
        }
        return this[propName] = value;
      });

      return Data;

    })();
    return DSView = (function(superClass) {
      var class1, viewSequence;

      extend(DSView, superClass);

      function DSView() {
        return class1.apply(this, arguments);
      }

      DSView.begin('DSView');

      DSView.begin = (function(name) {
        var superSrc;
        DSObject.begin.call(this, name);
        this.prototype.__src = (superSrc = this.__super__.__src) ? _.clone(superSrc) : {};
      });

      DSView.propData = (function(name, type, params) {
        var index, watch;
        if (assert) {
          if (typeof this.prototype._src !== 'undefined') {
            throw new Error("Duplicate data set name: " + name);
          }
          if (!(typeof params === 'undefined' || (typeof params === 'object' && params !== null))) {
            error.invalidArg('params');
          }
        }
        if (typeof params === 'object') {
          if (params.hasOwnProperty('watch')) {
            watch = params.watch;
            delete params.watch;
          } else {
            watch = null;
          }
          if (assert) {
            if (!(_.isArray(watch) || watch === null)) {
              error.invalidArg('params.watch');
            }
          }
        }
        this.prototype.__srcLength = (index = _.size(this.prototype.__src)) + 1;
        this.prototype.__src[name] = {
          name: name,
          type: type,
          watch: watch,
          params: params,
          index: index
        };
      });

      DSView.ds_dstr.push((function() {
        var k, ref, v;
        if (typeof this.__unwatch1 === "function") {
          this.__unwatch1();
        }
        if (typeof this.__unwatch2 === "function") {
          this.__unwatch2();
        }
        ref = this.__src;
        for (k in ref) {
          v = ref[k];
          if (typeof v.unwatch === "function") {
            v.unwatch();
          }
          if (typeof v.unwatchStatus === "function") {
            v.unwatchStatus();
          }
          if (v.hasOwnProperty('set')) {
            v.set.release(this);
          }
        }
      }));

      class1 = (function($scope, key) {
        var k, ref, setDirty, v, watch;
        DSObject.call(this, $scope, key);
        if (assert) {
          if (typeof $scope !== 'object') {
            error.invalidArg('$scope');
          }
        }
        this.__unwatch1 = (this.__scope = $scope).$on('$destroy', ((function(_this) {
          return function() {
            delete _this.__unwatch1;
            return _this.release($scope);
          };
        })(this)));
        this.__dirty = 0;
        this.__src = _.cloneDeep(this.__proto__.__src);
        this.__srcList = new Array(__proto__.__srcLength);
        this.dataStatus = 'nodata';
        setDirty = ((function(_this) {
          return function() {
            _this.__dirty++;
          };
        })(this));
        ref = this.__src;
        for (k in ref) {
          v = ref[k];
          watch = v.watch;
          v.listener = {
            add: setDirty,
            remove: setDirty,
            change: !watch ? setDirty : ((function(_this) {
              return function(watch) {
                return function(item, prop) {
                  if (watch.indexOf(prop) !== -1) {
                    _this.__dirty++;
                  }
                };
              };
            })(this))(watch)
          };
        }
      });

      DSView.prop({
        name: 'data',
        type: 'DSView.data',
        readonly: true,
        init: (function() {
          return new Data();
        })
      });

      viewSequence = 0;

      DSView.prototype.dataUpdate = (function(params) {
        var data, k, newSet, ref, v;
        if (typeof params === 'undefined') {
          params = {};
        }
        if (assert) {
          if (typeof params !== 'object' && params !== null) {
            error.invalidArg('params');
          }
        }
        dsDataService.requestSources(this, params, this.__src);
        ref = this.__src;
        for (k in ref) {
          v = ref[k];
          if (v.hasOwnProperty('newSet')) {
            newSet = v.newSet;
            if (v.hasOwnProperty('set')) {
              v.set.release(this);
              v.unwatch();
              v.unwatchStatus();
            }
            Object.defineProperty((data = this.get('data')), k, {
              configurable: true,
              enumerable: true,
              value: newSet.items
            });
            Object.defineProperty(data, k + "Set", {
              configurable: true,
              get: (function(newSet) {
                return function() {
                  return newSet;
                };
              })(newSet)
            });
            Object.defineProperty(data, k + "Status", {
              configurable: true,
              get: (function(newSet) {
                return function() {
                  return newSet.get('status');
                };
              })(newSet)
            });
            this.__srcList[v.index] = v.set = newSet;
            delete v.newSet;
            this.__dirty++;
            v.unwatch = newSet.watch(this, v.listener);
            v.unwatchStatus = newSet.watchStatus(this, ((function(_this) {
              return function(source, status, prevStatus) {
                var newStatus;
                if ((prevStatus = _this.dataStatus) !== (newStatus = DSObject.integratedStatus(_this.__srcList))) {
                  _this.dataStatus = newStatus;
                  if (!((newStatus === 'ready' && prevStatus === 'update') || (newStatus === 'update' && prevStatus === 'ready'))) {
                    _this.__dirty++;
                  }
                }
              };
            })(this)));
          }
        }
        if (!this.hasOwnProperty('__unwatch2')) {
          this.__unwatch2 = this.__scope.$watch(((function(_this) {
            return function() {
              return _this.__dirty;
            };
          })(this)), ((function(_this) {
            return function(val, oldVal) {
              var ref1, rest, src, srcName;
              if (traceView) {
                rest = '';
                ref1 = _this.__src;
                for (srcName in ref1) {
                  src = ref1[srcName];
                  rest += ", " + srcName + ": " + (src.set.get('status'));
                }
                console.info((++viewSequence) + ":" + (DSObject.desc(_this)) + ".render(): dataStatus: " + _this.dataStatus + rest);
                if (viewSequence === window.viewBreak) {
                  debugger;
                }
              }
              _this.render();
            };
          })(this)));
        }
      });

      DSView.end();

      return DSView;

    })(DSObject);
  })
]);



},{"../data/dsDataService":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\dsDataService.coffee","./DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","./DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","./util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee":[function(require,module,exports){
var ServiceOwner, util;

module.exports = util = {
  assert: true,
  traceData: false,
  traceWatch: false,
  traceView: false,
  traceRefs: false,
  totalRelease: false,
  totalReleaseVerb: false,
  modeReleaseDataOnReload: true,
  serviceOwner: new (ServiceOwner = (function() {
    var class1;

    function ServiceOwner() {
      return class1.apply(this, arguments);
    }

    class1 = (function() {
      this.name = 'serviceOwner';
      this.services = [];
      this.poolCleaners = [];
    });

    ServiceOwner.prototype.start = (function() {
      this.services = [];
      this.poolCleaners = [];
    });

    ServiceOwner.prototype.stop = (function() {
      var c, i, j, len, len1, ref, ref1, s;
      ref = this.services;
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        s.release(this);
      }
      if (this.poolCleaners) {
        ref1 = this.poolCleaners;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          c = ref1[j];
          c();
        }
      }
    });

    ServiceOwner.prototype.add = (function(svc) {
      this.services.push(svc);
      return svc;
    });

    ServiceOwner.prototype.remove = (function(svc) {
      _.remove(this.services, svc);
    });

    ServiceOwner.prototype.clearPool = (function(poolCleaner) {
      return this.poolCleaners.push(poolCleaner);
    });

    return ServiceOwner;

  })()),
  validate: {
    required: (function(value) {
      if (typeof value !== 'undefined' && value !== null) {
        return value;
      } else {
        return void 0;
      }
    }),
    trimString: (function(value) {
      if (typeof value !== 'string') {
        return null;
      } else if ((value = value.trim()).length === 0) {
        return null;
      } else {
        return value;
      }
    })
  },
  error: {
    invalidArg: (function(name) {
      throw new Error("Invalid '" + name + "' parameter");
    }),
    notDSObjectClass: (function(clazz) {
      throw new Error("Not a DSObject class");
    }),
    invalidProp: (function(object, propName) {
      throw new Error("Obj '" + object + "': Prop '" + propName + "': Invalid property");
    }),
    invalidListValue: (function(index, invalidValue) {
      throw new Error("Invalid value '" + invalidValue + "' at position " + index);
    }),
    duplicatedProperty: (function(clazz, propName) {
      throw new Error("Class '" + clazz.name + "': Prop '" + propName + "': Duplicated property name");
    }),
    propIsReadOnly: (function(clazz, propName) {
      throw new Error("Class '" + clazz.name + "': Prop '" + propName + "': Property is read-only");
    }),
    invalidValue: (function(object, propName, invalidValue) {
      throw new Error("Obj '" + object + "': Prop '" + propName + "': Invalid value '" + invalidValue + "'");
    }),
    invalidMapElementType: (function(invalidValue) {
      throw new Error("Invalid element type '" + invalidValue + "'");
    }),
    invalidPropMapElementType: (function(object, propName, invalidValue) {
      throw new Error("Obj '" + object + "': Prop '" + propName + "': Invalid value '" + invalidValue + "'");
    })
  }
};



},{}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee":[function(require,module,exports){
var DSDocument, DSEnum, Person, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSDocument = require('../dscommon/DSDocument');

DSEnum = require('../dscommon/DSEnum');

module.exports = Person = (function(superClass) {
  var class1;

  extend(Person, superClass);

  function Person() {
    return class1.apply(this, arguments);
  }

  Person.begin('Person');

  DSEnum.addPropType(Person);

  Person.addPool();

  Person.str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.get('name');
    }
  });

  Person.propNum('id', 0);

  Person.propStr('name');

  Person.propStr('avatar');

  Person.propStr('email');

  Person.propDSEnum('roles');

  Person.propNum('companyId');

  Person.propDuration('contractTime');

  class1 = (function(referry, key) {
    DSDocument.call(this, referry, key);
    this.set('contractTime', moment.duration(8, 'hours'));
  });

  Person.end();

  return Person;

})(DSDocument);



},{"../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../dscommon/DSEnum":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSEnum.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\PersonDayStat.coffee":[function(require,module,exports){
var DSObject, Person, PersonDayStat, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSObject = require('../dscommon/DSObject');

Person = require('./Person');

module.exports = PersonDayStat = (function(superClass) {
  var DayStat, class1;

  extend(PersonDayStat, superClass);

  function PersonDayStat() {
    return class1.apply(this, arguments);
  }

  PersonDayStat.begin('PersonDayStat');

  PersonDayStat.DayStat = DayStat = (function(superClass1) {
    extend(DayStat, superClass1);

    function DayStat() {
      return DayStat.__super__.constructor.apply(this, arguments);
    }

    DayStat.begin('DayStat');

    DayStat.propMoment('day');

    DayStat.propNum('tasksCount');

    DayStat.propDuration('contract');

    DayStat.propDuration('tasksTotal');

    DayStat.propDuration('timeLeft');

    DayStat.end();

    return DayStat;

  })(DSObject);

  class1 = (function(referry, key, person, days) {
    var d, ds, i, id, len;
    DSObject.call(this, referry, key);
    if (assert) {
      if (!(person instanceof Person)) {
        error.invalidArg('person');
      }
      if (!(Array.isArray(days))) {
        error.invalidArg('days');
      }
      for (i = 0, len = days.length; i < len; i++) {
        d = days[i];
        if (!moment.isMoment(d)) {
          error.invalidArg('days');
        }
      }
    }
    this.set('person', person);
    id = 0;
    this.get('dayStatsList').merge(this, (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = days.length; j < len1; j++) {
        d = days[j];
        results.push(((ds = new DayStat(this, "" + (id++))).set('day', d), ds));
      }
      return results;
    }).call(this));
  });

  PersonDayStat.propDoc('person', Person);

  PersonDayStat.propList('dayStats', DayStat);

  PersonDayStat.propDuration('totalPeriodTime');

  PersonDayStat.end();

  return PersonDayStat;

})(DSObject);



},{"../dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","./Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Project.coffee":[function(require,module,exports){
var DSDocument, Project, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSDocument = require('../dscommon/DSDocument');

module.exports = Project = (function(superClass) {
  extend(Project, superClass);

  function Project() {
    return Project.__super__.constructor.apply(this, arguments);
  }

  Project.begin('Project');

  Project.addPool();

  Project.str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.get('name');
    }
  });

  Project.propNum('id', 0);

  Project.propStr('name');

  Project.end();

  return Project;

})(DSDocument);



},{"../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee":[function(require,module,exports){
var DSDocument, Person, Project, Task, TaskSplit, TodoList, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSDocument = require('../dscommon/DSDocument');

Project = require('./Project');

Person = require('./Person');

TodoList = require('./TodoList');

TaskSplit = require('./types/TaskSplit');

module.exports = Task = (function(superClass) {
  extend(Task, superClass);

  function Task() {
    return Task.__super__.constructor.apply(this, arguments);
  }

  Task.begin('Task');

  Task.addPool(true);

  TaskSplit.addPropType(Task);

  Task.str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.get('title');
    }
  });

  Task.propNum('id', 0);

  Task.propStr('title');

  (Task.propDuration('estimate')).str = (function(v) {
    var hours, minutes, res;
    hours = Math.floor(v.asHours());
    minutes = v.minutes();
    res = hours ? hours + "h" : '';
    if (minutes) {
      res += " " + minutes + "m";
    }
    if (!res) {
      res = '0';
    }
    return res;
  });

  (Task.propMoment('duedate')).str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.format('DD.MM.YYYY');
    }
  });

  (Task.propMoment('startDate')).str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.format('DD.MM.YYYY');
    }
  });

  Task.propDoc('creator', Person);

  Task.propDoc('responsible', Person);

  Task.propDoc('todoList', TodoList);

  Task.propDoc('project', Project);

  Task.propTaskRelativeSplit('split');

  Task.propStr('description');

  Task.end();

  return Task;

})(DSDocument);



},{"../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","./Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","./Project":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Project.coffee","./TodoList":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\TodoList.coffee","./types/TaskSplit":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\types\\TaskSplit.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\TodoList.coffee":[function(require,module,exports){
var DSObject, Project, TodoList, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

DSObject = require('../dscommon/DSObject');

Project = require('./Project');

module.exports = TodoList = (function(superClass) {
  extend(TodoList, superClass);

  function TodoList() {
    return TodoList.__super__.constructor.apply(this, arguments);
  }

  TodoList.begin('TodoList');

  TodoList.addPool();

  TodoList.str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.get('name');
    }
  });

  TodoList.propNum('id', 0);

  TodoList.propStr('name');

  TodoList.propDoc('project', Project);

  TodoList.end();

  return TodoList;

})(DSObject);



},{"../dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","./Project":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Project.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\types\\TaskSplit.coffee":[function(require,module,exports){
var DSDocument, TaskSplit, assert, error;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSDocument = require('../../dscommon/DSDocument');

module.exports = TaskSplit = (function() {
  var class1, zero;

  function TaskSplit() {
    return class1.apply(this, arguments);
  }

  TaskSplit.addPropType = (function(clazz) {
    clazz.propTaskRelativeSplit = (function(name, valid) {
      var q;
      if (assert) {
        if (!typeof name === 'string') {
          error.invalidArg('name');
        }
        if (valid && typeof valid !== 'function') {
          error.invalidArg('valid');
        }
      }
      valid = (q = valid) ? (function(value) {
        if ((value === null || (typeof value === 'object' && value instanceof TaskSplit)) && q(value)) {
          return value;
        } else {
          return void 0;
        }
      }) : (function(value) {
        if (value === null || value instanceof TaskSplit) {
          return value;
        } else {
          return void 0;
        }
      });
      return clazz.prop({
        name: name,
        type: 'taskRelativeSplit',
        valid: valid,
        read: (function(v) {
          if (v !== null) {
            return new TaskSplit(v);
          } else {
            return null;
          }
        }),
        str: (function() {
          return 'split';
        }),
        equal: (function(l, r) {
          var i, j, leftList, len, rightList, v;
          if (l === null || r === null) {
            return l === r;
          }
          if ((leftList = l != null ? l.list : void 0).length !== (rightList = r != null ? r.list : void 0).length) {
            return false;
          }
          for (i = j = 0, len = leftList.length; j < len; i = j += 2) {
            v = leftList[i];
            if (v !== rightList[i] || leftList[i + 1].valueOf() !== rightList[i + 1].valueOf()) {
              return false;
            }
          }
          return true;
        }),
        init: null
      });
    });
  });

  zero = moment.duration(0);

  class1 = (function(persisted) {
    var d, i, j, k, len, len1, list, src, v;
    if (assert) {
      if (arguments.length === 1 && typeof arguments[0] === 'object' && arguments[0].__proto__ === TaskSplit.prototype) {
        void 0;
      } else if (arguments.length === 1 && Array.isArray(persisted)) {
        if (!(persisted.length % 2 === 0)) {
          error.invalidArg('persisted');
        }
        for (j = 0, len = persisted.length; j < len; j++) {
          v = persisted[j];
          if (!(typeof v === 'number')) {
            error.invalidArg('persisted');
          }
        }
      }
    }
    if (arguments.length === 1 && typeof (src = arguments[0]) === 'object' && src.__proto__ === TaskSplit.prototype) {
      this.list = src.list.slice();
    } else {
      this.list = list = [];
      if (Array.isArray(persisted)) {
        for (i = k = 0, len1 = persisted.length; k < len1; i = k += 2) {
          d = persisted[i];
          list.push(moment.duration(d, 'day').valueOf());
          list.push(moment.duration(persisted[i + 1], 'minute'));
        }
      }
    }
  });

  TaskSplit.prototype.clone = (function() {
    return new TaskSplit(this);
  });

  TaskSplit.prototype.set = (function(duedate, date, estimate) {
    var d, dateDiff, i, j, len, list, ref;
    if (assert) {
      if (!(moment.isMoment(duedate))) {
        error.invalidArg('duedate');
      }
      if (!(moment.isMoment(date))) {
        error.invalidArg('date');
      }
      if (!(estimate === null || moment.isDuration(estimate))) {
        error.invalidArg('estimate');
      }
    }
    dateDiff = date.diff(duedate);
    ref = (list = this.list);
    for (i = j = 0, len = ref.length; j < len; i = j += 2) {
      d = ref[i];
      if (d === dateDiff) {
        if (estimate !== null && estimate.valueOf() !== 0) {
          if (list[i + 1].valueOf() === estimate.valueOf()) {
            return;
          }
          list[i + 1] = estimate;
        } else {
          list.splice(i, 2);
        }
        delete this.value;
        return;
      } else if (dateDiff < d) {
        if ((estimate != null ? estimate.valueOf() : void 0) !== 0) {
          list.splice(i, 0, dateDiff, estimate);
        }
        delete this.value;
        return;
      }
    }
    if ((estimate != null ? estimate.valueOf() : void 0) !== 0) {
      delete this.value;
      list.push(dateDiff);
      list.push(estimate);
    }
    return this;
  });

  TaskSplit.prototype.get = (function(duedate, date) {
    var d, dateDiff, i, j, len, list, ref;
    if (assert) {
      if (!(moment.isMoment(duedate))) {
        error.invalidArg('duedate');
      }
      if (!(moment.isMoment(date))) {
        error.invalidArg('date');
      }
    }
    dateDiff = date.diff(duedate);
    ref = (list = this.list);
    for (i = j = 0, len = ref.length; j < len; i = j += 2) {
      d = ref[i];
      if (d === dateDiff) {
        return list[i + 1];
      }
    }
    return null;
  });

  TaskSplit.prototype.day = (function(getDuedate, date) {
    var accessor;
    if (assert) {
      if (!typeof getDuedate === 'function') {
        error.invalidArg('getDuedate');
      }
      if (!moment.isMoment(date)) {
        error.invalidArg('date');
      }
    }
    Object.defineProperty(accessor = {}, 'val', {
      get: ((function(_this) {
        return function() {
          return _this.get(getDuedate(), date);
        };
      })(this)),
      set: ((function(_this) {
        return function(v) {
          return _this.set(getDuedate(), date, v);
        };
      })(this))
    });
    return accessor;
  });

  TaskSplit.prototype.valueOf = (function() {
    var e, i, j, len, list, ref, res, s, value;
    if ((value = this.value)) {
      return value;
    }
    this.value = res = [];
    ref = (list = this.list);
    for (i = j = 0, len = ref.length; j < len; i = j += 2) {
      s = ref[i];
      e = list[i + 1];
      res.push(moment.duration(s).asDays());
      res.push(e.asMinutes());
    }
    return res;
  });

  TaskSplit.prototype.shift = (function(newDuedate, oldDuedate) {
    var diff, i, j, len, list, ref, t;
    if (assert) {
      switch (arguments.length) {
        case 1:
          if (!typeof newDuedate === 'number') {
            error.invalidArg('diff');
          }
          break;
        case 2:
          if (!moment.isMoment(newDuedate)) {
            error.invalidArg('newDuedate');
          }
          if (!moment.isMoment(oldDuedate)) {
            error.invalidArg('oldDuedate');
          }
          break;
        default:
          throw new Error('Invalid arguments');
      }
    }
    diff = typeof newDuedate === 'number' ? newDuedate : newDuedate.diff(oldDuedate);
    if (diff !== 0) {
      ref = (list = this.list);
      for (i = j = 0, len = ref.length; j < len; i = j += 2) {
        t = ref[i];
        list[i] -= diff;
      }
    }
  });

  TaskSplit.prototype.firstDate = (function(duedate) {
    var list;
    if (assert) {
      if (!moment.isMoment(duedate)) {
        error.invalidArg('duedate');
      }
    }
    if ((list = this.list).length > 0) {
      return moment(duedate).add(list[0]);
    } else {
      return null;
    }
  });

  TaskSplit.prototype.lastDate = (function(duedate) {
    var list;
    if (assert) {
      if (!moment.isMoment(duedate)) {
        error.invalidArg('duedate');
      }
    }
    if ((list = this.list).length > 0) {
      return moment(duedate).add(list[list.length - 2]);
    } else {
      return null;
    }
  });

  TaskSplit.prototype.clear = (function() {
    delete this.value;
    this.list = [];
  });

  TaskSplit.prototype.fixEstimate = (function(diff) {
    var i, j, len, list, ref, s;
    if (diff > 0) {
      this.list[this.list.length - 1].add(diff);
    } else if (diff < 0) {
      ref = list = this.list.slice(1);
      for (i = j = 0, len = ref.length; j < len; i = j += 2) {
        s = ref[i];
        if ((diff += s.valueOf()) > 0) {
          this.list[i + 1] = moment.duration(diff);
          this.list = this.list.slice(i);
          break;
        }
      }
    }
  });

  Object.defineProperty(TaskSplit.prototype, 'total', {
    get: (function() {
      var j, len, list, ref, sum, t;
      if ((list = this.list).length === 0) {
        return zero;
      }
      if (list.length === 1) {
        return list[1];
      }
      sum = moment.duration(list[1]);
      ref = list.slice(3);
      for (j = 0, len = ref.length; j < len; j += 2) {
        t = ref[j];
        sum.add(t);
      }
      return sum;
    })
  });

  return TaskSplit;

})();



},{"../../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\ui\\views\\changes\\ViewChanges.coffee":[function(require,module,exports){
var Change, DSObject, Person, Task, assert, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/changes/ViewChanges', [require('../../../data/dsChanges'), require('../../../dscommon/DSView')])).name;

assert = require('../../../dscommon/util').assert;

DSObject = require('../../../dscommon/DSObject');

Task = require('../../../models/Task');

Person = require('../../../models/Person');

Change = require('./models/Change');

ngModule.run([
  '$rootScope', (function($rootScope) {
    $rootScope.showChanges = (function() {
      $rootScope.modal = $rootScope.modal.type !== 'changes' ? {
        type: 'changes'
      } : {
        type: null
      };
    });
  })
]);

ngModule.controller('ViewChanges', [
  '$scope', 'ViewChanges', 'dsChanges', '$rootScope', (function($scope, ViewChanges, dsChanges, $rootScope) {
    $scope.view = new ViewChanges($scope, 'viewChanges');
    $scope.save = (function() {
      dsChanges.save().then(function() {
        $rootScope.modal = {
          type: null
        };
      });
    });
    $scope.reset = (function() {
      dsChanges.reset();
      $rootScope.modal = {
        type: null
      };
    });
  })
]);

ngModule.directive('viewChangesFix', [
  (function() {
    return {
      restrict: 'A',
      link: (function($scope, element, attrs) {
        var data, header;
        header = $('.main-table.header', element);
        data = $('.main-table.data', element);
        header.width(data.width());
      })
    };
  })
]);

ngModule.factory('ViewChanges', [
  'DSView', '$log', (function(DSView, $log) {
    var ViewChange;
    return ViewChange = (function(superClass) {
      var class1;

      extend(ViewChange, superClass);

      function ViewChange() {
        return class1.apply(this, arguments);
      }

      ViewChange.begin('ViewChange');

      ViewChange.propData('tasks', Task, {
        mode: 'changes'
      });

      ViewChange.propPool('poolChanges', Change);

      ViewChange.propList('changes', Change);

      class1 = (function($scope, key) {
        DSView.call(this, $scope, key);
        this.dataUpdate({});
      });

      ViewChange.prototype.render = (function() {
        var change, changes, conflictValue, poolChanges, prop, propChange, propName, props, ref, ref1, task, taskKey, tasksSet, tasksStatus, v;
        if (!((tasksStatus = this.get('data').get('tasksStatus')) === 'ready' || tasksStatus === 'update')) {
          this.get('changesList').merge(this, []);
          return;
        }
        poolChanges = this.get('poolChanges');
        changes = [];
        props = (tasksSet = this.get('data').get('tasksSet')).type.prototype.__props;
        ref = tasksSet.items;
        for (taskKey in ref) {
          task = ref[taskKey];
          ref1 = task.__change;
          for (propName in ref1) {
            propChange = ref1[propName];
            prop = props[propName];
            changes.push(change = poolChanges.find(this, task.$ds_key + "." + propName));
            change.set('doc', task);
            change.set('prop', propName);
            change.set('value', (v = propChange.v) === null ? ' -' : prop.str(propChange.v));
            change.set('conflict', prop.equal((conflictValue = task.$ds_doc.get(propName)), propChange.s) ? null : conflictValue === null ? ' -' : prop.str(conflictValue));
            change.remove = (function(self, task, propName) {
              return function() {
                task.set(propName, task.$ds_doc.get(propName));
                self.__dirty++;
              };
            })(this, task, propName);
          }
        }
        this.get('changesList').merge(this, changes);
      });

      ViewChange.end();

      return ViewChange;

    })(DSView);
  })
]);



},{"../../../data/dsChanges":"C:\\SVN\\_WebProfyManagement\\src\\app\\data\\dsChanges.coffee","../../../dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../../dscommon/DSView":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSView.coffee","../../../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../../../models/Person":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Person.coffee","../../../models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee","./models/Change":"C:\\SVN\\_WebProfyManagement\\src\\app\\ui\\views\\changes\\models\\Change.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\ui\\views\\changes\\models\\Change.coffee":[function(require,module,exports){
var Change, DSDocument, DSObject, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../../../dscommon/util').assert;

error = require('../../../../dscommon/util').error;

DSObject = require('../../../../dscommon/DSObject');

DSDocument = require('../../../../dscommon/DSDocument');

module.exports = Change = (function(superClass) {
  extend(Change, superClass);

  function Change() {
    return Change.__super__.constructor.apply(this, arguments);
  }

  Change.begin('Change');

  Change.propDoc('doc', DSDocument);

  Change.propStr('prop');

  Change.propStr('value');

  Change.propStr('conflict');

  Change.end();

  return Change;

})(DSObject);



},{"../../../../dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../../../dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../../../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\RMSData.coffee":[function(require,module,exports){
var RMSDataEnd, RMSDataStart, assert, clear, error, trimEndLF, trimStartLF;

assert = require('../dscommon/util').assert;

error = require('../dscommon/util').error;

RMSDataStart = /RMS\s*Data\s*\(DO NOT CHANGE!?\)/i;

RMSDataEnd = /}\s*END/i;

trimEndLF = (function(text) {
  var c, i, j, ref;
  for (i = j = ref = text.length - 1; j >= 0; i = j += -1) {
    if (!((c = text.charAt(i)) === '\r' || c === '\n' || c === ' ' || c === '\t')) {
      break;
    }
  }
  if (i >= 0) {
    return text.substr(0, i + 1);
  } else {
    return '';
  }
});

trimStartLF = (function(text) {
  var c, e, i, j, ref;
  e = -1;
  for (i = j = 0, ref = text.length; j < ref; i = j += 1) {
    if ((c = text.charAt(i)) === '\n') {
      e = i;
    } else if (!(c === '\r' || c === ' ' || c === '\t')) {
      break;
    }
  }
  if (e === -1) {
    return text;
  } else if (i < text.length) {
    return text.substr(e + 1);
  } else {
    return '';
  }
});

clear = (function(description) {
  var end, endText, start, startText;
  if ((start = description.search(RMSDataStart)) === -1) {
    return description;
  }
  if ((end = description.search(RMSDataEnd)) !== -1 && start < end) {
    startText = trimEndLF(description.substr(0, start));
    endText = trimStartLF(description.substr((description.search(/end/i)) + 3));
    return clear(startText.length > 0 ? endText.length > 0 ? startText + "\r\n\r\n" + endText : startText : endText);
  } else {
    return trimEndLF(description.substr(0, start - 1));
  }
});

module.exports = {
  clear: clear,
  get: (function(description) {
    var end, ex, jsonStart, start;
    if (assert) {
      if (!(description === null || typeof description === 'string')) {
        error.invalidArg('description');
      }
    }
    if (description === null || (start = description.search(RMSDataStart)) === -1) {
      return null;
    }
    if ((end = description.search(RMSDataEnd)) !== -1 && start < end) {
      if ((jsonStart = description.indexOf('{', start)) !== -1 && jsonStart < end) {
        try {
          return JSON.parse((description.substr(jsonStart, end - jsonStart + 1)).trim());
        } catch (_error) {
          ex = _error;
          console.error('ex: ', ex);
        }
      }
    }
    console.error('Corrupted RMS Data: ', description);
    return null;
  }),
  put: (function(description, data) {
    if (assert) {
      if (!(description === null || typeof description === 'string')) {
        error.invalidArg('description');
      }
      if (!(data === null || typeof data === 'object')) {
        error.invalidArg('data');
      }
    }
    description = description === null ? '' : clear(description);
    if (data === null || _.size(data) === 0) {
      return description;
    }
    return (description.length === 0 ? '' : "" + description) + ("\r\n\r\nRMS Data (DO NOT CHANGE!) " + (JSON.stringify(data)) + " END");
  })
};



},{"../dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee"}],"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\angular-local-storage.js":[function(require,module,exports){
/**
 * An Angular module that gives you access to the browsers local storage
 * @version v0.1.5 - 2014-11-04
 * @link https://github.com/grevory/angular-local-storage
 * @author grevory <greg@gregpike.ca>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function ( window, angular, undefined ) {
/*jshint globalstrict:true*/
'use strict';

var isDefined = angular.isDefined,
  isUndefined = angular.isUndefined,
  isNumber = angular.isNumber,
  isObject = angular.isObject,
  isArray = angular.isArray,
  extend = angular.extend,
  toJson = angular.toJson,
  fromJson = angular.fromJson;


// Test if string is only contains numbers
// e.g '1' => true, "'1'" => true
function isStringNumber(num) {
  return  /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
}

var angularLocalStorage = angular.module('LocalStorageModule', []);

angularLocalStorage.provider('localStorageService', function() {

  // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
  // e.g. localStorageServiceProvider.setPrefix('youAppName');
  // With provider you can use config as this:
  // myApp.config(function (localStorageServiceProvider) {
  //    localStorageServiceProvider.prefix = 'yourAppName';
  // });
  this.prefix = 'ls';

  // You could change web storage type localstorage or sessionStorage
  this.storageType = 'localStorage';

  // Cookie options (usually in case of fallback)
  // expiry = Number of days before cookies expire // 0 = Does not expire
  // path = The web path the cookie represents
  this.cookie = {
    expiry: 30,
    path: '/'
  };

  // Send signals for each of the following actions?
  this.notify = {
    setItem: true,
    removeItem: false
  };

  // Setter for the prefix
  this.setPrefix = function(prefix) {
    this.prefix = prefix;
    return this;
  };

   // Setter for the storageType
   this.setStorageType = function(storageType) {
     this.storageType = storageType;
     return this;
   };

  // Setter for cookie config
  this.setStorageCookie = function(exp, path) {
    this.cookie = {
      expiry: exp,
      path: path
    };
    return this;
  };

  // Setter for cookie domain
  this.setStorageCookieDomain = function(domain) {
    this.cookie.domain = domain;
    return this;
  };

  // Setter for notification config
  // itemSet & itemRemove should be booleans
  this.setNotify = function(itemSet, itemRemove) {
    this.notify = {
      setItem: itemSet,
      removeItem: itemRemove
    };
    return this;
  };

  this.$get = ['$rootScope', '$window', '$document', '$parse', function($rootScope, $window, $document, $parse) {
    var self = this;
    var prefix = self.prefix;
    var cookie = self.cookie;
    var notify = self.notify;
    var storageType = self.storageType;
    var webStorage;

    // When Angular's $document is not available
    if (!$document) {
      $document = document;
    } else if ($document[0]) {
      $document = $document[0];
    }

    // If there is a prefix set in the config lets use that with an appended period for readability
    if (prefix.substr(-1) !== '.') {
      prefix = !!prefix ? prefix + '.' : '';
    }
    var deriveQualifiedKey = function(key) {
      return prefix + key;
    };
    // Checks the browser to see if local storage is supported
    var browserSupportsLocalStorage = (function () {
      try {
        var supported = (storageType in $window && $window[storageType] !== null);

        // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
        // is available, but trying to call .setItem throws an exception.
        //
        // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
        // that exceeded the quota."
        var key = deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
        if (supported) {
          webStorage = $window[storageType];
          webStorage.setItem(key, '');
          webStorage.removeItem(key);
        }

        return supported;
      } catch (e) {
        storageType = 'cookie';
        $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
        return false;
      }
    }());



    // Directly adds a value to local storage
    // If local storage is not available in the browser use cookies
    // Example use: localStorageService.add('library','angular');
    var addToLocalStorage = function (key, value) {
      // Let's convert undefined values to null to get the value consistent
      if (isUndefined(value)) {
        value = null;
      } else if (isObject(value) || isArray(value) || isNumber(+value || value)) {
        value = toJson(value);
      }

      // If this browser does not support local storage use cookies
      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
            $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
        }

        if (notify.setItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: 'cookie'});
        }
        return addToCookies(key, value);
      }

      try {
        if (isObject(value) || isArray(value)) {
          value = toJson(value);
        }
        if (webStorage) {webStorage.setItem(deriveQualifiedKey(key), value)};
        if (notify.setItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: self.storageType});
        }
      } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
        return addToCookies(key, value);
      }
      return true;
    };

    // Directly get a value from local storage
    // Example use: localStorageService.get('library'); // returns 'angular'
    var getFromLocalStorage = function (key) {

      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
          $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
        }

        return getFromCookies(key);
      }

      var item = webStorage ? webStorage.getItem(deriveQualifiedKey(key)) : null;
      // angular.toJson will convert null to 'null', so a proper conversion is needed
      // FIXME not a perfect solution, since a valid 'null' string can't be stored
      if (!item || item === 'null') {
        return null;
      }

      if (item.charAt(0) === "{" || item.charAt(0) === "[" || isStringNumber(item)) {
        return fromJson(item);
      }

      return item;
    };

    // Remove an item from local storage
    // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
    var removeFromLocalStorage = function (key) {
      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
          $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
        }

        if (notify.removeItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {key: key, storageType: 'cookie'});
        }
        return removeFromCookies(key);
      }

      try {
        webStorage.removeItem(deriveQualifiedKey(key));
        if (notify.removeItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {key: key, storageType: self.storageType});
        }
      } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
        return removeFromCookies(key);
      }
      return true;
    };

    // Return array of keys for local storage
    // Example use: var keys = localStorageService.keys()
    var getKeysForLocalStorage = function () {

      if (!browserSupportsLocalStorage) {
        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
        return false;
      }

      var prefixLength = prefix.length;
      var keys = [];
      for (var key in webStorage) {
        // Only return keys that are for this app
        if (key.substr(0,prefixLength) === prefix) {
          try {
            keys.push(key.substr(prefixLength));
          } catch (e) {
            $rootScope.$broadcast('LocalStorageModule.notification.error', e.Description);
            return [];
          }
        }
      }
      return keys;
    };

    // Remove all data for this app from local storage
    // Also optionally takes a regular expression string and removes the matching key-value pairs
    // Example use: localStorageService.clearAll();
    // Should be used mostly for development purposes
    var clearAllFromLocalStorage = function (regularExpression) {

      regularExpression = regularExpression || "";
      //accounting for the '.' in the prefix when creating a regex
      var tempPrefix = prefix.slice(0, -1);
      var testRegex = new RegExp(tempPrefix + '.' + regularExpression);

      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
          $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
        }

        return clearAllFromCookies();
      }

      var prefixLength = prefix.length;

      for (var key in webStorage) {
        // Only remove items that are for this app and match the regular expression
        if (testRegex.test(key)) {
          try {
            removeFromLocalStorage(key.substr(prefixLength));
          } catch (e) {
            $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
            return clearAllFromCookies();
          }
        }
      }
      return true;
    };

    // Checks the browser to see if cookies are supported
    var browserSupportsCookies = (function() {
      try {
        return $window.navigator.cookieEnabled ||
          ("cookie" in $document && ($document.cookie.length > 0 ||
          ($document.cookie = "test").indexOf.call($document.cookie, "test") > -1));
      } catch (e) {
          $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
          return false;
      }
    }());

    // Directly adds a value to cookies
    // Typically used as a fallback is local storage is not available in the browser
    // Example use: localStorageService.cookie.add('library','angular');
    var addToCookies = function (key, value) {

      if (isUndefined(value)) {
        return false;
      } else if(isArray(value) || isObject(value)) {
        value = toJson(value);
      }

      if (!browserSupportsCookies) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
        return false;
      }

      try {
        var expiry = '',
            expiryDate = new Date(),
            cookieDomain = '';

        if (value === null) {
          // Mark that the cookie has expired one day ago
          expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
          expiry = "; expires=" + expiryDate.toGMTString();
          value = '';
        } else if (cookie.expiry !== 0) {
          expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
          expiry = "; expires=" + expiryDate.toGMTString();
        }
        if (!!key) {
          var cookiePath = "; path=" + cookie.path;
          if(cookie.domain){
            cookieDomain = "; domain=" + cookie.domain;
          }
          $document.cookie = deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
        }
      } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
        return false;
      }
      return true;
    };

    // Directly get a value from a cookie
    // Example use: localStorageService.cookie.get('library'); // returns 'angular'
    var getFromCookies = function (key) {
      if (!browserSupportsCookies) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
        return false;
      }

      var cookies = $document.cookie && $document.cookie.split(';') || [];
      for(var i=0; i < cookies.length; i++) {
        var thisCookie = cookies[i];
        while (thisCookie.charAt(0) === ' ') {
          thisCookie = thisCookie.substring(1,thisCookie.length);
        }
        if (thisCookie.indexOf(deriveQualifiedKey(key) + '=') === 0) {
          var storedValues = decodeURIComponent(thisCookie.substring(prefix.length + key.length + 1, thisCookie.length))
          try{
            var obj = JSON.parse(storedValues);
            return fromJson(obj)
          }catch(e){
            return storedValues
          }
        }
      }
      return null;
    };

    var removeFromCookies = function (key) {
      addToCookies(key,null);
    };

    var clearAllFromCookies = function () {
      var thisCookie = null, thisKey = null;
      var prefixLength = prefix.length;
      var cookies = $document.cookie.split(';');
      for(var i = 0; i < cookies.length; i++) {
        thisCookie = cookies[i];

        while (thisCookie.charAt(0) === ' ') {
          thisCookie = thisCookie.substring(1, thisCookie.length);
        }

        var key = thisCookie.substring(prefixLength, thisCookie.indexOf('='));
        removeFromCookies(key);
      }
    };

    var getStorageType = function() {
      return storageType;
    };

    // Add a listener on scope variable to save its changes to local storage
    // Return a function which when called cancels binding
    var bindToScope = function(scope, key, def, lsKey) {
      lsKey = lsKey || key;
      var value = getFromLocalStorage(lsKey);

      if (value === null && isDefined(def)) {
        value = def;
      } else if (isObject(value) && isObject(def)) {
        value = extend(def, value);
      }

      $parse(key).assign(scope, value);

      return scope.$watch(key, function(newVal) {
        addToLocalStorage(lsKey, newVal);
      }, isObject(scope[key]));
    };

    // Return localStorageService.length
    // ignore keys that not owned
    var lengthOfLocalStorage = function() {
      var count = 0;
      var storage = $window[storageType];
      for(var i = 0; i < storage.length; i++) {
        if(storage.key(i).indexOf(prefix) === 0 ) {
          count++;
        }
      }
      return count;
    };

    return {
      isSupported: browserSupportsLocalStorage,
      getStorageType: getStorageType,
      set: addToLocalStorage,
      add: addToLocalStorage, //DEPRECATED
      get: getFromLocalStorage,
      keys: getKeysForLocalStorage,
      remove: removeFromLocalStorage,
      clearAll: clearAllFromLocalStorage,
      bind: bindToScope,
      deriveKey: deriveQualifiedKey,
      length: lengthOfLocalStorage,
      cookie: {
        isSupported: browserSupportsCookies,
        set: addToCookies,
        add: addToCookies, //DEPRECATED
        get: getFromCookies,
        remove: removeFromCookies,
        clearAll: clearAllFromCookies
      }
    };
  }];
});
})( window, window.angular );
},{}],"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\base64.coffee":[function(require,module,exports){
var keyStr;

keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "=";

module.exports = {
  encode: (function(input) {
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4, i, output;
    output = "";
    chr1 = void 0;
    chr2 = void 0;
    chr3 = "";
    enc1 = void 0;
    enc2 = void 0;
    enc3 = void 0;
    enc4 = "";
    i = 0;
    while (true) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else {
        if (isNaN(chr3)) {
          enc4 = 64;
        }
      }
      output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
      chr1 = chr2 = chr3 = "";
      enc1 = enc2 = enc3 = enc4 = "";
      if (!(i < input.length)) {
        break;
      }
    }
    return output;
  }),
  decode: (function(input) {
    var base64test, chr1, chr2, chr3, enc1, enc2, enc3, enc4, i, output;
    output = "";
    chr1 = void 0;
    chr2 = void 0;
    chr3 = "";
    enc1 = void 0;
    enc2 = void 0;
    enc3 = void 0;
    enc4 = "";
    i = 0;
    base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
      alert("There were invalid base64 characters in the input text.\n" + "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" + "Expect errors in decoding.");
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (true) {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
      chr1 = chr2 = chr3 = "";
      enc1 = enc2 = enc3 = enc4 = "";
      if (!(i < input.length)) {
        break;
      }
    }
    return output;
  })
};



},{}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\110 DSObject.beginEnd.coffee":[function(require,module,exports){
var DSObject,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

describe('110 DSObject.beginEnd.coffee', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('construct and destroy an Object', function() {
    var AnotherClass, T, ac, ctor1, ctor2, dstr1, dstr2, owner, t, t2;
    owner = {
      name: 'owner'
    };
    ctor1 = jasmine.createSpy();
    ctor2 = jasmine.createSpy();
    dstr1 = jasmine.createSpy();
    dstr2 = jasmine.createSpy();
    T = (function(superClass) {
      extend(T, superClass);

      function T() {
        return T.__super__.constructor.apply(this, arguments);
      }

      T.begin('T');

      T.ds_ctor.push(ctor1);

      T.ds_ctor.push(ctor2);

      T.ds_dstr.push(dstr1);

      T.ds_dstr.push(dstr2);

      T.end();

      return T;

    })(DSObject);
    t = new T(owner, '1');
    expect(ctor1).toHaveBeenCalled();
    expect(ctor2).toHaveBeenCalled();
    expect(dstr1).not.toHaveBeenCalled();
    expect(dstr2).not.toHaveBeenCalled();
    t.release(owner);
    expect(dstr1).toHaveBeenCalled();
    expect(dstr2).toHaveBeenCalled();
    t2 = new T(owner, '2');
    expect(ctor1.calls.count()).toEqual(2);
    expect(ctor2.calls.count()).toEqual(2);
    expect(dstr1.calls.count()).toEqual(1);
    expect(dstr2.calls.count()).toEqual(1);
    t2.release(owner);
    expect(ctor1.calls.count()).toEqual(2);
    expect(ctor2.calls.count()).toEqual(2);
    expect(dstr1.calls.count()).toEqual(2);
    expect(dstr2.calls.count()).toEqual(2);
    AnotherClass = (function(superClass) {
      extend(AnotherClass, superClass);

      function AnotherClass() {
        return AnotherClass.__super__.constructor.apply(this, arguments);
      }

      AnotherClass.begin('AnotherClass');

      AnotherClass.end();

      return AnotherClass;

    })(DSObject);
    ac = new AnotherClass(owner, 'A');
    expect(ctor1.calls.count()).toEqual(2);
    expect(ctor2.calls.count()).toEqual(2);
    expect(dstr1.calls.count()).toEqual(2);
    expect(dstr2.calls.count()).toEqual(2);
    ac.release(owner);
    expect(ctor1.calls.count()).toEqual(2);
    expect(ctor2.calls.count()).toEqual(2);
    expect(dstr1.calls.count()).toEqual(2);
    return expect(dstr2.calls.count()).toEqual(2);
  });
});



},{"../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\112 DSObject.prop.coffee":[function(require,module,exports){
var DSObject,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

describe('112 DSObject.prop', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('declare and type check', function() {
    var R, T, owner, r, t;
    owner = {
      name: 'owner'
    };
    R = (function(superClass) {
      extend(R, superClass);

      function R() {
        return R.__super__.constructor.apply(this, arguments);
      }

      R.begin('R');

      R.end();

      return R;

    })(DSObject);
    T = (function(superClass) {
      extend(T, superClass);

      function T() {
        return T.__super__.constructor.apply(this, arguments);
      }

      T.begin('T');

      T.propNum('numNull', 0);

      T.propStr('strNull', '');

      T.propNum('num', 1, (function(value) {
        if (value > 0) {
          return value;
        } else {
          return void 0;
        }
      }));

      T.propStr('str', '123', (function(value) {
        if (value !== null && value.length > 0) {
          return value;
        } else {
          return void 0;
        }
      }));

      T.propDoc('r', R);

      T.end();

      return T;

    })(DSObject);
    t = new T(owner, 'T1');
    expect(t._numNull).toBe(0);
    expect(t.numNull).toBe(0);
    expect((function() {
      return t.get('numNull');
    })()).toBe(0);
    expect(t._strNull).toBe('');
    expect(t.strNull).toBe('');
    expect((function() {
      return t.get('strNull');
    })()).toBe('');
    expect(t._num).toBe(1);
    expect(t.num).toBe(1);
    expect((function() {
      return t.get('num');
    })()).toBe(1);
    expect(t._str).toBe('123');
    expect(t.str).toBe('123');
    expect((function() {
      return t.get('str');
    })()).toBe('123');
    expect(t._r).toBeNull();
    expect(t.r).toBeNull();
    expect((function() {
      return t.get('r');
    })()).toBeNull();
    expect((function() {
      t.strNull = 0;
    })).toThrowError("Obj 'T:T1': Prop 'strNull': Invalid value '0'");
    expect((function() {
      t.numNull = '';
    })).toThrowError("Obj 'T:T1': Prop 'numNull': Invalid value ''");
    expect((function() {
      t.set('strNull', 0);
    })).toThrowError("Obj 'T:T1': Prop 'strNull': Invalid value '0'");
    expect((function() {
      t.set('numNull', '');
    })).toThrowError("Obj 'T:T1': Prop 'numNull': Invalid value ''");
    expect((function() {
      t.r = t;
    })).toThrowError("Obj 'T:T1': Prop 'r': Invalid value 'T:T1'");
    expect((function() {
      t.r = 0;
    })).toThrowError("Obj 'T:T1': Prop 'r': Invalid value '0'");
    expect((function() {
      t.get('aaa');
    })).toThrowError("Obj 'T:T1': Prop 'aaa': Invalid property");
    expect((function() {
      t.set('aaa', 12);
    })).toThrowError("Obj 'T:T1': Prop 'aaa': Invalid property");
    expect((function() {
      t.str = null;
    })).toThrowError("Obj 'T:T1': Prop 'str': Invalid value 'null'");
    expect((function() {
      t.str = '';
    })).toThrowError("Obj 'T:T1': Prop 'str': Invalid value ''");
    t.r = r = new R(owner, 'R1');
    expect(t._r).toBe(r);
    expect(r.$ds_ref).toBe(2);
    r.release(owner);
    expect(r.$ds_ref).toBe(1);
    t.release(owner);
    expect(t.$ds_ref).toBe(0);
    return expect(r.$ds_ref).toBe(0);
  });
});



},{"../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\116 DSObject.map.coffee":[function(require,module,exports){
var DSObject,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

describe('116 DSObject.map', function() {
  var AnotherDoc, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  AnotherDoc = (function(superClass) {
    extend(AnotherDoc, superClass);

    function AnotherDoc() {
      return AnotherDoc.__super__.constructor.apply(this, arguments);
    }

    AnotherDoc.begin('AnotherDoc');

    AnotherDoc.end();

    return AnotherDoc;

  })(DSObject);
  TestDoc = (function(superClass) {
    var class1;

    extend(TestDoc, superClass);

    function TestDoc() {
      return class1.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.propNum('num', 12);

    TestDoc.propStr('str', 'TestStr');

    TestDoc.propBool('bool', false);

    TestDoc.propObj('obj', {});

    TestDoc.propDoc('doc', AnotherDoc);

    TestDoc.propMoment('moment');

    TestDoc.propDuration('duration');

    class1 = (function(referry, key) {
      var anotherDoc;
      DSObject.call(this, referry, key);
      this.set('doc', anotherDoc = new AnotherDoc(owner, 'anotherDoc'));
      anotherDoc.release(owner);
      this.set('moment', moment('2015-02-18'));
      this.set('duration', moment.duration('2h'));
    });

    TestDoc.end();

    return TestDoc;

  })(DSObject);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('DSObject to simple map and back', function() {
    var mapA, mapB, testDoc;
    expect(mapA = (testDoc = new TestDoc(owner, 'testDoc')).writeMap()).toEqual({
      num: 12,
      str: 'TestStr',
      bool: false,
      obj: {},
      doc: 'anotherDoc',
      moment: moment('2015-02-18').valueOf(),
      duration: moment.duration('2h').valueOf()
    });
    testDoc.num = null;
    testDoc.str = null;
    testDoc.bool = null;
    testDoc.obj = null;
    testDoc.doc = null;
    testDoc.moment = null;
    testDoc.duration = null;
    expect(mapB = testDoc.writeMap()).toEqual({
      num: null,
      str: null,
      bool: null,
      obj: null,
      doc: null,
      moment: null,
      duration: null
    });
    testDoc.readMap(mapA);
    expect(testDoc.num).toBe(12);
    expect(testDoc.str).toBe('TestStr');
    expect(testDoc.bool).toBe(false);
    expect(testDoc.obj).toEqual({});
    expect(testDoc.doc).toBeNull();
    expect(testDoc.moment.valueOf()).toBe(moment('2015-02-18').valueOf());
    expect(testDoc.duration.valueOf()).toBe(moment.duration('2h').valueOf());
    testDoc.readMap(mapB);
    expect(testDoc.num).toBeNull();
    expect(testDoc.str).toBeNull();
    expect(testDoc.bool).toBeNull();
    expect(testDoc.obj).toBeNull();
    expect(testDoc.doc).toBeNull();
    expect(testDoc.moment).toBeNull();
    expect(testDoc.duration).toBeNull();
    return testDoc.release(owner);
  });
});



},{"../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\120 DSEnum.coffee":[function(require,module,exports){
var DSEnum;

DSEnum = require('../../src/app/dscommon/DSEnum');

describe('120 DSEnum', function() {
  return it('general', function() {
    var e1, e2, e3;
    e1 = new DSEnum('c, b');
    e2 = e1.clone();
    e3 = e2.clone();
    expect(e1.get('c')).toBeTruthy();
    expect(e1.get('b')).toBeTruthy();
    expect(e1.get('a')).toBeFalsy();
    e1.set('b', false);
    expect(e1.get('b')).toBeFalsy();
    e1.set('a', true);
    expect(e1.get('a')).toBeTruthy();
    expect(e1).not.toEqual(e2);
    expect(e2).toEqual(e3);
    expect(e1.valueOf()).toBe('a,c');
    return expect(e1.diff(e2)).toBe('+a, -b');
  });
});



},{"../../src/app/dscommon/DSEnum":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSEnum.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\140 DSPool.coffee":[function(require,module,exports){
var DSObject, DSPool,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

DSPool = require('../../src/app/dscommon/DSPool');

describe('140 DSPool', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('create, reuse, release', function() {
    var E, e1, e1b, e1c, e2, owner, pool;
    owner = {
      name: 'owner'
    };
    E = (function(superClass) {
      extend(E, superClass);

      function E() {
        return E.__super__.constructor.apply(this, arguments);
      }

      E.begin('E');

      E.end();

      return E;

    })(DSObject);
    pool = new DSPool(owner, 'poolA', E);
    e1 = pool.find(owner, '1');
    expect(e1).not.toBeNull();
    e2 = pool.find(owner, '2');
    expect(e2).not.toBeNull();
    e1b = pool.find(owner, '1');
    expect(e1b).not.toBeNull();
    expect(e1b).toBe(e1);
    e1.release(owner);
    e1b.release(owner);
    e1c = pool.find(owner, '1');
    expect(e1c).not.toBeNull();
    expect(e1c).not.toBe(e1);
    e1c.release(owner);
    e2.release(owner);
    return pool.release(owner);
  });
});



},{"../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\150 DSSet.coffee":[function(require,module,exports){
var DSData, DSObject, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

DSPool = require('../../src/app/dscommon/DSPool');

DSData = require('../../src/app/dscommon/DSData');

DSSet = require('../../src/app/dscommon/DSSet');

describe('150 DSSet', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('populate', function() {
    var E, TestData, add, change, data, e1, e1b, e2, e3, e3b, e5b, owner, pool, remove, set, tmp, unwatch;
    owner = {
      name: 'owner'
    };
    E = (function(superClass) {
      extend(E, superClass);

      function E() {
        return E.__super__.constructor.apply(this, arguments);
      }

      E.begin('E');

      E.propNum('num', 0);

      E.end();

      return E;

    })(DSObject);
    TestData = (function(superClass) {
      extend(TestData, superClass);

      function TestData() {
        return TestData.__super__.constructor.apply(this, arguments);
      }

      TestData.begin('TestData');

      TestData.noCache();

      TestData.propSet('items', E);

      TestData.end();

      return TestData;

    })(DSData);
    pool = new DSPool(owner, 'poolE', E);
    data = new TestData(owner, 'testData', {});
    (set = data.get('itemsSet')).addRef(owner);
    data.release(owner);
    expect(data.itemsSet.$ds_ref).toBe(2);
    expect(data.$ds_ref).toBe(1);
    unwatch = set.watch(owner, {
      add: add = jasmine.createSpy(),
      remove: remove = jasmine.createSpy(),
      change: change = jasmine.createSpy()
    });
    tmp = {
      '1': e1 = pool.find(owner, '1'),
      '2': e2 = pool.find(owner, '2'),
      '3': e3 = pool.find(owner, '3')
    };
    set.merge(owner, tmp);
    expect(add.calls.count()).toEqual(3);
    expect(remove.calls.count()).toEqual(0);
    expect(change.calls.count()).toEqual(0);
    expect(e1.$ds_ref).toBe(1);
    expect(e2.$ds_ref).toBe(1);
    expect(e3.$ds_ref).toBe(1);
    tmp = {
      '1': e1b = pool.find(owner, '1'),
      '3': e3b = pool.find(owner, '3'),
      '5': e5b = pool.find(owner, '5')
    };
    set.merge(owner, tmp);
    expect(add.calls.count()).toEqual(4);
    expect(remove.calls.count()).toEqual(1);
    expect(change.calls.count()).toEqual(0);
    e1.num = 0;
    expect(change.calls.count()).toEqual(0);
    e1.num = 1;
    expect(change.calls.count()).toEqual(1);
    expect(e1.$ds_ref).toBe(1);
    expect(e1).toBe(e1b);
    expect(e2.$ds_ref).toBe(0);
    expect(e3.$ds_ref).toBe(1);
    expect(e3).toBe(e3b);
    expect(e5b.$ds_ref).toBe(1);
    set.release(owner);
    unwatch();
    expect(e1.$ds_ref).toBe(0);
    expect(e3.$ds_ref).toBe(0);
    expect(e5b.$ds_ref).toBe(0);
    expect(change.calls.count()).toEqual(1);
    expect(data.$ds_ref).toBe(0);
    return pool.release(owner);
  });
});



},{"../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\160 DSList.coffee":[function(require,module,exports){
var DSList, DSObject, DSPool,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

DSPool = require('../../src/app/dscommon/DSPool');

DSList = require('../../src/app/dscommon/DSList');

describe('160 DSList', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('populate', function() {
    var E, e1, e1b, e2, e3, e3b, e5b, list, owner, pool, tmp;
    owner = {
      name: 'owner'
    };
    E = (function(superClass) {
      extend(E, superClass);

      function E() {
        return E.__super__.constructor.apply(this, arguments);
      }

      E.begin('E');

      E.propNum('num', 0);

      E.end();

      return E;

    })(DSObject);
    pool = new DSPool(owner, 'poolA', E);
    list = new DSList(owner, 'listA', E);
    tmp = [e1 = pool.find(owner, '1'), e2 = pool.find(owner, '2'), e3 = pool.find(owner, '3')];
    list.merge(owner, tmp);
    expect(e1.$ds_ref).toBe(1);
    expect(e2.$ds_ref).toBe(1);
    expect(e3.$ds_ref).toBe(1);
    tmp = [e1b = pool.find(owner, '1'), e3b = pool.find(owner, '3'), e5b = pool.find(owner, '5')];
    list.merge(owner, tmp);
    expect(e1.$ds_ref).toBe(1);
    expect(e1).toBe(e1b);
    expect(e2.$ds_ref).toBe(0);
    expect(e3.$ds_ref).toBe(1);
    expect(e3).toBe(e3b);
    expect(e5b.$ds_ref).toBe(1);
    list.release(owner);
    expect(e1.$ds_ref).toBe(0);
    expect(e3.$ds_ref).toBe(0);
    expect(e5b.$ds_ref).toBe(0);
    return pool.release(owner);
  });
});



},{"../../src/app/dscommon/DSList":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSList.coffee","../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\170 DSDocument.coffee":[function(require,module,exports){
var DSChangesBase, DSDocument, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('170 DSDocument', function() {
  var TestData, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  TestDoc = (function(superClass) {
    extend(TestDoc, superClass);

    function TestDoc() {
      return TestDoc.__super__.constructor.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.propStr('name');

    TestDoc.propBool('deleted', false);

    TestDoc.end();

    return TestDoc;

  })(DSDocument);
  TestData = (function(superClass) {
    extend(TestData, superClass);

    function TestData() {
      return TestData.__super__.constructor.apply(this, arguments);
    }

    TestData.begin('TestData');

    TestData.propSet('items', TestDoc.Editable);

    TestData.end();

    return TestData;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, edtDoc, hist, set, srvDoc;
    changes = new TestData(owner, 'changes', {});
    hist = changes.get('hist');
    set = changes.get('itemsSet');
    srvDoc = new TestDoc(owner, 'srvDoc', set);
    srvDoc.set('name', 'doc1');
    expect(_.size(set.items)).toBe(0);
    if (typeof (base = (edtDoc = new TestDoc.Editable(owner, srvDoc.$ds_key))).init === "function") {
      base.init(srvDoc, set);
    }
    expect(srvDoc.$ds_ref).toBe(2);
    expect(_.size(set.items)).toBe(0);
    srvDoc.release(owner);
    expect(srvDoc.$ds_ref).toBe(1);
    expect(edtDoc.get('name')).toBe('doc1');
    expect(edtDoc.get('deleted')).toBe(false);
    expect(_.size(set.items)).toBe(0);
    edtDoc.set('name', 'newName');
    expect(_.size(set.items)).toBe(1);
    expect(srvDoc.get('name')).toBe('doc1');
    expect(edtDoc.get('name')).toBe('newName');
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }
    ]);
    expect(hist.histTop).toBe(1);
    edtDoc.set('deleted', true);
    expect(_.size(set.items)).toBe(1);
    expect(srvDoc.get('deleted')).toBe(false);
    expect(edtDoc.get('name')).toBe('newName');
    expect(edtDoc.__change).toEqual({
      name: {
        v: 'newName',
        s: 'doc1'
      },
      deleted: {
        v: true,
        s: false
      }
    });
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }
    ]);
    expect(hist.histTop).toBe(2);
    edtDoc.set('deleted', false);
    edtDoc.set('name', 'doc1');
    expect(_.size(set.items)).toBe(0);
    expect(edtDoc.__change).toBeUndefined();
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'deleted',
        o: true,
        n: void 0
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: void 0
      }
    ]);
    expect(hist.histTop).toBe(4);
    expect(hist.hasUndo()).toBeTruthy();
    expect(hist.hasRedo()).toBeFalsy();
    hist.undo();
    expect(hist.hasUndo()).toBeTruthy();
    expect(hist.hasRedo()).toBeTruthy();
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'deleted',
        o: true,
        n: void 0
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: void 0
      }
    ]);
    expect(hist.histTop).toBe(3);
    hist.redo();
    expect(hist.hasUndo()).toBeTruthy();
    expect(hist.hasRedo()).toBeFalsy();
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'deleted',
        o: true,
        n: void 0
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: void 0
      }
    ]);
    expect(hist.histTop).toBe(4);
    hist.undo();
    hist.undo();
    hist.undo();
    expect(_.size(set.items)).toBe(1);
    expect(edtDoc.$ds_ref).toBe(6);
    hist.undo();
    expect(_.size(set.items)).toBe(0);
    expect(edtDoc.$ds_ref).toBe(5);
    expect(hist.hasUndo()).toBeFalsy();
    expect(hist.hasRedo()).toBeTruthy();
    hist.redo();
    hist.redo();
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'deleted',
        o: true,
        n: void 0
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: void 0
      }
    ]);
    expect(hist.histTop).toBe(2);
    expect(_.size(set.items)).toBe(1);
    expect(edtDoc.$ds_ref).toBe(6);
    edtDoc.set('name', 'name2');
    expect(hist.histTop).toBe(3);
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: 'name2'
      }
    ]);
    expect(_.size(set.items)).toBe(1);
    expect(edtDoc.$ds_ref).toBe(5);
    edtDoc.release(owner);
    expect(edtDoc.$ds_ref).toBe(4);
    expect(srvDoc.$ds_ref).toBe(1);
    changes.reset();
    expect(edtDoc.$ds_ref).toBe(0);
    expect(srvDoc.$ds_ref).toBe(0);
    return changes.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\172 DSDocument.serverChanges.coffee":[function(require,module,exports){
var DSChangesBase, DSDocument, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('172 DSDocument.serverChanges', function() {
  var Changes, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  TestDoc = (function(superClass) {
    extend(TestDoc, superClass);

    function TestDoc() {
      return TestDoc.__super__.constructor.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.propStr('name');

    TestDoc.propNum('num', 0);

    TestDoc.propBool('deleted', false);

    TestDoc.end();

    return TestDoc;

  })(DSDocument);
  Changes = (function(superClass) {
    extend(Changes, superClass);

    function Changes() {
      return Changes.__super__.constructor.apply(this, arguments);
    }

    Changes.begin('Changes');

    Changes.propSet('items', TestDoc.Editable);

    Changes.end();

    return Changes;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, edtDoc, hist, set, srvDoc;
    changes = new Changes(owner, 'changes', {});
    hist = changes.get('hist');
    set = changes.get('itemsSet');
    srvDoc = new TestDoc(owner, 'srvDoc', set);
    srvDoc.set('name', 'doc1');
    if (typeof (base = (edtDoc = new TestDoc.Editable(owner, srvDoc.$ds_key))).init === "function") {
      base.init(srvDoc, set);
    }
    edtDoc.set('name', 'newName');
    edtDoc.set('name', 'anotherName');
    edtDoc.set('name', 'newName');
    edtDoc.set('deleted', true);
    edtDoc.set('num', 10);
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: 'anotherName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'anotherName',
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'deleted',
        o: void 0,
        n: true
      }, {
        i: edtDoc,
        p: 'num',
        o: void 0,
        n: 10
      }
    ]);
    expect(hist.histTop).toBe(5);
    srvDoc.set('name', 'newName');
    srvDoc.set('deleted', true);
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: 'anotherName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'anotherName',
        n: void 0
      }, {
        i: edtDoc,
        p: 'num',
        o: void 0,
        n: 10
      }
    ]);
    expect(hist.histTop).toBe(4);
    expect(_.size(set.items)).toBe(1);
    srvDoc.set('num', 10);
    expect(hist.hist).toEqual([
      {
        i: edtDoc,
        p: 'name',
        o: void 0,
        n: 'newName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'newName',
        n: 'anotherName'
      }, {
        i: edtDoc,
        p: 'name',
        o: 'anotherName',
        n: void 0
      }
    ]);
    expect(hist.histTop).toBe(3);
    expect(_.size(set.items)).toBe(0);
    srvDoc.release(owner);
    edtDoc.release(owner);
    return changes.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\174 DSDocument.DSDocumentValues.coffee":[function(require,module,exports){
var DSChangesBase, DSDocument, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('174 DSDocument.DSDocumentValues', function() {
  var Changes, SomeDoc, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  SomeDoc = (function(superClass) {
    extend(SomeDoc, superClass);

    function SomeDoc() {
      return SomeDoc.__super__.constructor.apply(this, arguments);
    }

    SomeDoc.begin('SomeDoc');

    SomeDoc.end();

    return SomeDoc;

  })(DSDocument);
  TestDoc = (function(superClass) {
    extend(TestDoc, superClass);

    function TestDoc() {
      return TestDoc.__super__.constructor.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.propDoc('docA', SomeDoc);

    TestDoc.propDoc('docB', SomeDoc);

    TestDoc.end();

    return TestDoc;

  })(DSDocument);
  Changes = (function(superClass) {
    extend(Changes, superClass);

    function Changes() {
      return Changes.__super__.constructor.apply(this, arguments);
    }

    Changes.begin('Changes');

    Changes.propSet('items', TestDoc.Editable);

    Changes.end();

    return Changes;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, doc1, doc2, doc3, edtDoc1, hist, set, srvDoc1;
    changes = new Changes(owner, 'changes', {});
    hist = changes.get('hist');
    set = changes.get('itemsSet');
    doc1 = new SomeDoc(owner, 'doc1');
    doc2 = new SomeDoc(owner, 'doc2');
    doc3 = new SomeDoc(owner, 'doc3');
    srvDoc1 = new TestDoc(owner, 'edtDoc1Srv');
    if (typeof (base = (edtDoc1 = new TestDoc.Editable(owner, srvDoc1.$ds_key))).init === "function") {
      base.init(srvDoc1, set);
    }
    edtDoc1.set('docA', doc1);
    expect(doc1.$ds_ref).toBe(3);
    edtDoc1.set('docB', doc1);
    expect(doc1.$ds_ref).toBe(5);
    edtDoc1.set('docA', doc2);
    expect(doc1.$ds_ref).toBe(5);
    expect(doc2.$ds_ref).toBe(3);
    hist.startReset();
    hist.endReset();
    expect(doc1.$ds_ref).toBe(2);
    edtDoc1.set('docA', doc1);
    expect(doc1.$ds_ref).toBe(4);
    srvDoc1.set('docA', doc1);
    expect(doc1.$ds_ref).toBe(3);
    srvDoc1.release(owner);
    edtDoc1.release(owner);
    doc1.release(owner);
    doc2.release(owner);
    doc3.release(owner);
    return changes.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\180 DSDataEdited.coffee":[function(require,module,exports){
var DSChangesBase, DSData, DSDataEditable, DSDocument, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSPool = require('../../src/app/dscommon/DSPool');

DSData = require('../../src/app/dscommon/DSData');

DSDataEditable = require('../../src/app/dscommon/DSDataEditable');

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('180 DSDataEdited', function() {
  var Changes, ServerData, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  TestDoc = (function(superClass) {
    extend(TestDoc, superClass);

    function TestDoc() {
      return TestDoc.__super__.constructor.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.addPool();

    TestDoc.propNum('num', 0);

    TestDoc.end();

    return TestDoc;

  })(DSDocument);
  ServerData = (function(superClass) {
    extend(ServerData, superClass);

    function ServerData() {
      return ServerData.__super__.constructor.apply(this, arguments);
    }

    ServerData.begin('ServerData');

    ServerData.noCache();

    ServerData.propSet('items', TestDoc);

    ServerData.end();

    return ServerData;

  })(DSData);
  Changes = (function(superClass) {
    extend(Changes, superClass);

    function Changes() {
      return Changes.__super__.constructor.apply(this, arguments);
    }

    Changes.begin('TestData');

    Changes.propSet('items', TestDoc.Editable);

    Changes.end();

    return Changes;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, dataEditable, doc1, doc1Editable, doc2, doc2Editable, doc3, doc3Editable, serverData;
    serverData = new ServerData(owner, 'serverData', {});
    serverData.set('status', 'ready');
    changes = new Changes(owner, 'changes');
    changes.set('status', 'ready');
    if (typeof (base = (dataEditable = new (DSDataEditable(changes.itemsSet.type))(owner, 'editedData', {
      from: 10,
      to: 20
    }))).init === "function") {
      base.init(serverData.itemsSet, changes.itemsSet, (function(v) {
        var ref;
        return (this.params.from <= (ref = v.get('num')) && ref < this.params.to);
      }));
    }
    doc1 = TestDoc.pool.find(owner, 'doc1');
    doc1.set('num', 10);
    doc2 = TestDoc.pool.find(owner, 'doc2');
    doc2.set('num', 5);
    doc3 = TestDoc.pool.find(owner, 'doc3');
    doc3.set('num', 15);
    serverData.itemsSet.add(owner, doc1);
    serverData.itemsSet.add(owner, doc2);
    serverData.itemsSet.add(owner, doc3);
    serverData.itemsSet.status = 'ready';
    expect(_.size(dataEditable.items)).toBe(3);
    expect(doc1Editable = dataEditable.items['doc1']).toBeDefined();
    expect(doc2Editable = dataEditable.items['doc2']).toBeDefined();
    expect(doc3Editable = dataEditable.items['doc3']).toBeDefined();
    doc2Editable.set('num', 12);
    expect(_.size(dataEditable.items)).toBe(3);
    expect(_.size(changes.items)).toBe(1);
    doc3Editable.set('num', 18);
    expect(_.size(dataEditable.items)).toBe(3);
    expect(_.size(changes.items)).toBe(2);
    serverData.itemsSet.remove(doc2);
    expect(_.size(dataEditable.items)).toBe(3);
    expect(_.size(changes.items)).toBe(2);
    doc2Editable.set('num', 25);
    expect(_.size(dataEditable.items)).toBe(2);
    expect(_.size(changes.items)).toBe(2);
    doc3.set('num', 18);
    expect(_.size(dataEditable.items)).toBe(2);
    expect(_.size(changes.items)).toBe(1);
    dataEditable.release(owner);
    serverData.release(owner);
    return changes.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\190 DSChanges.coffee":[function(require,module,exports){
var DSChangesBase, DSData, DSDataEditable, DSDocument, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSPool = require('../../src/app/dscommon/DSPool');

DSData = require('../../src/app/dscommon/DSData');

DSDataEditable = require('../../src/app/dscommon/DSDataEditable');

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('190 DSChanges', function() {
  var Changes, ServerData, TestDoc, owner;
  owner = {
    name: 'owner'
  };
  TestDoc = (function(superClass) {
    extend(TestDoc, superClass);

    function TestDoc() {
      return TestDoc.__super__.constructor.apply(this, arguments);
    }

    TestDoc.begin('TestDoc');

    TestDoc.addPool();

    TestDoc.propNum('num', 0);

    TestDoc.propStr('str', '');

    TestDoc.end();

    return TestDoc;

  })(DSDocument);
  ServerData = (function(superClass) {
    extend(ServerData, superClass);

    function ServerData() {
      return ServerData.__super__.constructor.apply(this, arguments);
    }

    ServerData.begin('ServerData');

    ServerData.noCache();

    ServerData.propSet('items', TestDoc);

    ServerData.end();

    return ServerData;

  })(DSData);
  Changes = (function(superClass) {
    extend(Changes, superClass);

    function Changes() {
      return Changes.__super__.constructor.apply(this, arguments);
    }

    Changes.begin('TestData');

    Changes.propSet('items', TestDoc.Editable);

    Changes.end();

    return Changes;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, dataEditable, doc1, doc1Editable, doc2, doc2Editable, doc3, doc3Editable, serverData;
    serverData = new ServerData(owner, 'serverData', {});
    changes = new Changes(owner, 'changes');
    changes.itemsSet.status = 'ready';
    if (typeof (base = (dataEditable = new (DSDataEditable(changes.itemsSet.type))(owner, 'editedData', {
      from: 10,
      to: 20
    }))).init === "function") {
      base.init(serverData.itemsSet, changes.itemsSet, (function(v) {
        var ref;
        return (this.params.from <= (ref = v.get('num')) && ref < this.params.to);
      }));
    }
    doc1 = TestDoc.pool.find(owner, 'doc1');
    doc1.set('num', 10);
    doc2 = TestDoc.pool.find(owner, 'doc2');
    doc2.set('num', 5);
    doc3 = TestDoc.pool.find(owner, 'doc3');
    doc3.set('num', 15);
    serverData.itemsSet.add(owner, doc1);
    serverData.itemsSet.add(owner, doc2);
    serverData.itemsSet.add(owner, doc3);
    serverData.itemsSet.status = 'ready';
    expect(_.size(dataEditable.items)).toBe(3);
    expect(doc1Editable = dataEditable.items['doc1']).toBeDefined();
    expect(doc2Editable = dataEditable.items['doc2']).toBeDefined();
    expect(doc3Editable = dataEditable.items['doc3']).toBeDefined();
    doc2Editable.set('num', 17);
    expect(doc2Editable.__change).toEqual({
      num: {
        s: 5,
        v: 17
      }
    });
    doc2Editable.set('str', 'AString');
    expect(doc2Editable.__change).toEqual({
      num: {
        s: 5,
        v: 17
      },
      str: {
        s: '',
        v: 'AString'
      }
    });
    doc1Editable.set('num', 20);
    expect(doc1Editable.__change).toEqual({
      num: {
        s: 10,
        v: 20
      }
    });
    expect(doc2Editable.__change).toEqual({
      num: {
        s: 5,
        v: 17
      },
      str: {
        s: '',
        v: 'AString'
      }
    });
    doc2Editable.set('str', '');
    doc2.set('num', 17);
    doc1Editable.set('num', 10);
    expect(doc1Editable.__change).not.toBeDefined();
    expect(doc2Editable.__change).not.toBeDefined();
    serverData.release(owner);
    changes.release(owner);
    return dataEditable.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\100 Basic\\192 DSChanges.persistAndRestore.coffee":[function(require,module,exports){
var DSChangesBase, DSData, DSDataEditable, DSDocument, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSPool = require('../../src/app/dscommon/DSPool');

DSData = require('../../src/app/dscommon/DSData');

DSDataEditable = require('../../src/app/dscommon/DSDataEditable');

DSDocument = require('../../src/app/dscommon/DSDocument');

DSSet = require('../../src/app/dscommon/DSSet');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('192 DSChanges.persistAndRestore', function() {
  var Changes, ServerData, TestPerson, TestTask, owner;
  owner = {
    name: 'owner'
  };
  TestPerson = (function(superClass) {
    extend(TestPerson, superClass);

    function TestPerson() {
      return TestPerson.__super__.constructor.apply(this, arguments);
    }

    TestPerson.begin('TestPerson');

    TestPerson.propStr('name', '');

    TestPerson.end();

    return TestPerson;

  })(DSDocument);
  TestTask = (function(superClass) {
    extend(TestTask, superClass);

    function TestTask() {
      return TestTask.__super__.constructor.apply(this, arguments);
    }

    TestTask.begin('TestTask');

    TestTask.addPool();

    TestTask.propStr('title', '');

    TestTask.propMoment('duedate');

    TestTask.propDuration('estimate');

    TestTask.propDoc('resposible', TestPerson);

    TestTask.end();

    return TestTask;

  })(DSDocument);
  ServerData = (function(superClass) {
    extend(ServerData, superClass);

    function ServerData() {
      return ServerData.__super__.constructor.apply(this, arguments);
    }

    ServerData.begin('ServerData');

    ServerData.noCache();

    ServerData.propSet('tasks', TestTask);

    ServerData.end();

    return ServerData;

  })(DSData);
  Changes = (function(superClass) {
    extend(Changes, superClass);

    function Changes() {
      return Changes.__super__.constructor.apply(this, arguments);
    }

    Changes.begin('TestData');

    Changes.propSet('tasks', TestTask.Editable);

    Changes.end();

    return Changes;

  })(DSChangesBase);
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease())).toBe(0);
    }
  }));
  return it('general', function() {
    var base, changes, chg, dataEditable, map, poolEditable, serverData, task1, task1Edited, task2, task2Edited, testPerson;
    poolEditable = new DSPool(owner, 'poolEditable', TestTask.Editable);
    serverData = new ServerData(owner, 'serverData', {});
    changes = new Changes(owner, 'changes');
    changes.tasksSet.status = 'ready';
    if (typeof (base = (dataEditable = new (DSDataEditable(changes.tasksSet.type))(owner, 'dataEditable', {}))).init === "function") {
      base.init(serverData.tasksSet, changes.tasksSet);
    }
    testPerson = new TestPerson(owner, 'testPerson');
    map = {};
    task1 = TestTask.pool.find(owner, 'task1', map);
    task1.set('title', 'task1');
    task1.set('duedate', moment('2015-01-10'));
    task1.set('estimate', moment.duration('1h'));
    task1.set('resposible', testPerson);
    task2 = TestTask.pool.find(owner, 'task2', map);
    task2.set('title', 'task2');
    task2.set('duedate', null);
    task2.set('estimate', null);
    task2.set('resposible', null);
    serverData.tasksSet.merge(owner, map);
    serverData.tasksSet.status = 'ready';
    expect(task1Edited = changes.tasksSet.$ds_pool.items[task1.$ds_key]).toBeDefined();
    task1Edited.set('title', 'task1bis');
    task1Edited.set('duedate', null);
    task1Edited.set('estimate', null);
    task1Edited.set('resposible', null);
    expect(task2Edited = changes.tasksSet.$ds_pool.items[task2.$ds_key]).toBeDefined();
    task2Edited.set('duedate', moment('2015-02-01'));
    task2Edited.set('estimate', moment.duration('15h'));
    task2Edited.set('resposible', testPerson);
    console.info('changes: ', map = changes.changesToMap());
    console.info('back: ', chg = changes.mapToChanges(map));
    poolEditable.release(owner);
    serverData.release(owner);
    changes.release(owner);
    dataEditable.release(owner);
    return testPerson.release(owner);
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../../src/app/dscommon/DSDocument":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDocument.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\210 View.coffee":[function(require,module,exports){
var DSData, DSObject, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

DSPool = require('../../src/app/dscommon/DSPool');

DSSet = require('../../src/app/dscommon/DSSet');

DSData = require('../../src/app/dscommon/DSData');

describe('210 View', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease)).toBe(0);
    }
  }));
  return it('react on data load and changes', function() {
    var Model, ModelData, owner;
    owner = {
      name: 'owner'
    };
    Model = (function(superClass) {
      extend(Model, superClass);

      function Model() {
        return Model.__super__.constructor.apply(this, arguments);
      }

      Model.begin('Model');

      Model.addPool();

      Model.propStr('text');

      Model.propNum('num', 0);

      Model.end();

      return Model;

    })(DSObject);
    ModelData = (function(superClass) {
      extend(ModelData, superClass);

      function ModelData() {
        return ModelData.__super__.constructor.apply(this, arguments);
      }

      ModelData.begin('TestData');

      ModelData.noCache();

      ModelData.propSet('items', Model);

      ModelData.end();

      return ModelData;

    })(DSData);
    angular.mock.module(require('../../src/app/dscommon/DSView'));
    angular.mock.module((function($provide) {
      $provide.factory('dsDataService', (function() {
        var data, dataCounter, set;
        data = new ModelData(owner, 'data', {});
        dataCounter = 0;
        return {
          _dataCounter: (function() {
            return dataCounter;
          }),
          _data: data,
          _set: set = data.get('itemsSet'),
          _load: (function() {
            var map;
            map = {};
            (Model.pool.find(owner, '1', map)).set('text', 'element1');
            (Model.pool.find(owner, '2', map)).set('text', 'element2');
            set.merge(owner, map);
            set.set('status', 'ready');
          }),
          _change1: (function() {
            var k, newMap, v;
            newMap = _.clone(set.items);
            for (k in newMap) {
              v = newMap[k];
              v.addRef(owner);
            }
            (Model.pool.find(owner, '3', newMap)).set('text', 'element3');
            set.merge(owner, newMap);
          }),
          _change2: (function() {
            var k, newMap, v;
            newMap = _.clone(set.items);
            delete newMap['2'];
            for (k in newMap) {
              v = newMap[k];
              v.addRef(owner);
            }
            set.merge(owner, newMap);
          }),
          _change3: (function() {
            _.clone(set.items['1'].set('text', 'element1bis'));
          }),
          _change4: (function() {
            _.clone(set.items['1'].set('num', 1));
          }),
          requestSources: (function(owner, params, sources) {
            sources.models.newSet = set;
            set.addRef(owner);
            dataCounter += 1;
          })
        };
      }));
    }));
    return inject(function(DSView, dsDataService, $rootScope, $httpBackend) {
      var $scope, TestView, render, view;
      $httpBackend.expectGET('data/people.json').respond('{}');
      TestView = (function(superClass) {
        extend(TestView, superClass);

        function TestView() {
          return TestView.__super__.constructor.apply(this, arguments);
        }

        TestView.begin('TestView');

        TestView.propData('models', Model, {
          watch: ['text']
        });

        TestView.end();

        return TestView;

      })(DSView);
      view = new TestView($scope = $rootScope.$new(false, $rootScope), 'view');
      view.render = (render = jasmine.createSpy());
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(0);
      view.dataUpdate();
      $rootScope.$digest();
      expect(view.data.get('models')).toBe(dsDataService._set.items);
      expect(view.dataStatus).toBe('nodata');
      expect(render.calls.count()).toEqual(1);
      dsDataService._load();
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(2);
      expect(view.dataStatus).toBe('ready');
      dsDataService._change1();
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(3);
      dsDataService._change2();
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(4);
      dsDataService._change3();
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(5);
      dsDataService._change4();
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(5);
      $scope.$destroy();
      expect(view.$ds_ref).toBe(0);
      return dsDataService._data.release(owner);
    });
  });
});



},{"../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","../../src/app/dscommon/DSView":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSView.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\220 View.IntegratedStatus.coffee":[function(require,module,exports){
var DSData, DSObject, DSPool, DSSet,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../src/app/dscommon/DSObject');

DSPool = require('../../src/app/dscommon/DSPool');

DSSet = require('../../src/app/dscommon/DSSet');

DSData = require('../../src/app/dscommon/DSData');

describe('220 View.IntegratedStatus', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease)).toBe(0);
    }
  }));
  return it('react on data load and changes', function() {
    var Model, ModelData, owner;
    owner = {
      name: 'owner'
    };
    Model = (function(superClass) {
      extend(Model, superClass);

      function Model() {
        return Model.__super__.constructor.apply(this, arguments);
      }

      Model.begin('Model');

      Model.addPool();

      Model.propStr('text');

      Model.end();

      return Model;

    })(DSObject);
    ModelData = (function(superClass) {
      extend(ModelData, superClass);

      function ModelData() {
        return ModelData.__super__.constructor.apply(this, arguments);
      }

      ModelData.begin('TestData');

      ModelData.noCache();

      ModelData.propSet('set1', Model);

      ModelData.propSet('set2', Model);

      ModelData.propSet('set3', Model);

      ModelData.end();

      return ModelData;

    })(DSData);
    angular.mock.module(require('../../src/app/dscommon/DSView'));
    angular.mock.module((function($provide) {
      $provide.factory('dsDataService', (function() {
        var data, dataCounter, set1, set2, set3;
        data = new ModelData(owner, 'data', {});
        dataCounter = 0;
        return {
          _dataCounter: (function() {
            return dataCounter;
          }),
          _data: data,
          _set1: set1 = data.get('set1Set'),
          _set2: set2 = data.get('set2Set'),
          _set3: set3 = data.get('set3Set'),
          _setStatus: (function(set1Status, set2Status, set3Status) {
            set1.set('status', set1Status);
            set2.set('status', set2Status);
            set3.set('status', set3Status);
          }),
          requestSources: (function(owner, params, sources) {
            sources.models1.newSet = set1;
            set1.addRef(owner);
            sources.models2.newSet = set2;
            set2.addRef(owner);
            sources.models3.newSet = set3;
            set3.addRef(owner);
            dataCounter += 3;
          })
        };
      }));
    }));
    return inject(function(DSView, dsDataService, $rootScope, $httpBackend) {
      var $scope, TestView, render, view;
      $httpBackend.expectGET('data/people.json').respond('{}');
      TestView = (function(superClass) {
        extend(TestView, superClass);

        function TestView() {
          return TestView.__super__.constructor.apply(this, arguments);
        }

        TestView.begin('TestView');

        TestView.propData('models1', Model);

        TestView.propData('models2', Model);

        TestView.propData('models3', Model);

        TestView.end();

        return TestView;

      })(DSView);
      view = new TestView($scope = $rootScope.$new(false, $rootScope), 'view');
      view.render = (render = jasmine.createSpy());
      $rootScope.$digest();
      expect(render.calls.count()).toEqual(0);
      view.dataUpdate();
      expect(dsDataService._dataCounter()).toBe(3);
      $rootScope.$digest();
      expect(view.dataStatus).toBe('nodata');
      dsDataService._set1.set('status', 'update');
      dsDataService._set2.set('status', 'ready');
      dsDataService._set3.set('status', 'nodata');
      $rootScope.$digest();
      expect(view.dataStatus).toBe('nodata');
      dsDataService._set3.set('status', 'ready');
      $rootScope.$digest();
      expect(view.dataStatus).toBe('update');
      dsDataService._set1.set('status', 'ready');
      $rootScope.$digest();
      expect(view.dataStatus).toBe('ready');
      $scope.$destroy();
      $rootScope.$digest();
      expect(view.$ds_ref).toBe(0);
      return dsDataService._data.release(owner);
    });
  });
});



},{"../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSObject":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSObject.coffee","../../src/app/dscommon/DSPool":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSPool.coffee","../../src/app/dscommon/DSSet":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSSet.coffee","../../src/app/dscommon/DSView":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSView.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\200 Views\\230 ViewChanges.coffee":[function(require,module,exports){
var DSChangesBase, DSData, DSDataEditable, Task, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

serviceOwner = require('../../src/app/dscommon/util').serviceOwner;

Task = require('../../src/app/models/Task');

DSData = require('../../src/app/dscommon/DSData');

DSDataEditable = require('../../src/app/dscommon/DSDataEditable');

DSChangesBase = require('../../src/app/dscommon/DSChangesBase');

describe('230 ViewChanges', function() {
  beforeEach((function() {
    if (window.totalRelease) {
      window.totalReleaseReset();
    }
  }));
  afterEach((function() {
    if (window.totalRelease) {
      expect(_.size(window.totalRelease)).toBe(0);
    }
  }));
  return it('check ViewChanges', function() {
    var Changes, ServerData, owner;
    owner = {
      name: 'owner'
    };
    ServerData = (function(superClass) {
      extend(ServerData, superClass);

      function ServerData() {
        return ServerData.__super__.constructor.apply(this, arguments);
      }

      ServerData.begin('ServerData');

      ServerData.propSet('tasks', Task);

      ServerData.end();

      return ServerData;

    })(DSData);
    Changes = (function(superClass) {
      extend(Changes, superClass);

      function Changes() {
        return Changes.__super__.constructor.apply(this, arguments);
      }

      Changes.begin('TestData');

      Changes.propSet('tasks', Task.Editable);

      Changes.end();

      return Changes;

    })(DSChangesBase);
    angular.mock.module(require('../../src/app/ui/views/changes/ViewChanges'));
    angular.mock.module((function($provide) {
      $provide.factory('dsDataService', (function() {
        return {
          requestSources: (function(referry, params, sources) {
            var base, changes, dataEditable, serverData, set, task1, task1Editable, task2, task2Editable;
            console.info('requestSources');
            serviceOwner.add(serverData = new ServerData(serviceOwner, 'serverData', {}));
            serviceOwner.add(changes = new Changes(serviceOwner, 'changes'));
            set = {};
            task1 = Task.pool.find(owner, '111', set);
            task1.set('duedate', moment('2015-02-14'));
            task1.set('estimate', moment.duration(2, 'h'));
            task2 = Task.pool.find(owner, '222', set);
            task2.set('duedate', moment('2015-02-14'));
            task2.set('estimate', moment.duration(2, 'h'));
            serverData.get('tasksSet').merge(owner, set);
            serverData.get('tasksSet').set('status', 'ready');
            changes.get('tasksSet').set('status', 'ready');
            if (typeof (base = (dataEditable = new (DSDataEditable(changes.tasksSet.type))(serviceOwner, 'editedData', {}))).init === "function") {
              base.init(serverData.tasksSet, changes.tasksSet);
            }
            serviceOwner.add(dataEditable);
            expect(task1Editable = dataEditable.get('items')['111']).toBeDefined();
            task1Editable.set('estimate', moment.duration(1, 'd'));
            expect(task2Editable = dataEditable.get('items')['222']).toBeDefined();
            task2Editable.set('duedate', moment('2015-03-01'));
            task2Editable.set('estimate', moment.duration(15, 'min'));
            (sources.tasks.newSet = changes.get('tasksSet')).addRef(referry);
          })
        };
      }));
    }));
    return inject(function(ViewChanges, $rootScope, $httpBackend) {
      var $scope, task1, task2, tasks, view;
      $httpBackend.expectGET('data/people.json').respond('{}');
      view = new ViewChanges($scope = $rootScope.$new(false, $rootScope), 'view');
      $rootScope.$digest();
      expect(_.size(tasks = view.get('data').get('tasks'))).toBe(2);
      expect(task1 = tasks['111']).toBeDefined();
      expect(task2 = tasks['222']).toBeDefined();
      expect(view.get('changes').length).toBe(3);
      return $scope.$destroy();
    });
  });
});



},{"../../src/app/dscommon/DSChangesBase":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSChangesBase.coffee","../../src/app/dscommon/DSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSData.coffee","../../src/app/dscommon/DSDataEditable":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\DSDataEditable.coffee","../../src/app/dscommon/util":"C:\\SVN\\_WebProfyManagement\\src\\app\\dscommon\\util.coffee","../../src/app/models/Task":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\Task.coffee","../../src/app/ui/views/changes/ViewChanges":"C:\\SVN\\_WebProfyManagement\\src\\app\\ui\\views\\changes\\ViewChanges.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\300 TaskSplit\\310 TaskSplit.coffee":[function(require,module,exports){
var TaskSplit;

TaskSplit = require('../../src/app/models/types/TaskSplit');

describe('310 TaskSplit', function() {
  return it('general', function() {
    var clone, duedate, duedateShifted, taskSplit;
    taskSplit = new TaskSplit();
    duedate = moment('2015-03-04');
    duedateShifted = moment('2015-03-06');
    taskSplit.set(duedate, moment('2015-03-03'), moment.duration(2, 'h'));
    taskSplit.set(duedate, moment('2015-03-05'), moment.duration(3, 'h'));
    taskSplit.set(duedate, moment('2015-03-06'), moment.duration(4, 'h'));
    expect(taskSplit.get(duedate, moment('2015-03-02'))).toBeNull();
    expect(taskSplit.get(duedate, moment('2015-03-03'))).toEqual(moment.duration(2, 'h'));
    expect(taskSplit.get(duedate, moment('2015-03-04'))).toBeNull();
    expect(taskSplit.get(duedate, moment('2015-03-05'))).toEqual(moment.duration(3, 'h'));
    expect(taskSplit.get(duedate, moment('2015-03-06'))).toEqual(moment.duration(4, 'h'));
    expect(taskSplit.get(duedate, moment('2015-03-07'))).toBeNull();
    expect(taskSplit.get(duedateShifted, moment('2015-03-04'))).toBeNull();
    expect(taskSplit.get(duedateShifted, moment('2015-03-05'))).toEqual(moment.duration(2, 'h'));
    expect(taskSplit.get(duedateShifted, moment('2015-03-06'))).toBeNull();
    expect(taskSplit.get(duedateShifted, moment('2015-03-07'))).toEqual(moment.duration(3, 'h'));
    expect(taskSplit.get(duedateShifted, moment('2015-03-08'))).toEqual(moment.duration(4, 'h'));
    expect(taskSplit.get(duedateShifted, moment('2015-03-09'))).toBeNull();
    expect(taskSplit.total).toEqual(moment.duration(9, 'h'));
    expect(taskSplit.get(duedate, moment('2015-03-03'))).toEqual(moment.duration(2, 'h'));
    expect(taskSplit.firstDate(duedate).valueOf()).toBe(moment('2015-03-03').valueOf());
    expect(taskSplit.lastDate(duedate).valueOf()).toBe(moment('2015-03-06').valueOf());
    clone = taskSplit.clone();
    expect(clone).toEqual(taskSplit);
    expect(taskSplit.valueOf()).toEqual([moment.duration(moment('2015-03-03').diff(duedate)).asDays(), moment.duration(2, 'h').asMinutes(), moment.duration(moment('2015-03-05').diff(duedate)).asDays(), moment.duration(3, 'h').asMinutes(), moment.duration(moment('2015-03-06').diff(duedate)).asDays(), moment.duration(4, 'h').asMinutes()]);
    expect((new TaskSplit(taskSplit.valueOf())).valueOf()).toEqual(taskSplit.valueOf());
    taskSplit.set(duedate, moment('2015-03-03'), moment.duration(0));
    taskSplit.set(duedate, moment('2015-03-06'), null);
    expect(taskSplit.firstDate(duedate).format()).toEqual(moment('2015-03-05').format());
    expect(taskSplit.lastDate(duedate).format()).toEqual(moment('2015-03-05').format());
    expect(taskSplit.firstDate(duedateShifted).format()).toEqual(moment('2015-03-07').format());
    expect(taskSplit.lastDate(duedateShifted).format()).toEqual(moment('2015-03-07').format());
    expect(clone).not.toEqual(taskSplit);
    expect(taskSplit.total).toEqual(moment.duration(3, 'h'));
    expect(taskSplit.firstDate(duedate).startOf('week').valueOf()).toBe(moment('2015-03-02').valueOf());
    expect(taskSplit.lastDate(duedate).endOf('week').valueOf()).toBe(moment('2015-03-08T23:59:59.999').valueOf());
    clone.shift(duedateShifted, duedate);
    expect(clone.get(duedateShifted, moment('2015-03-02'))).toBeNull();
    expect(clone.get(duedateShifted, moment('2015-03-03'))).toEqual(moment.duration(2, 'h'));
    expect(clone.get(duedateShifted, moment('2015-03-04'))).toBeNull();
    expect(clone.get(duedateShifted, moment('2015-03-05'))).toEqual(moment.duration(3, 'h'));
    expect(clone.get(duedateShifted, moment('2015-03-06'))).toEqual(moment.duration(4, 'h'));
    return expect(clone.get(duedateShifted, moment('2015-03-07'))).toBeNull();
  });
});



},{"../../src/app/models/types/TaskSplit":"C:\\SVN\\_WebProfyManagement\\src\\app\\models\\types\\TaskSplit.coffee"}],"C:\\SVN\\_WebProfyManagement\\test\\300 TaskSplit\\320 TaskSplitSaveData.coffee":[function(require,module,exports){
var RMSData;

RMSData = require('../../src/app/utils/RMSData');

describe('320 TaskSplitSaveData', function() {
  it('RMSData.get', function() {
    var badExampleEndMissing, badExampleJsonAfterEnd, badExampleNoJson, badExampleWrongJson, data, example, exampleNoEndText, exampleNoOtherText;
    example = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {\"a\":12} END\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(data = RMSData.get(example)).not.toBeNull();
    expect(data).toEqual({
      a: 12
    });
    exampleNoEndText = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {\"a\":12} END".replace(/\n/g, '\r\n');
    expect(data = RMSData.get(exampleNoEndText)).not.toBeNull();
    expect(data).toEqual({
      a: 12
    });
    exampleNoOtherText = "RMS Data (DO NOT CHANGE!) {\"a\":12} END".replace(/\n/g, '\r\n');
    expect(data = RMSData.get(exampleNoOtherText)).not.toBeNull();
    expect(data).toEqual({
      a: 12
    });
    badExampleWrongJson = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {a:12} END\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(RMSData.get(badExampleWrongJson)).toBeNull();
    badExampleNoJson = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) END\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(RMSData.get(badExampleNoJson)).toBeNull();
    badExampleJsonAfterEnd = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) END {\"a\":12}\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(RMSData.get(badExampleJsonAfterEnd)).toBeNull();
    badExampleEndMissing = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) END {\"a\":12}\n\nПродолжение".replace(/\n/g, '\r\n');
    return expect(RMSData.get(badExampleEndMissing)).toBeNull();
  });
  return it('RMSData.put', function() {
    var example, exampleEmptyDesc, exampleNoDescNoData, exampleNoEnd, exampleRMSDataOnly, exampleTextAfterJson;
    example = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {\"a\":12} END\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(RMSData.put(example, {
      t: false
    })).toBe("Описание задачи\nЕщё что-то\n\nПродолжение\n\nRMS Data (DO NOT CHANGE!) {\"t\":false} END".replace(/\n/g, '\r\n'));
    exampleEmptyDesc = '';
    expect(RMSData.put(exampleEmptyDesc, {
      t: false
    })).toBe('\n\nRMS Data (DO NOT CHANGE!) {"t":false} END'.replace(/\n/g, '\r\n'));
    exampleRMSDataOnly = 'RMS Data (DO NOT CHANGE!) {} END';
    expect(RMSData.put(exampleRMSDataOnly, {
      t: false
    })).toBe('\n\nRMS Data (DO NOT CHANGE!) {"t":false} END'.replace(/\n/g, '\r\n'));
    exampleNoDescNoData = '';
    expect(RMSData.put(exampleNoDescNoData, null)).toBe('');
    expect(RMSData.put(exampleNoDescNoData, {})).toBe('');
    exampleNoEnd = "Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {\"a\":12}\n\nПродолжение".replace(/\n/g, '\r\n');
    expect(RMSData.put(exampleNoEnd, {
      t: false
    })).toBe("Описание задачи\nЕщё что-то\n\nRMS Data (DO NOT CHANGE!) {\"t\":false} END".replace(/\n/g, '\r\n'));
    exampleTextAfterJson = "RMS Data (DO NOT CHANGE!) {\"a\":12}END\n\n\nОписание задачи\nЕщё что-то\n\nПродолжение".replace(/\n/g, '\r\n');
    return expect(RMSData.put(exampleTextAfterJson, {
      t: false
    })).toBe("Описание задачи\nЕщё что-то\n\nПродолжение\n\nRMS Data (DO NOT CHANGE!) {\"t\":false} END".replace(/\n/g, '\r\n'));
  });
});



},{"../../src/app/utils/RMSData":"C:\\SVN\\_WebProfyManagement\\src\\app\\utils\\RMSData.coffee"}]},{},["./test/test.coffee"]);
