(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
          if (!desc.readonly && typeof (v = localStorageService.get(name)) !== 'undefined') {
            if (v) {
              config.set(name, v);
            }
          }
        }
      }
    }
    return config;
  })
]);


},{"../dscommon/DSObject":19,"../dscommon/util":24,"../utils/angular-local-storage.js":31,"./models/Person":5}],2:[function(require,module,exports){
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
                      teamworkPeople.items[personKey].set('roles', dstags = new DSTags(_this, '' + ++DSTags.nextTags, personInfo.role));
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


},{"../../dscommon/DSData":13,"../../dscommon/DSDataServiceBase":14,"../../dscommon/DSDigest":16,"../../dscommon/DSSet":22,"../../dscommon/DSTags":23,"../../dscommon/util":24,"../models/Person":5}],3:[function(require,module,exports){
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


},{"../../../dscommon/DSData":13,"../../../dscommon/DSDigest":16,"../../../dscommon/util":24}],4:[function(require,module,exports){
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


},{"../../../dscommon/DSDataSource":15,"../../../dscommon/util":24,"../../models/Person":5,"./DSDataTeamworkPaged":3}],5:[function(require,module,exports){
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


},{"../../dscommon/DSDocument":17,"../../dscommon/DSTags":23,"../../dscommon/util":24}],6:[function(require,module,exports){
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


},{"../../dscommon/DSObject":19,"../../dscommon/util":24}],7:[function(require,module,exports){
var Comments, DSDocument, DSTags, Person, Project, Task, TaskSplit, TaskTimeTracking, TodoList, assert, error, time,
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

DSTags = require('../../dscommon/DSTags');

Comments = require('./types/Comments');

TaskSplit = require('./types/TaskSplit');

module.exports = Task = (function(superClass) {
  extend(Task, superClass);

  function Task() {
    return Task.__super__.constructor.apply(this, arguments);
  }

  Task.begin('Task');

  Comments.addPropType(Task);

  TaskSplit.addPropType(Task);

  DSTags.addPropType(Task);

  Task.addPool(true);

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

  return Task;

})(DSDocument);


},{"../../dscommon/DSDocument":17,"../../dscommon/DSTags":23,"../../dscommon/util":24,"../ui/time":12,"./Person":5,"./Project":6,"./TaskTimeTracking":8,"./TodoList":9,"./types/Comments":10,"./types/TaskSplit":11}],8:[function(require,module,exports){
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


},{"../../dscommon/DSObject":19}],9:[function(require,module,exports){
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


},{"../../dscommon/DSObject":19,"../../dscommon/util":24,"./Project":6}],10:[function(require,module,exports){
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


},{"../../../dscommon/DSDocument":17,"../../../dscommon/util":24}],11:[function(require,module,exports){
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


},{"../../../dscommon/DSDocument":17,"../../../dscommon/util":24}],12:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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


},{"./DSObject":19,"./util":24}],14:[function(require,module,exports){
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


},{"./DSObject":19,"./DSPool":21,"./util":24}],15:[function(require,module,exports){
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


},{"../utils/base64":33,"./DSDigest":16,"./DSObject":19,"./util":24}],16:[function(require,module,exports){
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


},{"./util":24}],17:[function(require,module,exports){
var DSDocument, DSObject, DSObjectBase, DSSet, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

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
        var changePair, i, index, item, len, list, propName, ref, refs;
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
        if ((this.__change = this.changes)) {
          if (traceRefs) {
            list = [];
            ref = (this.__change = changes);
            for (propName in ref) {
              changePair = ref[propName];
              if (changePair.v instanceof DSObject) {
                list.push(changePair.v);
              }
              if (changePair.s instanceof DSObject) {
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
        var change, empty, i, j, len, lst, prop, ref, s, val;
        if ((change = this.__change) && change.hasOwnProperty(propName) && item.__props[propName].equal((val = (prop = change[propName]).v), value)) {
          this.$ds_chg.$ds_hist.setSameAsServer(this, propName);
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
        } else if (this.$ds_evt) {
          ref = this.$ds_evt;
          for (j = ref.length - 1; j >= 0; j += -1) {
            lst = ref[j];
            lst.__onChange.call(lst, this, propName, value, oldVal);
          }
        }
      });

      Editable.prototype._clearChanges = function() {
        var change, i, lst, prop, propName, ref, s, v;
        if ((change = this.__change)) {
          for (propName in change) {
            prop = change[propName];
            this.$ds_chg.$ds_hist.setSameAsServer(this, propName);
            ref = this.$ds_evt;
            for (i = ref.length - 1; i >= 0; i += -1) {
              lst = ref[i];
              lst.__onChange.call(lst, this, propName, prop.s, prop.v);
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
                var change, changePair, empty, i, j, lst, oldVal, ref1, ref2, s, serverValue, v;
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
                    empty = true;
                    for (k in change) {
                      if (k !== '__error' && k !== '__refreshView') {
                        empty = false;
                        break;
                      }
                    }
                    if (empty) {
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


},{"./DSObject":19,"./DSObjectBase":20,"./DSSet":22,"./util":24}],18:[function(require,module,exports){
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


},{"./DSObjectBase":20,"./util":24}],19:[function(require,module,exports){
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


},{"./DSList":18,"./DSObjectBase":20,"./DSPool":21,"./DSSet":22,"./util":24}],20:[function(require,module,exports){
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


},{"./util":24}],21:[function(require,module,exports){
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


},{"./DSDigest":16,"./DSObjectBase":20,"./util":24}],22:[function(require,module,exports){
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


},{"./DSObjectBase":20,"./util":24}],23:[function(require,module,exports){
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
            return new DSTags(this, '' + ++DSTags.nextTags, v);
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

  function DSTags(referry, key, enums) {
    var i, k, len, map, ref, ref1, src, v, value;
    DSTags.__super__.constructor.call(this, referry, key);
    if (assert) {
      if (arguments.length === 3 && typeof (src = arguments[2]) === 'object') {
        void 0;
      } else {
        if (typeof enums !== 'string') {
          error.invalidArg('enums');
        }
      }
    }
    if (arguments.length === 3 && typeof (src = arguments[2]) === 'object') {
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
    return;
  }

  DSTags.prototype.toString = (function() {
    return this.value;
  });

  DSTags.prototype.valueOf = (function() {
    return this.value;
  });

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


},{"./DSObjectBase":20,"./util":24}],24:[function(require,module,exports){
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


},{}],25:[function(require,module,exports){
var DSDataServiceBase, PeriodTimeTracking, Person, Project, assert, base64, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataService', [require('../../dscommon/DSDataSource'), require('../../app/config'), require('../../dscommon/DSDataSource'), require('../../app/data/teamwork/TWPeople'), require('../../app/data/PeopleWithJson'), require('./teamwork/TWProjects'), require('./teamwork/TWPeriodTimeTracking')])).name;

assert = require('../../dscommon/util').assert;

serviceOwner = require('../../dscommon/util').serviceOwner;

error = require('../../dscommon/util').error;

base64 = require('../../utils/base64');

DSDataServiceBase = require('../../dscommon/DSDataServiceBase');

Person = require('../../app/models/Person');

Project = require('../../app/models/Project');

PeriodTimeTracking = require('../models/PeriodTimeTracking');

ngModule.run([
  'dsDataService', '$rootScope', function(dsDataService, $rootScope) {
    $rootScope.dataService = dsDataService;
  }
]);

ngModule.factory('dsDataService', [
  'TWPeriodTimeTracking', 'PeopleWithJson', 'TWPeople', 'TWProjects', 'DSDataSource', 'config', '$http', '$rootScope', '$q', function(TWPeriodTimeTracking, PeopleWithJson, TWPeople, TWProjects, DSDataSource, config, $http, $rootScope, $q) {
    var DSDataService;
    DSDataService = (function(superClass) {
      extend(DSDataService, superClass);

      DSDataService.begin('DSDataService');

      DSDataService.propDoc('dataSource', DSDataSource);

      DSDataService.propSet('peopleSet', Person);

      DSDataService.propSet('projectsSet', Project);

      DSDataService.propSet('periodTimeTrackingSet', PeriodTimeTracking);

      DSDataService.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      function DSDataService() {
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
        return;
      }

      DSDataService.prototype.refresh = function() {
        this.get('dataSource').refresh();
      };

      DSDataService.prototype.findDataSet = function(owner, params) {
        var base, base1, base2, base3, data, set;
        DSDataServiceBase.prototype.findDataSet.call(this, owner, params);
        switch (params.type.docType) {
          case 'Person':
            if (params.source) {
              delete params.source;
              if (typeof (base = (data = TWPeople.pool.find(this, params))).init === "function") {
                base.init(this);
              }
              (set = data.get('peopleSet')).addRef(owner);
              data.release(this);
            } else {
              if (typeof (base1 = (data = PeopleWithJson.pool.find(this, params))).init === "function") {
                base1.init(this);
              }
              (set = data.get('peopleSet')).addRef(owner);
              data.release(this);
            }
            return set;
          case 'Project':
            if (typeof (base2 = (data = TWProjects.pool.find(this, params))).init === "function") {
              base2.init(this);
            }
            (set = data.get('projectsSet')).addRef(owner);
            data.release(this);
            return set;
          case 'PeriodTimeTracking':
            if (typeof (base3 = (data = TWPeriodTimeTracking.pool.find(this, params))).init === "function") {
              base3.init(this);
            }
            (set = data.get('timeTrackingSet')).addRef(owner);
            data.release(this);
            return set;
        }
      };

      DSDataService.prototype.requestSources = function(owner, params, sources) {
        DSDataServiceBase.prototype.requestSources.call(this, owner, params, sources);
        throw new Error('requestSources() is not implemented for reports.  It\'s not expected that DSView will be used');
      };

      DSDataService.end();

      return DSDataService;

    })(DSDataServiceBase);
    return serviceOwner.add(new DSDataService(serviceOwner, 'dataService'));
  }
]);


},{"../../app/config":1,"../../app/data/PeopleWithJson":2,"../../app/data/teamwork/TWPeople":4,"../../app/models/Person":5,"../../app/models/Project":6,"../../dscommon/DSDataServiceBase":14,"../../dscommon/DSDataSource":15,"../../dscommon/util":24,"../../utils/base64":33,"../models/PeriodTimeTracking":28,"./teamwork/TWPeriodTimeTracking":26,"./teamwork/TWProjects":27}],26:[function(require,module,exports){
var DSData, DSDigest, DSObject, DSSet, HISTORY_END_SEARCH_STEP, PeriodTimeTracking, Person, Project, WORK_ENTRIES_WHOLE_PAGE, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWPeriodTimeTracking', [require('../../../dscommon/DSDataSource')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSObject = require('../../../dscommon/DSObject');

DSData = require('../../../dscommon/DSData');

DSSet = require('../../../dscommon/DSSet');

DSDigest = require('../../../dscommon/DSDigest');

Person = require('../../../app/models/Person');

Project = require('../../../app/models/Project');

PeriodTimeTracking = require('../../models/PeriodTimeTracking');

WORK_ENTRIES_WHOLE_PAGE = 500;

HISTORY_END_SEARCH_STEP = 50;

ngModule.factory('TWPeriodTimeTracking', [
  'DSDataSource', '$rootScope', '$q', function(DSDataSource, $rootScope, $q) {
    var TWPeriodTimeTracking;
    return TWPeriodTimeTracking = (function(superClass) {
      extend(TWPeriodTimeTracking, superClass);

      function TWPeriodTimeTracking() {
        return TWPeriodTimeTracking.__super__.constructor.apply(this, arguments);
      }

      TWPeriodTimeTracking.begin('LoadPeriodTimeTracking');

      TWPeriodTimeTracking.addPool();

      TWPeriodTimeTracking.propDoc('source', DSDataSource);

      TWPeriodTimeTracking.propDoc('people', DSSet);

      TWPeriodTimeTracking.propDoc('projects', DSSet);

      TWPeriodTimeTracking.propSet('timeTracking', PeriodTimeTracking);

      TWPeriodTimeTracking.propObj('cancel', null);

      TWPeriodTimeTracking.ds_dstr.push(function() {
        this.__unwatchA();
        this.__unwatch1();
        this.__unwatch2();
      });

      TWPeriodTimeTracking.prototype.clear = function() {
        var cancel;
        if (typeof this.__unwatch1 === "function") {
          this.__unwatch1();
        }
        this.__unwatchA = null;
        if (typeof this.__unwatch2 === "function") {
          this.__unwatch2();
        }
        this.__unwatchB = null;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      };

      TWPeriodTimeTracking.prototype.init = function(dsDataService) {
        var from, to;
        if (!moment.isMoment((from = this.get('params').from))) {
          throw new Error('Missing params.from');
        }
        if (!moment.isMoment((to = this.get('params').to))) {
          throw new Error('Missing params.to');
        }
        if (!(from < to)) {
          throw new Error('Params.to is less or equal to params.from');
        }
        (this.set('people', dsDataService.findDataSet(this, {
          type: Person,
          mode: 'original'
        }))).release(this);
        (this.set('projects', dsDataService.findDataSet(this, {
          type: Project,
          mode: 'original'
        }))).release(this);
        this.__unwatchA = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      };

      TWPeriodTimeTracking.prototype.load = function() {
        var actualLoad, people, projects, sets;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        sets = [people = this.get('people'), projects = this.get('projects')];
        actualLoad = (function(_this) {
          return function() {
            var endPage, finalizeLoad, findFirstPage, from, importResponse, missingPeople, onError, pageLoad, pages, periodTimeTrackingMap, personKey, ref, taskTracking, to, topPage;
            if (DSObject.integratedStatus(sets) !== 'ready') {
              return;
            }
            _this.__unwatch1();
            _this.__unwatch2();
            ref = PeriodTimeTracking.pool.items;
            for (personKey in ref) {
              taskTracking = ref[personKey];
              taskTracking.set('totalMin', 0);
            }
            periodTimeTrackingMap = {};
            missingPeople = {};
            from = _this.get('params').from;
            to = _this.get('params').to;
            importResponse = function(timeEntries) {
              var date, i, jsonTaskTimeEntry, len, minutes, periodTimeTracking, person, personId, projectId, taskId, taskName, timeEntryId;
              for (i = 0, len = timeEntries.length; i < len; i++) {
                jsonTaskTimeEntry = timeEntries[i];
                if (!((date = moment(jsonTaskTimeEntry['date'])) >= from)) {
                  continue;
                }
                timeEntryId = jsonTaskTimeEntry['id'];
                personId = parseInt(jsonTaskTimeEntry['person-id']);
                projectId = parseInt(jsonTaskTimeEntry['project-id']);
                minutes = 60 * parseInt(jsonTaskTimeEntry['hours']) + parseInt(jsonTaskTimeEntry['minutes']);
                if (jsonTaskTimeEntry['todo-item-id'] !== '') {
                  taskId = parseInt(jsonTaskTimeEntry['todo-item-id']);
                  taskName = jsonTaskTimeEntry['todo-item-name'];
                } else {
                  taskId = null;
                  taskName = null;
                }
                if (date >= to) {
                  return false;
                }
                periodTimeTracking = PeriodTimeTracking.pool.find(_this, personId + "-" + projectId + "-" + taskId, periodTimeTrackingMap);
                if (!(person = people.items[personId])) {
                  person = Person.pool.find(_this, "missing-" + personId, missingPeople);
                  person.set('id', personId);
                  person.set('missing', true);
                }
                periodTimeTracking.set('person', person);
                periodTimeTracking.set('project', projects.items[projectId]);
                periodTimeTracking.set('taskId', taskId);
                periodTimeTracking.set('taskName', taskName);
                periodTimeTracking.set('totalMin', periodTimeTracking.get('totalMin') + minutes);
                periodTimeTracking.set('lastReport', date);
              }
              return timeEntries.length === WORK_ENTRIES_WHOLE_PAGE;
            };
            finalizeLoad = (function() {
              var k, person;
              _this.get('timeTrackingSet').merge(_this, periodTimeTrackingMap);
              for (k in missingPeople) {
                person = missingPeople[k];
                person.release(_this);
              }
              _this._endLoad(true);
            });
            onError = (function(error, isCancelled) {
              var k, v;
              if (!isCancelled) {
                console.error('error: ', error);
                _this.set('cancel', null);
              }
              for (k in periodTimeTrackingMap) {
                v = periodTimeTrackingMap[k];
                v.release(_this);
              }
              _this._endLoad(false);
            });
            pages = {};
            pageLoad = (function(page) {
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
                    if (!(entries = resp.data['time-entries'])) {
                      finalizeLoad();
                    } else if (moment(entries[entries.length - 1]['date']) < from) {
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
            });
            topPage = 1;
            endPage = HISTORY_END_SEARCH_STEP;
            (findFirstPage = (function(page) {
              _this.get('source').httpGet("time_entries.json?page=" + page + "&pageSize=" + WORK_ENTRIES_WHOLE_PAGE, _this.set('cancel', $q.defer())).then((function(resp) {
                var entries, ref1;
                if (resp.status === 200) {
                  _this.set('cancel', null);
                  if (!(entries = resp.data['time-entries']) || entries.length === 0) {
                    findFirstPage(topPage + Math.floor(((endPage = page) - topPage) / 2));
                  } else {
                    if (moment(entries[0]['date']) >= from) {
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
                    } else if (moment(entries[entries.length - 1]['date']) < from) {
                      if (endPage === page) {
                        ref1 = [endPage, endPage + HISTORY_END_SEARCH_STEP], topPage = ref1[0], endPage = ref1[1];
                        findFirstPage(endPage);
                      } else if (endPage === (page + 1)) {
                        finalizeLoad();
                      } else {
                        topPage = page + 1;
                        findFirstPage(topPage + Math.floor((endPage - topPage) / 2));
                      }
                    } else {
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
            }))(endPage);
          };
        })(this);
        this.__unwatch1 = people.watchStatus(this, actualLoad);
        this.__unwatch2 = projects.watchStatus(this, actualLoad);
      };

      TWPeriodTimeTracking.end();

      return TWPeriodTimeTracking;

    })(DSData);
  }
]);


},{"../../../app/models/Person":5,"../../../app/models/Project":6,"../../../dscommon/DSData":13,"../../../dscommon/DSDataSource":15,"../../../dscommon/DSDigest":16,"../../../dscommon/DSObject":19,"../../../dscommon/DSSet":22,"../../../dscommon/util":24,"../../models/PeriodTimeTracking":28}],27:[function(require,module,exports){
var Project, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWProjects', [require('../../../dscommon/DSDataSource'), require('../../../app/data/teamwork/DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Project = require('../../../app/models/Project');

ngModule.factory('TWProjects', [
  'DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$q', (function(DSDataTeamworkPaged, DSDataSource, $rootScope, $q) {
    var TWProjects;
    return TWProjects = (function(superClass) {
      extend(TWProjects, superClass);

      function TWProjects() {
        return TWProjects.__super__.constructor.apply(this, arguments);
      }

      TWProjects.begin('TWProjects');

      TWProjects.addPool();

      TWProjects.propSet('projects', Project);

      TWProjects.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      TWProjects.prototype.init = (function(dsDataService) {
        this.set('request', "projects.json?status=ALL");
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
        this.projectsMap = {};
      });

      TWProjects.prototype.startLoad = function() {
        this.projectsMap = {};
      };

      TWProjects.prototype.importResponse = function(json) {
        var cnt, i, jsonProject, len, project, ref;
        cnt = 0;
        ref = json['projects'];
        for (i = 0, len = ref.length; i < len; i++) {
          jsonProject = ref[i];
          ++cnt;
          project = Project.pool.find(this, "" + jsonProject['id'], this.projectsMap);
          project.set('id', parseInt(jsonProject['id']));
          project.set('name', jsonProject['name']);
          project.set('status', jsonProject['status']);
        }
        return cnt;
      };

      TWProjects.prototype.finalizeLoad = function() {
        this.get('projectsSet').merge(this, this.projectsMap);
      };

      TWProjects.end();

      return TWProjects;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../app/data/teamwork/DSDataTeamworkPaged":3,"../../../app/models/Project":6,"../../../dscommon/DSDataSource":15,"../../../dscommon/util":24}],28:[function(require,module,exports){
var DSObject, PeriodTimeTracking, Person, Project, Task,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../dscommon/DSObject');

Person = require('../../app/models/Person');

Project = require('../../app/models/Project');

Task = require('../../app/models/Task');

module.exports = PeriodTimeTracking = (function(superClass) {
  extend(PeriodTimeTracking, superClass);

  function PeriodTimeTracking() {
    return PeriodTimeTracking.__super__.constructor.apply(this, arguments);
  }

  PeriodTimeTracking.begin('PeriodTimeTracking');

  PeriodTimeTracking.addPool();

  PeriodTimeTracking.propDoc('person', Person);

  PeriodTimeTracking.propDoc('project', Project);

  PeriodTimeTracking.propNum('taskId');

  PeriodTimeTracking.propStr('taskName');

  PeriodTimeTracking.propMoment('lastReport');

  PeriodTimeTracking.propNum('totalMin', 0);

  PeriodTimeTracking.end();

  return PeriodTimeTracking;

})(DSObject);


},{"../../app/models/Person":5,"../../app/models/Project":6,"../../app/models/Task":7,"../../dscommon/DSObject":19}],29:[function(require,module,exports){
(function (global){
var ExcelBuilder, FileSaver, PeriodTimeTracking, base62ToBlob, base64, defaultTask, fixStr, ngModule, projectReport, serviceOwner;

ExcelBuilder = (typeof window !== "undefined" ? window['ExcelBuilder'] : typeof global !== "undefined" ? global['ExcelBuilder'] : null);

FileSaver = require('../../static/libs/FileSaver.js/FileSaver');

serviceOwner = require('../dscommon/util').serviceOwner;

PeriodTimeTracking = require('./models/PeriodTimeTracking');

base64 = require('../utils/base64');

base62ToBlob = require('../utils/base62ToBlob');

module.exports = (ngModule = angular.module('reports-app', ['ui.bootstrap', require('./showSpinner'), require('./data/dsDataService'), require('./data/teamwork/TWPeriodTimeTracking')])).name;

defaultTask = "Без задачи";

fixStr = function(str) {
  if (str === null) {
    return str;
  } else {
    return str.replace(/"/g, '""');
  }
};

projectReport = function(workbook) {
  var ProjectReport, alightRight, blue, fontBold, hoursFormat, moneyFormat, moneyFormatBold, rateFormat, styleSheet;
  styleSheet = workbook.getStyleSheet();
  fontBold = styleSheet.createFormat({
    font: {
      bold: true
    }
  });
  alightRight = styleSheet.createFormat({
    font: {
      bold: true
    },
    alignment: {
      horizontal: 'right'
    }
  });
  rateFormat = styleSheet.createFormat({
    format: '0'
  });
  hoursFormat = styleSheet.createFormat({
    format: '0.00'
  });
  moneyFormat = styleSheet.createFormat({
    format: '0.00'
  });
  moneyFormatBold = styleSheet.createFormat({
    format: '0.00',
    font: {
      bold: true
    }
  });
  blue = styleSheet.createFormat({
    font: {
      color: '002A00FF'
    }
  });
  return ProjectReport = (function() {
    function ProjectReport(arg) {
      var data, j, len, ref, ref1, v;
      this.topRow = (ref = arg.topRow) != null ? ref : 0, data = arg.data;
      this.rows = [];
      this.projectLine(data.project);
      this.peopleLine(data.people);
      this.ratesLine();
      ref1 = data.tasks;
      for (j = 0, len = ref1.length; j < len; j++) {
        v = ref1[j];
        this.taskLine(v.task, v.hours);
      }
      this.totalHoursLine();
      this.totalMoneyLine();
      this.addRow();
    }

    ProjectReport.prototype.addRow = function() {
      this.rows.push(this.currRow = []);
    };

    ProjectReport.prototype.skip = function() {
      this.currRow.push(null);
    };

    ProjectReport.prototype.rate = function() {
      this.currRow.push({
        value: 0,
        metadata: {
          style: rateFormat.id
        }
      });
    };

    ProjectReport.prototype.hours = function(h) {
      this.currRow.push({
        value: h,
        metadata: {
          style: hoursFormat.id
        }
      });
    };

    ProjectReport.prototype.sumHoursVert = function(rows) {
      var letter;
      letter = String.fromCharCode(65 + this.currRow.length);
      this.currRow.push({
        value: "SUM(" + letter + (this.topRow + 4) + ":" + letter + (this.topRow + this.rows.length - 1) + ")",
        metadata: {
          type: 'formula',
          style: hoursFormat.id
        }
      });
    };

    ProjectReport.prototype.sumHoursHoriz = function(rows) {
      var fromLetter, toLetter;
      fromLetter = String.fromCharCode(65 + this.currRow.length + 1);
      toLetter = String.fromCharCode(65 + this.currRow.length + this.peopleCount);
      this.currRow.push({
        value: "SUM(" + fromLetter + (this.topRow + this.rows.length) + ":" + toLetter + (this.topRow + this.rows.length) + ")",
        metadata: {
          type: 'formula',
          style: hoursFormat.id
        }
      });
    };

    ProjectReport.prototype.sumMoneyHoriz = function(rows) {
      var fromLetter, toLetter;
      fromLetter = String.fromCharCode(65 + this.currRow.length + 1);
      toLetter = String.fromCharCode(65 + this.currRow.length + this.peopleCount);
      this.currRow.push({
        value: "SUM(" + fromLetter + (this.topRow + this.rows.length) + ":" + toLetter + (this.topRow + this.rows.length) + ")",
        metadata: {
          type: 'formula',
          style: moneyFormatBold.id
        }
      });
    };

    ProjectReport.prototype.multHoursByRate = function(rows) {
      var letter;
      letter = String.fromCharCode(65 + this.currRow.length);
      this.currRow.push({
        value: "" + letter + (this.topRow + 3) + "*" + letter + (this.topRow + this.rows.length - 1),
        metadata: {
          type: 'formula',
          style: moneyFormat.id
        }
      });
    };

    ProjectReport.prototype.totalByTaskTitle = function() {
      this.currRow.push({
        value: 'Всего часов',
        metadata: {
          style: fontBold.id
        }
      });
    };

    ProjectReport.prototype.ratesTitle = function() {
      this.currRow.push({
        value: 'Стоимость часа (руб):',
        metadata: {
          style: alightRight.id
        }
      });
    };

    ProjectReport.prototype.totalHoursTitle = function() {
      this.currRow.push({
        value: 'Итого часов:',
        metadata: {
          style: alightRight.id
        }
      });
    };

    ProjectReport.prototype.totalMoneyTitle = function() {
      this.currRow.push({
        value: 'Сумма (руб):',
        metadata: {
          style: alightRight.id
        }
      });
    };

    ProjectReport.prototype.person = function(person) {
      this.currRow.push({
        value: "HYPERLINK(\"http://teamwork.webprofy.ru/people/" + person.id + "\", \"" + (person.missing ? person.id : fixStr(person.name)) + "\")",
        metadata: {
          type: 'formula',
          style: blue.id
        }
      });
    };

    ProjectReport.prototype.project = function(project) {
      this.currRow.push({
        value: "HYPERLINK(\"http://teamwork.webprofy.ru/projects/" + project.id + "/tasks\", \"" + (fixStr(project.name)) + "\")",
        metadata: {
          type: 'formula',
          style: blue.id
        }
      });
    };

    ProjectReport.prototype.task = function(task) {
      this.currRow.push((task.id === null ? defaultTask : "" + task.name));
    };

    ProjectReport.prototype.taskLink = function(task) {
      this.currRow.push((task.id === null ? '' : {
        value: "HYPERLINK(\"http://teamwork.webprofy.ru/tasks/" + task.id + "\", \"<<\")",
        metadata: {
          type: 'formula',
          style: blue.id
        }
      }));
    };

    ProjectReport.prototype.projectLine = function(project) {
      this.addRow();
      this.project(project);
    };

    ProjectReport.prototype.peopleLine = function(people) {
      var j, len, v;
      this.addRow();
      this.skip();
      this.skip();
      this.totalByTaskTitle();
      for (j = 0, len = people.length; j < len; j++) {
        v = people[j];
        this.person(v);
      }
      this.peopleCount = people.length;
    };

    ProjectReport.prototype.ratesLine = function() {
      var i, j, ref;
      this.addRow();
      this.skip();
      this.ratesTitle();
      this.skip();
      for (i = j = 0, ref = this.peopleCount; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        this.rate();
      }
    };

    ProjectReport.prototype.taskLine = function(task, hours) {
      var h, j, len;
      this.addRow();
      this.taskLink(task);
      this.task(task);
      this.sumHoursHoriz();
      for (j = 0, len = hours.length; j < len; j++) {
        h = hours[j];
        this.hours(h);
      }
    };

    ProjectReport.prototype.totalHoursLine = function() {
      var i, j, ref;
      this.addRow();
      this.skip();
      this.totalHoursTitle();
      this.sumHoursVert();
      for (i = j = 0, ref = this.peopleCount; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        this.sumHoursVert();
      }
    };

    ProjectReport.prototype.totalMoneyLine = function() {
      var i, j, ref;
      this.addRow();
      this.skip();
      this.totalMoneyTitle();
      this.sumMoneyHoriz();
      for (i = j = 0, ref = this.peopleCount; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        this.multHoursByRate();
      }
    };

    return ProjectReport;

  })();
};

ngModule.directive('reports', [
  'TWPeriodTimeTracking', 'dsDataService', 'config', '$http', '$rootScope', function(TWPeriodTimeTracking, dsDataService, config, $http, $rootScope) {
    return {
      restrict: 'A',
      scope: true,
      link: function($scope, element, attrs) {
        $scope.progressMessage = null;
        $scope.period = moment().startOf('month').add(-1, 'month').toDate();
        $scope.selectPeriod = false;
        $scope.generateReport = function() {
          var ProjectReport, from, periodTimeTrackingSet, to, unwatch, wb;
          ProjectReport = projectReport(wb = window.ExcelBuilder.createWorkbook());
          $scope.progressMessage = 'Идет загрузка данных...';
          from = moment($scope.period);
          to = moment(from).add(1, 'month');
          periodTimeTrackingSet = dsDataService.findDataSet(serviceOwner, {
            type: PeriodTimeTracking,
            mode: 'original',
            from: from,
            to: to
          });
          unwatch = periodTimeTrackingSet.watchStatus(serviceOwner, function(set, status) {
            var base, hours, j, k, len, maxPeopleCount, name, name1, people, peopleMap, personIndex, personName, project, projectName, projectsMap, ref, ref1, report, reportData, reports, taskName, tasks, tasksMap, v;
            if (status !== 'ready') {
              return;
            }
            unwatch();
            projectsMap = {};
            reportData = [];
            maxPeopleCount = 0;
            ref = periodTimeTrackingSet.items;
            for (k in ref) {
              v = ref[k];
              ((base = (projectsMap[name1 = v.project.name] || (projectsMap[name1] = {})))[name = v.taskName] || (base[name] = [])).push(v);
            }
            ref1 = (Object.keys(projectsMap)).sort();
            for (j = 0, len = ref1.length; j < len; j++) {
              projectName = ref1[j];
              tasksMap = projectsMap[projectName];
              peopleMap = {};
              for (k in tasksMap) {
                reports = tasksMap[k];
                peopleMap[reports[0].person.name] = reports[0].person;
              }
              people = (function() {
                var l, len1, ref2, results;
                ref2 = (Object.keys(peopleMap)).sort();
                results = [];
                for (l = 0, len1 = ref2.length; l < len1; l++) {
                  personName = ref2[l];
                  results.push(peopleMap[personName]);
                }
                return results;
              })();
              maxPeopleCount = Math.max(maxPeopleCount, people.length);
              tasks = ((function() {
                var l, len1, results;
                results = [];
                for (taskName in tasksMap) {
                  reports = tasksMap[taskName];
                  project = reports[0].project;
                  hours = (function() {
                    var l, ref2, results1;
                    results1 = [];
                    for (v = l = 0, ref2 = people.length; l < ref2; v = l += 1) {
                      results1.push(null);
                    }
                    return results1;
                  })();
                  for (l = 0, len1 = reports.length; l < len1; l++) {
                    report = reports[l];
                    personIndex = people.indexOf(report.person);
                    if (hours[personIndex] === null) {
                      hours[personIndex] = report.totalMin / 60;
                    } else {
                      hours[personIndex] += report.totalMin / 60;
                    }
                  }
                  results.push({
                    task: {
                      id: reports[0].taskId,
                      name: taskName
                    },
                    lastReport: reports[reports.length - 1].lastReport,
                    hours: hours
                  });
                }
                return results;
              })()).sort(function(left, right) {
                if (left.task.id === null) {
                  return -1;
                } else if (right.task.id === null) {
                  return 1;
                } else {
                  return left.lastReport.valueOf() - right.lastReport.valueOf();
                }
              });
              reportData = reportData.concat((new ProjectReport({
                topRow: reportData.length,
                data: {
                  project: project,
                  people: people,
                  tasks: tasks
                }
              })).rows);
            }
            $scope.progressMessage = 'Формируем MS Excel файл ...';
            if (!$rootScope.$$phase) {
              $rootScope.$digest();
            }
            $scope.$evalAsync(function() {
              var blob, columns, file, i, l, ref2, sheet;
              columns = [
                {
                  width: 4
                }, {
                  width: 30
                }, {
                  width: 20
                }
              ];
              for (i = l = 0, ref2 = maxPeopleCount; l < ref2; i = l += 1) {
                columns.push({
                  width: 30
                });
              }
              sheet = wb.createWorksheet({
                name: "По людям " + (moment($scope.period).format('MM.YYYY'))
              });
              sheet.setData(reportData);
              sheet.setColumns(columns);
              wb.addWorksheet(sheet);
              file = window.ExcelBuilder.createFile(wb);
              blob = base62ToBlob(file, 'application/vnd.ms-excel', 512);
              FileSaver.saveAs(blob, "Часы по людям по проектам за " + (moment($scope.period).format('MM.YYYY')) + ".xlsx");
              periodTimeTrackingSet.release(serviceOwner);
              dsDataService.refresh();
              $scope.progressMessage = null;
              if (!$rootScope.$$phase) {
                $rootScope.$digest();
              }
            });
          });
        };
      }
    };
  }
]);


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../static/libs/FileSaver.js/FileSaver":34,"../dscommon/util":24,"../utils/base62ToBlob":32,"../utils/base64":33,"./data/dsDataService":25,"./data/teamwork/TWPeriodTimeTracking":26,"./models/PeriodTimeTracking":28,"./showSpinner":30}],30:[function(require,module,exports){
var ngModule, spinnerOpts;

module.exports = (ngModule = angular.module('showSpinner', [])).name;

spinnerOpts = {
  lines: 13,
  length: 1,
  radius: 8,
  color: '#000',
  opacity: 0.2
};

ngModule.directive('showSpinner', [
  function() {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {
        var spinner;
        spinner = new Spinner(spinnerOpts).spin();
        element[0].appendChild(spinner.el);
        $scope.$on('$destroy', (function() {
          spinner.stop();
        }));
      }
    };
  }
]);


},{}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
module.exports = function(b64Data, contentType, sliceSize) {
  var blob, byteArray, byteArrays, byteCharacters, byteNumbers, i, offset, slice;
  contentType = contentType || '';
  sliceSize = sliceSize || 512;
  byteCharacters = atob(b64Data);
  byteArrays = [];
  offset = 0;
  while (offset < byteCharacters.length) {
    slice = byteCharacters.slice(offset, offset + sliceSize);
    byteNumbers = new Array(slice.length);
    i = 0;
    while (i < slice.length) {
      byteNumbers[i] = slice.charCodeAt(i);
      i++;
    }
    byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
    offset += sliceSize;
  }
  blob = new Blob(byteArrays, {
    type: contentType
  });
  return blob;
};


},{}],33:[function(require,module,exports){
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


},{}],34:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.1.20151003
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent)
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if (target_view && is_safari && typeof FileReader !== "undefined") {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var base64Data = reader.result;
							target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && is_safari) {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name, no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name || "download");
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
}

},{}]},{},[29]);
