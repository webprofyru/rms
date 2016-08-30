(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./ng-app');

moment.locale('ru');


},{"./ng-app":24}],2:[function(require,module,exports){
var DSObject, Person, VER_MAJOR, VER_MINOR, assert, ngModule, serviceOwner, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

validate = require('../dscommon/util').validate;

serviceOwner = require('../dscommon/util').serviceOwner;

DSObject = require('../dscommon/DSObject');

Person = require('./models/Person');

require('../utils/angular-local-storage.js');

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

VER_MAJOR = 1;

VER_MINOR = 1;

ngModule.factory('config', [
  '$http', 'localStorageService', (function($http, localStorageService) {
    var Config, config, desc, keepConnection, keepOtherOptions, name, ref, v, ver, verMajor, verMinor, verParts;
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

      Config.propCalc('hasTimeReports', (function() {
        return this.teamwork === 'http://teamwork.webprofy.ru/' || this.teamwork === 'http://delightsoft.teamworkpm.net/';
      }));

      Config.propConst('planTag', 'План');

      Config.propConst('teamleadRole', 'Teamlead');

      Config.propNum('hResizer');

      Config.propNum('vResizer');

      Config.propStr('currentUserId');

      Config.propDoc('currentUser', Person);

      Config.propCalc('canUserSetPlan', (function() {
        var ref, ref1;
        return ((ref = this.currentUser) != null ? (ref1 = ref.roles) != null ? ref1.get(this.teamleadRole) : void 0 : void 0) || this.teamwork === 'http://delightsoft.teamworkpm.net/';
      }));

      Config.propStr('selectedRole');

      Config.propNum('selectedCompany');

      Config.propNum('selectedLoad');

      Config.propNum('activeSidebarTab', 0);

      Config.propNum('refreshPeriod');

      Config.propNum('view3GroupByPerson', 0);

      Config.propNum('view3HidePeopleWOTasks', 0);

      Config.propStr('view3FilterByPerson', '');

      Config.propStr('view3FilterByProject', '');

      Config.propStr('view3FilterByTask', '');

      Config.propNum('histStart', -1);

      Config.onAnyPropChange((function(item, propName, newVal, oldVal) {
        if (propName === 'currentUserId' || propName === 'currentUser') {
          return;
        }
        if (propName === 'teamwork' || propName === 'token') {
          this.set('histStart', -1);
        }
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
    keepConnection = true;
    keepOtherOptions = true;
    verMajor = 1;
    verMinor = 0;
    if (typeof (ver = localStorageService.get('ver')) === 'string') {
      if ((verParts = ver.split('\.')).length = 2) {
        verMajor = parseInt(verParts[0]);
        verMinor = parseInt(verParts[1]);
      }
    }
    if (!(keepConnection = verMajor === VER_MAJOR)) {
      keepOtherOptions = false;
    } else {
      keepOtherOptions = verMinor === VER_MINOR;
    }
    if (!keepOtherOptions) {
      localStorageService.set('ver', VER_MAJOR + "." + VER_MINOR);
    }
    if (keepConnection) {
      ref = Config.prototype.__props;
      for (name in ref) {
        desc = ref[name];
        if (keepOtherOptions || name === 'teamwork' || name === 'token') {
          if (!desc.readonly && (v = localStorageService.get(name)) !== null) {
            config.set(name, v);
          }
        }
      }
    }
    return config;
  })
]);


},{"../dscommon/DSObject":60,"../dscommon/util":66,"../utils/angular-local-storage.js":67,"./models/Person":14}],3:[function(require,module,exports){
var DSData, DSDataServiceBase, DSDigest, DSSet, DSTags, Person, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/PeopleWithJson', [])).name;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSSet = require('../../dscommon/DSSet');

DSTags = require('../../dscommon/DSTags');

DSData = require('../../dscommon/DSData');

DSDigest = require('../../dscommon/DSDigest');

DSDataServiceBase = require('../../dscommon/DSDataServiceBase');

Person = require('../models/Person');

ngModule.factory('PeopleWithJson', [
  'DSDataSource', 'config', '$rootScope', '$http', '$q', (function(DSDataSource, config, $rootScope, $http, $q) {
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
        var load, onError, people, teamworkPeople;
        if (assert) {
          if (!(dsDataService instanceof DSDataServiceBase)) {
            error.invalidArg('dsDataService');
          }
        }
        (teamworkPeople = this.set('teamworkPeople', dsDataService.findDataSet(this, _.assign({}, this.params, {
          type: Person,
          source: true
        })))).release(this);
        people = this.get('peopleSet');
        onError = ((function(_this) {
          return function(error, isCancelled) {
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel', null);
            }
            _this._endLoad(false);
          };
        })(this));
        load = ((function(_this) {
          return function() {
            var cancel;
            if (!_this._startLoad()) {
              return;
            }
            cancel = _this.set('cancel', $q.defer());
            $http.get("data/people.json?t=" + (new Date().getTime()), cancel).then((function(resp) {
              if (resp.status === 200) {
                _this.set('cancel', null);
                DSDigest.block((function() {
                  var dstags, i, j, k, len, len1, map, peopleRoles, person, personInfo, personKey, ref, ref1, selectedRole;
                  peopleRoles = $rootScope.peopleRoles = resp.data.roles;
                  if ((selectedRole = config.get('selectedRole'))) {
                    for (j = 0, len = peopleRoles.length; j < len; j++) {
                      i = peopleRoles[j];
                      if (i.role === selectedRole) {
                        $rootScope.selectedRole = i;
                      }
                    }
                  }
                  ref = resp.data.people;
                  for (k = 0, len1 = ref.length; k < len1; k++) {
                    personInfo = ref[k];
                    if (teamworkPeople.items.hasOwnProperty(personKey = "" + personInfo.id)) {
                      teamworkPeople.items[personKey].set('roles', dstags = new DSTags(_this, personInfo.role));
                      dstags.release(_this);
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
              } else {
                onError(resp, resp.status === 0);
              }
            }), onError);
          };
        })(this));
        this._unwatchA = teamworkPeople.watchStatus(this, ((function(_this) {
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
        })(this)));
        this.init = null;
      });

      PeopleWithJson.end();

      return PeopleWithJson;

    })(DSData);
  })
]);


},{"../../dscommon/DSData":51,"../../dscommon/DSDataServiceBase":54,"../../dscommon/DSDigest":56,"../../dscommon/DSSet":63,"../../dscommon/DSTags":64,"../../dscommon/util":66,"../models/Person":14}],4:[function(require,module,exports){
var DSData, DSDataServiceBase, DSDigest, DSDocument, DSSet, Person, PersonDayStat, Task, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/PersonDayStatData', [])).name;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSDocument = require('../../dscommon/DSDocument');

DSDataServiceBase = require('../../dscommon/DSDataServiceBase');

DSData = require('../../dscommon/DSData');

DSDigest = require('../../dscommon/DSDigest');

DSSet = require('../../dscommon/DSSet');

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
          type: Task,
          filter: 'assigned'
        })))).release(this);
        tasksItems = tasks.items;
        (people = this.set('people', dsDataService.findDataSet(this, {
          type: Person,
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
                  if ((duedate = task.duedate) !== null) {
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
                      n = Math.floor((duedate.valueOf() - startDate.valueOf()) / (24 * 60 * 60 * 1000));
                      if ((0 <= n && n < dayStats.length)) {
                        if ((estimate = task.get('estimate')) !== null) {
                          tasksTotal[n].add(estimate);
                        }
                        tasksCounts[n]++;
                      }
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


},{"../../dscommon/DSData":51,"../../dscommon/DSDataServiceBase":54,"../../dscommon/DSDigest":56,"../../dscommon/DSDocument":57,"../../dscommon/DSSet":63,"../../dscommon/util":66,"../models/Person":14,"../models/PersonDayStat":15,"../models/Task":19}],5:[function(require,module,exports){
var DSData, DSDataServiceBase, DSDigest, DSSet, DSTags, Task, TaskTimeTracking, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/TasksWithTimeTracking', [])).name;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSSet = require('../../dscommon/DSSet');

DSTags = require('../../dscommon/DSTags');

DSData = require('../../dscommon/DSData');

DSDigest = require('../../dscommon/DSDigest');

DSDataServiceBase = require('../../dscommon/DSDataServiceBase');

Task = require('../models/Task');

TaskTimeTracking = require('../models/TaskTimeTracking');

ngModule.factory('TasksWithTimeTracking', [
  'DSDataSource', '$rootScope', '$http', '$q', (function(DSDataSource, $rootScope, $http, $q) {
    var TasksWithTimeTracking;
    return TasksWithTimeTracking = (function(superClass) {
      extend(TasksWithTimeTracking, superClass);

      function TasksWithTimeTracking() {
        return TasksWithTimeTracking.__super__.constructor.apply(this, arguments);
      }

      TasksWithTimeTracking.begin('TasksWithTimeTracking');

      TasksWithTimeTracking.addPool();

      TasksWithTimeTracking.propDoc('srcTasks', DSSet);

      TasksWithTimeTracking.propDoc('srcTasksTimeTracking', DSSet);

      TasksWithTimeTracking.propObj('cancel', null);

      TasksWithTimeTracking.propSet('tasks', Task);

      TasksWithTimeTracking.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        if (typeof this.__unwatchA === "function") {
          this.__unwatchA();
        }
        if (typeof this.__unwatchB === "function") {
          this.__unwatchB();
        }
      }));

      TasksWithTimeTracking.prototype.clear = (function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      });

      TasksWithTimeTracking.prototype.init = (function(dsDataService) {
        var srcTasks, srcTasksTimeTracking, tasks;
        if (assert) {
          if (!(dsDataService instanceof DSDataServiceBase)) {
            error.invalidArg('dsDataService');
          }
        }
        (srcTasks = this.set('srcTasks', dsDataService.findDataSet(this, {
          mode: 'original',
          type: Task,
          filter: 'all',
          source: true
        }))).release(this);
        (srcTasksTimeTracking = this.set('srcTasksTimeTracking', dsDataService.findDataSet(this, {
          mode: 'original',
          type: TaskTimeTracking
        }))).release(this);
        tasks = this.get('tasksSet');
        this.__unwatchA = srcTasks.watch(this, {
          add: (function(task) {
            var ttt;
            if (task.get('timeTracking') === null) {
              if ((ttt = TaskTimeTracking.pool.find(this, task.$ds_key))) {
                task.set('timeTracking', ttt);
                ttt.release(this);
              }
            }
            tasks.add(this, task.addRef(this));
          }),
          remove: (function(task) {
            tasks.remove(task);
          })
        });
        this.__unwatchB = srcTasks.watchStatus(this, ((function(_this) {
          return function(source, status) {
            _this.set('status', status);
          };
        })(this)));
        this.init = null;
      });

      TasksWithTimeTracking.end();

      return TasksWithTimeTracking;

    })(DSData);
  })
]);


},{"../../dscommon/DSData":51,"../../dscommon/DSDataServiceBase":54,"../../dscommon/DSDigest":56,"../../dscommon/DSSet":63,"../../dscommon/DSTags":64,"../../dscommon/util":66,"../models/Task":19,"../models/TaskTimeTracking":20}],6:[function(require,module,exports){
var CHANGES_PERSISTANCE_VER, Comments, DSChangesBase, DSDataEditable, DSDigest, Person, RMSData, Task, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataChanges', ['LocalStorageModule', require('../../dscommon/DSDataSource')])).name;

assert = require('../../dscommon/util').assert;

serviceOwner = require('../../dscommon/util').serviceOwner;

error = require('../../dscommon/util').error;

DSDigest = require('../../dscommon/DSDigest');

DSChangesBase = require('../../dscommon/DSChangesBase');

DSDataEditable = require('../../dscommon/DSDataEditable');

Person = require('../models/Person');

Task = require('../models/Task');

Comments = require('../models/types/Comments');

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
                type: Person,
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
                      if (!taskEditable.hasOwnProperty('__change')) {
                        delete set[taskEditable.$ds_key];
                        taskEditable.release(_this);
                      }
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
        return function(tasks) {
          var actionError, allTasksSaved, change, comments, commentsOrSplit, dueDateStr, duedate, k, newReponsible, project, projectPeople, promise, propChange, propName, ref, saveTaskAction, split, startDate, tag, tags, task, taskKey, taskUpd, upd;
          if (saveInProgress && !tasks) {
            return saveInProgress.promise;
          }
          if (!tasks) {
            saveInProgress = $q.defer();
            tasks = (function() {
              var ref, results;
              ref = this.get('tasks');
              results = [];
              for (taskKey in ref) {
                task = ref[taskKey];
                results.push(task.addRef(this));
              }
              return results;
            }).call(this);
          }
          newReponsible = null;
          upd = {
            'todo-item': taskUpd = {}
          };
          if (!(task = tasks.shift())) {
            if ((tasks = (function() {
              var ref, results;
              ref = this.get('tasks');
              results = [];
              for (taskKey in ref) {
                task = ref[taskKey];
                if (!task.__change.__error) {
                  results.push(task.addRef(this));
                }
              }
              return results;
            }).call(this)).length > 0) {
              this.save(tasks);
              return;
            }
            allTasksSaved = true;
            for (k in this.get('tasks')) {
              allTasksSaved = false;
              break;
            }
            saveInProgress.resolve(allTasksSaved);
            promise = saveInProgress.promise;
            saveInProgress = null;
            return promise;
          }
          change = _.clone(task.__change);
          taskUpd['content'] = task.get('title');
          commentsOrSplit = false;
          for (propName in change) {
            propChange = change[propName];
            if (propName !== '__error' && propName !== '__refreshView') {
              switch (propName) {
                case 'title':
                  void 0;
                  break;
                case 'comments':
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
                  taskUpd['responsible-party-id'] = (newReponsible = propChange.v) ? [propChange.v.get('id')] : [];
                  break;
                case 'tags':
                  taskUpd['tags'] = (tags = (ref = task.get('tags')) != null ? ref.map : void 0) ? ((function() {
                    var results;
                    results = [];
                    for (tag in tags) {
                      results.push(tag);
                    }
                    return results;
                  })()).join() : '';
                  break;
                case 'plan':
                  comments = (comments = task.get('comments')) === null ? new Comments : comments.clone();
                  comments.unshift(propChange.v ? "Поставлено в план на " + (task.get('duedate').format('DD.MM.YYYY')) : "Снято с плана.  Причина:");
                  task.set('comments', comments);
                  break;
                default:
                  console.error("change.save(): Property " + propName + " not expected to be changed");
              }
            }
          }
          actionError = ((function(_this) {
            return function(error, isCancelled) {
              if (!isCancelled) {
                console.error('error: ', error);
                _this.set('cancel', null);
              }
              task.release(_this);
              saveInProgress.reject();
              saveInProgress = null;
            };
          })(this));
          saveTaskAction = ((function(_this) {
            return function() {
              return _this.get('source').httpPut("tasks/" + (task.get('id')) + ".json", upd, _this.set('cancel', $q.defer())).then((function(resp) {
                var base, comment, html;
                _this.set('cancel', null);
                if (resp.status === 200) {
                  delete change.__error;
                  DSDigest.block((function() {
                    for (propName in change) {
                      propChange = change[propName];
                      if (propName !== '__refreshView') {
                        task.$ds_doc.set(propName, propChange.v);
                      }
                    }
                  }));
                  if ((comments = task.get('comments')) !== null) {
                    html = '';
                    while ((comment = comments.shift())) {
                      html += "<p>" + comment + "</p>";
                    }
                    upd = {
                      comment: {
                        'content-type': 'html',
                        body: html,
                        isprivate: false
                      }
                    };
                    _this.get('source').httpPost("tasks/" + (task.get('id')) + "/comments.json", upd, _this.set('cancel', $q.defer())).then((function(resp) {
                      _this.set('cancel', null);
                      if (resp.status === 201) {
                        task.release(_this);
                        _this.save(tasks);
                      } else {
                        actionError(resp, resp.status === 0);
                      }
                    }), actionError);
                  } else {
                    task.release(_this);
                    _this.save(tasks);
                  }
                } else {
                  task.__change.__error = resp.data.MESSAGE;
                  if (typeof (base = task.__change).__refreshView === "function") {
                    base.__refreshView();
                  }
                  task.release(_this);
                  _this.save(tasks);
                }
              }), actionError);
            };
          })(this));
          if (newReponsible === null) {
            saveTaskAction();
          } else if ((projectPeople = (project = task.get('project')).get('people')) === null) {
            this.get('source').httpGet("projects/" + (project.get('id')) + "/people.json", this.set('cancel', $q.defer())).then(((function(_this) {
              return function(resp) {
                var i, len, p, ref1;
                _this.set('cancel', null);
                if (resp.status === 200) {
                  project.set('people', projectPeople = {});
                  ref1 = resp.data.people;
                  for (i = 0, len = ref1.length; i < len; i++) {
                    p = ref1[i];
                    projectPeople[p.id] = true;
                  }
                  _this.addPersonToProject(project, newReponsible, saveTaskAction, actionError);
                } else {
                  actionError(resp, resp.status === 0);
                }
              };
            })(this)), actionError);
          } else if (!projectPeople.hasOwnProperty(newReponsible.get('id'))) {
            this.addPersonToProject(project, newReponsible, saveTaskAction);
          } else {
            saveTaskAction();
          }
          return saveInProgress.promise;
        };
      })(null);

      DSChanges.prototype.addPersonToProject = (function(project, person, nextAction, actionError) {
        this.get('source').httpPost("projects/" + (project.get('id')) + "/people/" + (person.get('id')) + ".json", null, this.set('cancel', $q.defer())).then(((function(_this) {
          return function(resp) {
            _this.set('cancel', null);
            if (resp.status === 200 || resp.status === 409) {
              project.get('people')[person.get('id')] = true;
              nextAction();
            } else {
              actionError(resp, resp.status === 0);
            }
          };
        })(this)), actionError);
      });

      DSChanges.end();

      return DSChanges;

    })(DSChangesBase);
    return serviceOwner.add(new DSChanges(serviceOwner, 'dataChanges'));
  })
]);


},{"../../dscommon/DSChangesBase":50,"../../dscommon/DSDataEditable":52,"../../dscommon/DSDataSource":55,"../../dscommon/DSDigest":56,"../../dscommon/util":66,"../models/Person":14,"../models/Task":19,"../models/types/Comments":22,"../utils/RMSData":49}],7:[function(require,module,exports){
var DSChangesBase, DSDataEditable, DSDataFiltered, DSDataServiceBase, DSObject, Person, PersonTimeTracking, Task, TaskTimeTracking, assert, base64, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataService', [require('./PeopleWithJson'), require('./TasksWithTimeTracking'), require('./teamwork/TWPeople'), require('./teamwork/TWTasks'), require('./teamwork/TWTags'), require('./teamwork/TWTimeTracking'), require('./PersonDayStatData'), require('./dsChanges'), require('../../dscommon/DSDataSource'), require('../config')])).name;

assert = require('../../dscommon/util').assert;

serviceOwner = require('../../dscommon/util').serviceOwner;

error = require('../../dscommon/util').error;

base64 = require('../../utils/base64');

DSObject = require('../../dscommon/DSObject');

DSDataServiceBase = require('../../dscommon/DSDataServiceBase');

DSChangesBase = require('../../dscommon/DSChangesBase');

DSDataEditable = require('../../dscommon/DSDataEditable');

DSDataFiltered = require('../../dscommon/DSDataFiltered');

Person = require('../models/Person');

Task = require('../models/Task');

TaskTimeTracking = require('../models/TaskTimeTracking');

PersonTimeTracking = require('../models/PersonTimeTracking');

ngModule.run([
  'dsDataService', '$rootScope', (function(dsDataService, $rootScope) {
    $rootScope.dataService = dsDataService;
  })
]);

ngModule.factory('dsDataService', [
  'TWPeople', 'TWTasks', 'TWTags', 'TWTimeTracking', 'PeopleWithJson', 'TasksWithTimeTracking', 'PersonDayStatData', 'DSDataSource', 'dsChanges', 'config', '$http', '$rootScope', '$q', (function(TWPeople, TWTasks, TWTags, TWTimeTracking, PeopleWithJson, TasksWithTimeTracking, PersonDayStatData, DSDataSource, dsChanges, config, $http, $rootScope, $q) {
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

      DSDataService.propPool('personTimeTrackingPool', DSDataFiltered(PersonTimeTracking));

      DSDataService.propBool('showTimeSpent', false);

      DSDataService.propDoc('changes', DSChangesBase);

      DSDataService.propSet('emptyPersonTimeTracking', PersonTimeTracking);

      DSDataService.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      class1 = (function() {
        var cancel;
        DSDataServiceBase.apply(this, arguments);
        (this.set('dataSource', new DSDataSource(this, 'dataSource'))).release(this);
        cancel = null;
        this.__unwatch2 = $rootScope.$watch((function() {
          return [config.get('teamwork'), config.get('token')];
        }), ((function(_this) {
          return function(arg) {
            var onError, teamwork, token;
            teamwork = arg[0], token = arg[1];
            if (!(teamwork && token)) {
              return _this.get('dataSource').setConnection(null, null);
            } else {
              if (cancel) {
                cancel.resolve();
                cancel = null;
              }
              onError = (function(error, isCancelled) {
                if (!isCancelled) {
                  console.error('error: ', error);
                  cancel = null;
                }
                _this.get('dataSource').setConnection(null, null);
              });
              $http.get(teamwork + "authenticate.json", {
                timeout: (cancel = $q.defer()).promise,
                headers: {
                  Authorization: "Basic " + (base64.encode(token))
                }
              }).then((function(resp) {
                if (resp.status === 200) {
                  cancel = null;
                  config.set('currentUserId', resp.data['account']['userId']);
                  _this.get('dataSource').setConnection(teamwork, token);
                } else {
                  onError(resp, resp.status === 0);
                }
              }), onError);
            }
          };
        })(this)), true);
        (this.set('changes', dsChanges)).init(this);
      });

      DSDataService.prototype.refresh = (function() {
        this.get('dataSource').refresh();
      });

      DSDataService.prototype.findDataSet = (function(owner, params) {
        var base, base1, base2, base3, base4, changesSet, data, originalSet, set, type;
        DSDataServiceBase.prototype.findDataSet.call(this, owner, params);
        switch (params.type.docType) {
          case 'Tag':
            if (typeof (base = (data = TWTags.pool.find(this, params))).init === "function") {
              base.init(this);
            }
            (set = data.get('tagsSet')).addRef(owner);
            data.release(this);
            return set;
          case 'PersonDayStat':
            if (typeof (base1 = (data = PersonDayStatData.pool.find(this, params))).init === "function") {
              base1.init(this);
            }
            (set = data.get('personDayStatsSet')).addRef(owner);
            data.release(this);
            return set;
          case 'TaskTimeTracking':
            if ((data = TWTimeTracking.pool.find(this, {})).init) {
              data.init(this);
            }
            (set = data.get('taskTimeTrackingSet')).addRef(owner);
            data.release(this);
            return set;
          case 'PersonTimeTracking':
            if (params.hasOwnProperty('showTimeSpent') && !params.showTimeSpent) {
              (set = this.get('emptyPersonTimeTrackingSet')).addRef(owner);
            } else if (!params.hasOwnProperty('startDate')) {
              if ((data = TWTimeTracking.pool.find(this, {})).init) {
                data.init(this);
              }
              (set = data.get('personTimeTrackingSet')).addRef(owner);
              data.release(this);
            } else {
              if ((data = this.get('personTimeTrackingPool').find(this, params)).init) {
                data.init(originalSet = this.findDataSet(this, {
                  type: PersonTimeTracking,
                  mode: params.mode
                }), TWTimeTracking.filterPersonTimeTracking(params));
                originalSet.release(this);
              }
              (set = data.get('itemsSet')).addRef(owner);
              data.release(this);
            }
            return set;
        }
        switch (params.mode) {
          case 'edited':
            switch ((type = params.type.docType)) {
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
                throw new Error("Not supported model type (1): " + type);
            }
            break;
          case 'changes':
            switch ((type = params.type.docType)) {
              case 'Task':
                return (set = this.get('changes').get('tasksSet')).addRef(owner);
              default:
                throw new Error("Not supported model type (2): " + type);
            }
            break;
          case 'original':
            switch (((type = params.type) !== Person ? type.docType : !config.get('hasRoles') || params.source ? Person.docType : 'PeopleWithJson')) {
              case 'PeopleWithJson':
                if (typeof (base2 = (data = PeopleWithJson.pool.find(this, params))).init === "function") {
                  base2.init(this);
                }
                (set = data.get('peopleSet')).addRef(owner);
                data.release(this);
                return set;
              case 'Person':
                delete params.source;
                if (typeof (base3 = (data = TWPeople.pool.find(this, params))).init === "function") {
                  base3.init(this);
                }
                (set = data.get('peopleSet')).addRef(owner);
                data.release(this);
                return set;
              case 'Task':
                if (params.filter === 'all' && !params.hasOwnProperty('startDate')) {
                  if (!config.get('hasTimeReports') || params.source) {
                    delete params.source;
                    if (typeof (base4 = (data = TWTasks.pool.find(this, params))).init === "function") {
                      base4.init(this);
                    }
                  } else {
                    if ((data = TasksWithTimeTracking.pool.find(this, {})).init) {
                      data.init(this);
                    }
                  }
                  (set = data.get('tasksSet')).addRef(owner);
                  data.release(this);
                } else {
                  if ((data = this.get('tasksPool').find(this, params)).init) {
                    data.init(originalSet = this.findDataSet(this, {
                      type: Task,
                      mode: 'original',
                      filter: 'all'
                    }), TWTasks.filter(params));
                    originalSet.release(this);
                  }
                  (set = data.get('itemsSet')).addRef(owner);
                  data.release(this);
                }
                return set;
              default:
                throw new Error("Not supported model type (3): " + type);
            }
        }
      });

      DSDataService.prototype.requestSources = (function(owner, params, sources) {
        var docType, k, mode, newSet, requestParams, set, srcParams, type, v;
        DSDataServiceBase.prototype.requestSources.call(this, owner, params, sources);
        for (k in sources) {
          v = sources[k];
          srcParams = _.assign({}, v.params, params);
          requestParams = {
            type: type = v.type,
            mode: mode = srcParams.mode
          };
          switch ((docType = type.docType)) {
            case 'Tag':
              void 0;
              break;
            case 'Person':
              void 0;
              break;
            case 'PersonDayStat':
              requestParams.startDate = srcParams.startDate;
              requestParams.endDate = srcParams.endDate;
              break;
            case 'PersonTimeTracking':
              requestParams.showTimeSpent = srcParams.showTimeSpent;
              requestParams.startDate = srcParams.startDate;
              requestParams.endDate = srcParams.endDate;
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
                  requestParams.startDate = srcParams.startDate;
                  requestParams.endDate = srcParams.endDate;
                }
              }
              break;
            default:
              throw new Error("Not supported model type (4): " + docType);
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


},{"../../dscommon/DSChangesBase":50,"../../dscommon/DSDataEditable":52,"../../dscommon/DSDataFiltered":53,"../../dscommon/DSDataServiceBase":54,"../../dscommon/DSDataSource":55,"../../dscommon/DSObject":60,"../../dscommon/util":66,"../../utils/base64":68,"../config":2,"../models/Person":14,"../models/PersonTimeTracking":16,"../models/Task":19,"../models/TaskTimeTracking":20,"./PeopleWithJson":3,"./PersonDayStatData":4,"./TasksWithTimeTracking":5,"./dsChanges":6,"./teamwork/TWPeople":9,"./teamwork/TWTags":10,"./teamwork/TWTasks":11,"./teamwork/TWTimeTracking":12}],8:[function(require,module,exports){
var DSData, DSDigest, WORK_ENTRIES_WHOLE_PAGE, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('dscommon/DSDataTeamworkPaged', [])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSData = require('../../../dscommon/DSData');

DSDigest = require('../../../dscommon/DSDigest');

WORK_ENTRIES_WHOLE_PAGE = 500;

ngModule.factory('DSDataTeamworkPaged', [
  'DSDataSource', '$rootScope', '$q', (function(DSDataSource, $rootScope, $q) {
    var DSDataTeamworkPaged;
    return DSDataTeamworkPaged = (function(superClass) {
      extend(DSDataTeamworkPaged, superClass);

      function DSDataTeamworkPaged() {
        return DSDataTeamworkPaged.__super__.constructor.apply(this, arguments);
      }

      DSDataTeamworkPaged.begin('DSDataTeamworkPaged');

      DSDataTeamworkPaged.propDoc('source', DSDataSource);

      DSDataTeamworkPaged.propObj('cancel', null);

      DSDataTeamworkPaged.propEnum('method', ['httpGet', 'httpPost', 'httpPut']);

      DSDataTeamworkPaged.propStr('request');

      DSDataTeamworkPaged.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      }));

      DSDataTeamworkPaged.prototype.clear = (function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      });

      DSDataTeamworkPaged.prototype.load = (function() {
        var addPaging, cancel, onError, pageLoad, request;
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
        onError = ((function(_this) {
          return function(error, isCancelled) {
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel', null);
            }
            _this._endLoad(false);
          };
        })(this));
        addPaging = function(page, url) {
          return "" + url + (url.indexOf('?') === -1 ? '?' : '&') + "page=" + page + "&pageSize=" + WORK_ENTRIES_WHOLE_PAGE;
        };
        this.startLoad();
        (pageLoad = (function(_this) {
          return function(page) {
            var method;
            return ((function() {
              switch ((method = this.get('method'))) {
                case 'httpGet':
                  return this.get('source').httpGet(addPaging(page, this.get('request')), cancel);
                case 'httpPost':
                  return this.get('source').httpPost(addPaging(page, this.get('request')), this.params.json, cancel);
                case 'httpPut':
                  return this.get('source').httpPut(addPaging(page, this.get('request')), this.params.json, cancel);
              }
            }).call(_this)).then((function(resp) {
              if (resp.status === 200) {
                _this.set('cancel', null);
                if (_this.importResponse(resp.data, resp.status) === WORK_ENTRIES_WHOLE_PAGE) {
                  pageLoad(page + 1);
                  return;
                }
                DSDigest.block((function() {
                  return _this.finalizeLoad();
                }));
                _this._endLoad(true);
              } else {
                onError(resp, resp.status === 0);
              }
            }), onError);
          };
        })(this))(1);
      });

      DSDataTeamworkPaged.end();

      return DSDataTeamworkPaged;

    })(DSData);
  })
]);


},{"../../../dscommon/DSData":51,"../../../dscommon/DSDigest":56,"../../../dscommon/util":66}],9:[function(require,module,exports){
var Person, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWPeople', [require('../../../dscommon/DSDataSource'), require('./DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Person = require('../../models/Person');

ngModule.factory('TWPeople', [
  'DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$q', (function(DSDataTeamworkPaged, DSDataSource, $rootScope, $q) {
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

      TWPeople.prototype.startLoad = function() {
        return this.peopleMap = {};
      };

      TWPeople.prototype.importResponse = function(json) {
        var cnt, i, jsonPerson, len, person, ref;
        cnt = 0;
        ref = json['people'];
        for (i = 0, len = ref.length; i < len; i++) {
          jsonPerson = ref[i];
          ++cnt;
          person = Person.pool.find(this, "" + jsonPerson['id'], this.peopleMap);
          person.set('id', +jsonPerson['id']);
          person.set('name', (jsonPerson['last-name'] + " " + (jsonPerson['first-name'].charAt(0).toUpperCase()) + ".").trim());
          person.set('firstName', jsonPerson['first-name'].trim());
          person.set('avatar', jsonPerson['avatar-url']);
          person.set('email', jsonPerson['email-address']);
          person.set('companyId', +jsonPerson['company-id']);
          person.set('currentUser', false);
        }
        return cnt;
      };

      TWPeople.prototype.finalizeLoad = function() {
        this.get('peopleSet').merge(this, this.peopleMap);
        delete this.peopleMap;
      };

      TWPeople.end();

      return TWPeople;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../dscommon/DSDataSource":55,"../../../dscommon/util":66,"../../models/Person":14,"./DSDataTeamworkPaged":8}],10:[function(require,module,exports){
var Tag, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTags', [require('../../../dscommon/DSDataSource'), require('./DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Tag = require('../../models/Tag');

ngModule.factory('TWTags', [
  'DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$q', (function(DSDataTeamworkPaged, DSDataSource, $rootScope, $q) {
    var TWTags;
    return TWTags = (function(superClass) {
      extend(TWTags, superClass);

      function TWTags() {
        return TWTags.__super__.constructor.apply(this, arguments);
      }

      TWTags.begin('TWTags');

      TWTags.addPool();

      TWTags.propSet('tags', Tag);

      TWTags.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      TWTags.prototype.init = (function(dsDataService) {
        this.set('request', "tags.json");
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      TWTags.prototype.startLoad = function() {
        this.tagsMap = {};
      };

      TWTags.prototype.importResponse = function(json) {
        var cnt, i, jsonTag, len, person, ref;
        cnt = 0;
        ref = json['tags'];
        for (i = 0, len = ref.length; i < len; i++) {
          jsonTag = ref[i];
          ++cnt;
          person = Tag.pool.find(this, jsonTag['name'], this.tagsMap);
          person.set('id', parseInt(jsonTag['id']));
          person.set('name', jsonTag['name']);
          person.set('color', jsonTag['color']);
        }
        return cnt;
      };

      TWTags.prototype.finalizeLoad = function() {
        this.get('tagsSet').merge(this, this.tagsMap);
        delete this.tagsMap;
      };

      TWTags.end();

      return TWTags;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../dscommon/DSDataSource":55,"../../../dscommon/util":66,"../../models/Tag":18,"./DSDataTeamworkPaged":8}],11:[function(require,module,exports){
var DSData, DSDigest, DSTags, Person, PersonTimeTracking, Project, RMSData, Tag, Task, TaskSplit, TaskTimeTracking, TodoList, assert, error, ngModule, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTasks', [require('../../../dscommon/DSDataSource')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

time = require('../../ui/time');

Task = require('../../models/Task');

Tag = require('../../models/Tag');

Person = require('../../models/Person');

TodoList = require('../../models/TodoList');

Project = require('../../models/Project');

TaskTimeTracking = require('../../models/TaskTimeTracking');

PersonTimeTracking = require('../../models/PersonTimeTracking');

DSData = require('../../../dscommon/DSData');

DSDigest = require('../../../dscommon/DSDigest');

DSTags = require('../../../dscommon/DSTags');

TaskSplit = require('../../models/types/TaskSplit');

RMSData = require('../../utils/RMSData');

ngModule.factory('TWTasks', [
  'DSDataSource', 'dsChanges', 'config', '$http', '$q', function(DSDataSource, dsChanges, config, $http, $q) {
    var TWTasks;
    return TWTasks = (function(superClass) {
      var alwaysTrue, class1, clazz, importTask, initCalcTaskPriority, isTaskInDatesRange, loadCompletedTaskForPersonTimeTracking, loadTagsJson, releaseMaps;

      extend(TWTasks, superClass);

      function TWTasks() {
        return class1.apply(this, arguments);
      }

      Task.TWTask = TWTasks;

      Task.planTag = config.planTag;

      TWTasks.begin('TWTasks');

      TWTasks.addPool();

      TWTasks.propDoc('source', DSDataSource);

      TWTasks.propStr('request');

      TWTasks.propSet('tasks', Task);

      TWTasks.propPool('completedTasksPool', Task);

      TWTasks.propObj('cancel', null);

      TWTasks.propObj('cancel2', null);

      TWTasks.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        this.__unwatch1();
        this.__unwatch2();
      }));

      clazz = TWTasks;

      TWTasks.calcTaskPriority = initCalcTaskPriority = (function(task) {
        task.__setCalcPriority(Task.defaultTag.priority);
        task.__setCalcStyle(Task.defaultTag);
      });

      TWTasks.prototype.clear = function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      };

      TWTasks.propObj('visiblePersonTTracking', {});

      class1 = (function() {
        var completedTasksPool, self, taskSet, visiblePersonTTracking;
        DSData.apply(this, arguments);
        this.peopleMap = {};
        this.projectMap = {};
        this.todoListMap = {};
        if (assert) {
          if (PersonTimeTracking.prototype.hasOwnProperty('setVisible')) {
            console.error("TWTasks:ctor: setVisible expects that their will be only one instance of TWTasks object");
          }
        }
        visiblePersonTTracking = this.get('visiblePersonTTracking');
        completedTasksPool = this.get('completedTasksPool');
        taskSet = this.get('tasksSet');
        self = this;
        PersonTimeTracking.prototype.setVisible = (function(isVisible) {
          var task, taskId;
          if (isVisible) {
            if ((this.__visCount = (this.__visCount || 0) + 1) === 1) {
              visiblePersonTTracking[this.$ds_key] = this;
              if ((task = this.get('task')) === null) {
                if ((task = taskSet.items[taskId = this.get('taskId')])) {
                  this.set('task', task);
                } else {
                  this.set('task', task = completedTasksPool.find(this, "" + taskId));
                  if (task.get('timeTracking') === null) {
                    task.set('id', taskId);
                    task.set('timeTracking', TaskTimeTracking.pool.find(this, task.$ds_key));
                    loadCompletedTaskForPersonTimeTracking.call(self);
                  }
                  task.release(this);
                }
              }
              task.setVisible(true);
            }
          } else if (--this.__visCount === 0) {
            delete visiblePersonTTracking[this.$ds_key];
            this.get('task').setVisible(false);
          }
        });
      });

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

      alwaysTrue = (function(task) {
        return true;
      });

      TWTasks.filter = (function(params) {
        switch (params.filter) {
          case 'all':
            if (moment.isMoment(params.startDate)) {
              return function(task) {
                return isTaskInDatesRange(params, task);
              };
            } else {
              return alwaysTrue;
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
              return (date = task.get('duedate')) !== null && date < time.today;
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
              if (!tasksSet.items.hasOwnProperty(item.$ds_key)) {
                tasksSet.add(_this, item.addRef(_this));
              }
            } else {
              if (tasksSet.items.hasOwnProperty(item.$ds_key)) {
                tasksSet.remove(item);
              }
            }
          };
        })(this)));
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.allTasksSet = filter === alwaysTrue;
        this.init = null;
      });

      releaseMaps = (function() {
        var k, ref, ref1, ref2, v;
        ref = this.peopleMap;
        for (k in ref) {
          v = ref[k];
          v.release(this);
          delete this.peopleMap[k];
        }
        ref1 = this.todoListMap;
        for (k in ref1) {
          v = ref1[k];
          v.release(this);
          delete this.todoListMap[k];
        }
        ref2 = this.projectMap;
        for (k in ref2) {
          v = ref2[k];
          v.release(this);
          delete this.projectMap[k];
        }
      });

      importTask = (function(task, jsonTask) {
        var data, date, desc, duedateStr, estimate, j, k, len, person, plan, project, ref, resp, split, tag, tagDoc, tags, timeIsLogged, todoList, v;
        person = Person.pool.find(this, "" + jsonTask['creator-id'], this.peopleMap);
        project = Project.pool.find(this, "" + jsonTask['project-id'], this.projectMap);
        todoList = TodoList.pool.find(this, "" + jsonTask['todo-list-id'], this.todoListMap);
        todoList.set('project', project);
        task.set('creator', person);
        task.set('project', project);
        task.set('todoList', todoList);
        task.set('title', jsonTask['content']);
        task.set('estimate', (estimate = jsonTask['estimated-minutes']) ? moment.duration(estimate, 'minutes') : null);
        task.set('duedate', (duedateStr = jsonTask['due-date']) ? moment(duedateStr, 'YYYYMMDD') : null);
        task.set('startDate', (date = jsonTask['start-date']) ? moment(date, 'YYYYMMDD') : null);
        task.set('completed', jsonTask['completed']);
        task.set('isReady', true);
        if (timeIsLogged = jsonTask['timeIsLogged']) {
          task.set('firstTimeEntryId', timeIsLogged);
        }
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
          task.set('responsible', (resp = jsonTask['responsible-party-ids'].split(',')).length > 0 ? Person.pool.find(this, "" + resp[0], this.peopleMap) : null);
        }
        person.set('id', parseInt(jsonTask['creator-id']));
        if (!jsonTask.hasOwnProperty('tags')) {
          task.set('tags', null);
          task.set('plan', false);
        } else {
          tags = null;
          plan = false;
          ref = jsonTask['tags'];
          for (j = 0, len = ref.length; j < len; j++) {
            tag = ref[j];
            if (tag.name === config.planTag) {
              plan = true;
            }
            tagDoc = (tags != null ? tags : tags = {})[tag.name] = Tag.pool.find(this, tag.name);
            tagDoc.set('id', tag.id);
            tagDoc.set('name', tag.name);
            tagDoc.set('color', tag.color);
            (tags || (tags = {}))[tag.name] = tagDoc;
          }
          task.set('plan', plan);
          if (tags === null) {
            task.set('tags', null);
          } else {
            (task.set('tags', new DSTags(this, tags))).release(this);
            for (k in tags) {
              v = tags[k];
              v.release(this);
            }
          }
          clazz.calcTaskPriority(task);
        }
        todoList.set('id', parseInt(jsonTask['todo-list-id']));
        todoList.set('name', jsonTask['todo-list-name']);
        project.set('id', parseInt(jsonTask['project-id']));
        project.set('name', jsonTask['project-name']);
      });

      clazz = TWTasks;

      loadTagsJson = function() {
        var onError2;
        clazz.calcTaskPriority = initCalcTaskPriority;
        onError2 = (function(_this) {
          return function(error, isCancelled) {
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel2', null);
            }
          };
        })(this);
        $http.get("data/tags.json?t=" + (new Date().getTime()), this.set('cancel2', $q.defer())).then(((function(_this) {
          return function(resp) {
            var calcTaskPriority, err, i, j, k, len, ref, ref1, t, tags;
            if (resp.status === 200) {
              _this.set('cancel2', null);
              tags = resp.data;
              if (!Array.isArray(tags)) {
                console.error('invalid tags.json');
                return;
              }
              err = false;
              for (i = j = 0, len = tags.length; j < len; i = ++j) {
                t = tags[i];
                if (!(typeof t.name === 'string' && t.name.length >= 0)) {
                  err = true;
                  console.error("invalid tags.json: invalid 'name'", t);
                }
                if (t.hasOwnProperty('priority')) {
                  if (typeof t.priority !== 'number') {
                    err = true;
                    console.error("invalid tags.json: invalid 'priority'", t);
                  }
                } else {
                  t.priority = i;
                }
                if (!(!t.hasOwnProperty('color') || typeof t.color === 'string' && t.color.length >= 0)) {
                  err = true;
                  console.error("invalid tags.json: invalid 'color'", t);
                }
                if (!(!t.hasOwnProperty('border') || typeof t.border === 'string' && t.border.length >= 0)) {
                  err = true;
                  console.error("invalid tags.json: invalid 'border'", t);
                }
              }
              if (err) {
                return;
              }
              clazz.calcTaskPriority = calcTaskPriority = function(task) {
                var l, len1, tag, taskTags;
                if ((taskTags = task.get('tags'))) {
                  for (i = l = 0, len1 = tags.length; l < len1; i = ++l) {
                    tag = tags[i];
                    if (!(taskTags.get(tag.name))) {
                      continue;
                    }
                    task.__setCalcPriority(tag.priority);
                    task.__setCalcStyle(tag);
                    return;
                  }
                }
                task.__setCalcPriority(Task.defaultTag.priority);
                task.__setCalcStyle(Task.defaultTag);
              };
              ref = Task.pool.items;
              for (k in ref) {
                t = ref[k];
                calcTaskPriority(t);
              }
              ref1 = dsChanges.get('tasksSet').$ds_pool.items;
              for (k in ref1) {
                t = ref1[k];
                calcTaskPriority(t);
              }
            } else {
              onError2(resp, resp.status === 0);
            }
          };
        })(this)), onError2);
      };

      TWTasks.prototype.load = (function() {
        var cancel, cancel2, clearChangesForClosedTasks, importResponse, onError, pageLoad, taskMap;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        taskMap = {};
        importResponse = ((function(_this) {
          return function(json) {
            var j, jsonTask, len, ref, task, todoItems;
            Task.pool.enableWatch(false);
            try {
              ref = (todoItems = json['todo-items']);
              for (j = 0, len = ref.length; j < len; j++) {
                jsonTask = ref[j];
                task = Task.pool.find(_this, "" + jsonTask['id'], taskMap);
                task.set('id', parseInt(jsonTask['id']));
                importTask.call(_this, task, jsonTask);
              }
            } finally {
              Task.pool.enableWatch(true);
            }
            return todoItems.length === 250;
          };
        })(this));
        onError = ((function(_this) {
          return function(error, isCancelled) {
            var k, v;
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel', null);
            }
            for (k in taskMap) {
              v = taskMap[k];
              v.release(_this);
            }
            releaseMaps.call(_this);
            _this._endLoad(false);
          };
        })(this));
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        if (cancel2 = this.get('cancel2')) {
          cancel2.resolve();
        }
        if (this.allTasksSet) {
          loadTagsJson.call(this);
        }
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
                    clearChangesForClosedTasks.call(_this);
                    _this.get('tasksSet').merge(_this, taskMap);
                    releaseMaps.call(_this);
                  }));
                  _this._endLoad(true);
                  loadCompletedTaskForPersonTimeTracking.call(_this);
                }
              } else {
                onError(resp, resp.status === 0);
              }
            };
          })(this)), onError);
        })).call(this, 1);
        clearChangesForClosedTasks = function() {
          var ref, task, taskKey;
          ref = dsChanges.tasks;
          for (taskKey in ref) {
            task = ref[taskKey];
            if (!taskMap.hasOwnProperty(taskKey)) {
              task._clearChanges();
            }
          }
        };
      });

      loadCompletedTaskForPersonTimeTracking = (function() {
        var k, onError, ref, t, task, v;
        if (this.get('cancel') !== null) {
          return;
        }
        task = null;
        ref = this.get('visiblePersonTTracking');
        for (k in ref) {
          v = ref[k];
          if (!(t = v.get('task')).get('isReady')) {
            task = t;
            break;
          }
        }
        if (task === null) {
          return;
        }
        onError = ((function(_this) {
          return function(error, isCancelled) {
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel', null);
            }
            task.release(_this);
            releaseMaps.call(_this);
            _this._endLoad(false);
          };
        })(this));
        this.get('source').httpGet("/tasks/" + task.id + ".json", this.set('cancel', $q.defer())).then(((function(_this) {
          return function(resp) {
            if (resp.status === 200) {
              _this.set('cancel', null);
              DSDigest.block((function() {
                importTask.call(_this, task, resp.data['todo-item']);
                releaseMaps.call(_this);
                loadCompletedTaskForPersonTimeTracking.call(_this);
              }));
            } else {
              onError(resp, resp.status === 0);
            }
          };
        })(this)), onError);
      });

      TWTasks.tasksSortRule = (function(leftTask, rightTask) {
        var leftEstimate, leftPrior, ref, ref1, rightEstimate, rightPrior;
        if ((leftPrior = leftTask.get('priority')) !== (rightPrior = rightTask.get('priority'))) {
          return leftPrior - rightPrior;
        }
        if ((leftEstimate = (ref = leftTask.get('estimate')) != null ? ref.valueOf() : void 0) !== (rightEstimate = (ref1 = rightTask.get('estimate')) != null ? ref1.valueOf() : void 0)) {
          if (leftEstimate === void 0) {
            return 1;
          }
          if (rightEstimate === void 0) {
            return -1;
          }
          return rightEstimate - leftEstimate;
        }
        return leftTask.get('id') - rightTask.get('id');
      });

      TWTasks.end();

      return TWTasks;

    })(DSData);
  }
]);


},{"../../../dscommon/DSData":51,"../../../dscommon/DSDataSource":55,"../../../dscommon/DSDigest":56,"../../../dscommon/DSTags":64,"../../../dscommon/util":66,"../../models/Person":14,"../../models/PersonTimeTracking":16,"../../models/Project":17,"../../models/Tag":18,"../../models/Task":19,"../../models/TaskTimeTracking":20,"../../models/TodoList":21,"../../models/types/TaskSplit":23,"../../ui/time":34,"../../utils/RMSData":49}],12:[function(require,module,exports){
var DSData, DSDigest, HISTORY_END_SEARCH_STEP, PersonTimeTracking, RMSData, Task, TaskSplit, TaskTimeTracking, WORK_ENTRIES_WHOLE_PAGE, assert, error, ngModule, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTimeTracking', [require('../../config'), require('../../../dscommon/DSDataSource'), require('../../db')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

time = require('../../ui/time');

Task = require('../../models/Task');

TaskTimeTracking = require('../../models/TaskTimeTracking');

PersonTimeTracking = require('../../models/PersonTimeTracking');

DSData = require('../../../dscommon/DSData');

DSDigest = require('../../../dscommon/DSDigest');

TaskSplit = require('../../models/types/TaskSplit');

RMSData = require('../../utils/RMSData');

WORK_ENTRIES_WHOLE_PAGE = 500;

HISTORY_END_SEARCH_STEP = 50;

ngModule.factory('TWTimeTracking', [
  'DSDataSource', '$q', 'db', 'config', (function(DSDataSource, $q, db, config) {
    var TWTimeTracking;
    return TWTimeTracking = (function(superClass) {
      var class1;

      extend(TWTimeTracking, superClass);

      function TWTimeTracking() {
        return class1.apply(this, arguments);
      }

      TWTimeTracking.begin('TWTimeTracking');

      TWTimeTracking.addPool();

      TWTimeTracking.propDoc('source', DSDataSource);

      TWTimeTracking.propSet('taskTimeTracking', TaskTimeTracking);

      TWTimeTracking.propSet('personTimeTracking', PersonTimeTracking);

      TWTimeTracking.propObj('cancel', null);

      TWTimeTracking.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        if (typeof this.__unwatchA === "function") {
          this.__unwatchA();
        }
        if (typeof this.__unwatchB === "function") {
          this.__unwatchB();
        }
      }));

      TWTimeTracking.propObj('visibleTTracking', {});

      class1 = (function() {
        var visibleTTracking;
        DSData.apply(this, arguments);
        if (assert) {
          if (TaskTimeTracking.prototype.hasOwnProperty('setVisible')) {
            console.error("TWTimeTracking:ctor: setVisible expects that their will be only one instance of TWTimeTracking object");
          }
        }
        visibleTTracking = this.get('visibleTTracking');
        TaskTimeTracking.prototype.setVisible = (function(isVisible) {
          if (isVisible) {
            if ((this.__visCount = (this.__visCount || 0) + 1) === 1 && !this.get('isReady')) {
              visibleTTracking[this.$ds_key] = this;
            }
          } else if (--this.__visCount === 0) {
            delete visibleTTracking[this.$ds_key];
          }
        });
      });

      TWTimeTracking.prototype.clear = (function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        if (typeof this.__unwatchB === "function") {
          this.__unwatchB();
        }
      });

      TWTimeTracking.filterPersonTimeTracking = (function(params) {
        return (function(personTTracking) {
          var ref;
          return (params.startDate <= (ref = moment(personTTracking.get('date').startOf('day'))) && ref <= params.endDate);
        });
      });

      TWTimeTracking.prototype.init = (function(dsDataService) {
        this.__unwatchA = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      TWTimeTracking.prototype.load = (function() {
        var endPage, finalizeLoad, findFirstPage, histStart, importResponse, onError, pageLoad, pages, personKey, personTimeTrackingMap, ref, ref1, taskKey, taskTimeTrackingMap, taskTracking, topPage;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        if (typeof this.__unwatchB === "function") {
          this.__unwatchB();
        }
        PersonTimeTracking.pool.enableWatch(false);
        TaskTimeTracking.pool.enableWatch(false);
        ref = TaskTimeTracking.pool.items;
        for (taskKey in ref) {
          taskTracking = ref[taskKey];
          taskTracking.set('isReady', false);
          taskTracking.set('totalMin', 0);
          taskTracking.set('priorTodayMin', 0);
          taskTracking.set('timeEntries', {});
        }
        ref1 = PersonTimeTracking.pool.items;
        for (personKey in ref1) {
          taskTracking = ref1[personKey];
          taskTracking.set('timeMin', 0);
        }
        personTimeTrackingMap = {};
        taskTimeTrackingMap = {};
        importResponse = ((function(_this) {
          return function(timeEntries) {
            var date, i, jsonTaskTimeEntry, len, minutes, personId, personIdStr, personTimeTracking, taskId, taskIdStr, taskTTracking, timeEntryId;
            for (i = 0, len = timeEntries.length; i < len; i++) {
              jsonTaskTimeEntry = timeEntries[i];
              if (!(moment(jsonTaskTimeEntry['date']) >= time.historyLimit)) {
                continue;
              }
              if (!(taskId = parseInt(taskIdStr = jsonTaskTimeEntry['todo-item-id']))) {
                continue;
              }
              timeEntryId = jsonTaskTimeEntry['id'];
              personId = parseInt(personIdStr = jsonTaskTimeEntry['person-id']);
              minutes = 60 * parseInt(jsonTaskTimeEntry['hours']) + parseInt(jsonTaskTimeEntry['minutes']);
              date = moment(jsonTaskTimeEntry['date']).startOf('day');
              personTimeTracking = PersonTimeTracking.pool.find(_this, personIdStr + "-" + taskId + "-" + (date.valueOf()), personTimeTrackingMap);
              personTimeTracking.set('personId', personId);
              personTimeTracking.set('date', date);
              personTimeTracking.set('taskId', taskId);
              personTimeTracking.set('timeMin', personTimeTracking.get('timeMin') + minutes);
              if (taskTimeTrackingMap.hasOwnProperty(taskIdStr)) {
                taskTTracking = taskTimeTrackingMap[taskIdStr];
              } else {
                taskTTracking = TaskTimeTracking.pool.find(_this, taskIdStr, taskTimeTrackingMap);
                taskTTracking.set('taskId', taskId);
              }
              taskTTracking.set('totalMin', taskTTracking.get('totalMin') + minutes);
              taskTTracking.get('timeEntries')[timeEntryId] = true;
              if (date < time.today) {
                taskTTracking.set('priorTodayMin', taskTTracking.get('priorTodayMin') + minutes);
              }
            }
            return timeEntries.length === WORK_ENTRIES_WHOLE_PAGE;
          };
        })(this));
        finalizeLoad = ((function(_this) {
          return function() {
            DSDigest.block((function() {
              var ref2, taskTTracking;
              ref2 = TaskTimeTracking.pool.items;
              for (taskKey in ref2) {
                taskTTracking = ref2[taskKey];
                taskTTracking.set('isReady', true);
              }
              if (!_this.__unwatchB) {
                _this.__unwatchB = TaskTimeTracking.pool.watch(_this, (function(taskTTracking) {
                  taskTTracking.set('isReady', true);
                }));
              }
              PersonTimeTracking.pool.enableWatch(true);
              _this.get('personTimeTrackingSet').merge(_this, personTimeTrackingMap);
              TaskTimeTracking.pool.enableWatch(true);
              _this.get('taskTimeTrackingSet').merge(_this, taskTimeTrackingMap);
            }));
            _this._endLoad(true);
          };
        })(this));
        onError = ((function(_this) {
          return function(error, isCancelled) {
            var k, v;
            if (!isCancelled) {
              console.error('error: ', error);
              _this.set('cancel', null);
            }
            for (k in taskTimeTrackingMap) {
              v = taskTimeTrackingMap[k];
              v.release(_this);
            }
            _this._endLoad(false);
          };
        })(this));
        pages = {};
        pageLoad = ((function(_this) {
          return function(page) {
            if (pages.hasOwnProperty(page)) {
              if (DSDigest.block((function() {
                return importResponse(pages[page]);
              }))) {
                pageLoad(page + 1);
              } else {
                finalizeLoad();
              }
            } else {
              _this.get('source').httpGet("time_entries.json?page=" + page + "&pageSize=" + WORK_ENTRIES_WHOLE_PAGE, _this.set('cancel', $q.defer())).then((function(resp) {
                var entries;
                if (resp.status === 200) {
                  _this.set('cancel', null);
                  if (!(entries = resp.data['time-entries']) || entries.length === 0) {
                    finalizeLoad();
                  } else if (moment(entries[entries.length - 1]['date']) < time.historyLimit) {
                    config.set('histStart', page + 1);
                    if (entries.length === WORK_ENTRIES_WHOLE_PAGE) {
                      pageLoad(page + 1);
                    } else {
                      finalizeLoad();
                    }
                  } else if (DSDigest.block((function() {
                    return importResponse(entries);
                  }))) {
                    pageLoad(page + 1);
                  } else {
                    finalizeLoad();
                  }
                } else {
                  onError(resp, resp.status === 0);
                }
              }), onError);
            }
          };
        })(this));
        topPage = 1;
        endPage = HISTORY_END_SEARCH_STEP;
        if ((histStart = config.get('histStart')) >= 0) {
          pageLoad(histStart);
        } else {
          (findFirstPage = ((function(_this) {
            return function(page) {
              _this.get('source').httpGet("time_entries.json?page=" + page + "&pageSize=" + WORK_ENTRIES_WHOLE_PAGE, _this.set('cancel', $q.defer())).then((function(resp) {
                var entries, ref2;
                if (resp.status === 200) {
                  _this.set('cancel', null);
                  if (!(entries = resp.data['time-entries']) || entries.length === 0) {
                    findFirstPage(topPage + Math.floor(((endPage = page) - topPage) / 2));
                  } else {
                    if (moment(entries[0]['date']) >= time.historyLimit) {
                      if (topPage === page) {
                        config.set('histStart', page);
                        if (DSDigest.block((function() {
                          return importResponse(entries);
                        }))) {
                          pageLoad(page + 1);
                        } else {
                          finalizeLoad();
                        }
                      } else {
                        pages[page] = entries;
                        findFirstPage(topPage + Math.floor(((endPage = page) - topPage) / 2));
                      }
                    } else if (moment(entries[entries.length - 1]['date']) < time.historyLimit) {
                      if (endPage === page) {
                        ref2 = [endPage, endPage + HISTORY_END_SEARCH_STEP], topPage = ref2[0], endPage = ref2[1];
                        findFirstPage(endPage);
                      } else if (endPage === (page + 1)) {
                        finalizeLoad();
                      } else {
                        topPage = page + 1;
                        findFirstPage(topPage + Math.floor((endPage - topPage) / 2));
                      }
                    } else {
                      config.set('histStart', page);
                      if (DSDigest.block((function() {
                        return importResponse(entries);
                      }))) {
                        pageLoad(page + 1);
                      } else {
                        finalizeLoad();
                      }
                    }
                  }
                } else {
                  onError(resp, resp.status === 0);
                }
              }), onError);
            };
          })(this)))(endPage);
        }
      });

      TWTimeTracking.end();

      return TWTimeTracking;

    })(DSData);
  })
]);


},{"../../../dscommon/DSData":51,"../../../dscommon/DSDataSource":55,"../../../dscommon/DSDigest":56,"../../../dscommon/util":66,"../../config":2,"../../db":13,"../../models/PersonTimeTracking":16,"../../models/Task":19,"../../models/TaskTimeTracking":20,"../../models/types/TaskSplit":23,"../../ui/time":34,"../../utils/RMSData":49}],13:[function(require,module,exports){
var DSObject, assert, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../dscommon/util').assert;

serviceOwner = require('../dscommon/util').serviceOwner;

DSObject = require('../dscommon/DSObject');

module.exports = (ngModule = angular.module('db', [])).name;

ngModule.factory('db', [
  '$q', (function($q) {
    var DB, dbDeferred;
    dbDeferred = null;
    DB = (function(superClass) {
      extend(DB, superClass);

      function DB() {
        return DB.__super__.constructor.apply(this, arguments);
      }

      DB.begin('DB');

      DB.propConst('name', 'RMS');

      DB.propConst('ver', 4);

      DB.prototype.logQuota = (function() {});

      DB.prototype.openDB = (function() {
        var request;
        if (!window.indexedDB) {
          console.warn("IndexedDB.openDB: Missing window.indexedDB, so there will be no local time tracking info");
          dbDeferred.reject();
          return;
        }
        if (!dbDeferred) {
          dbDeferred = $q.defer();
          request = window.indexedDB.open(this.get('name'), this.get('ver'));
          request.onsuccess = (function(event) {
            console.info("IndexedDB.openDB: Success");
            dbDeferred.resolve(event.target.result);
          });
          request.onerror = (function(event) {
            console.warn("IndexedDB.openDB: Error", event);
            dbDeferred.reject();
          });
          request.onupgradeneeded = (function(event) {
            var db, e, error;
            console.info("IndexedDB.openDB: Upgrade", event);
            db = event.target.result;
            try {
              db.deleteObjectStore('timetracking');
            } catch (error) {
              e = error;
            }
            db.createObjectStore('timetracking', {
              keyPath: 'page'
            });
            dbDeferred.resolve(db);
          });
        }
        return dbDeferred.promise;
      });

      DB.end();

      return DB;

    })(DSObject);
    return serviceOwner.add(new DB(serviceOwner, 'db'));
  })
]);


},{"../dscommon/DSObject":60,"../dscommon/util":66}],14:[function(require,module,exports){
var DSDocument, DSTags, Person, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSDocument = require('../../dscommon/DSDocument');

DSTags = require('../../dscommon/DSTags');

module.exports = Person = (function(superClass) {
  var class1;

  extend(Person, superClass);

  function Person() {
    return class1.apply(this, arguments);
  }

  Person.begin('Person');

  DSTags.addPropType(Person);

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

  Person.propStr('firstName');

  Person.propStr('avatar');

  Person.propStr('email');

  Person.propDSTags('roles');

  Person.propNum('companyId');

  Person.propBool('currentUser');

  Person.propBool('missing');

  Person.propDuration('contractTime');

  class1 = (function(referry, key) {
    DSDocument.call(this, referry, key);
    this.set('contractTime', moment.duration(8, 'hours'));
  });

  Person.end();

  return Person;

})(DSDocument);


},{"../../dscommon/DSDocument":57,"../../dscommon/DSTags":64,"../../dscommon/util":66}],15:[function(require,module,exports){
var DSObject, Person, PersonDayStat, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

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

    DayStat.propDuration('timeSpent');

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


},{"../../dscommon/DSObject":60,"../../dscommon/util":66,"./Person":14}],16:[function(require,module,exports){
var DSObject, PersonTimeTracking, Task,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../dscommon/DSObject');

Task = require('../models/Task');

module.exports = PersonTimeTracking = (function(superClass) {
  extend(PersonTimeTracking, superClass);

  function PersonTimeTracking() {
    return PersonTimeTracking.__super__.constructor.apply(this, arguments);
  }

  PersonTimeTracking.begin('PersonTimeTracking');

  PersonTimeTracking.addPool(true);

  PersonTimeTracking.propNum('personId', 0);

  PersonTimeTracking.propMoment('date');

  PersonTimeTracking.propNum('taskId', 0);

  PersonTimeTracking.propDoc('task', Task);

  PersonTimeTracking.propNum('timeMin', 0);

  PersonTimeTracking.end();

  return PersonTimeTracking;

})(DSObject);


},{"../../dscommon/DSObject":60,"../models/Task":19}],17:[function(require,module,exports){
var DSObject, Project, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

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

  Project.propStr('status');

  Project.propObj('people');

  Project.end();

  return Project;

})(DSObject);


},{"../../dscommon/DSObject":60,"../../dscommon/util":66}],18:[function(require,module,exports){
var DSDocument, Tag, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSDocument = require('../../dscommon/DSDocument');

module.exports = Tag = (function(superClass) {
  extend(Tag, superClass);

  function Tag() {
    return Tag.__super__.constructor.apply(this, arguments);
  }

  Tag.begin('Tag');

  Tag.addPool();

  Tag.propNum('id', 0);

  Tag.propStr('name');

  Tag.propStr('color');

  Tag.end();

  return Tag;

})(DSDocument);


},{"../../dscommon/DSDocument":57,"../../dscommon/util":66}],19:[function(require,module,exports){
var Comments, DSDocument, DSTags, Person, Project, Tag, Task, TaskSplit, TaskTimeTracking, TodoList, assert, error, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

time = require('../ui/time');

DSDocument = require('../../dscommon/DSDocument');

Project = require('./Project');

Person = require('./Person');

TodoList = require('./TodoList');

TaskTimeTracking = require('./TaskTimeTracking');

Tag = require('./Tag');

DSTags = require('../../dscommon/DSTags');

Comments = require('./types/Comments');

TaskSplit = require('./types/TaskSplit');

module.exports = Task = (function(superClass) {
  var defaultTag, originalEditableInit, processTagsEditable, processTagsOriginal;

  extend(Task, superClass);

  function Task() {
    return Task.__super__.constructor.apply(this, arguments);
  }

  Task.begin('Task');

  Comments.addPropType(Task);

  TaskSplit.addPropType(Task);

  DSTags.addPropType(Task);

  Task.defaultTag = defaultTag = {
    name: '[default]',
    priority: 1000
  };

  Task.addPool(true);

  processTagsEditable = {
    __onChange: function(task, propName, val, oldVal) {
      var newTags, planTag, tags;
      switch (propName) {
        case 'plan':
          tags = task.get('tags');
          if (tags) {
            tags = tags.clone(this);
            if (val) {
              if (!tags.get(Task.planTag)) {
                tags.set(Task.planTag, (planTag = Tag.pool.find(this, Task.planTag)));
                planTag.release(this);
                task.set('tags', tags);
              }
            } else {
              if (tags.get(Task.planTag)) {
                tags.set(Task.planTag, false);
                task.set('tags', tags.empty() ? null : tags);
              }
            }
            tags.release(this);
          } else if (val) {
            (newTags = {})[Task.planTag] = planTag = Tag.pool.find(this, Task.planTag);
            tags = new DSTags(this, newTags);
            task.set('tags', tags);
            tags.release(this);
          }
          break;
        case 'tags':
          Task.TWTask.calcTaskPriority(task);
          console.info('set plan');
          task.set('plan', !!(val && val.get(Task.planTag)));
      }
    }
  };

  processTagsOriginal = {
    __onChange: function(task, propName, val, oldVal) {
      if (propName === 'tags') {
        Task.TWTask.calcTaskPriority(task);
      }
    }
  };

  Task.ds_ctor.push(function() {
    if (this.__proto__.constructor.ds_editable) {
      if (this.hasOwnProperty('$ds_evt')) {
        this.$ds_evt.push(processTagsEditable);
      } else {
        this.$ds_evt = [processTagsEditable];
      }
    } else {
      if (this.hasOwnProperty('$ds_evt')) {
        this.$ds_evt.push(processTagsOriginal);
      } else {
        this.$ds_evt = [processTagsOriginal];
      }
    }
  });

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

  Task.propComments('comments');

  Task.propDoc('timeTracking', TaskTimeTracking);

  Task.propStr('firstTimeEntryId');

  Task.propBool('completed');

  Task.propBool('isReady');

  Task.propBool('plan');

  Task.propDSTags('tags');

  Task.propNum('priority', 1000, null, true);

  Task.propObj('style', (function() {
    return defaultTag;
  }), null, true);

  Task.prototype.isOverdue = (function() {
    var duedate;
    return (duedate = this.get('duedate')) !== null && duedate < time.today;
  });

  Task.prototype.timeWithinEstimate = (function() {
    var estimate;
    if ((estimate = this.get('estimate')) === null) {
      return 0;
    }
    return Math.min(100, Math.round(this.get('timeTracking').get('totalMin') * 100 / estimate.asMinutes()));
  });

  Task.prototype.timeAboveEstimate = (function() {
    var estimate, percent;
    if ((estimate = this.get('estimate')) === null) {
      return 0;
    }
    if ((percent = Math.round(this.get('timeTracking').get('totalMin') * 100 / estimate.asMinutes())) <= 100) {
      return 0;
    } else if (percent > 200) {
      return 100;
    } else {
      return percent - 100;
    }
  });

  Task.prototype.timeReported = (function() {
    var estimate, percent;
    if ((estimate = this.get('estimate')) === null) {
      return '';
    }
    if ((percent = Math.round(this.get('timeTracking').get('totalMin') * 100 / estimate.asMinutes())) > 200) {
      return percent + " %";
    } else {
      return '';
    }
  });

  Task.prototype.grade = (function() {
    var estimate;
    if ((estimate = this.get('estimate')) === null) {
      return '';
    }
    if (estimate.asMinutes() < 60) {
      return 'easy';
    }
    if (estimate.asMinutes() >= 60 && estimate.asMinutes() < 240) {
      return 'medium';
    }
    if (estimate.asMinutes() >= 240 && estimate.asMinutes() < 480) {
      return 'hard';
    }
    if (estimate.asMinutes() >= 480) {
      return 'complex';
    }
  });

  Task.prototype.setVisible = (function(isVisible) {
    var ref, ref1;
    if (isVisible) {
      if ((this.__visCount = (this.__visCount || 0) + 1) === 1) {
        if ((ref = this.get('timeTracking')) != null) {
          ref.setVisible(true);
        }
      }
    } else if (--this.__visCount === 0) {
      if ((ref1 = this.get('timeTracking')) != null) {
        ref1.setVisible(false);
      }
    }
  });

  Task.end();

  originalEditableInit = Task.Editable.prototype.init;

  Task.Editable.prototype.init = function() {
    originalEditableInit.apply(this, arguments);
    Task.TWTask.calcTaskPriority(this);
  };

  return Task;

})(DSDocument);


},{"../../dscommon/DSDocument":57,"../../dscommon/DSTags":64,"../../dscommon/util":66,"../ui/time":34,"./Person":14,"./Project":17,"./Tag":18,"./TaskTimeTracking":20,"./TodoList":21,"./types/Comments":22,"./types/TaskSplit":23}],20:[function(require,module,exports){
var DSObject, TaskTimeTracking,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../dscommon/DSObject');

module.exports = TaskTimeTracking = (function(superClass) {
  extend(TaskTimeTracking, superClass);

  function TaskTimeTracking() {
    return TaskTimeTracking.__super__.constructor.apply(this, arguments);
  }

  TaskTimeTracking.begin('TaskTimeTracking');

  TaskTimeTracking.addPool(true);

  TaskTimeTracking.propNum('taskId', 0);

  TaskTimeTracking.propBool('isReady');

  TaskTimeTracking.propNum('totalMin', 0);

  TaskTimeTracking.propNum('priorTodayMin', 0);

  TaskTimeTracking.propObj('timeEntries', {});

  TaskTimeTracking.end();

  return TaskTimeTracking;

})(DSObject);


},{"../../dscommon/DSObject":60}],21:[function(require,module,exports){
var DSObject, Project, TodoList, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

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


},{"../../dscommon/DSObject":60,"../../dscommon/util":66,"./Project":17}],22:[function(require,module,exports){
var Comments, DSDocument, assert, error;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSDocument = require('../../../dscommon/DSDocument');

module.exports = Comments = (function() {
  var class1, zero;

  function Comments() {
    return class1.apply(this, arguments);
  }

  Comments.addPropType = (function(clazz) {
    clazz.propComments = (function(name, valid) {
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
        if ((value === null || Array.isArray(value)) && q(value)) {
          return value;
        } else {
          return void 0;
        }
      }) : (function(value) {
        if (value === null || value instanceof Comments) {
          return value;
        } else {
          return void 0;
        }
      });
      return clazz.prop({
        name: name,
        type: 'comments',
        valid: valid,
        read: (function(v) {
          if (v !== null) {
            return new Comments(v);
          } else {
            return null;
          }
        }),
        str: (function() {
          return 'split';
        }),
        equal: (function(l, r) {
          var i, j, len, litem, ref;
          if (l === null || r === null) {
            return l === r;
          }
          if (l.list.length !== r.list.length) {
            return false;
          }
          ref = l.list;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            litem = ref[i];
            if (litem !== r.list[i]) {
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
    var j, len, src, v;
    if (assert) {
      if (arguments.length === 1 && typeof arguments[0] === 'object' && arguments[0].__proto__ === Comments.prototype) {
        void 0;
      } else if (arguments.length === 1 && Array.isArray(persisted)) {
        for (j = 0, len = persisted.length; j < len; j++) {
          v = persisted[j];
          if (!(typeof v === 'string')) {
            error.invalidArg('persisted');
          }
        }
      }
    }
    if (arguments.length === 1 && typeof (src = arguments[0]) === 'object' && src.__proto__ === Comments.prototype) {
      this.list = src.list.slice();
    } else {
      this.list = persisted || [];
    }
  });

  Comments.prototype.clone = (function() {
    return new Comments(this);
  });

  Comments.prototype.add = (function(comment) {
    this.list.push(comment);
  });

  Comments.prototype.unshift = (function(comment) {
    this.list.unshift(comment);
  });

  Comments.prototype.shift = (function() {
    return this.list.shift();
  });

  Comments.prototype.valueOf = (function() {
    return this.list;
  });

  Comments.prototype.clear = (function() {
    this.list = [];
  });

  return Comments;

})();


},{"../../../dscommon/DSDocument":57,"../../../dscommon/util":66}],23:[function(require,module,exports){
var DSDocument, TaskSplit, assert, error;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSDocument = require('../../../dscommon/DSDocument');

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
        str: (function(v) {
          if (v) {
            return 'split';
          } else {
            return '';
          }
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
          if (typeof newDuedate !== 'number') {
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
    delete this.value;
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


},{"../../../dscommon/DSDocument":57,"../../../dscommon/util":66}],24:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('app', ['ui.router', 'ui.select', require('./ui/ui'), require('./data/dsDataService'), require('./svc/emails/emails'), require('./db')])).name;

ngModule.run([
  'config', '$rootScope', 'db', (function(config, $rootScope, db) {
    $rootScope.Math = Math;
    $rootScope.taskModal = {};
    $rootScope.startDateVal = null;
    $rootScope.view3ActiveTab = null;
  })
]);

ngModule.config([
  '$urlRouterProvider', '$stateProvider', '$locationProvider', (function($urlRouterProvider, $stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
  })
]);


},{"./data/dsDataService":7,"./db":13,"./svc/emails/emails":25,"./ui/ui":35}],25:[function(require,module,exports){
var Person, Task, base64, ctrl, ngModule;

base64 = require('../../../utils/base64');

Task = require('../../models/Task');

Person = require('../../models/Person');

module.exports = (ngModule = angular.module('svc-emails', [require('../../data/dsDataService')])).name;

ngModule.config([
  '$urlRouterProvider', '$stateProvider', '$locationProvider', '$httpProvider', (function($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider) {
    $stateProvider.state({
      name: 'emails',
      url: '/emails',
      templateUrl: function() {
        return './svc/emails/main.html';
      },
      controller: ctrl
    });
  })
]);

ctrl = [
  '$scope', '$http', '$sce', 'config', 'dsDataService', (function($scope, $http, $sce, config, dsDataService) {
    var formatDuration, sendEmail;
    $scope.dateCheck = '';
    $scope.isDateCheckOk = (function() {
      if (!/\d{1,2}\.\d{2}\.\d{4}/.test($scope.dateCheck)) {
        return false;
      }
      return moment($scope.dateCheck, 'DD.MM.YYYY').startOf('day').valueOf() === moment().startOf('day').valueOf();
    });
    $scope.state = 'notStarted';
    $scope.data = null;
    $scope.formatDuration = formatDuration = (function(duration) {
      var hours, minutes, res;
      hours = Math.floor(duration.asHours());
      minutes = duration.minutes();
      res = hours ? hours + " ч." : '';
      if (minutes) {
        if (res) {
          res += ' ';
        }
        res += minutes + " мин.";
      }
      return res;
    });
    $scope.prepare = (function() {
      var compute, endDate, formatHours, peopleSet, startDate, tasksSet, unwatch1, unwatch2, watch;
      peopleSet = dsDataService.findDataSet(this, {
        type: Person,
        mode: 'original'
      });
      tasksSet = dsDataService.findDataSet(this, {
        type: Task,
        mode: 'original',
        filter: 'assigned',
        startDate: startDate = moment().startOf('week'),
        endDate: endDate = moment(startDate).add(6, 'days')
      });
      formatHours = (function(project) {
        var optHours, planHours, res;
        planHours = formatDuration(project.planHours);
        optHours = formatDuration(project.optHours);
        res = planHours;
        if (optHours) {
          if (res) {
            res += ' + ';
          }
          res += "<span style='background-color:rgb(255,153,0)'>" + optHours + "</span>";
        }
        project.hours = $sce.trustAsHtml(res);
        return project;
      });
      compute = (function() {
        var d, duedate, dur, emails, hours, i, len, people, person, project, projectKey, projectState, projects, ref, ref1, split, task, taskKey, totalHours;
        console.info('compute started...');
        $scope.emails = emails = [];
        ref = (people = _.sortBy(_.map(peopleSet.items), (function(person) {
          return person.get('name');
        })));
        for (i = 0, len = ref.length; i < len; i++) {
          person = ref[i];
          if (person.get('roles') === null) {
            continue;
          }
          projects = {};
          ref1 = tasksSet.items;
          for (taskKey in ref1) {
            task = ref1[taskKey];
            if (!(task.get('responsible') === person && task.get('estimate') !== null)) {
              continue;
            }
            if (task.get('todoList').get('id') === 462667) {
              continue;
            }
            if (!(projectState = projects[projectKey = (project = task.get('project')).$ds_key])) {
              projectState = projects[projectKey] = {
                id: project.get('id'),
                name: project.get('name'),
                planHours: moment.duration(),
                optHours: moment.duration(),
                manager: ''
              };
            }
            hours = task.get('title').toLowerCase().indexOf('бронь') !== -1 || task.get('todoList').get('name').toLowerCase().indexOf('бронь') !== -1 ? projectState.optHours : projectState.planHours;
            if ((split = task.get('split'))) {
              duedate = task.get('duedate');
              d = moment(startDate);
              while (d <= endDate) {
                if ((dur = split.get(duedate, d)) !== null) {
                  hours.add(dur);
                }
                d.add(1, 'day');
              }
            } else {
              hours.add(task.get('estimate'));
            }
          }
          totalHours = moment.duration();
          if ((projects = _.map(projects, (function(project) {
            totalHours.add(project.planHours);
            totalHours.add(project.optHouras);
            return formatHours(project);
          }))).length > 0) {
            projects = _.sortBy(projects, (function(project) {
              return project.name;
            }));
            emails.push({
              person: person,
              toName: person.get('firstName'),
              startDate: startDate.format('DD.MM'),
              endDate: endDate.format('DD.MM.YYYY'),
              totalHours: formatDuration(totalHours),
              projects: projects,
              status: 'notSent'
            });
          }
        }
        console.info('compute finished: ', emails);
      });
      watch = (function() {
        if (peopleSet.status === 'ready' && tasksSet.status === 'ready') {
          compute();
          unwatch1();
          unwatch2();
        }
      });
      unwatch1 = peopleSet.watchStatus(this, watch);
      unwatch2 = tasksSet.watchStatus(this, watch);
      peopleSet.release(this);
      tasksSet.release(this);
    });
    sendEmail = (function(index) {
      var cc, email, html, personRoles, to;
      email = $scope.emails[index];
      html = template({
        email: email
      });
      personRoles = email.person.get('roles');
      to = email.person.get('email');
      cc = 'managers@webprofy.ru';
      if (personRoles.get('Designer') || personRoles.get('Jr. Designer')) {
        cc += ', a.shevtsov@webprofy.ru, a.kolesnikov@webprofy.ru';
      }
      if (personRoles.get('Markuper')) {
        cc += ', n.skinteev@webprofy.ru, s.yastrebov@webprofy.ru';
      }
      console.info('to: ', to);
      console.info('cc: ', cc);
      $http({
        method: 'POST',
        url: 'https://thawing-chamber-8269.herokuapp.com/https://api.mailgun.net/v3/webprofy.ru/messages',
        data: $.param({
          to: email.person.get('email'),
          cc: cc,
          from: 'Татьяна Верхотурова <t.verkhoturova@webprofy.ru>',
          subject: email.title,
          html: html
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': "Basic " + (base64.encode('api:key-3ccadef54df260c8a2903da328ebb165'))
        }
      }).then((function(ok) {
        console.info('ok: ', ok);
        email.status = 'sent';
        if (index + 1 === $scope.emails.length) {
          $scope.state = 'completed';
        } else {
          sendEmail(index + 1);
        }
      }), (function(error) {
        console.error('error: ', error);
        $scope.state = 'error';
      }));
    });
    $scope.sendOut = (function() {
      $scope.state = 'inProgress';
      sendEmail(0);
    });
  })
];


},{"../../../utils/base64":68,"../../data/dsDataService":7,"../../models/Person":14,"../../models/Task":19}],26:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('ui/account/rmsAccount', [require('../../config')])).name;

ngModule.run([
  '$rootScope', (function($rootScope) {
    $rootScope.isShowAccount = false;
    $rootScope.showAccount = (function() {
      $rootScope.isShowAccount = !$rootScope.isShowAccount;
    });
  })
]);

ngModule.directive('rmsAccount', [
  'config', '$rootScope', (function(config, $rootScope) {
    return {
      restrict: 'A',
      scope: true,
      link: (function($scope, element, attrs) {
        var close;
        $scope.$evalAsync((function() {
          $($('input', element)[1]).select();
        }));
        $scope.url = config.teamwork;
        $scope.token = config.token;
        $scope.refreshPeriod = config.refreshPeriod;
        $scope.save = (function() {
          var token, url;
          url = $scope.url.trim();
          token = $scope.token.trim();
          if (url.length > 0) {
            if (url.charAt(url.length - 1) !== '/') {
              url += '/';
            }
          }
          config.teamwork = url;
          config.token = token;
          config.refreshPeriod = $scope.refreshPeriod;
          close();
        });
        $scope.close = close = (function() {
          $rootScope.isShowAccount = false;
        });
      })
    };
  })
]);


},{"../../config":2}],27:[function(require,module,exports){
var DSObject, assert, dayOfWeek, error, ngModule;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

module.exports = (ngModule = angular.module('ui/filters', [])).name;

dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

ngModule.run([
  '$rootScope', (function($rootScope) {
    $rootScope.filter = {
      calendarHeader: (function(doc, prop) {
        var date, dtString, month, props, type;
        if (assert) {
          if (!(doc instanceof DSObject)) {
            error.invalidArg('doc');
          }
          if (!((props = doc.__proto__.__props).hasOwnProperty(prop))) {
            error.invalidArg('prop');
          }
          if (!((type = props[prop].type) === 'moment')) {
            throw new Error("Expected property with type 'moment', but property '" + prop + "' has type " + type);
          }
        }
        if (!(date = doc.get(prop))) {
          throw new Error('Non null date expected in the header');
        }
        dtString = moment(date).format('YYYYMMDD');
        month = date.month() + 1;
        if (month < 10) {
          month = '0' + month;
        }
        return dayOfWeek[date.day()] + " " + (date.date()) + "/<small>" + month + "</small>";
      }),
      shortDate: (function(doc, prop) {
        var date, props, type;
        if (assert) {
          if (!(doc instanceof DSObject)) {
            error.invalidArg('doc');
          }
          if (!((props = doc.__proto__.__props).hasOwnProperty(prop))) {
            error.invalidArg('prop');
          }
          if (!((type = props[prop].type) === 'moment')) {
            throw new Error("Expected property with type 'moment', but property '" + prop + "' has type " + type);
          }
        }
        date = doc.get(prop);
        if (!date) {
          return '';
        } else {
          return date.format('DD.MM');
        }
      }),
      taskPeriod: (function(doc, prop, time) {
        var duration, hours, minutes, props, res, type;
        if (assert) {
          if (doc) {
            if (!(doc instanceof DSObject)) {
              error.invalidArg('doc');
            }
            if (!((props = doc.__proto__.__props).hasOwnProperty(prop))) {
              error.invalidArg('prop');
            }
            if (!((type = props[prop].type) === 'duration')) {
              throw new Error("Expected property with type 'duration', but property '" + prop + "' has type " + type);
            }
          }
        }
        res = '';
        if (time) {
          if (moment.isDuration(time)) {
            hours = Math.floor(time.asHours());
            minutes = time.minutes();
          } else {
            hours = Math.floor((time = time.get('timeMin')) / 60);
            minutes = time % 60;
          }
          if (hours || minutes) {
            res += hours ? hours + "h " : '';
            if (minutes) {
              res += minutes + "m";
            }
          } else {
            res += '0';
          }
        } else if (typeof time === null) {
          res += '0';
        }
        if (doc && (duration = doc.get(prop))) {
          if (typeof time !== 'undefined' && $rootScope.dataService.showTimeSpent) {
            res += ' / ';
          }
          hours = Math.floor(duration.asHours());
          minutes = duration.minutes();
          res += hours ? hours + "h" : '';
          if (hours && minutes) {
            res += ' ';
          }
          if (minutes) {
            res += minutes + "m";
          }
          if (!res) {
            res += '0';
          }
        }
        return res;
      }),
      taskPeriodLight: (function(duration) {
        var hours, minutes, res;
        if (assert) {
          if (!moment.isDuration(duration)) {
            error.invalidArg('duration');
          }
        }
        if (!duration) {
          return '';
        }
        hours = Math.floor(duration.asHours());
        minutes = duration.minutes();
        res = hours ? hours + "h" : '';
        if (minutes) {
          res += " " + minutes + "m";
        }
        if (!res) {
          res = '0';
        }
        return res;
      }),
      periodDiff: (function(diff) {
        var hours, minutes, res, val;
        if (assert) {
          if (!(diff === null || moment.isDuration(diff))) {
            error.invalidArg('diff');
          }
        }
        if (!diff || (val = diff.valueOf()) === null) {
          return '';
        }
        res = val < 0 ? (diff = moment.duration(-val), '- ') : '+ ';
        hours = Math.floor(diff.asHours());
        minutes = diff.minutes();
        res += hours + "h";
        if (minutes) {
          res += " " + minutes + "m";
        }
        if (!res) {
          res = '0';
        }
        return res;
      }),
      timeLeft: (function(diff) {
        var hours, minutes, res, val;
        if (assert) {
          if (!(diff === null || moment.isDuration(diff))) {
            error.invalidArg('diff');
          }
        }
        if (!diff || (val = diff.valueOf()) === null) {
          return '';
        }
        res = val < 0 ? (diff = moment.duration(-val), '- ') : '';
        hours = Math.floor(diff.asHours());
        minutes = diff.minutes();
        res += hours + "h " + (minutes < 10 ? '0' + minutes : minutes) + "m";
        return res;
      }),
      taskEditDueDate: (function(date) {
        if (assert) {
          if (!(!date || moment.isMoment(date))) {
            error.invalidArg('date');
          }
        }
        if (!date) {
          return '';
        } else {
          return date.format('DD.MM.YYYY');
        }
      }),
      splitDuration: (function(duration, time) {
        var hours, minutes, res;
        res = '';
        if (time) {
          hours = Math.floor((time = time.get('timeMin')) / 60);
          minutes = time % 60;
          if (hours || minutes) {
            res += hours ? hours + "h " : '';
            if (minutes) {
              res += minutes + "m";
            }
          } else {
            res += '0';
          }
        } else if (typeof time === null) {
          res += '0';
        }
        if (duration) {
          if (typeof time !== 'undefined' && $rootScope.dataService.showTimeSpent) {
            res += ' / ';
          }
          hours = Math.floor(duration.asHours());
          minutes = duration.minutes();
          res = hours ? hours + "h" : '';
          if (minutes) {
            res += " " + minutes + "m";
          }
          if (!res) {
            res = '0';
          }
        }
        return res;
      })
    };
  })
]);


},{"../../dscommon/DSObject":60,"../../dscommon/util":66}],28:[function(require,module,exports){
var DOMWrapper, actionsMinWidth, actionsWidth, area1MinHeight, area1MinWidth, area2MinHeight, area3MinWidth, assert, error, headerHeight, ngModule, windowMinHeight, windowMinWidth;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

module.exports = (ngModule = angular.module('ui/layout', [])).name;

area1MinHeight = 140;

area1MinWidth = 730;

area2MinHeight = 10;

area3MinWidth = 10;

windowMinWidth = 900;

windowMinHeight = area1MinHeight + area3MinWidth;

headerHeight = 40;

actionsWidth = 440;

actionsMinWidth = 440;

ngModule.directive("uiLayout", [
  'config', '$window', '$rootScope', (function(config, $window, $rootScope) {
    $window = $($window);
    return {
      restrict: 'A',
      controller: [
        '$scope', (function($scope) {
          var digest;
          $scope.layout = this;
          this.area1 = {};
          this.area2 = {};
          this.area3 = {};
          this.width = $window.width();
          this.area3.height = (this.height = $window.height() - headerHeight);
          digest = (function() {
            $rootScope.$digest();
            $rootScope.$broadcast('layout-update');
          });
          (this.setVResizer = (function(v, noDigest) {
            var w;
            w = this.area1.width = this.area2.width = this.vResizer = Math.min(Math.max(Math.round(v), area1MinWidth), this.width - area3MinWidth);
            this.area3.width = this.width - w;
            config.set('vResizer', this.area1.width / this.width);
            if (!noDigest) {
              digest();
            }
          })).call(this, this.width * (config.get('vResizer') || 0.68), true);
          (this.setHResizer = (function(v, noDigest) {
            var h;
            h = this.area1.height = this.hResizer = Math.min(Math.max(Math.round(v), area1MinHeight), this.height - area2MinHeight);
            this.area2.height = this.height - h;
            config.set('hResizer', this.area1.height / this.height);
            if (!noDigest) {
              digest();
            }
          })).call(this, this.height * (config.get('hResizer') || 0.68), true);
          this.setSize = (function(width, height, noDigest) {
            var change, oldHeight, oldWidth;
            height -= headerHeight;
            change = false;
            if ((oldWidth = this.width) !== width) {
              change = true;
              this.setVResizer(this.vResizer * ((this.width = Math.max(width, windowMinWidth)) / oldWidth), true);
            }
            if ((oldHeight = this.height) !== height) {
              change = true;
              this.setHResizer(this.hResizer * ((this.height = Math.max(height, windowMinHeight)) / oldHeight), true);
              this.area3.height = height;
            }
            if (change && !noDigest) {
              digest();
            }
          });
        })
      ],
      link: (function($scope, element, attrs, uiLayout) {
        var onResize;
        $window.on('resize', onResize = (function() {
          uiLayout.setSize($window.width(), $window.height());
        }));
        $scope.$on('$destroy', (function() {
          $window.off('resize', onResize);
        }));
      })
    };
  })
]);

ngModule.directive('uiLayoutResizer', [
  '$document', (function($document) {
    return {
      restrict: 'A',
      require: '^uiLayout',
      link: (function($scope, element, attrs, uiLayout) {
        var isHorizontal, mousemove, mouseup, onMouseDown;
        isHorizontal = attrs.uiLayoutResizer === 'horizontal';
        element.on('mousedown', onMouseDown = (function(event) {
          event.preventDefault();
          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        }));
        mousemove = isHorizontal ? (function(event) {
          uiLayout.setHResizer(event.pageY - headerHeight);
        }) : (function(event) {
          uiLayout.setVResizer(event.pageX);
        });
        mouseup = (function(event) {
          $document.off('mousemove', mousemove);
          $document.off('mouseup', mouseup);
        });
        $scope.$on('$destroy', (function() {
          $document.off('mousedown', onMouseDown);
          mouseup();
        }));
      })
    };
  })
]);

DOMWrapper = (function() {
  var class1;

  function DOMWrapper() {
    return class1.apply(this, arguments);
  }

  class1 = (function(DOMElement) {
    this.elem = DOMElement;
  });

  DOMWrapper.prototype.innerHeight = (function() {
    return this.elem.innerHeight();
  });

  return DOMWrapper;

})();

ngModule.directive('uiLayoutContainer', [
  '$document', (function($document) {
    return {
      restrict: 'A',
      link: (function($scope, element, attrs) {
        $scope.uiContainer = new DOMWrapper(element);
      })
    };
  })
]);


},{"../../dscommon/util":66}],29:[function(require,module,exports){
var DSObject, Person, PersonDayStat, Task, TaskSplit, assert, ngModule, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/tasks/TaskSplitWeekView', [require('../../../dscommon/DSView')])).name;

assert = require('../../../dscommon/util').assert;

DSObject = require('../../../dscommon/DSObject');

TaskSplit = require('../../models/types/TaskSplit');

Task = require('../../models/Task');

Person = require('../../models/Person');

PersonDayStat = require('../../models/PersonDayStat');

time = require('../time');

ngModule.factory('TaskSplitWeekView', [
  'DSView', '$log', (function(DSView, $log) {
    var DayModel, TaskSplitWeekView;
    DayModel = (function(superClass) {
      extend(DayModel, superClass);

      function DayModel() {
        return DayModel.__super__.constructor.apply(this, arguments);
      }

      DayModel.begin('DayModel');

      DayModel.ds_dstr.push((function() {
        if (typeof this.__unwatch1 === "function") {
          this.__unwatch1();
        }
        if (typeof this.__unwatch2 === "function") {
          this.__unwatch2();
        }
      }));

      DayModel.propDuration('timeLeft');

      DayModel.propDuration('timeLeftShow');

      DayModel.propObj('plan');

      DayModel.propDuration('initPlan');

      DayModel.propBool('select');

      DayModel.end();

      return DayModel;

    })(DSObject);
    return TaskSplitWeekView = (function(superClass) {
      var class1;

      extend(TaskSplitWeekView, superClass);

      function TaskSplitWeekView() {
        return class1.apply(this, arguments);
      }

      TaskSplitWeekView.begin('TaskSplitWeekView');

      TaskSplit.addPropType(TaskSplitWeekView);

      TaskSplitWeekView.propData('personDayStat', PersonDayStat, {
        mode: 'edited'
      });

      TaskSplitWeekView.propList('days', DayModel);

      TaskSplitWeekView.propMoment('monday');

      TaskSplitWeekView.propDoc('responsible', Person);

      TaskSplitWeekView.propMoment('today');

      TaskSplitWeekView.propMoment('duedate');

      TaskSplitWeekView.propTaskRelativeSplit('split');

      class1 = (function($scope, key, getDuedate, split, monday) {
        var d, date, dayModel, days, initSplit, splitDuedate;
        if (assert) {
          if (!typeof getDuedate === 'function') {
            error.invalidArg('getDuedate');
          }
          if (!split instanceof TaskSplit) {
            error.invalidArg('split');
          }
          if (!moment.isMoment(monday)) {
            error.invalidArg('monday');
          }
          if (!typeof getPerson === 'function') {
            error.invalidArg('getPerson');
          }
          if (!typeof getDuedate === 'function') {
            error.invalidArg('getDuedate');
          }
        }
        DSView.call(this, $scope, key);
        this.set('split', split);
        this.set('monday', monday);
        $scope.$watch('edit.responsible', ((function(_this) {
          return function(responsible) {
            _this.set('responsible', responsible);
            _this.__dirty++;
          };
        })(this)));
        this.dataUpdate({
          startDate: monday,
          endDate: moment(monday).endOf('week'),
          mode: $scope.mode
        });
        initSplit = $scope.edit.split;
        splitDuedate = $scope.edit.splitDuedate;
        date = moment(monday);
        this.get('daysList').merge(this, days = (function() {
          var fn, j, results;
          fn = (function(_this) {
            return function(dayModel, date) {
              var initPlan;
              dayModel.set('initPlan', initPlan = initSplit === null ? null : initSplit.get(splitDuedate, date));
              dayModel.set('plan', split.day(getDuedate, date));
              if (date.valueOf() === time.today) {
                dayModel.set('select', true);
              } else if (date > time.today) {
                dayModel.__unwatch1 = $scope.$watch('edit.duedate', (function(duedate) {
                  dayModel.set('select', duedate !== null && date <= duedate);
                }));
              }
              return dayModel.__unwatch2 = $scope.$watch((function() {
                var ref, ref1, ref2;
                return [(ref = $scope.$eval('edit.responsible')) != null ? ref.$ds_key : void 0, (ref1 = dayModel.get('plan')) != null ? ref1.val : void 0, (ref2 = dayModel.get('timeLeft')) != null ? ref2.valueOf() : void 0];
              }), (function(arg) {
                var diff, plan, responsible, responsibleKey, timeLeft;
                responsibleKey = arg[0], plan = arg[1], timeLeft = arg[2];
                if (typeof timeLeft !== 'number') {
                  dayModel.set('timeLeftShow', null);
                } else {
                  diff = moment.duration(timeLeft);
                  if (initPlan !== null && (responsible = $scope.task.get('responsible')) !== null && responsible.$ds_key === responsibleKey) {
                    diff.add(initPlan);
                  }
                  if (moment.isDuration(plan)) {
                    diff.subtract(plan);
                  }
                  dayModel.set('timeLeftShow', diff);
                }
              }), true);
            };
          })(this);
          results = [];
          for (d = j = 0; j < 7; d = ++j) {
            dayModel = new DayModel(this, "" + d);
            fn(dayModel, date);
            (date = moment(date)).add(1, 'day');
            results.push(dayModel);
          }
          return results;
        }).call(this));
      });

      TaskSplitWeekView.prototype.render = (function() {
        var d, dayStats, i, j, k, len, len1, ref, ref1, responsible, status;
        if ((responsible = this.get('responsible')) !== null && ((status = this.data.get('personDayStatStatus')) === 'ready' || status === 'update')) {
          if (assert) {
            if (!this.data.get('personDayStat').hasOwnProperty(responsible.$ds_key)) {
              throw new Error('Missing person');
            }
          }
          dayStats = this.data.get('personDayStat')[responsible.$ds_key].get('dayStats');
          ref = this.get('days');
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            d = ref[i];
            d.set('timeLeft', dayStats[i].get('timeLeft'));
          }
        } else {
          ref1 = this.get('days');
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            d = ref1[k];
            d.set('timeLeft', null);
          }
        }
      });

      TaskSplitWeekView.end();

      return TaskSplitWeekView;

    })(DSView);
  })
]);


},{"../../../dscommon/DSObject":60,"../../../dscommon/DSView":65,"../../../dscommon/util":66,"../../models/Person":14,"../../models/PersonDayStat":15,"../../models/Task":19,"../../models/types/TaskSplit":23,"../time":34}],30:[function(require,module,exports){
var Comments, DSDigest, DSDocument, DSObject, Person, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

serviceOwner = require('../../../dscommon/util').serviceOwner;

DSObject = require('../../../dscommon/DSObject');

DSDocument = require('../../../dscommon/DSDocument');

DSDigest = require('../../../dscommon/DSDigest');

Comments = require('../../models/types/Comments');

Person = require('../../models/Person');

module.exports = (ngModule = angular.module('ui/tasks/addCommentAndSave', [require('../../config'), require('../../data/dsDataService'), require('../../data/dsChanges')])).name;

ngModule.run([
  '$rootScope', (function($rootScope) {
    $rootScope.AddCommentAndSave = null;
  })
]);

ngModule.factory('addCommentAndSave', [
  'dsDataService', 'dsChanges', 'config', '$rootScope', '$q', (function(dsDataService, dsChanges, config, $rootScope, $q) {
    var AddCommentAndSave, instance;
    AddCommentAndSave = (function(superClass) {
      extend(AddCommentAndSave, superClass);

      function AddCommentAndSave() {
        return AddCommentAndSave.__super__.constructor.apply(this, arguments);
      }

      AddCommentAndSave.begin('AddCommentAndSave');

      AddCommentAndSave.propDoc('document', DSDocument);

      AddCommentAndSave.propList('documents', DSDocument);

      AddCommentAndSave.propObj('changes');

      AddCommentAndSave.propStr('reason', '');

      AddCommentAndSave.propBool('plansChange');

      AddCommentAndSave.prototype.show = (function(document, showDialog, changes) {
        var anyChange, doc, i, j, len, len1, newChanges, plansChange, promise, propDesc, propName, ref, value;
        if (assert) {
          if (!(document !== null && ((Array.isArray(document) && document.length > 0 && document[0] instanceof DSDocument) || document instanceof DSDocument))) {
            error.invalidArg('document');
          }
          if (!(typeof showDialog === 'boolean')) {
            error.invalidArg('showDialog');
          }
          if (!(changes !== null && typeof changes === 'object')) {
            error.invalidArg('changes');
          }
        }
        this.__deferred = $q.defer();
        if (changes.hasOwnProperty('plan') && !changes.plan) {
          if (Array.isArray(document)) {
            for (i = 0, len = document.length; i < len; i++) {
              doc = document[i];
              if (!(doc.get('plan'))) {
                continue;
              }
              plansChange = this.set('plansChange', true);
              break;
            }
          } else if (document.get('plan')) {
            plansChange = this.set('plansChange', true);
          }
        }
        if (Array.isArray(document)) {
          for (j = 0, len1 = document.length; j < len1; j++) {
            doc = document[j];
            doc.addRef(this);
          }
          this.get('documentsList').merge(this, document);
          document = this.set('document', document[0]);
        } else {
          this.set('document', document);
        }
        newChanges = [];
        anyChange = false;
        ref = document.__props;
        for (propName in ref) {
          propDesc = ref[propName];
          if (changes.hasOwnProperty(propName)) {
            if (!document.$u.hasOwnProperty(propName)) {
              console.error("Doc " + (document.toString()) + ": Prop " + propName + ": Property is not editable");
              continue;
            }
            if (typeof (propDesc.valid((value = changes[propName]))) === 'undefined') {
              console.error("Doc " + (document.toString()) + ": Prop " + propName + ": Invalid value '" + value + "'");
              continue;
            }
            if (!propDesc.equal(document.get(propName), value = changes[propName])) {
              anyChange = true;
              newChanges.push({
                propName: propName,
                value: value,
                text: (value === null ? '-' : propDesc.str(value))
              });
            }
            delete changes[propName];
          }
        }
        for (propName in changes) {
          console.error("Doc " + (document.toString()) + ": Has no property '" + propName + "'");
        }
        promise = this.__deferred.promise;
        if (!anyChange) {
          this.set('document', null);
          this.get('documentsList').merge(this, []);
          this.__deferred.resolve(true);
          delete this.__deferred;
        } else {
          this.set('changes', newChanges);
          if (showDialog || plansChange) {
            $rootScope.addCommentAndSave = this;
          } else {
            this.saveWOComment();
            this.freeDocs();
          }
        }
        return promise;
      });

      AddCommentAndSave.prototype.save = (function() {
        this.addCommentAndSave();
        $rootScope.addCommentAndSave = null;
      });

      AddCommentAndSave.prototype.cancel = (function() {
        this.freeDocs();
        $rootScope.addCommentAndSave = null;
        this.__deferred.resolve(false);
        delete this.__deferred;
      });

      AddCommentAndSave.prototype.freeDocs = (function() {
        this.set('reason', '');
        this.set('document', null);
        this.get('documentsList').merge(this, []);
        this.set('changes', null);
      });

      AddCommentAndSave.prototype.addCommentAndSave = (function() {
        DSDigest.block(((function(_this) {
          return function() {
            var change, comment, doc, docs, hist, i, j, k, len, len1, len2, ref, setComment;
            (hist = dsChanges.get('hist')).startBlock();
            try {
              doc = _this.get('document');
              if ((docs = _this.get('documents')).length === 0) {
                docs = null;
              }
              ref = _this.get('changes');
              for (i = 0, len = ref.length; i < len; i++) {
                change = ref[i];
                if (docs) {
                  for (j = 0, len1 = docs.length; j < len1; j++) {
                    doc = docs[j];
                    doc.set(change.propName, change.value);
                  }
                } else {
                  doc.set(change.propName, change.value);
                }
              }
              if ((comment = _this.get('reason').trim()).length > 0) {
                setComment = (function(doc) {
                  var comments;
                  comments = (comments = doc.get('comments')) === null ? new Comments : comments.clone();
                  comments.add(comment);
                  doc.set('comments', comments);
                });
                if (docs) {
                  for (k = 0, len2 = docs.length; k < len2; k++) {
                    doc = docs[k];
                    setComment(doc);
                  }
                } else {
                  setComment(doc);
                }
              }
            } finally {
              hist.endBlock();
            }
          };
        })(this)));
        this.freeDocs();
        this.__deferred.resolve(true);
        delete this.__deferred;
      });

      AddCommentAndSave.prototype.saveWOComment = (function() {
        DSDigest.block(((function(_this) {
          return function() {
            var change, doc, docs, hist, i, j, len, len1, ref;
            (hist = dsChanges.get('hist')).startBlock();
            try {
              doc = _this.get('document');
              if ((docs = _this.get('documents')).length === 0) {
                docs = null;
              }
              ref = _this.get('changes');
              for (i = 0, len = ref.length; i < len; i++) {
                change = ref[i];
                if (docs) {
                  for (j = 0, len1 = docs.length; j < len1; j++) {
                    doc = docs[j];
                    doc.set(change.propName, change.value);
                  }
                } else {
                  doc.set(change.propName, change.value);
                }
              }
            } finally {
              hist.endBlock();
            }
          };
        })(this)));
        this.freeDocs();
        this.__deferred.resolve(true);
        delete this.__deferred;
      });

      AddCommentAndSave.end();

      return AddCommentAndSave;

    })(DSObject);
    instance = serviceOwner.add(new AddCommentAndSave(serviceOwner, 'addCommentAndSave'));
    return (function(document, showDialog, changes) {
      return instance.show(document, showDialog, changes);
    });
  })
]);


},{"../../../dscommon/DSDigest":56,"../../../dscommon/DSDocument":57,"../../../dscommon/DSObject":60,"../../../dscommon/util":66,"../../config":2,"../../data/dsChanges":6,"../../data/dsDataService":7,"../../models/Person":14,"../../models/types/Comments":22}],31:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('ui/tasks/rmsTask', [])).name;

ngModule.run([
  '$rootScope', function($rootScope) {
    $rootScope.modal = {
      type: null
    };
  }
]);

ngModule.directive('rmsTask', [
  '$rootScope', '$timeout', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function($scope, element, attrs, model) {
        var listenerFunc;
        element.on('click', (function(e) {
          var modal;
          e.stopPropagation();
          if ((modal = $rootScope.modal).type !== 'task-edit') {
            $rootScope.modal = {
              type: 'task-edit',
              task: model.$viewValue,
              pos: element.offset()
            };
            $rootScope.$digest();
          } else if (modal.task !== model.$viewValue) {
            $rootScope.modal = {
              type: null
            };
            $rootScope.$digest();
            $rootScope.$evalAsync((function() {
              $rootScope.modal = {
                type: 'task-edit',
                task: model.$viewValue,
                pos: element.offset()
              };
            }), 0);
          }
        }));
        element.on('mouseover', (function(e) {
          e.stopPropagation();
          if (0 <= ['task-info', null].indexOf($rootScope.modal.type)) {
            $rootScope.modal = {
              type: 'task-info',
              task: model.$viewValue,
              pos: element.offset()
            };
            $rootScope.$digest();
          }
        }));
        element.on('mouseleave', (function(e) {
          e.stopPropagation();
          if (0 <= ['task-info'].indexOf($rootScope.modal.type)) {
            $rootScope.modal = {
              type: null
            };
            $rootScope.$digest();
          }
        }));
        listenerFunc = void 0;
        if (attrs.rmsTask !== 'taskView.time.task') {
          $scope.$watch(attrs.rmsTask + ".style", function(style) {
            element.css('background-color', style.color ? style.color : '');
            element.css('border', style.border ? style.border : '');
          });
        }
        $scope.$watch(attrs.rmsTask + ".$u", function(val) {
          var el;
          if (val) {
            el = element[0];
            el.draggable = true;
            el.addEventListener('dragstart', listenerFunc = function(ev) {
              var task;
              $rootScope.modal = {
                type: 'drag-start',
                task: task = $scope.$eval(attrs.rmsTask),
                scope: $scope
              };
              $rootScope.$digest();
              element.addClass('drag-start');
              ev.dataTransfer.effectAllowed = 'move';
              ev.dataTransfer.setData('task', task);
              ev.dataTransfer.setDragImage($('#task-drag-ghost')[0], 20, 20);
              return true;
            });
            el.addEventListener('dragend', function(ev) {
              $rootScope.modal = {
                type: null
              };
              element.removeClass('drag-start');
              $rootScope.$digest();
              return true;
            });
          } else {
            el = element[0];
            el.draggable = false;
            el.removeEventListener('dragstart', listenerFunc);
            element.off('dragend');
          }
        });
      }
    };
  }
]);

ngModule.directive('setTaskVisible', [
  function() {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {
        var path;
        path = attrs.setTaskVisible;
        $scope.$eval(path + ".setVisible(true)");
        $scope.$on('$destroy', function() {
          $scope.$eval(path + ".setVisible(false)");
        });
      }
    };
  }
]);


},{}],32:[function(require,module,exports){
var DSDigest, Person, PersonDayStat, TaskSplit, assert, ngModule, splitViewWeeksCount, time;

module.exports = (ngModule = angular.module('ui/tasks/rmsTaskEdit', [require('../../data/dsChanges'), require('../../data/dsDataService'), require('./TaskSplitWeekView'), require('./addCommentAndSave')])).name;

assert = require('../../../dscommon/util').assert;

time = require('../../ui/time');

DSDigest = require('../../../dscommon/DSDigest');

Person = require('../../models/Person');

TaskSplit = require('../../models/types/TaskSplit');

PersonDayStat = require('../../models/PersonDayStat');

splitViewWeeksCount = 3;

ngModule.directive('rmsTaskEdit', [
  'TaskSplitWeekView', 'dsDataService', 'dsChanges', 'addCommentAndSave', '$rootScope', '$window', '$timeout', (function(TaskSplitWeekView, dsDataService, dsChanges, addCommentAndSave, $rootScope, $window, $timeout) {
    return {
      restrict: 'A',
      scope: true,
      link: (function($scope, element, attrs) {
        var close, duedate, edit, first, last, makeSplitView, modal, newTaskSplitWeekView, releaseSplitView, split, task, thisWeek, unwatchSplitLastDate, weeks;
        modal = $rootScope.modal;
        $scope.edit = edit = {};
        unwatchSplitLastDate = null;
        newTaskSplitWeekView = (function(monday) {
          return new TaskSplitWeekView($scope, "TaskSplitWeekView " + (monday.format()), (function() {
            return edit.splitDuedate;
          }), edit.split, monday);
        });
        makeSplitView = (function() {
          var monday, view, w;
          monday = edit.firstWeek;
          edit.splitView = (function() {
            var i, ref, results;
            results = [];
            for (w = i = 0, ref = splitViewWeeksCount; 0 <= ref ? i < ref : i > ref; w = 0 <= ref ? ++i : --i) {
              view = newTaskSplitWeekView(monday);
              (monday = moment(monday)).add(1, 'week');
              results.push(view);
            }
            return results;
          })();
          unwatchSplitLastDate = $scope.$watch((function() {
            var ref;
            return (ref = edit.split.lastDate(edit.splitDuedate)) != null ? ref.valueOf() : void 0;
          }), (function(lastDateValue) {
            var lastDate;
            if (!typeof lastDateValue === 'number') {
              return;
            }
            edit.split.shift((lastDate = moment(lastDateValue)), edit.splitDuedate);
            edit.splitDuedate = lastDate;
          }));
        });
        releaseSplitView = (function() {
          var i, len, ref, v;
          ref = edit.splitView;
          for (i = 0, len = ref.length; i < len; i++) {
            v = ref[i];
            v.release($scope);
          }
          edit.splitView = null;
          unwatchSplitLastDate();
        });
        $scope.$evalAsync((function() {
          $($('input', element)[1]).select();
        }));
        $scope.people = _.map(Person.pool.items, (function(person) {
          return person;
        }));
        $scope.task = task = modal.task;
        $scope.$watch((function() {
          return time.today.valueOf();
        }), (function() {
          return $scope.today = time.today;
        }));
        edit.title = task.get('title');
        edit.duedate = duedate = task.get('duedate');
        edit.estimate = task.get('estimate');
        edit.responsible = task.get('responsible');
        edit.splitDiff = null;
        edit.firstWeek = thisWeek = moment().startOf('week');
        edit.splitDuedate = duedate !== null ? duedate : moment().startOf('day');
        if (edit.isSplit = (edit.split = (split = task.get('split')) !== null ? split.clone() : null) !== null) {
          first = moment(split.firstDate(duedate)).startOf('week');
          last = moment(split.lastDate(duedate)).startOf('week');
          if ((weeks = moment.duration(last.diff(first)).asWeeks()) < splitViewWeeksCount) {
            if (first.isBefore(thisWeek)) {
              edit.firstWeek = first;
            } else if (!(moment.duration(last.diff(thisWeek)).asWeeks() <= splitViewWeeksCount)) {
              edit.firstWeek = last.subtract(splitViewWeeksCount - 1, 'week');
            }
          } else {
            edit.firstWeek = first;
          }
          makeSplitView();
        } else {
          edit.splitView = null;
        }
        if (!($scope.viewonly = !task.$u || _.isEmpty(task.$u))) {
          $scope.changes = false;
          $scope.$watch((function() {
            var estimate, res, responsible, val;
            res = [edit.title, (duedate = edit.duedate) === null ? null : duedate.valueOf(), (estimate = edit.estimate) === null ? null : estimate.valueOf(), (responsible = edit.responsible) === null ? null : responsible.$ds_key];
            if ((split = edit.split) !== null && (val = split.valueOf()).length > 0) {
              res = res.concat(val);
            }
            return res;
          }), (function(val, oldVal) {
            $scope.changes = val !== oldVal;
          }), true);
          $scope.$watch((function() {
            return edit.isSplit;
          }), (function(isSplit) {
            var ref;
            if (isSplit) {
              if (edit.split === null) {
                edit.split = new TaskSplit();
              }
              if (edit.splitView === null) {
                makeSplitView();
              }
            } else {
              if (edit.splitView !== null) {
                releaseSplitView();
              }
            }
            if (((ref = edit.split) != null ? ref.valueOf().length : void 0) > 0) {
              $scope.changes = true;
            }
          }));
          $scope.$watch((function() {
            var ref;
            return (ref = edit.duedate) != null ? ref.valueOf() : void 0;
          }), (function(duedateValue, oldDuedateValue) {
            if (duedateValue === oldDuedateValue || !typeof duedateValue === 'number') {
              return;
            }
            $scope.changes = true;
            if (edit.split !== null && duedateValue !== null && oldDuedateValue !== null) {
              edit.splitDuedate.add(duedateValue - oldDuedateValue);
            }
          }));
          $scope.$watch((function() {
            var ref;
            return [(ref = edit.estimate) != null ? ref.valueOf() : void 0, edit.isSplit, edit.split];
          }), (function(arg) {
            var estimateVal, isSplit, newDiff, newVal, split, splitDiff;
            estimateVal = arg[0], isSplit = arg[1], split = arg[2];
            if (typeof estimateVal === 'number' && isSplit && split !== null) {
              newVal = (newDiff = moment.duration(split.total).subtract(estimateVal)).valueOf();
              edit.splitDiff = newVal !== 0 && ((splitDiff = edit.splitDiff) === null || splitDiff.valueOf() !== newVal) ? newDiff : null;
            } else {
              edit.splitDiff = null;
            }
          }), true);
          $scope.splitPrevWeek = (function() {
            edit.firstWeek.subtract(1, 'week');
            edit.splitView.unshift(newTaskSplitWeekView(edit.firstWeek));
            edit.splitView.pop().release($scope);
          });
          $scope.splitNextWeek = (function() {
            var monday;
            monday = moment(edit.firstWeek.add(1, 'week')).add(splitViewWeeksCount - 1, 'week');
            edit.splitView.push(newTaskSplitWeekView(monday));
            edit.splitView.shift().release($scope);
          });
        }
        $scope.close = close = (function() {
          $rootScope.modal = {
            type: null
          };
        });
        $scope.save = (function($event, plan) {
          var diff, estimate, splitTotal, update;
          if (assert) {
            if (!(typeof plan === 'undefined' || typeof plan === 'boolean')) {
              error.invalidArg('plan');
            }
          }
          if (edit.isSplit && edit.split.list.length > 0) {
            edit.duedate = edit.splitDuedate;
            splitTotal = split.total;
            if ((estimate = edit.estimate) === null) {
              edit.estimate = splitTotal;
            } else if ((diff = estimate.valueOf() - splitTotal.valueOf()) !== 0) {
              split.fixEstimate(diff);
            }
          }
          update = {
            title: edit.title,
            duedate: edit.duedate,
            estimate: edit.estimate,
            responsible: edit.responsible,
            split: edit.isSplit && edit.split.valueOf().length > 0 ? edit.split : null
          };
          if (typeof plan === 'boolean') {
            update.plan = plan;
          }
          addCommentAndSave(task, $event.shiftKey, update).then((function(saved) {
            if (saved) {
              close();
            }
          }));
        });
        $scope.showTimeLeft = (function(dayModel) {
          var diff, hours, initPlan, minutes, plan, res, timeLeft, val;
          if ((timeLeft = dayModel.get('timeLeft')) === null) {
            return '';
          }
          plan = dayModel.get('plan');
          initPlan = dayModel.get('initPlan');
          diff = moment.duration(timeLeft);
          if (initPlan !== null && $scope.task.get('responsible') === edit.responsible) {
            diff.add(initPlan);
          }
          if ((val = plan.val) !== null) {
            diff.subtract(val);
          }
          res = (val = diff.valueOf()) < 0 ? (diff = moment.duration(-val), '- ') : '';
          hours = Math.floor(diff.asHours());
          minutes = diff.minutes();
          res += hours + "h " + (minutes < 10 ? '0' + minutes : minutes) + "m";
          return res;
        });
        $scope.$on('$destroy', (function() {
          if (typeof $scope._unwatch === "function") {
            $scope._unwatch();
          }
        }));
        $scope.autoSplitInProgress = false;
        return $scope.autoSplit = (function() {
          var d, e, initDuedate, initSplit, ref, ref1, reponsibleKey, splitWithinWeek;
          if (assert) {
            if (!(edit.duedate !== null && time.today <= edit.duedate)) {
              throw new Error("Invalid duedate: " + ((ref = edit.duedate) != null ? ref.format() : void 0));
            }
            if (!(edit.responsible !== null)) {
              throw new Error("Invalid value 'edit.responsible': " + edit.responsible);
            }
            if (!(edit.estimate !== null && edit.estimate > 0)) {
              throw new Error("Invalid value 'edit.estimate': " + ((ref1 = edit.estimate) != null ? ref1.valueOf() : void 0));
            }
          }
          $scope.autoSplitInProgress = true;
          reponsibleKey = edit.responsible.$ds_key;
          d = moment(duedate = edit.duedate);
          e = moment.duration(edit.estimate);
          (split = edit.split).clear();
          edit.splitDuedate = moment(d);
          initDuedate = $scope.task.get('duedate');
          initSplit = initDuedate !== null && $scope.edit.responsible === $scope.task.get('responsible') ? $scope.task.get('split') : null;
          splitWithinWeek = (function() {
            var personDayStatSet, weekStart;
            personDayStatSet = dsDataService.findDataSet($scope, {
              type: PersonDayStat,
              mode: 'edited',
              startDate: weekStart = moment(d).startOf('week'),
              endDate: moment(d).endOf('week')
            });
            $scope._unwatch = personDayStatSet.watchStatus($scope, (function(set, status, prevStatus, unwatch) {
              var dayStat, dayStats, dayTime, initPlan, timeLeft;
              if (status !== 'ready') {
                return;
              }
              dayStats = set.items[reponsibleKey].get('dayStats');
              while (e > 0 && time.today <= d && weekStart <= d) {
                timeLeft = (dayStat = dayStats[moment.duration(d.diff(weekStart)).asDays()]).timeLeft;
                if (initSplit !== null) {
                  if ((initPlan = initSplit.get(initDuedate, d)) !== null) {
                    (timeLeft = moment.duration(timeLeft)).add(initPlan);
                  }
                }
                if (timeLeft > 0) {
                  split.set(duedate, d, (dayTime = moment.duration(Math.min(timeLeft.valueOf(), e.valueOf()))));
                  e.subtract(dayTime);
                }
                d.subtract(1, 'day');
              }
              unwatch();
              delete $scope._unwatch;
              if (e > 0 && time.today <= d) {
                d.subtract(2, 'days');
                splitWithinWeek();
              } else {
                $scope.autoSplitInProgress = false;
              }
            }));
            personDayStatSet.release($scope);
          });
          splitWithinWeek();
        });
      })
    };
  })
]);


},{"../../../dscommon/DSDigest":56,"../../../dscommon/util":66,"../../data/dsChanges":6,"../../data/dsDataService":7,"../../models/Person":14,"../../models/PersonDayStat":15,"../../models/types/TaskSplit":23,"../../ui/time":34,"./TaskSplitWeekView":29,"./addCommentAndSave":30}],33:[function(require,module,exports){
var DSObject, assert, error, ngModule;

module.exports = (ngModule = angular.module('ui/tasks/rmsTaskInfo', [])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSObject = require('../../../dscommon/DSObject');

ngModule.directive('rmsTaskInfo', [
  '$rootScope', '$window', (function($rootScope, $window) {
    return {
      restrict: 'A',
      scope: true,
      link: (function($scope, element, attrs) {
        var modal;
        modal = $rootScope.modal;
        if ($(window).height() > (modal.pos.top + 150)) {
          $scope.top = Math.ceil(modal.pos.top + 50);
        } else {
          $scope.top = Math.ceil(modal.pos.top - 100);
        }
        if ($(window).width() - $('#sidebar').innerWidth() > modal.pos.left) {
          $scope.left = Math.ceil(modal.pos.left + 95);
        } else {
          $scope.left = Math.ceil(modal.pos.left - 300);
        }
        $scope.task = modal.task;
      })
    };
  })
]);


},{"../../../dscommon/DSObject":60,"../../../dscommon/util":66}],34:[function(require,module,exports){
var time, updateToday;

module.exports = time = {
  today: moment().startOf('day'),
  historyLimit: moment().startOf('week').subtract(2, 'weeks')
};

(updateToday = (function() {
  setTimeout((function() {
    time.today = moment().startOf('day');
    updateToday();
  }), moment().startOf('day').add(1, 'day').add(20, 'seconds').valueOf() - (new Date()).getTime());
}))();


},{}],35:[function(require,module,exports){
var DSObjectBase, PersonDayStat, assert, error, ngModule, totalRelease, uiCtrl;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

totalRelease = require('../../dscommon/util').totalRelease;

DSObjectBase = require('../../dscommon/DSObjectBase');

PersonDayStat = require('../models/PersonDayStat');

module.exports = (ngModule = angular.module('ui/ui', ['ui.router', 'ngSanitize', require('./views/view1/View1'), require('./views/view2/View2'), require('./views/view3/View3'), require('./views/changes/ViewChanges'), require('./account/rmsAccount'), require('./widgets/widgetDate'), require('./widgets/widgetDuration'), require('./tasks/rmsTask'), require('./tasks/rmsTaskEdit'), require('./tasks/TaskSplitWeekView'), require('./tasks/rmsTaskInfo'), require('./tasks/addCommentAndSave'), require('./layout'), require('./filters')])).name;

ngModule.config([
  '$urlRouterProvider', '$stateProvider', '$locationProvider', '$httpProvider', (function($urlRouterProvider, $stateProvider, $locationProvider, $httpProvider) {
    $stateProvider.state({
      name: '/',
      url: '/',
      templateUrl: function() {
        return './ui/main.html';
      },
      controller: uiCtrl
    });
    if (totalRelease) {
      $stateProvider.state({
        name: 'totalRelease',
        url: '/totalRelease',
        templat: "<div/>"
      });
    }
  })
]);

if (totalRelease) {
  ngModule.run([
    '$state', '$rootScope', (function($state, $rootScope) {
      var superTotalRelease;
      superTotalRelease = window.totalRelease;
      return window.totalRelease = (function() {
        $state.go('totalRelease');
        $rootScope.$evalAsync((function() {
          superTotalRelease();
          setTimeout((function() {
            console.info(window.totalPool);
          }), 1000);
        }));
      });
    })
  ]);
}

uiCtrl = [
  '$rootScope', '$scope', (function($rootScope, $scope) {
    $scope.mode = 'edited';
    $scope.setMode = (function(mode) {
      $scope.mode = mode;
    });
    $scope.taskSummaryColor = (function(dayStat) {
      var timeLeft;
      if (assert) {
        if (!(dayStat instanceof PersonDayStat.DayStat)) {
          error.invalidArg('dayStat');
        }
      }
      if ((timeLeft = dayStat.get('timeLeft').valueOf()) < 0) {
        return 'red';
      } else if ((timeLeft / dayStat.get('contract').valueOf()) <= 0.2) {
        return 'green';
      } else {
        return 'light-yellow';
      }
    });
    $scope.dayTaskWidth = (function(dayStat) {
      var timeLeft;
      if (assert) {
        if (!(dayStat instanceof PersonDayStat.DayStat)) {
          error.invalidArg('dayStat');
        }
      }
      if ((timeLeft = dayStat.get('timeLeft').valueOf()) < 0) {
        return 100;
      } else {
        return Math.round((1 - timeLeft / dayStat.get('contract').valueOf()) * 100);
      }
    });
    $scope.taskViewExpand = (function(index) {
      $scope.period.people[index].tasks.expand = !$scope.period.people[index].tasks.expand;
    });
  })
];


},{"../../dscommon/DSObjectBase":61,"../../dscommon/util":66,"../models/PersonDayStat":15,"./account/rmsAccount":26,"./filters":27,"./layout":28,"./tasks/TaskSplitWeekView":29,"./tasks/addCommentAndSave":30,"./tasks/rmsTask":31,"./tasks/rmsTaskEdit":32,"./tasks/rmsTaskInfo":33,"./views/changes/ViewChanges":36,"./views/view1/View1":38,"./views/view2/View2":42,"./views/view3/View3":43,"./widgets/widgetDate":47,"./widgets/widgetDuration":48}],36:[function(require,module,exports){
var Change, DSDigest, DSObject, Person, Task, assert, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/changes/ViewChanges', [require('../../../data/dsChanges'), require('../../../../dscommon/DSView')])).name;

assert = require('../../../../dscommon/util').assert;

DSObject = require('../../../../dscommon/DSObject');

DSDigest = require('../../../../dscommon/DSDigest');

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
      dsChanges.save().then(function(allTasksSaved) {
        if (allTasksSaved) {
          $rootScope.modal = {
            type: null
          };
        }
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
  'DSView', 'dsChanges', '$log', (function(DSView, dsChanges, $log) {
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

      ViewChange.ds_dstr.push((function() {
        var ref, task, taskKey;
        ref = this.get('data').get('tasksSet').items;
        for (taskKey in ref) {
          task = ref[taskKey];
          delete task.__change.__refreshView;
        }
      }));

      ViewChange.prototype.render = (function() {
        var change, changes, conflictValue, isDark, isFirst, poolChanges, prop, propChange, propName, props, ref, ref1, refreshView, remove, task, taskKey, tasksSet, tasksStatus, v;
        if (!((tasksStatus = this.get('data').get('tasksStatus')) === 'ready' || tasksStatus === 'update')) {
          this.get('changesList').merge(this, []);
          return;
        }
        poolChanges = this.get('poolChanges');
        changes = [];
        props = (tasksSet = this.get('data').get('tasksSet')).type.prototype.__props;
        isDark = false;
        refreshView = ((function(_this) {
          return function() {
            _this.__dirty++;
          };
        })(this));
        ref = tasksSet.items;
        for (taskKey in ref) {
          task = ref[taskKey];
          isDark = !isDark;
          isFirst = true;
          task.__change.__refreshView = refreshView;
          remove = (function(task) {
            return function() {
              var hist;
              (hist = dsChanges.get('hist')).startBlock();
              try {
                DSDigest.block((function() {
                  var propChange, propName, ref1;
                  ref1 = task.__change;
                  for (propName in ref1) {
                    propChange = ref1[propName];
                    if (propName !== '__error' && propName !== '__refreshView') {
                      task.set(propName, task.$ds_doc.get(propName));
                    }
                  }
                }));
              } finally {
                hist.endBlock();
              }
              refreshView();
            };
          })(task);
          ref1 = task.__change;
          for (propName in ref1) {
            propChange = ref1[propName];
            if (!(propName !== '__error' && propName !== '__refreshView' && propName !== 'comments')) {
              continue;
            }
            prop = props[propName];
            changes.push(change = poolChanges.find(this, task.$ds_key + "." + propName));
            change.set('isDark', isDark);
            if (isFirst) {
              isFirst = false;
              change.set('doc', task);
            }
            change.set('prop', propName);
            change.set('value', (v = propChange.v) === null ? ' -' : prop.str(propChange.v));
            change.set('conflict', prop.equal((conflictValue = task.$ds_doc.get(propName)), propChange.s) ? null : conflictValue === null ? ' -' : prop.str(conflictValue));
            if (remove) {
              change.remove = remove;
              remove = null;
            }
          }
          if (task.__change.__error) {
            changes.push(change = poolChanges.find(this, task.$ds_key + ".__error"));
            change.set('isDark', isDark);
            change.set('error', task.__change.__error);
          }
        }
        this.get('changesList').merge(this, changes);
      });

      ViewChange.end();

      return ViewChange;

    })(DSView);
  })
]);


},{"../../../../dscommon/DSDigest":56,"../../../../dscommon/DSObject":60,"../../../../dscommon/DSView":65,"../../../../dscommon/util":66,"../../../data/dsChanges":6,"../../../models/Person":14,"../../../models/Task":19,"./models/Change":37}],37:[function(require,module,exports){
var Change, DSDocument, DSObject, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../../../../dscommon/util').assert;

error = require('../../../../../dscommon/util').error;

DSObject = require('../../../../../dscommon/DSObject');

DSDocument = require('../../../../../dscommon/DSDocument');

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

  Change.propStr('error');

  Change.propBool('isDark');

  Change.end();

  return Change;

})(DSObject);


},{"../../../../../dscommon/DSDocument":57,"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66}],38:[function(require,module,exports){
var DSDigest, Day, Person, PersonDayStat, PersonTimeTracking, Row, Tag, Task, TaskView, assert, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/view1/View1', [require('../../../config'), require('../../../data/dsChanges'), require('../../../data/dsDataService'), require('../../../../dscommon/DSView'), require('../../tasks/addCommentAndSave'), require('../../../data/teamwork/TWTasks')])).name;

assert = require('../../../../dscommon/util').assert;

DSDigest = require('../../../../dscommon/DSDigest');

Task = require('../../../models/Task');

Tag = require('../../../models/Tag');

Person = require('../../../models/Person');

PersonDayStat = require('../../../models/PersonDayStat');

PersonTimeTracking = require('../../../models/PersonTimeTracking');

Day = require('./models/Day');

Row = require('./models/Row');

TaskView = require('./models/TaskView');

serviceOwner = require('../../../../dscommon/util').serviceOwner;

ngModule.controller('View1', [
  '$scope', 'View1', '$rootScope', function($scope, View1, $rootScope) {
    $rootScope.view1 = $scope.view = new View1($scope, 'view1');
    $scope.$on('$destroy', (function() {
      delete $rootScope.view1;
    }));
    $scope.expandedHeight = function(row) {
      if (!row.expand) {
        return '';
      }
      if (_.isEmpty(row.tasks)) {
        return "height:100px";
      }
      return "height:" + (65 * _.maxBy(row.tasks, 'y').y + 98) + "px";
    };
  }
]);

ngModule.factory('View1', [
  'DSView', 'config', '$rootScope', '$log', 'TWTasks', (function(DSView, config, $rootScope, $log, TWTasks) {
    var View1;
    return View1 = (function(superClass) {
      var class1, positionTaskView, taskViewsSortRule;

      extend(View1, superClass);

      function View1() {
        return class1.apply(this, arguments);
      }

      View1.begin('View1');

      View1.propData('people', Person, {
        watch: ['roles', 'companyId']
      });

      View1.propData('tasks', Task, {
        filter: 'assigned',
        watch: ['responsible', 'duedate', 'split', 'estimate', 'priority']
      });

      View1.propData('personDayStat', PersonDayStat, {});

      View1.propData('personTimeTracking', PersonTimeTracking, {
        watch: []
      });

      View1.propMoment('startDate');

      View1.propList('days', Day);

      View1.propPool('poolRows', Row);

      View1.propList('rows', Row);

      View1.propObj('hiddenPeople', {});

      View1.propNum('hiddenPeopleCount', 0);

      View1.ds_dstr.push((function() {
        this.__unwatchA();
        this.__unwatchB();
        this.__unwatchC();
      }));

      class1 = (function($scope, key) {
        var i, j, l, len1, len2, ref, ref1, selectedCompany, selectedLoad;
        DSView.call(this, $scope, key);
        this.scope = $scope;
        this.set('startDate', moment().startOf('week'));
        $scope.filterLoad = [
          $scope.selectedLoad = {
            id: 0,
            name: 'All'
          }, {
            id: -1,
            name: 'Underload'
          }, {
            id: 1,
            name: 'Overload'
          }
        ];
        if ((selectedLoad = config.get('selectedLoad'))) {
          ref = $scope.filterLoad;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            i = ref[j];
            if (i.id === selectedLoad) {
              $scope.selectedLoad = i;
            }
          }
        }
        if (config.hasRoles) {
          $scope.filterCompanies = [
            {
              id: null,
              name: 'All'
            }, $scope.selectedCompany = {
              id: 23872,
              name: 'WebProfy'
            }, {
              id: 50486,
              name: 'Freelancers'
            }
          ];
          if ((selectedCompany = config.get('selectedCompany'))) {
            ref1 = $scope.filterCompanies;
            for (l = 0, len2 = ref1.length; l < len2; l++) {
              i = ref1[l];
              if (i.id === selectedCompany) {
                $scope.selectedCompany = i;
              }
            }
          }
        }
        this.__unwatchA = $scope.$watch(((function(_this) {
          return function() {
            var ref2;
            return [(ref2 = _this.get('startDate')) != null ? ref2.valueOf() : void 0, $scope.mode, $scope.dataService.showTimeSpent];
          };
        })(this)), ((function(_this) {
          return function(arg) {
            var mode, showTimeSpent, startDateVal;
            startDateVal = arg[0], mode = arg[1], showTimeSpent = arg[2];
            _this.dataUpdate({
              startDate: moment(startDateVal),
              endDate: moment(startDateVal).add(6, 'days'),
              mode: mode,
              showTimeSpent: showTimeSpent
            });
          };
        })(this)), true);
        this.__unwatchB = $scope.$watch((function() {
          return [$scope.selectedRole, $scope.selectedCompany, $scope.selectedLoad];
        }), ((function(_this) {
          return function(arg) {
            var selectedCompany, selectedLoad, selectedRole;
            selectedRole = arg[0], selectedCompany = arg[1], selectedLoad = arg[2];
            if ($rootScope.peopleRoles) {
              config.set('selectedRole', selectedRole ? selectedRole.role : null);
            }
            config.set('selectedCompany', selectedCompany ? selectedCompany.id : null);
            config.set('selectedLoad', selectedLoad ? selectedLoad.id : 0);
            return _this.__dirty++;
          };
        })(this)), true);
        this.__unwatchC = $scope.$watch(((function(_this) {
          return function() {
            return [config.get('currentUserId'), _this.get('data').get('peopleStatus')];
          };
        })(this)), ((function(_this) {
          return function(arg) {
            var currentUserId, peopleStatus;
            currentUserId = arg[0], peopleStatus = arg[1];
            if (!(currentUserId !== null && (peopleStatus === 'ready' || peopleStatus === 'update'))) {
              config.set('currentUser', null);
              return;
            }
            config.set('currentUser', _this.get('data').get('people')[currentUserId]);
          };
        })(this)), true);
      });

      View1.prototype.periodChange = (function(num) {
        this.set('startDate', this.startDate.add(num, 'week'));
      });

      View1.prototype.hideRow = (function(row) {
        this.get('hiddenPeople')[row.$ds_key] = true;
        this.hiddenPeopleCount++;
        this.__dirty++;
      });

      View1.prototype.unhideAll = (function() {
        this.set('hiddenPeople', {});
        this.hiddenPeopleCount = 0;
        this.__dirty++;
      });

      View1.prototype.render = (function() {
        var companyId, days, daysTemp, f0, f1, f2, filter, hiddenPeople, j, k, len1, loadFilter, peopleStatus, personDayStat, personDayStatStatus, personTimeTracking, poolRows, r, ref, ref1, ref2, ref3, role, rolesMap, rows, selectedPeople, selectedRole, startDate, tasksByPerson, tasksStatus, timeByPerson, timeSpentTemp;
        if (!((peopleStatus = this.get('data').get('peopleStatus')) === 'ready' || peopleStatus === 'update')) {
          this.get('rowsList').merge(this, []);
          return;
        }
        startDate = this.get('startDate');
        days = this.get('daysList').merge(this, _.map([0, 1, 2, 3, 4, 5, 6], ((function(_this) {
          return function(dayIndex, index) {
            var date, day;
            date = moment(startDate).add(dayIndex, 'days');
            day = new Day(_this, date.format());
            day.set('date', date);
            day.set('index', index);
            day.set('x', dayIndex);
            return day;
          };
        })(this))));
        filter = (function() {
          return true;
        });
        hiddenPeople = this.get('hiddenPeople');
        for (k in hiddenPeople) {
          filter = (function(person) {
            return !hiddenPeople.hasOwnProperty(person.$ds_key);
          });
          break;
        }
        if (config.get('hasRoles')) {
          if ((ref = this.scope.selectedCompany) != null ? ref.id : void 0) {
            companyId = this.scope.selectedCompany.id;
            f0 = filter;
            filter = (function(person) {
              return f0(person) && person.get('companyId') === companyId;
            });
          } else {
            f0 = filter;
          }
          if ((ref1 = this.scope.selectedRole) != null ? ref1.role : void 0) {
            selectedRole = this.scope.selectedRole;
            f1 = filter;
            if (selectedRole.hasOwnProperty('roles')) {
              rolesMap = {};
              ref2 = selectedRole.roles.split(',');
              for (j = 0, len1 = ref2.length; j < len1; j++) {
                r = ref2[j];
                rolesMap[r.trim()] = true;
              }
              filter = (function(person) {
                var ref3;
                return f1(person) && ((ref3 = person.get('roles')) != null ? ref3.any(rolesMap) : void 0);
              });
            } else if (selectedRole.hasOwnProperty('special')) {
              switch (selectedRole.special) {
                case 'notSupervisors':
                  filter = (function(person) {
                    var roles;
                    return f1(person) && ((roles = person.get('roles')) === null || !roles.get('Manager'));
                  });
                  break;
                default:
                  console.error("Unexpected role.special value: " + role.special, selectedRole);
              }
            } else {
              role = selectedRole.role;
              filter = (function(person) {
                var ref3;
                return f1(person) && ((ref3 = person.get('roles')) != null ? ref3.get(role) : void 0);
              });
            }
          }
          if (((ref3 = this.scope.selectedLoad) != null ? ref3.id : void 0) !== 0) {
            if (this.get('data').get('personDayStatStatus') !== 'ready') {
              return;
            }
            personDayStat = this.get('data').get('personDayStat');
            loadFilter = this.scope.selectedLoad.id === 1 ? (function(person) {
              var dayStat, l, len2, ref4;
              ref4 = personDayStat[person.$ds_key].get('dayStats');
              for (l = 0, len2 = ref4.length; l < len2; l++) {
                dayStat = ref4[l];
                if (dayStat.get('timeLeft') < 0) {
                  return true;
                }
              }
              return false;
            }) : (function(person) {
              var dayStat, l, len2, ref4;
              ref4 = personDayStat[person.$ds_key].get('dayStats');
              for (l = 0, len2 = ref4.length; l < len2; l++) {
                dayStat = ref4[l];
                if (dayStat.get('timeLeft').valueOf() / dayStat.get('contract').valueOf() > 0.2) {
                  return true;
                }
              }
              return false;
            });
            f2 = filter;
            filter = (function(person) {
              return f2(person) && loadFilter(person);
            });
          }
        }
        selectedPeople = _.filter(this.data.get('people'), filter);
        selectedPeople.sort((function(left, right) {
          var leftLC, rightLC;
          if ((leftLC = left.name.toLowerCase()) < (rightLC = right.name.toLowerCase())) {
            return -1;
          } else if (leftLC > rightLC) {
            return 1;
          } else {
            return 0;
          }
        }));
        poolRows = this.get('poolRows');
        rows = this.get('rowsList').merge(this, _.map(selectedPeople, ((function(_this) {
          return function(person) {
            var row;
            row = poolRows.find(_this, person.$ds_key);
            row.set('person', person);
            return row;
          };
        })(this))));
        daysTemp = _.map([0, 1, 2, 3, 4, 5, 6], (function() {
          return moment.duration(0);
        }));
        timeSpentTemp = _.map([0, 1, 2, 3, 4, 5, 6], (function() {
          return moment.duration(0);
        }));
        if (!(((tasksStatus = this.get('data').get('tasksStatus')) === 'ready' || tasksStatus === 'update') && ((personDayStatStatus = this.get('data').get('personDayStatStatus')) === 'ready' || personDayStatStatus === 'update'))) {
          _.forEach(rows, ((function(_this) {
            return function(row) {
              row.get('tasksList').merge(_this, []);
              row.set('personDayStat', null);
            };
          })(this)));
        } else {
          tasksByPerson = _.groupBy(this.data.tasks, (function(task) {
            return task.get('responsible').$ds_key;
          }));
          timeByPerson = null;
          if (this.data.personTimeTrackingStatus === 'ready') {
            timeSpentTemp = _.map([0, 1, 2, 3, 4, 5, 6], (function() {
              return moment.duration(0);
            }));
            timeByPerson = _.groupBy((personTimeTracking = this.data.personTimeTracking), (function(task) {
              return task.get('personId');
            }));
          }
          _.forEach(rows, ((function(_this) {
            return function(row) {
              var dayStat, dayStats, dayTimeTrackingByDates, ds, getTime, i, l, len2, len3, len4, len5, m, n, o, ref4, ref5, ref6, takenTime, taskView, taskViews, tasksPool, time, timeByThisPerson, timeTrackingByDates;
              row.set('personDayStat', personDayStat = _this.data.get('personDayStat')[row.$ds_key]);
              ref4 = dayStats = personDayStat.get('dayStats');
              for (i = l = 0, len2 = ref4.length; l < len2; i = ++l) {
                ds = ref4[i];
                daysTemp[i].add(ds.get('tasksTotal'));
              }
              tasksPool = row.get('tasksPool');
              takenTime = {};
              taskViews = _.map(tasksByPerson[row.$ds_key], (function(task) {
                var day, duedate, firstDate, len3, m, ref5, split, start, taskView, time;
                taskView = tasksPool.find(_this, task.$ds_key);
                taskView.set('task', task);
                if (timeByPerson) {
                  if ((split = task.get('split'))) {
                    duedate = task.get('duedate');
                    start = (firstDate = split.firstDate(duedate)) <= startDate ? 0 : moment.duration(firstDate.diff(startDate)).asDays();
                    ref5 = _this.get('days').slice(start, 7);
                    for (m = 0, len3 = ref5.length; m < len3; m++) {
                      day = ref5[m];
                      if ((time = personTimeTracking[row.$ds_key + "-" + task.$ds_key + "-" + (day.get('date').valueOf())])) {
                        takenTime[time.$ds_key] = true;
                      }
                    }
                  } else if ((time = personTimeTracking[row.$ds_key + "-" + task.$ds_key + "-" + (task.get('duedate').valueOf())])) {
                    takenTime[time.$ds_key] = true;
                    taskView.set('time', time);
                  } else {
                    taskView.set('time', null);
                  }
                }
                return taskView;
              }));
              if (timeByPerson && (timeByThisPerson = timeByPerson[row.$ds_key])) {
                for (m = 0, len3 = timeByThisPerson.length; m < len3; m++) {
                  time = timeByThisPerson[m];
                  if (!(!takenTime[time.$ds_key])) {
                    continue;
                  }
                  taskViews.push((taskView = tasksPool.find(_this, time.$ds_key)));
                  taskView.set('time', time);
                }
                timeTrackingByDates = _.groupBy(timeByThisPerson, (function(personTTracking) {
                  return personTTracking.get('date').valueOf();
                }));
                ref5 = personDayStat.get('dayStats');
                for (i = n = 0, len4 = ref5.length; n < len4; i = ++n) {
                  dayStat = ref5[i];
                  if (dayTimeTrackingByDates = timeTrackingByDates[dayStat.get('day').valueOf()]) {
                    timeSpentTemp[i].add(dayStat.set('timeSpent', _.reduce(dayTimeTrackingByDates, (function(res, val) {
                      return res.add(val.get('timeMin'), 'm');
                    }), moment.duration())));
                  } else {
                    dayStat.set('timeSpent', null);
                  }
                }
              } else {
                ref6 = personDayStat.get('dayStats');
                for (o = 0, len5 = ref6.length; o < len5; o++) {
                  dayStat = ref6[o];
                  dayStat.set('timeSpent', null);
                }
              }
              row.get('tasksList').merge(_this, taskViews);
              getTime = null;
              if (timeByPerson) {
                getTime = (function(taskView, date) {
                  if ((time = personTimeTracking[row.$ds_key + "-" + (taskView.get('task').$ds_key) + "-" + (date.valueOf())])) {
                    return time;
                  } else {
                    return null;
                  }
                });
              }
              View1.layoutTaskView(startDate, taskViews, getTime);
            };
          })(this)));
        }
        _.forEach(days, (function(day, index) {
          day.set('workTime', daysTemp[index]);
          day.set('timeSpent', timeSpentTemp[index].valueOf() === 0 ? null : timeSpentTemp[index]);
        }));
      });

      View1.taskViewsSortRule = taskViewsSortRule = (function(leftView, rightView) {
        var leftTask, rightTask;
        leftTask = leftView.get('task');
        rightTask = rightView.get('task');
        if (leftTask === null && rightTask === null) {
          return rightView.get('time').get('taskId') - leftView.get('time').get('taskId');
        }
        if (leftTask === null) {
          return 1;
        }
        if (rightTask === null) {
          return -1;
        }
        return TWTasks.tasksSortRule(leftTask, rightTask);
      });

      positionTaskView = (function(pos, taskView, taskStartDate, day, getTime) {
        var date, dayPos, dpos, j, l, len, len1, plan, ref, s, split, task, time, v, viewSplit, y;
        taskView.set('x', day);
        dayPos = pos[day];
        if (day === 0) {
          y = dayPos.length;
        } else {
          for (y = j = 0, len1 = dayPos.length; j < len1; y = ++j) {
            v = dayPos[y];
            if (typeof v === 'undefined') {
              break;
            }
          }
        }
        taskView.set('y', y);
        if ((task = taskView.get('task')) === null || (split = task.get('split')) === null) {
          taskView.set('split', null);
          taskView.set('len', 1);
          if (y === dayPos.length) {
            dayPos.length++;
          }
          dayPos[y] = true;
        } else {
          len = taskView.set('len', Math.min(moment.duration(moment(split.lastDate(task.get('duedate'))).diff(taskStartDate)).asDays() + 1, 7 - day));
          viewSplit = taskView.set('split', []);
          for (s = l = 0, ref = len; 0 <= ref ? l < ref : l > ref; s = 0 <= ref ? ++l : --l) {
            date = s === 0 ? taskStartDate : moment(taskStartDate).add(s, 'day');
            time = getTime ? getTime(taskView, date) : null;
            if ((plan = split.get(task.duedate, date)) !== null || time !== null) {
              viewSplit.push({
                x: s,
                plan: plan,
                time: time
              });
            }
            if ((dpos = pos[day + s]).length <= y) {
              dpos.length = y;
            }
            dpos[y] = true;
          }
        }
        return y;
      });

      View1.layoutTaskView = (function(startDate, taskViews, getTime) {
        var d, day, groupDates, i, j, len1, maxY, pos, t, taskStartDate, tasksByDay, tasksForTheDay;
        maxY = 0;
        if (!_.some(taskViews, (function(taskView) {
          var ref;
          return (ref = taskView.get('task')) != null ? ref.get('split') : void 0;
        }))) {
          tasksByDay = _.groupBy(taskViews, (function(taskView) {
            var time;
            return ((time = taskView.get('time')) ? time.get('date') : taskView.get('task').get('duedate')).valueOf();
          }));
          _.forEach(tasksByDay, (function(taskViews, date) {
            var time, x;
            taskViews.sort(taskViewsSortRule);
            x = moment.duration(((time = taskViews[0].get('time')) ? time.get('date') : taskViews[0].get('task').get('duedate')).diff(startDate)).asDays();
            _.forEach(taskViews, (function(taskView, i) {
              taskView.set('x', x);
              maxY = Math.max(maxY, taskView.set('y', i));
              taskView.set('len', 1);
              taskView.set('split', null);
            }));
          }));
        } else {
          tasksByDay = _.groupBy(taskViews, (function(taskView) {
            var duedate, split, task;
            if ((task = taskView.get('task'))) {
              duedate = task.get('duedate');
              return ((split = task.get('split')) !== null ? split.firstDate(duedate) : duedate).valueOf();
            }
            return taskView.get('time').get('date').valueOf();
          }));
          pos = (function() {
            var j, results;
            results = [];
            for (i = j = 0; j <= 6; i = ++j) {
              results.push([]);
            }
            return results;
          })();
          groupDates = ((function() {
            var results;
            results = [];
            for (t in tasksByDay) {
              results.push(parseInt(t));
            }
            return results;
          })()).sort();
          for (j = 0, len1 = groupDates.length; j < len1; j++) {
            d = groupDates[j];
            (tasksForTheDay = tasksByDay[d]).sort(taskViewsSortRule);
            day = moment.duration((taskStartDate = moment(d)).diff(startDate)).asDays();
            if (day < 0) {
              day = 0;
              taskStartDate = startDate;
            }
            _.forEach(tasksForTheDay, (function(taskView) {
              maxY = Math.max(maxY, positionTaskView(pos, taskView, taskStartDate, day, getTime));
            }));
          }
        }
        return maxY;
      });

      View1.end();

      return View1;

    })(DSView);
  })
]);

ngModule.factory('getDropTasksGroup', [
  'dsDataService', '$rootScope', function(dsDataService, $rootScope) {
    var allTasks;
    allTasks = serviceOwner.add(dsDataService.findDataSet(serviceOwner, {
      type: Task,
      mode: 'edited',
      filter: 'all'
    }));
    return function() {
      var duedate, k, project, res, responsible, t;
      duedate = $rootScope.modal.task.get('duedate').valueOf();
      responsible = $rootScope.modal.task.get('responsible');
      project = $rootScope.modal.task.get('project');
      res = (function() {
        var ref, ref1, results;
        ref = allTasks.items;
        results = [];
        for (k in ref) {
          t = ref[k];
          if (!t.plan && !t.split && t.get('responsible') === responsible && ((ref1 = t.get('duedate')) != null ? ref1.valueOf() : void 0) === duedate && t.get('project') === project) {
            results.push(t);
          }
        }
        return results;
      })();
      if (res.length === 0) {
        return [$rootScope.modal.task];
      } else {
        return res;
      }
    };
  }
]);

ngModule.directive('rmsView1DropTask', [
  'View1', '$rootScope', 'dsChanges', 'addCommentAndSave', 'getDropTasksGroup', function(View1, $rootScope, dsChanges, addCommentAndSave, getDropTasksGroup) {
    return {
      restrict: 'A',
      scope: true,
      link: function($scope, element, attrs) {
        var el;
        el = element[0];
        el.addEventListener('dragover', function(ev) {
          ev.preventDefault();
          return true;
        });
        return el.addEventListener('drop', function(ev) {
          var day, modal, tasks;
          day = _.findIndex($('.drop-zone', element), function(value) {
            var $v;
            $v = $(value);
            return $v.offset().left + $v.width() >= ev.clientX;
          });
          if (!(ev.ctrlKey && !(modal = $rootScope.modal).task.split && modal.task.duedate !== null)) {
            tasks = [$rootScope.modal.task];
          } else {
            tasks = getDropTasksGroup();
          }
          if (day < 0) {
            addCommentAndSave(tasks, ev.shiftKey, {
              responsible: $scope.row.get('person'),
              plan: false
            });
          } else {
            addCommentAndSave(tasks, ev.shiftKey, {
              responsible: $scope.row.get('person'),
              duedate: $scope.view.get('days')[day].get('date'),
              plan: false
            });
          }
          $rootScope.$digest();
          ev.stopPropagation();
          return false;
        });
      }
    };
  }
]);

ngModule.directive('rmsView1MouseOverWeekChange', [
  'View1', '$rootScope', 'dsChanges', 'addCommentAndSave', function(View1, $rootScope, dsChanges, addCommentAndSave) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {
        var direction, el, lastTimeStamp;
        direction = $scope.$eval(attrs.rmsView1MouseOverWeekChange);
        lastTimeStamp = 0;
        el = element[0];
        el.addEventListener('dragover', function(ev) {
          if (ev.timeStamp > lastTimeStamp) {
            lastTimeStamp = ev.timeStamp + 3000;
            $rootScope.view1.periodChange(direction);
            $rootScope.$digest();
          }
          ev.preventDefault();
          return true;
        });
      }
    };
  }
]);


},{"../../../../dscommon/DSDigest":56,"../../../../dscommon/DSView":65,"../../../../dscommon/util":66,"../../../config":2,"../../../data/dsChanges":6,"../../../data/dsDataService":7,"../../../data/teamwork/TWTasks":11,"../../../models/Person":14,"../../../models/PersonDayStat":15,"../../../models/PersonTimeTracking":16,"../../../models/Tag":18,"../../../models/Task":19,"../../tasks/addCommentAndSave":30,"./models/Day":39,"./models/Row":40,"./models/TaskView":41}],39:[function(require,module,exports){
var DSObject, Day,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

module.exports = Day = (function(superClass) {
  extend(Day, superClass);

  function Day() {
    return Day.__super__.constructor.apply(this, arguments);
  }

  Day.begin('Day');

  Day.propMoment('date');

  Day.propNum('index');

  Day.propNum('x');

  Day.propDuration('workTime');

  Day.propDuration('timeSpent');

  Day.end();

  return Day;

})(DSObject);


},{"../../../../../dscommon/DSObject":60}],40:[function(require,module,exports){
var DSObject, Person, PersonDayStat, Row, TaskView, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../../../../dscommon/util').assert;

error = require('../../../../../dscommon/util').error;

DSObject = require('../../../../../dscommon/DSObject');

Person = require('../../../../models/Person');

PersonDayStat = require('../../../../models/PersonDayStat');

TaskView = require('./TaskView');

module.exports = Row = (function(superClass) {
  extend(Row, superClass);

  function Row() {
    return Row.__super__.constructor.apply(this, arguments);
  }

  Row.begin('Row');

  Row.propPool('tasksPool', TaskView);

  Row.propDoc('person', Person);

  Row.propDoc('personDayStat', PersonDayStat);

  Row.propList('tasks', TaskView);

  Row.propBool('expand', false);

  Row.end();

  return Row;

})(DSObject);


},{"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66,"../../../../models/Person":14,"../../../../models/PersonDayStat":15,"./TaskView":41}],41:[function(require,module,exports){
var DSObject, PersonTimeTracking, Task, TaskView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Task = require('../../../../models/Task');

PersonTimeTracking = require('../../../../models/PersonTimeTracking');

module.exports = TaskView = (function(superClass) {
  extend(TaskView, superClass);

  function TaskView() {
    return TaskView.__super__.constructor.apply(this, arguments);
  }

  TaskView.begin('TaskView');

  TaskView.propDoc('task', Task);

  TaskView.propDoc('time', PersonTimeTracking);

  TaskView.propNum('x', 0, validate.required);

  TaskView.propNum('y', 0, validate.required);

  TaskView.propNum('len', 1, validate.required);

  TaskView.propObj('split');

  TaskView.end();

  return TaskView;

})(DSObject);


},{"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66,"../../../../models/PersonTimeTracking":16,"../../../../models/Task":19}],42:[function(require,module,exports){
var DSDigest, Task, TaskView, assert, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/view2/View2', [require('../../../data/dsChanges'), require('../../../data/dsDataService'), require('../../../../dscommon/DSView'), require('../view1/View1'), require('../../tasks/addCommentAndSave'), require('../../../data/teamwork/TWTasks')])).name;

assert = require('../../../../dscommon/util').assert;

DSDigest = require('../../../../dscommon/DSDigest');

Task = require('../../../models/Task');

TaskView = require('../view1/models/TaskView');

ngModule.controller('View2', [
  '$scope', 'View2', (function($scope, View2) {
    $scope.view = new View2($scope, 'view2');
    $scope.tasksHeight = (function(row) {
      if (!row.expand || _.isEmpty(row.tasks)) {
        return '';
      }
      return "height:" + (52 * _.maxBy(row.tasks, 'y').y + 100) + "px";
    });
  })
]);

ngModule.factory('View2', [
  'View1', 'DSView', '$rootScope', '$log', 'TWTasks', (function(View1, DSView, $rootScope, $log, TWTasks) {
    var View2;
    return View2 = (function(superClass) {
      var class1, taskViewsSortRule;

      extend(View2, superClass);

      function View2() {
        return class1.apply(this, arguments);
      }

      View2.begin('View2');

      View2.propData('tasksOverdue', Task, {
        filter: 'overdue',
        watch: ['duedate', 'plan', 'estimate', 'priority']
      });

      View2.propData('tasksNotAssigned', Task, {
        filter: 'notassigned',
        watch: ['duedate', 'split', 'plan', 'estimate', 'priority']
      });

      View2.propList('tasksOverdue', Task);

      View2.propPool('poolTasksNotassignedViews', TaskView);

      View2.propList('tasksNotAssigned', TaskView);

      View2.propNum('tasksNotAssignedHeight', 0);

      View2.ds_dstr.push((function() {
        this.__unwatchA();
      }));

      class1 = (function($scope, key) {
        DSView.call(this, $scope, key);
        this.__unwatchA = $scope.$watch((function() {
          var ref;
          return [(ref = $scope.$parent.view.startDate) != null ? ref.valueOf() : void 0, $scope.mode];
        }), ((function(_this) {
          return function(args) {
            var mode, startDateVal;
            startDateVal = args[0], mode = args[1];
            _this.dataUpdate({
              startDate: moment(startDateVal),
              endDate: moment(startDateVal).add(6, 'days'),
              mode: mode
            });
          };
        })(this)), true);
      });

      taskViewsSortRule = function(leftView, rightView) {
        var leftTask, rightTask;
        leftTask = leftView.get('task');
        rightTask = rightView.get('task');
        return TWTasks.tasksSortRule(leftTask, rightTask);
      };

      View2.prototype.render = (function() {
        var poolTasksNotassignedViews, startDate, status, tasksNotAssigned, tasksOverdue;
        startDate = this.__scope.$parent.view.startDate;
        if (!((status = this.get('data').get('tasksOverdueStatus')) === 'ready' || status === 'update')) {
          this.get('tasksOverdueList').merge(this, []);
        } else {
          tasksOverdue = _.map(this.get('data').get('tasksOverdue'), ((function(_this) {
            return function(task) {
              task.addRef(_this);
              return task;
            };
          })(this)));
          tasksOverdue.sort(TWTasks.tasksSortRule);
          this.get('tasksOverdueList').merge(this, tasksOverdue);
        }
        if (!((status = this.get('data').get('tasksNotAssignedStatus')) === 'ready' || status === 'update')) {
          this.get('tasksNotAssignedList').merge(this, []);
          this.set('tasksNotAssignedHeight', 0);
        } else {
          poolTasksNotassignedViews = this.get('poolTasksNotassignedViews');
          tasksNotAssigned = this.get('tasksNotAssignedList').merge(this, (_.map(this.get('data').get('tasksNotAssigned'), (function(_this) {
            return function(task) {
              var taskView;
              taskView = poolTasksNotassignedViews.find(_this, task.$ds_key);
              taskView.set('task', task);
              return taskView;
            };
          })(this))).sort(taskViewsSortRule));
          this.set('tasksNotAssignedHeight', View1.layoutTaskView(startDate, tasksNotAssigned));
        }
      });

      View2.end();

      return View2;

    })(DSView);
  })
]);

ngModule.directive('rmsView2DayDropTask', [
  'dsChanges', '$rootScope', 'addCommentAndSave', 'getDropTasksGroup', function(dsChanges, $rootScope, addCommentAndSave, getDropTasksGroup) {
    return {
      restrict: 'A',
      scope: true,
      link: function($scope, element, attrs) {
        var el, getDay;
        el = element[0];
        getDay = function(ev) {
          var day, ref;
          day = _.findIndex($('.vertical-lines > .col', element), function(zone) {
            var $v;
            $v = $(zone);
            return $v.offset().left + $v.width() >= ev.clientX;
          });
          if ((-1 <= (ref = --day) && ref <= 6)) {
            return day;
          } else {
            return -2;
          }
        };
        el.addEventListener('dragover', function(ev) {
          if (getDay(ev) === -2) {
            return false;
          }
          ev.preventDefault();
          return true;
        });
        el.addEventListener('drop', function(ev) {
          var day, modal, tasks;
          day = getDay(ev);
          if (!(ev.ctrlKey && !(modal = $rootScope.modal).task.split && modal.task.duedate !== null)) {
            tasks = [$rootScope.modal.task];
          } else {
            tasks = getDropTasksGroup();
          }
          addCommentAndSave(tasks, ev.shiftKey, {
            responsible: null,
            duedate: day === -1 ? null : $scope.view1.get('days')[day].get('date'),
            plan: false
          });
          $rootScope.$digest();
          ev.stopPropagation();
          return false;
        });
      }
    };
  }
]);


},{"../../../../dscommon/DSDigest":56,"../../../../dscommon/DSView":65,"../../../../dscommon/util":66,"../../../data/dsChanges":6,"../../../data/dsDataService":7,"../../../data/teamwork/TWTasks":11,"../../../models/Task":19,"../../tasks/addCommentAndSave":30,"../view1/View1":38,"../view1/models/TaskView":41}],43:[function(require,module,exports){
var PersonView, Project, ProjectView, Row, Task, TodoList, TodoListView, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/view3/View3', [require('../../../config'), require('../../../data/dsDataService'), require('../../../../dscommon/DSView'), require('../../tasks/addCommentAndSave'), require('../../../data/teamwork/TWTasks')])).name;

assert = require('../../../../dscommon/util').assert;

error = require('../../../../dscommon/util').error;

Task = require('../../../models/Task');

TodoList = require('../../../models/TodoList');

Project = require('../../../models/Project');

PersonView = require('./models/PersonView');

ProjectView = require('./models/ProjectView');

TodoListView = require('./models/TodoListView');

Row = require('../view1/models/Row');

ngModule.controller('View3', [
  '$scope', 'View3', function($scope, View3) {
    $scope.view = new View3($scope, 'view3');
  }
]);

ngModule.factory('View3', [
  'DSView', 'config', '$rootScope', '$log', 'TWTasks', function(DSView, config, $rootScope, $log, TWTasks) {
    var View3;
    return View3 = (function(superClass) {
      var filterPerson;

      extend(View3, superClass);

      View3.begin('View3');

      View3.propData('tasks', Task, {
        watch: ['duedate', 'priority']
      });

      View3.propPool('poolPeople', PersonView);

      View3.propList('people', PersonView);

      View3.propPool('poolProjects', ProjectView);

      View3.propList('projects', ProjectView);

      View3.ds_dstr.push((function() {
        this.__unwatchA();
        if (typeof this.__unwatchB === "function") {
          this.__unwatchB();
        }
        this.__unwatchС();
        if (typeof this.__unwatchD === "function") {
          this.__unwatchD();
        }
        clearTimeout(this.__timer1);
      }));

      function View3($scope, key) {
        DSView.call(this, $scope, key);
        this.scope = $scope;
        this.expandedProj = {};
        this.expandedRows = {};
        this.__unwatchA = $scope.$watch((function() {
          return [$scope.mode, config.activeSidebarTab];
        }), ((function(_this) {
          return function(args) {
            var active, mode;
            mode = args[0], active = args[1];
            $rootScope.view3ActiveTab = active;
            switch (active) {
              case -1:
                if (typeof _this.__unwatchB === "function") {
                  _this.__unwatchB();
                }
                _this.dataUpdate({
                  filter: 'clipboard',
                  mode: mode
                });
                break;
              case 0:
                if (typeof _this.__unwatchB === "function") {
                  _this.__unwatchB();
                }
                _this.dataUpdate({
                  filter: 'noduedate',
                  mode: mode
                });
                break;
              case 1:
                _this.__unwatchB = $scope.$watch((function() {
                  var ref;
                  return (ref = $scope.$parent.view.startDate) != null ? ref.valueOf() : void 0;
                }), function(startDateVal) {
                  var nextWeekEndDate, nextWeekStartDate;
                  $rootScope.startDateVal = startDateVal;
                  if (typeof startDateVal !== 'number') {
                    config.activeSidebarTab = 0;
                  } else {
                    nextWeekStartDate = moment(startDateVal).add(1, 'week');
                    nextWeekEndDate = moment(nextWeekStartDate).endOf('week');
                    _this.dataUpdate({
                      filter: 'all',
                      mode: mode,
                      startDate: nextWeekStartDate,
                      endDate: nextWeekEndDate
                    });
                  }
                });
                break;
              case 2:
                if (typeof _this.__unwatchB === "function") {
                  _this.__unwatchB();
                }
                _this.dataUpdate({
                  filter: 'all',
                  mode: mode
                });
            }
          };
        })(this)), true);
        this.__unwatchC = $scope.$watch((function() {
          return [config.view3GroupByPerson, config.view3HidePeopleWOTasks, config.view3FilterByPerson, config.view3FilterByProject, config.view3FilterByTask];
        }), ((function(_this) {
          return function() {
            clearTimeout(_this.__timer1);
            _this.__timer1 = setTimeout((function() {
              _this.__dirty++;
              $scope.$digest();
            }), 300);
          };
        })(this)), true);
        $scope.notAssignedExpanded = true;
        $scope.toggleProjectExpanded = (function(_this) {
          return function(project) {
            var active, expandedProj, projectKey, viewExpandedProj, viewExpandedProject;
            if (assert) {
              if (!(project instanceof ProjectView)) {
                error.invalidArg('project');
              }
            }
            viewExpandedProj = !(expandedProj = _this.expandedProj).hasOwnProperty((active = config.activeSidebarTab)) ? expandedProj[active] = viewExpandedProject = {} : expandedProj[active];
            if (viewExpandedProj.hasOwnProperty(projectKey = project.$ds_key)) {
              return viewExpandedProj[projectKey] = !viewExpandedProj[projectKey];
            } else {
              return viewExpandedProj[projectKey] = !(active !== 2);
            }
          };
        })(this);
        $scope.isProjectExpanded = (function(_this) {
          return function(project) {
            var active, expandedProj, projectKey, viewExpandedProj;
            if (assert) {
              if (!(project instanceof ProjectView)) {
                error.invalidArg('project');
              }
            }
            if ((expandedProj = _this.expandedProj).hasOwnProperty((active = config.activeSidebarTab))) {
              if ((viewExpandedProj = expandedProj[active]).hasOwnProperty(projectKey = project.$ds_key)) {
                return viewExpandedProj[projectKey];
              }
            }
            return active !== 2;
          };
        })(this);
        $scope.togglePersonExpanded = (function(_this) {
          return function(personView) {
            var active, expandedRows, personKey, viewExpandedRows, viewExpandedRowsect;
            if (assert) {
              if (!(personView instanceof PersonView)) {
                error.invalidArg('personView');
              }
            }
            viewExpandedRows = !(expandedRows = _this.expandedRows).hasOwnProperty((active = config.activeSidebarTab)) ? expandedRows[active] = viewExpandedRowsect = {} : expandedRows[active];
            if (viewExpandedRows.hasOwnProperty(personKey = personView.$ds_key)) {
              return viewExpandedRows[personKey] = !viewExpandedRows[personKey];
            } else {
              return viewExpandedRows[personKey] = false;
            }
          };
        })(this);
        $scope.isPersonExpended = (function(_this) {
          return function(personView) {
            var active, expandedRows, personKey, viewExpandedRows;
            if (assert) {
              if (!(personView instanceof PersonView)) {
                error.invalidArg('personView');
              }
            }
            if ((expandedRows = _this.expandedRows).hasOwnProperty((active = config.activeSidebarTab))) {
              if ((viewExpandedRows = expandedRows[active]).hasOwnProperty(personKey = personView.$ds_key)) {
                return viewExpandedRows[personKey];
              }
            }
            return true;
          };
        })(this);
      }

      filterPerson = function(row, filterByPerson) {
        if (row === 'null') {
          return 'not assigned tasks'.indexOf(filterByPerson) >= 0;
        } else {
          return row.person.name.toLowerCase().indexOf(filterByPerson) >= 0 || row.person.firstName.toLowerCase().indexOf(filterByPerson) >= 0 || row.person.email.toLowerCase().indexOf(filterByPerson) >= 0;
        }
      };

      View3.prototype.render = function() {
        var filterByPerson, filterByProject, filterByTask, i, k, len, personView, personViewKey, poolPeople, poolProjects, projects, r, ref, ref1, ref2, ref3, resultRows, rows, status, tasks, tasksByPeople, tasksByProject, tasksByTodoList, v;
        if (!((status = this.get('data').get('tasksStatus')) === 'ready' || status === 'update')) {
          this.get('projectsList').merge(this, []);
          return;
        }
        tasks = this.get('data').get('tasks');
        if (((ref = (filterByTask = config.view3FilterByTask)) != null ? ref.length : void 0) > 0) {
          filterByTask = filterByTask.trim().toLowerCase();
          tasks = _.filter(tasks, (function(task) {
            return task.get('title').toLowerCase().indexOf(filterByTask) >= 0;
          }));
        }
        if (config.view3GroupByPerson === 0) {
          tasksByTodoList = _.groupBy(tasks, (function(task) {
            return task.get('todoList').$ds_key;
          }));
          tasksByProject = _.groupBy(tasksByTodoList, (function(todoList) {
            return todoList[0].get('project').$ds_key;
          }));
          if (((ref1 = (filterByProject = config.view3FilterByProject)) != null ? ref1.length : void 0) > 0) {
            filterByProject = filterByProject.trim().toLowerCase();
            for (k in tasksByProject) {
              v = tasksByProject[k];
              if (!(Project.pool.items[k].get('name').toLowerCase().indexOf(filterByProject) >= 0)) {
                delete tasksByProject[k];
              }
            }
          }
          poolProjects = this.get('poolProjects');
          projects = this.get('projectsList').merge(this, (_.map(tasksByProject, ((function(_this) {
            return function(projectGroup, projectKey) {
              var projectView;
              projectView = poolProjects.find(_this, projectKey);
              projectView.set('project', Project.pool.items[projectKey]);
              projectView.get('todoListsList').merge(_this, _.map(projectGroup, (function(todoListGroup) {
                var todoListKey, todoListView;
                todoListKey = todoListGroup[0].get('todoList').$ds_key;
                todoListView = projectView.poolTodoLists.find(_this, todoListKey);
                todoListView.set('todoList', TodoList.pool.items[todoListKey]);
                todoListView.set('tasksCount', _.size(todoListGroup));
                todoListView.set('totalEstimate', _.reduce(todoListGroup, (function(sum, task) {
                  var estimate;
                  if ((estimate = task.get('estimate'))) {
                    return sum.add(estimate);
                  } else {
                    return sum;
                  }
                }), moment.duration(0)));
                todoListView.get('tasksList').merge(_this, (_.map(todoListGroup, (function(task) {
                  return task.addRef(_this);
                }))).sort(TWTasks.tasksSortRule));
                return todoListView;
              })));
              return projectView;
            };
          })(this)))).sort((function(left, right) {
            var leftLC, rightLC;
            if ((leftLC = left.get('project').get('name').toLowerCase()) < (rightLC = right.get('project').get('name').toLowerCase())) {
              return -1;
            } else if (leftLC > rightLC) {
              return 1;
            } else {
              return 0;
            }
          })));
          this.get('peopleList').merge(this, []);
          if (this.__unwatchD) {
            this.__unwatchD();
            this.__unwatchD = null;
            this.__src.tasks.watch.length = this.__src.tasks.watch.length - 1;
          }
        } else {
          if (!this.__unwatchD) {
            this.__unwatchD = this.scope.$watch(((function(_this) {
              return function() {
                var i, len, r, ref2, results;
                ref2 = _this.scope.view1.rows;
                results = [];
                for (i = 0, len = ref2.length; i < len; i++) {
                  r = ref2[i];
                  results.push(r.$ds_key);
                }
                return results;
              };
            })(this)), ((function(_this) {
              return function(val, newVal) {
                if (val !== newVal) {
                  _this.__dirty++;
                }
              };
            })(this)), true);
            this.__src.tasks.watch.push('responsible');
          }
          poolPeople = this.get('poolPeople');
          if (((ref2 = (filterByPerson = config.view3FilterByPerson)) != null ? ref2.length : void 0) > 0) {
            filterByPerson = filterByPerson.trim().toLowerCase();
          }
          if (((ref3 = (filterByProject = config.view3FilterByProject)) != null ? ref3.length : void 0) > 0) {
            filterByProject = filterByProject.trim().toLowerCase();
          }
          tasksByPeople = _.groupBy(tasks, function(task) {
            var responsible;
            if ((responsible = task.get('responsible'))) {
              return responsible.$ds_key;
            } else {
              return 'null';
            }
          });
          rows = this.scope.view1.rows;
          if (tasksByPeople.hasOwnProperty('null')) {
            rows = rows.concat('null');
          }
          resultRows = [];
          for (i = 0, len = rows.length; i < len; i++) {
            r = rows[i];
            if (!filterByPerson || filterPerson(r, filterByPerson)) {
              if (tasksByPeople.hasOwnProperty(personViewKey = (r !== 'null' ? r.$ds_key : 'null'))) {
                tasksByTodoList = _.groupBy(tasksByPeople[personViewKey], (function(task) {
                  return task.get('todoList').$ds_key;
                }));
                tasksByProject = _.groupBy(tasksByTodoList, (function(todoList) {
                  return todoList[0].get('project').$ds_key;
                }));
                if (filterByProject) {
                  for (k in tasksByProject) {
                    v = tasksByProject[k];
                    if (!(Project.pool.items[k].get('name').toLowerCase().indexOf(filterByProject) >= 0)) {
                      delete tasksByProject[k];
                    }
                  }
                }
                if (Object.keys(tasksByProject).length === 0) {
                  continue;
                }
                resultRows.push((personView = poolPeople.find(this, personViewKey)));
                if (r !== 'null') {
                  personView.set('row', r);
                }
                poolProjects = personView.get('poolProjects');
                personView.get('projectsList').merge(this, (_.map(tasksByProject, ((function(_this) {
                  return function(projectGroup, projectKey) {
                    var projectView;
                    projectView = poolProjects.find(_this, projectKey);
                    projectView.set('project', Project.pool.items[projectKey]);
                    projectView.get('todoListsList').merge(_this, _.map(projectGroup, (function(todoListGroup) {
                      var todoListKey, todoListView;
                      todoListKey = todoListGroup[0].get('todoList').$ds_key;
                      todoListView = projectView.poolTodoLists.find(_this, todoListKey);
                      todoListView.set('todoList', TodoList.pool.items[todoListKey]);
                      todoListView.set('tasksCount', _.size(todoListGroup));
                      todoListView.set('totalEstimate', _.reduce(todoListGroup, (function(sum, task) {
                        var estimate;
                        if ((estimate = task.get('estimate'))) {
                          return sum.add(estimate);
                        } else {
                          return sum;
                        }
                      }), moment.duration(0)));
                      todoListView.get('tasksList').merge(_this, _.map(todoListGroup, (function(task) {
                        return task.addRef(_this);
                      })));
                      return todoListView;
                    })));
                    return projectView;
                  };
                })(this)))).sort((function(left, right) {
                  var leftLC, rightLC;
                  if ((leftLC = left.get('project').get('name').toLowerCase()) < (rightLC = right.get('project').get('name').toLowerCase())) {
                    return -1;
                  } else if (leftLC > rightLC) {
                    return 1;
                  } else {
                    return 0;
                  }
                })));
              } else if (!config.get('view3HidePeopleWOTasks')) {
                resultRows.push(personView = poolPeople.find(this, personViewKey));
                if (r !== 'null') {
                  personView.set('row', r);
                }
                personView.get('projectsList').merge(this, []);
              }
            }
          }
          this.get('peopleList').merge(this, resultRows);
          this.get('projectsList').merge(this, []);
        }
      };

      View3.end();

      return View3;

    })(DSView);
  }
]);

ngModule.directive('rmsView3DropTask', [
  '$rootScope', 'addCommentAndSave', 'getDropTasksGroup', function($rootScope, addCommentAndSave, getDropTasksGroup) {
    return {
      restrict: 'A',
      scope: true,
      link: function($scope, element, attrs) {
        var activeTab, el;
        el = element[0];
        activeTab = attrs.rmsView3DropTask.length > 0 ? (function(tab) {
          return function() {
            return tab;
          };
        })(parseInt(attrs.rmsView3DropTask)) : (function() {
          return $rootScope.view3ActiveTab;
        });
        el.addEventListener('dragover', function(ev) {
          ev.preventDefault();
          return activeTab() === 2;
        });
        el.addEventListener('drop', function(ev) {
          var modal, tasks;
          if (!(ev.ctrlKey && !(modal = $rootScope.modal).task.split && modal.task.duedate !== null)) {
            tasks = [$rootScope.modal.task];
          } else {
            tasks = getDropTasksGroup();
          }
          addCommentAndSave(tasks, ev.shiftKey, {
            duedate: activeTab() === 0 ? null : moment($rootScope.startDateVal).add(1, 'week'),
            plan: false
          });
          $rootScope.$digest();
          ev.stopPropagation();
          return false;
        });
      }
    };
  }
]);


},{"../../../../dscommon/DSView":65,"../../../../dscommon/util":66,"../../../config":2,"../../../data/dsDataService":7,"../../../data/teamwork/TWTasks":11,"../../../models/Project":17,"../../../models/Task":19,"../../../models/TodoList":21,"../../tasks/addCommentAndSave":30,"../view1/models/Row":40,"./models/PersonView":44,"./models/ProjectView":45,"./models/TodoListView":46}],44:[function(require,module,exports){
var DSObject, Person, PersonView, Project, ProjectView, Row, TodoListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Person = require('../../../../models/Person');

Project = require('../../../../models/Project');

ProjectView = require('./ProjectView');

TodoListView = require('./TodoListView');

Row = require('../../view1/models/Row');

module.exports = PersonView = (function(superClass) {
  extend(PersonView, superClass);

  function PersonView() {
    return PersonView.__super__.constructor.apply(this, arguments);
  }

  PersonView.begin('PersonView');

  PersonView.propDoc('row', Row);

  PersonView.propPool('poolProjects', ProjectView);

  PersonView.propList('projects', TodoListView);

  PersonView.end();

  return PersonView;

})(DSObject);


},{"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66,"../../../../models/Person":14,"../../../../models/Project":17,"../../view1/models/Row":40,"./ProjectView":45,"./TodoListView":46}],45:[function(require,module,exports){
var DSObject, Project, ProjectView, TodoListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Project = require('../../../../models/Project');

TodoListView = require('./TodoListView');

module.exports = ProjectView = (function(superClass) {
  extend(ProjectView, superClass);

  function ProjectView() {
    return ProjectView.__super__.constructor.apply(this, arguments);
  }

  ProjectView.begin('ProjectView');

  ProjectView.propDoc('project', Project);

  ProjectView.propPool('poolTodoLists', TodoListView);

  ProjectView.propList('todoLists', TodoListView);

  ProjectView.end();

  return ProjectView;

})(DSObject);


},{"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66,"../../../../models/Project":17,"./TodoListView":46}],46:[function(require,module,exports){
var DSObject, Task, TodoList, TodoListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Task = require('../../../../models/Task');

TodoList = require('../../../../models/TodoList');

module.exports = TodoListView = (function(superClass) {
  extend(TodoListView, superClass);

  function TodoListView() {
    return TodoListView.__super__.constructor.apply(this, arguments);
  }

  TodoListView.begin('TodoListView');

  TodoListView.propDoc('todoList', TodoList);

  TodoListView.propList('tasks', Task);

  TodoListView.propNum('tasksCount', 0);

  TodoListView.propDuration('totalEstimate');

  TodoListView.propBool('isExpand', true);

  TodoListView.end();

  return TodoListView;

})(DSObject);


},{"../../../../../dscommon/DSObject":60,"../../../../../dscommon/util":66,"../../../../models/Task":19,"../../../../models/TodoList":21}],47:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('ui/widgets/widgetDate', [])).name;

$.datepicker.regional['ru'] = {
  dateFormat: 'dd.mm.yy',
  firstDay: 1
};

$.datepicker.setDefaults($.datepicker.regional['ru']);

$.timepicker.regional['ru'] = {};

$.timepicker.setDefaults($.timepicker.regional['ru']);

ngModule.directive('widgetDate', [
  '$rootScope', '$timeout', (function($rootScope, $timeout) {
    return {
      restrict: 'EA',
      require: 'ngModel',
      link: (function($scope, element, attrs, model) {
        var input;
        input = $('input', element);
        $timeout((function() {
          input.datepicker();
          input.change((function() {
            var t;
            model.$setViewValue((t = input.datetimepicker('getDate')) ? moment(t.getTime()) : null);
            $rootScope.$digest();
          }));
          (model.$render = (function() {
            input.datetimepicker('setDate', model.$viewValue ? new Date(model.$viewValue.valueOf()) : null);
          }))();
        }), 0);
      })
    };
  })
]);


},{}],48:[function(require,module,exports){
var msInHours, msInMinute, ngModule;

module.exports = (ngModule = angular.module('ui/widgets/widgetDuration', [])).name;

msInHours = 60 * 60 * 1000;

msInMinute = 60 * 1000;

ngModule.directive('widgetDuration', [
  '$rootScope', '$timeout', (function($rootScope, $timeout) {
    return {
      restrict: 'EA',
      require: 'ngModel',
      link: (function($scope, element, attrs, model) {
        var change, inputHours, inputMinutes, inputs;
        inputs = $('input', element);
        inputHours = $(inputs[0]);
        inputMinutes = $(inputs[1]);
        (model.$render = (function() {
          var hours, minutes, val;
          if ((val = model.$viewValue)) {
            hours = Math.floor(val.valueOf() / msInHours);
            minutes = Math.floor(val.valueOf() % msInHours / msInMinute);
            inputHours.val(hours);
            inputMinutes.val(minutes < 10 ? '0' + minutes : minutes);
          } else {
            inputHours.val('');
            inputMinutes.val('');
          }
        }))();
        change = (function() {
          var d, h, m;
          h = parseInt(inputHours.val());
          m = parseInt(inputMinutes.val());
          d = moment.duration(0);
          if (!isNaN(h)) {
            d.add(h, 'hours');
          }
          if (!isNaN(m)) {
            d.add(m, 'minutes');
          }
          model.$setViewValue(d.valueOf() === 0 ? null : d);
          $rootScope.$digest();
        });
        inputHours.on('input', change);
        inputMinutes.on('input', change);
      })
    };
  })
]);


},{}],49:[function(require,module,exports){
var RMSDataEnd, RMSDataStart, assert, clear, error, trimEndLF, trimStartLF;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

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
    endText = trimStartLF(description.substr(description.substr(start).search(/end/i) + 3 + start));
    return clear(startText.length > 0 ? endText.length > 0 ? startText + "\r\n\r\n" + endText : startText : endText);
  } else {
    return trimEndLF(description.substr(0, start - 1));
  }
});

module.exports = {
  clear: clear,
  get: (function(description) {
    var end, error1, ex, jsonStart, start;
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
        } catch (error1) {
          ex = error1;
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


},{"../../dscommon/util":66}],50:[function(require,module,exports){
var DSChangesBase, DSData, DSDigest, DSDocument, DSHistory, DSPool, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSHistory = require('./DSHistory');

DSPool = require('./DSPool');

DSData = require('./DSData');

DSDocument = require('./DSDocument');

DSDigest = require('./DSDigest');

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
    DSDigest.block(((function(_this) {
      return function() {
        var hist, i, item, j, len, len1, originalItem, propName, ref, ref1, s, set;
        (hist = _this.get('hist')).startReset();
        try {
          ref = _this.__proto__.__sets;
          for (i = 0, len = ref.length; i < len; i++) {
            s = ref[i];
            ref1 = _.map((set = _this["_" + s]).items, (function(v) {
              return v;
            }));
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              item = ref1[j];
              originalItem = item.$ds_doc;
              for (propName in item.__change) {
                if (propName !== '__error' && propName !== '__refreshView') {
                  item.set(propName, originalItem.get(propName));
                }
              }
            }
          }
        } finally {
          hist.endReset();
        }
      };
    })(this)));
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
          if (propName !== '__error' && propName !== '__refreshView' && (write = props[propName].write)) {
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
                v: propChange.v === null ? null : read.call(this, propChange.v),
                s: propChange.s === null ? null : read.call(this, propChange.s)
              };
            } else {
              throw new Error("Unsupported type " + type);
            }
          }).call(this);
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


},{"./DSData":51,"./DSDigest":56,"./DSDocument":57,"./DSHistory":58,"./DSPool":62,"./util":66}],51:[function(require,module,exports){
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
    return this.$ds_ref > 1;
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


},{"./DSObject":60,"./util":66}],52:[function(require,module,exports){
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

      DSDataEditable.begin("DSDataEditable<" + itemType.docType + ">");

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
            _this._startLoad();
            if (typeof _this._unwatch1 === "function") {
              _this._unwatch1();
            }
            _this._unwatch1 = null;
            if (typeof _this._unwatch2 === "function") {
              _this._unwatch2();
            }
            _this._unwatch2 = null;
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
            var inUpdate, newStatus, prevStatus;
            inUpdate = false;
            if (!((newStatus = DSDocument.integratedStatus(sets)) === (prevStatus = _this.get('status')))) {
              switch (newStatus) {
                case 'ready':
                  if (inUpdate) {
                    inUpdate = false;
                    _this._endLoad(true);
                  } else {
                    DSDigest.block(load);
                  }
                  break;
                case 'load':
                  _this._startLoad();
                  break;
                case 'update':
                  if (_this._startLoad()) {
                    inUpdate = true;
                  }
                  break;
                case 'nodata':
                  if (inUpdate) {
                    inUpdate = false;
                    _this._endLoad(false);
                  } else {
                    _this.set('status', 'nodata');
                  }
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


},{"./DSData":51,"./DSDigest":56,"./DSDocument":57,"./DSSet":63,"./util":66}],53:[function(require,module,exports){
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
    return classes[itemType.docType] = DSDataFiltered = (function(superClass) {
      var $u, k;

      extend(DSDataFiltered, superClass);

      function DSDataFiltered() {
        return DSDataFiltered.__super__.constructor.apply(this, arguments);
      }

      DSDataFiltered.begin("DSDataFiltered<" + itemType.docType + ">");

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
            _this._startLoad();
            if (typeof _this._unwatch1 === "function") {
              _this._unwatch1();
            }
            _this._unwatch1 = null;
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
            var inUpdate, newStatus, prevStatus;
            inUpdate = false;
            if (!((newStatus = original.get('status')) === (prevStatus = _this.get('status')))) {
              switch (newStatus) {
                case 'ready':
                  if (inUpdate) {
                    inUpdate = false;
                    _this._endLoad(true);
                  } else {
                    DSDigest.block(load);
                  }
                  break;
                case 'load':
                  _this._startLoad();
                  break;
                case 'update':
                  if (_this._startLoad()) {
                    inUpdate = true;
                  }
                  break;
                case 'nodata':
                  if (inUpdate) {
                    inUpdate = false;
                    _this._endLoad(false);
                  } else {
                    _this.set('status', 'nodata');
                  }
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


},{"./DSData":51,"./DSDigest":56,"./DSObject":60,"./DSSet":63,"./util":66}],54:[function(require,module,exports){
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


},{"./DSObject":60,"./DSPool":62,"./util":66}],55:[function(require,module,exports){
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
  'config', '$rootScope', '$q', '$http', (function(config, $rootScope, $q, $http) {
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
        this._lastRefresh = null;
        this._refreshTimer = null;
        $rootScope.$watch((function() {
          return config.refreshPeriod;
        }), (function(_this) {
          return function(val) {
            _this._setNextRefresh();
          };
        })(this));
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

      DSDataSource.prototype._setNextRefresh = function() {
        var currTime, nextUpdate, timeout;
        if (this._refreshTimer !== null) {
          clearTimeout(this._refreshTimer);
        }
        if (config.refreshPeriod !== null) {
          timeout = this._lastRefresh === null ? 0 : (nextUpdate = this._lastRefresh.add(config.refreshPeriod, 'minutes'), currTime = moment(), nextUpdate >= currTime ? nextUpdate - currTime : 0);
          this._refreshTimer = setTimeout(((function(_this) {
            return function() {
              _this.refresh();
            };
          })(this)), timeout);
        }
      };

      DSDataSource.prototype.refresh = (function() {
        this._lastRefresh = moment();
        this._setNextRefresh();
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


},{"../utils/base64":68,"./DSDigest":56,"./DSObject":60,"./util":66}],56:[function(require,module,exports){
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


},{"./util":66}],57:[function(require,module,exports){
var DSDocument, DSObject, DSObjectBase, DSSet, assert, error, traceRefs,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

traceRefs = require('./util').traceRefs;

DSObjectBase = require('./DSObjectBase');

DSObject = require('./DSObject');

DSSet = require('./DSSet');

module.exports = DSDocument = (function(superClass) {
  extend(DSDocument, superClass);

  DSDocument.begin('DSDocument');

  function DSDocument(referry, key) {
    DSDocument.__super__.constructor.call(this, referry, key);
    if (assert) {
      if (this.__proto__.constructor === DSDocument) {
        throw new Error('Cannot instantiate DSDocument directly');
      }
    }
  }

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
      var init, k, prop, props, ref, ref1, v;

      extend(Editable, superClass1);

      function Editable() {
        return Editable.__super__.constructor.apply(this, arguments);
      }

      Editable.begin(originalDocClass.docType + ".Editable");

      delete Editable.prototype.$ds_docType;

      Editable.ds_editable = true;

      init = null;

      ref = Editable.__super__.__init;
      for (k in ref) {
        v = ref[k];
        if (originalDocClass.prototype.__props[k.substr(1)].calc) {
          (init || (init = {}))[k] = v;
        }
      }

      Editable.prototype.__init = init;

      Editable.ds_dstr.push((function() {
        var change, propMap, propName, s;
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
        var changePair, i, index, item, len, list, notEmpty, prop, propName, refs;
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
        if ((this.__change = changes)) {
          notEmpty = false;
          for (propName in changes) {
            prop = changes[propName];
            if (this.__props[propName].equal(serverDoc.get(propName), prop.v)) {
              delete changes[propName];
            } else {
              notEmpty = true;
            }
          }
          if (!notEmpty) {
            delete this.__change;
          } else {
            if (traceRefs) {
              list = [];
              for (propName in changes) {
                changePair = changes[propName];
                if (changePair.v instanceof DSObjectBase) {
                  list.push(changePair.v);
                }
                if (changePair.s instanceof DSObjectBase) {
                  list.push(changePair.s);
                }
              }
              for (i = 0, len = list.length; i < len; i++) {
                item = list[i];
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
            }
            this.addRef(this);
            changesSet.add(this, this);
          }
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
        var change, empty, i, len, prop, s, val;
        if ((change = this.__change) && change.hasOwnProperty(propName) && item.__props[propName].equal((val = (prop = change[propName]).v), value)) {
          if ((s = prop.s) instanceof DSObjectBase) {
            s.release(this);
          }
          if (val instanceof DSObjectBase) {
            val.release(this);
          }
          delete change[propName];
          empty = true;
          for (i = 0, len = change.length; i < len; i++) {
            propName = change[i];
            if (!(propName !== '__error' && propName !== '__refreshView')) {
              continue;
            }
            empty = false;
            break;
          }
          if (empty) {
            delete this.__change;
            this.$ds_chg.remove(this);
          }
        }
      });

      Editable.prototype._clearChanges = function() {
        var change, i, lst, prop, propName, ref1, s;
        if ((change = this.__change)) {
          for (propName in change) {
            prop = change[propName];
            if (this.$ds_evt) {
              ref1 = this.$ds_evt;
              for (i = ref1.length - 1; i >= 0; i += -1) {
                lst = ref1[i];
                lst.__onChange.call(lst, this, propName, this.$ds_doc[propName], prop.v);
              }
            }
            if ((s = prop.s) instanceof DSObjectBase) {
              s.release(this);
            }
            if ((v = prop.v) instanceof DSObjectBase) {
              v.release(this);
            }
          }
          delete this.__change;
          this.$ds_chg.remove(this);
        }
      };

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

      ref1 = originalDocClass.prototype.__props;
      for (k in ref1) {
        prop = ref1[k];
        if (!prop.calc) {
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
                var change, changePair, empty, i, j, lst, oldVal, ref2, ref3, s, serverValue;
                if (propName === 'tags') {
                  console.info('tags:', value != null ? value.value : void 0);
                }
                if (assert) {
                  if (typeof (value = valid(v = value)) === 'undefined') {
                    error.invalidValue(this, propName, v);
                  }
                }
                if (!equal((oldVal = getValue.call(this)), value)) {
                  if (value instanceof DSObjectBase) {
                    value.addRef(this);
                  }
                  if (!(change = this.__change)) {
                    change = this.__change = {};
                    if (oldVal instanceof DSObjectBase) {
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
                    if ((v = changePair.v) instanceof DSObjectBase) {
                      v.release(this);
                    }
                    if ((s = changePair.s) instanceof DSObjectBase) {
                      s.release(this);
                    }
                    delete change[propName];
                    empty = true;
                    for (k in change) {
                      if (k !== '__error' && k !== '__refreshView') {
                        empty = false;
                        break;
                      }
                    }
                    if (empty) {
                      if (this.$ds_evt) {
                        ref2 = this.$ds_evt;
                        for (i = ref2.length - 1; i >= 0; i += -1) {
                          lst = ref2[i];
                          lst.__onChange.call(lst, this, propName, value, oldVal);
                        }
                      }
                      delete this.__change;
                      this.$ds_chg.remove(this);
                      return;
                    }
                  } else if ((changePair = change[propName])) {
                    this.$ds_chg.$ds_hist.add(this, propName, value, changePair.v);
                    if ((v = changePair.v) instanceof DSObjectBase) {
                      v.release(this);
                    }
                    changePair.v = value;
                  } else {
                    if (serverValue instanceof DSObjectBase) {
                      serverValue.addRef(this);
                    }
                    change[propName] = {
                      v: value,
                      s: serverValue
                    };
                    this.$ds_chg.$ds_hist.add(this, propName, value, void 0);
                  }
                  if (this.$ds_evt) {
                    ref3 = this.$ds_evt;
                    for (j = ref3.length - 1; j >= 0; j += -1) {
                      lst = ref3[j];
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


},{"./DSObject":60,"./DSObjectBase":61,"./DSSet":63,"./util":66}],58:[function(require,module,exports){
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
    var h, i, len, ref, val;
    ref = this.hist;
    for (i = 0, len = ref.length; i < len; i++) {
      h = ref[i];
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
    var h, hist, i, len, m, ref, val;
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
        for (i = 0, len = ref.length; i < len; i++) {
          h = ref[i];
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

  DSHistory.prototype.hasUndo = (function() {
    return this.histTop > 0;
  });

  DSHistory.prototype.undo = (function() {
    var b, h, hist, histTop, oldVal;
    console.info('undo');
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
    console.info('redo');
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


},{"./DSDigest":56,"./DSDocument":57,"./DSObject":60,"./DSObjectBase":61,"./util":66}],59:[function(require,module,exports){
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


},{"./DSObjectBase":61,"./util":66}],60:[function(require,module,exports){
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


},{"./DSList":59,"./DSObjectBase":61,"./DSPool":62,"./DSSet":63,"./util":66}],61:[function(require,module,exports){
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
    if (typeof clazz !== 'function') {
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
        throw new Error('Cannot instantiate DSObjectBаse directly');
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
    return this.__proto__.$ds_docType + ":" + this.$ds_key + (typeof this.$ds_pool === 'object' ? '@' + this.$ds_pool : '');
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
        this[propName] = propDesc.read.call(this, value);
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
      if (typeof opts !== 'object') {
        error.invalidArg('opts');
      }
      if (!opts.hasOwnProperty('name')) {
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
      if (!(typeof opts.calc === 'undefined' || typeof opts.calc === 'boolean')) {
        throw new Error('Invalid value of opts.calc');
      }
      if (!(!opts.hasOwnProperty('func') || typeof opts.func === 'function')) {
        throw new Error('Invalid value of opts.func');
      }
      if (!(!opts.hasOwnProperty('value') || typeof opts.value !== 'function')) {
        throw new Error('Invalid value of opts.value');
      }
      if (opts.hasOwnProperty('init') && !(opts.readonly || opts.calc) && !opts.hasOwnProperty('valid')) {
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
      if (opts.hasOwnProperty('readonly') && !opts.readonly && opts.hasOwnProperty('calc') && opts.calc) {
        throw new Error('Ambiguous opts.readonly and opts.calc');
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
      readonly: opts.readonly || false,
      calc: opts.calc || false
    };
    if (opts.hasOwnProperty('init')) {
      valid = propDecl.valid = opts.valid;
      propDecl.init = this.prototype.__init[localName = "_" + (name = opts.name)] = opts.init;
      if (opts.calc) {
        opts.readonly === true;
        this.prototype["__setCalc" + (name.substr(0, 1).toUpperCase() + name.substr(1))] = (function(value) {
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
        });
      }
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
        value: opts.value
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

  DSObjectBase.propSimple = (function(type, name, init, valid, calc) {
    var q;
    if (assert) {
      if (!(type === 'number' || type === 'boolean' || type === 'string' || type === 'object')) {
        error.invalidArg('type');
      }
      if (typeof name !== 'string') {
        error.invalidArg('name');
      }
      if (!(typeof init === 'undefined' || init === null || typeof init === 'function' || typeof init === type)) {
        error.invalidArg('init');
      }
      if (!(!valid || typeof valid === 'function')) {
        error.invalidArg('valid');
      }
      if (!(typeof calc === 'undefined' || typeof calc === 'boolean')) {
        error.invalidArg('calc');
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
      init: typeof init === 'undefined' || init === null ? null : typeof init === 'function' || type !== 'object' ? init : (function() {
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
      }),
      calc: calc
    });
  });

  DSObjectBase.propNum = (function(name, init, validation, calc) {
    this.propSimple('number', name, init, validation, calc);
  });

  DSObjectBase.propBool = (function(name, init, validation, calc) {
    return this.propSimple('boolean', name, init, validation, calc);
  });

  DSObjectBase.propStr = (function(name, init, validation, calc) {
    return this.propSimple('string', name, init, validation, calc);
  });

  DSObjectBase.propObj = (function(name, init, validation, calc) {
    return this.propSimple('object', name, init, validation, calc);
  });

  DSObjectBase.propDoc = (function(name, type, valid, calc) {
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
      if (typeof calc !== 'undefined' && typeof calc !== 'boolean') {
        error.invalidArg('calc');
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
      valid: valid,
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
      calc: calc,
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
    var i, len, localName, q, s, valid;
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
    localName = "_" + name;
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
        if (typeof listener !== 'function') {
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


},{"./util":66}],62:[function(require,module,exports){
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
    var active, evt, k, v, w;
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
    active = true;
    return ((function(_this) {
      return function() {
        if (active) {
          active = false;
          _this.release(owner);
          _.remove(evt, w);
        }
      };
    })(this));
  });

  DSPool.end();

  return DSPool;

})(DSObjectBase);


},{"./DSDigest":56,"./DSObjectBase":61,"./util":66}],63:[function(require,module,exports){
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
    var active, evt, k, v;
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
    active = true;
    return ((function(_this) {
      return function() {
        if (active) {
          active = false;
          _this.release(owner);
          _.remove(evt, (function(v) {
            return v === listener;
          }));
        }
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


},{"./DSObjectBase":61,"./util":66}],64:[function(require,module,exports){
var DSObjectBase, DSTags, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

DSObjectBase = require('./DSObjectBase');

module.exports = DSTags = (function(superClass) {
  extend(DSTags, superClass);

  DSTags.nextTags = 0;

  DSTags.begin('DSTags');

  DSTags.addPropType = (function(clazz) {
    clazz.propDSTags = (function(name, valid) {
      var localName, q;
      if (assert) {
        if (!typeof name === 'string') {
          error.invalidArg('name');
        }
        if (valid && typeof valid !== 'function') {
          error.invalidArg('valid');
        }
      }
      valid = (q = valid) ? (function(value) {
        if ((value === null || (typeof value === 'object' && value instanceof DSTags)) && q(value)) {
          return value;
        } else {
          return void 0;
        }
      }) : (function(value) {
        if (value === null || value instanceof DSTags) {
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
      return clazz.prop({
        name: name,
        type: 'DSTags',
        valid: valid,
        read: (function(v) {
          if (v !== null) {
            return new DSTags(this, v);
          } else {
            return null;
          }
        }),
        str: (function(v) {
          return v.value;
        }),
        init: null,
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
  });

  DSTags.ds_dstr.push((function() {
    var k, ref, v;
    ref = this.map;
    for (k in ref) {
      v = ref[k];
      if (v instanceof DSObjectBase) {
        v.release(this);
      }
    }
  }));

  function DSTags(referry, enums) {
    var i, k, key, len, map, ref, ref1, src, v, value;
    DSTags.__super__.constructor.call(this, referry, "" + (++DSTags.nextTags));
    if (assert) {
      if (arguments.length === 2 && typeof (src = arguments[1]) === 'object') {
        void 0;
      } else {
        if (typeof enums !== 'string') {
          error.invalidArg('enums');
        }
      }
    }
    if (arguments.length === 2 && typeof (src = arguments[1]) === 'object') {
      if (src.__proto__ === DSTags.prototype) {
        this.map = _.clone(src.map);
        this.value = src.value;
      } else {
        this.map = map = _.clone(enums);
        this.value = (_.sortBy((function() {
          var results;
          results = [];
          for (k in map) {
            results.push(k);
          }
          return results;
        })())).join(', ');
      }
      ref = this.map;
      for (key in ref) {
        value = ref[key];
        if (value instanceof DSObjectBase) {
          value.addRef(this);
        }
      }
    } else {
      this.map = map = {};
      if (typeof enums === 'string') {
        ref1 = enums.split(',');
        for (i = 0, len = ref1.length; i < len; i++) {
          v = ref1[i];
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
      })())).join(', ');
    }
  }

  DSTags.prototype.clone = function(owner) {
    return new DSTags(owner, this);
  };

  DSTags.prototype.toString = function() {
    return this.value;
  };

  DSTags.prototype.valueOf = function() {
    return this.value;
  };

  DSTags.prototype.set = (function(enumValue, value) {
    var alreadyIn, k, map, oldValue;
    if (assert) {
      if (typeof enumValue !== 'string') {
        error.invalidArg('enumValue');
      }
      if (typeof value === 'undefined') {
        error.invalidArg('value');
      }
    }
    if (!!value) {
      alreadyIn = (map = this.map).hasOwnProperty(enumValue);
      if (value instanceof DSObjectBase) {
        value.addRef(this);
      }
      if ((oldValue = map[enumValue]) instanceof DSObjectBase) {
        oldValue.release(this);
      }
      map[enumValue] = value;
      if (!alreadyIn) {
        this.value = (_.sortBy((function() {
          var results;
          results = [];
          for (k in map) {
            results.push(k);
          }
          return results;
        })())).join(', ');
      }
    } else if ((map = this.map).hasOwnProperty(enumValue)) {
      if ((oldValue = map[enumValue]) instanceof DSObjectBase) {
        oldValue.release(this);
      }
      delete this.map[enumValue];
      this.value = (_.sortBy((function() {
        var results;
        results = [];
        for (k in map) {
          results.push(k);
        }
        return results;
      })())).join(', ');
    }
    return this;
  });

  DSTags.prototype.get = (function(enumValue) {
    if (assert) {
      if (!(typeof enumValue === 'string')) {
        error.invalidArg('enumValue');
      }
    }
    if (this.map.hasOwnProperty(enumValue)) {
      return this.map[enumValue];
    } else {
      return false;
    }
  });

  DSTags.prototype.any = (function(map) {
    var k;
    for (k in map) {
      if (this.map.hasOwnProperty(k)) {
        return true;
      }
    }
    return false;
  });

  DSTags.prototype.empty = function() {
    var k;
    for (k in this.map) {
      return false;
    }
    return true;
  };

  DSTags.prototype.diff = (function(src) {
    var k, map, srcMap;
    if (assert) {
      if (!(typeof src === 'object' && src.__proto__ === DSTags.prototype)) {
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

  DSTags.end();

  return DSTags;

})(DSObjectBase);


},{"./DSObjectBase":61,"./util":66}],65:[function(require,module,exports){
var DSObject, DSSet, assert, error, ngModule, traceView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('dscommon/DSView', [require('../app/data/dsDataService')])).name;

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


},{"../app/data/dsDataService":7,"./DSObject":60,"./DSSet":63,"./util":66}],66:[function(require,module,exports){
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
    duplicatedProperty: (function(type, propName) {
      throw new Error("Class '" + type.docType + "': Prop '" + propName + "': Duplicated property name");
    }),
    propIsReadOnly: (function(type, propName) {
      throw new Error("Class '" + type.docType + "': Prop '" + propName + "': Property is read-only");
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


},{}],67:[function(require,module,exports){
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
},{}],68:[function(require,module,exports){
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


},{}]},{},[1]);
