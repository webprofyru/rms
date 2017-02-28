(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// rawAsap provides everything we need except exception management.
var rawAsap = require("./raw");
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};

},{"./raw":2}],2:[function(require,module,exports){
(function (global){
"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` or `self` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

/* globals self */
var scope = typeof global !== "undefined" ? global : self;
var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
"use strict";

var Iteration = require("./iteration");

module.exports = ArrayIterator;
function ArrayIterator(iterable, start, stop, step) {
    this.array = iterable;
    this.start = start || 0;
    this.stop = stop || Infinity;
    this.step = step || 1;
}

ArrayIterator.prototype.next = function () {
    var iteration;
    if (this.start < Math.min(this.array.length, this.stop)) {
        iteration = new Iteration(this.array[this.start], false, this.start);
        this.start += this.step;
    } else {
        iteration =  new Iteration(undefined, true);
    }
    return iteration;
};


},{"./iteration":4}],4:[function(require,module,exports){
"use strict";

module.exports = Iteration;
function Iteration(value, done, index) {
    this.value = value;
    this.done = done;
    this.index = index;
}

Iteration.prototype.equals = function (other) {
    return (
        typeof other == 'object' &&
        other.value === this.value &&
        other.done === this.done &&
        other.index === this.index
    );
};


},{}],5:[function(require,module,exports){
"use strict";

var Iteration = require("./iteration");
var ArrayIterator = require("./array-iterator");

module.exports = ObjectIterator;
function ObjectIterator(iterable, start, stop, step) {
    this.object = iterable;
    this.keysIterator = new ArrayIterator(Object.keys(iterable), start, stop, step);
}

ObjectIterator.prototype.next = function () {
    var iteration = this.keysIterator.next();
    if (iteration.done) {
        return iteration;
    }
    var key = iteration.value;
    return new Iteration(this.object[key], false, key);
};


},{"./array-iterator":3,"./iteration":4}],6:[function(require,module,exports){
"use strict";

var ArrayIterator = require("./array-iterator");
var ObjectIterator = require("./object-iterator");

module.exports = iterate;
function iterate(iterable, start, stop, step) {
    if (!iterable) {
        return empty;
    } else if (Array.isArray(iterable)) {
        return new ArrayIterator(iterable, start, stop, step);
    } else if (typeof iterable.next === "function") {
        return iterable;
    } else if (typeof iterable.iterate === "function") {
        return iterable.iterate(start, stop, step);
    } else if (typeof iterable === "object") {
        return new ObjectIterator(iterable);
    } else {
        throw new TypeError("Can't iterate " + iterable);
    }
}


},{"./array-iterator":3,"./object-iterator":5}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
(function (process){
/* vim:ts=4:sts=4:sw=4: */
/*!
 *
 * Copyright 2009-2013 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*global -WeakMap */
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

var WeakMap = require("weak-map");
var iterate = require("pop-iterate");
var asap = require("asap");

function isObject(value) {
    return value === Object(value);
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p && handlers.get(p); p = handlers.get(p).became) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    if (Q.isIntrospective) {
        return stackString;
    }
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function Q_deprecate() {
        if (
            typeof console !== "undefined" &&
            typeof console.warn === "function"
        ) {
            if (alternative) {
                console.warn(
                    name + " is deprecated, use " + alternative + " instead.",
                    new Error("").stack
                );
            } else {
                console.warn(
                    name + " is deprecated.",
                    new Error("").stack
                );
            }
        }
        return callback.apply(this, arguments);
    };
}

// end of long stack traces

var handlers = new WeakMap();

function Q_getHandler(promise) {
    var handler = handlers.get(promise);
    if (!handler || !handler.became) {
        return handler;
    }
    handler = follow(handler);
    handlers.set(promise, handler);
    return handler;
}

function follow(handler) {
    if (!handler.became) {
        return handler;
    } else {
        handler.became = follow(handler.became);
        return handler.became;
    }
}

var theViciousCycleError = new Error("Can't resolve a promise with itself");
var theViciousCycleRejection = Q_reject(theViciousCycleError);
var theViciousCycle = Q_getHandler(theViciousCycleRejection);

var thenables = new WeakMap();

/**
 * Coerces a value to a promise. If the value is a promise, pass it through
 * unaltered. If the value has a `then` method, it is presumed to be a promise
 * but not one of our own, so it is treated as a “thenable” promise and this
 * returns a promise that stands for it. Otherwise, this returns a promise that
 * has already been fulfilled with the value.
 * @param value promise, object with a then method, or a fulfillment value
 * @returns {Promise} the same promise as given, or a promise for the given
 * value
 */
module.exports = Q;
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (Q_isPromise(value)) {
        return value;
    } else if (isThenable(value)) {
        if (!thenables.has(value)) {
            thenables.set(value, new Promise(new Thenable(value)));
        }
        return thenables.get(value);
    } else {
        return new Promise(new Fulfilled(value));
    }
}

/**
 * Controls whether or not long stack traces will be on
 * @type {boolean}
 */
Q.longStackSupport = false;

/**
 * Returns a promise that has been rejected with a reason, which should be an
 * instance of `Error`.
 * @param {Error} error reason for the failure.
 * @returns {Promise} rejection
 */
Q.reject = Q_reject;
function Q_reject(error) {
    return new Promise(new Rejected(error));
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 *
 * @returns {{promise, resolve, reject}} a deferred
 */
Q.defer = defer;
function defer() {

    var handler = new Pending();
    var promise = new Promise(handler);
    var deferred = new Deferred(promise);

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    return deferred;
}

// TODO
/**
 */
Q.when = function Q_when(value, fulfilled, rejected, ms) {
    return Q(value).then(fulfilled, rejected, ms);
};

/**
 * Turns an array of promises into a promise for an array.  If any of the
 * promises gets rejected, the whole array is rejected immediately.
 * @param {Array.<Promise>} an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Promise.<Array>} a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = Q_all;
function Q_all(questions) {
    // XXX deprecated behavior
    if (Q_isPromise(questions)) {
        if (
            typeof console !== "undefined" &&
            typeof console.warn === "function"
        ) {
            console.warn("Q.all no longer directly unwraps a promise. Use Q(array).all()");
        }
        return Q(questions).all();
    }
    var countDown = 0;
    var deferred = defer();
    var answers = Array(questions.length);
    var estimates = [];
    var estimate = -Infinity;
    var setEstimate;
    Array.prototype.forEach.call(questions, function Q_all_each(promise, index) {
        var handler;
        if (
            Q_isPromise(promise) &&
            (handler = Q_getHandler(promise)).state === "fulfilled"
        ) {
            answers[index] = handler.value;
        } else {
            ++countDown;
            promise = Q(promise);
            promise.then(
                function Q_all_eachFulfilled(value) {
                    answers[index] = value;
                    if (--countDown === 0) {
                        deferred.resolve(answers);
                    }
                },
                deferred.reject
            );

            promise.observeEstimate(function Q_all_eachEstimate(newEstimate) {
                var oldEstimate = estimates[index];
                estimates[index] = newEstimate;
                if (newEstimate > estimate) {
                    estimate = newEstimate;
                } else if (oldEstimate === estimate && newEstimate <= estimate) {
                    // There is a 1/length chance that we will need to perform
                    // this O(length) walk, so amortized O(1)
                    computeEstimate();
                }
                if (estimates.length === questions.length && estimate !== setEstimate) {
                    deferred.setEstimate(estimate);
                    setEstimate = estimate;
                }
            });

        }
    });

    function computeEstimate() {
        estimate = -Infinity;
        for (var index = 0; index < estimates.length; index++) {
            if (estimates[index] > estimate) {
                estimate = estimates[index];
            }
        }
    }

    if (countDown === 0) {
        deferred.resolve(answers);
    }

    return deferred.promise;
}

/**
 * @see Promise#allSettled
 */
Q.allSettled = Q_allSettled;
function Q_allSettled(questions) {
    // XXX deprecated behavior
    if (Q_isPromise(questions)) {
        if (
            typeof console !== "undefined" &&
            typeof console.warn === "function"
        ) {
            console.warn("Q.allSettled no longer directly unwraps a promise. Use Q(array).allSettled()");
        }
        return Q(questions).allSettled();
    }
    return Q_all(questions.map(function Q_allSettled_each(promise) {
        promise = Q(promise);
        function regardless() {
            return promise.inspect();
        }
        return promise.then(regardless, regardless);
    }));
}

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function Q_delay(object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function Q_timeout(object, ms, message) {
    return Q(object).timeout(ms, message);
};

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = Q_spread;
function Q_spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function Q_join(x, y) {
    return Q.spread([x, y], function Q_joined(x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array} promises to race
 * @returns {Promise} the first promise to be fulfilled
 */
Q.race = Q_race;
function Q_race(answerPs) {
    return new Promise(function(deferred) {
        answerPs.forEach(function(answerP) {
            Q(answerP).then(deferred.resolve, deferred.reject);
        });
    });
}

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.try = function Q_try(callback) {
    return Q(callback).dispatch("call", [[]]);
};

/**
 * TODO
 */
Q.function = Promise_function;
function Promise_function(wrapped) {
    return function promiseFunctionWrapper() {
        var args = new Array(arguments.length);
        for (var index = 0; index < arguments.length; index++) {
            args[index] = arguments[index];
        }
        return Q(wrapped).apply(this, args);
    };
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = function Q_promised(callback) {
    return function promisedMethod() {
        var args = new Array(arguments.length);
        for (var index = 0; index < arguments.length; index++) {
            args[index] = arguments[index];
        }
        return Q_spread(
            [this, Q_all(args)],
            function Q_promised_spread(self, args) {
                return callback.apply(self, args);
            }
        );
    };
};

/**
 */
Q.passByCopy = // TODO XXX experimental
Q.push = function (value) {
    if (Object(value) === value && !Q_isPromise(value)) {
        passByCopies.set(value, true);
    }
    return value;
};

Q.isPortable = function (value) {
    return Object(value) === value && passByCopies.has(value);
};

var passByCopies = new WeakMap();

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators. Although generators are only
 * part of the newest ECMAScript 6 drafts, this code does not cause
 * syntax errors in older engines. This code should continue to work
 * and will in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * `--harmony-generators` runtime flag enabled. This function does not
 * support the former, Pythonic generators that were only implemented
 * by SpiderMonkey.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = Q_async;
function Q_async(makeGenerator) {
    return function spawn() {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var iteration;
            try {
                iteration = generator[verb](arg);
            } catch (exception) {
                return Q_reject(exception);
            }
            if (iteration.done) {
                return Q(iteration.value);
            } else {
                return Q(iteration.value).then(callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = Q_spawn;
function Q_spawn(makeGenerator) {
    Q_async(makeGenerator)().done();
}


// Thus begins the section dedicated to the Promise

/**
 * TODO
 */
Q.Promise = Promise;
function Promise(handler) {
    if (!(this instanceof Promise)) {
        return new Promise(handler);
    }
    if (typeof handler === "function") {
        var setup = handler;
        var deferred = defer();
        handler = Q_getHandler(deferred.promise);
        try {
            setup(deferred.resolve, deferred.reject, deferred.setEstimate);
        } catch (error) {
            deferred.reject(error);
        }
    }
    handlers.set(this, handler);
}

/**
 * Turns an array of promises into a promise for an array.  If any of the
 * promises gets rejected, the whole array is rejected immediately.
 * @param {Array.<Promise>} an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Promise.<Array>} a promise for an array of the corresponding values
 */
Promise.all = Q_all;

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array} promises to race
 * @returns {Promise} the first promise to be fulfilled
 */
Promise.race = Q_race;

/**
 * Coerces a value to a promise. If the value is a promise, pass it through
 * unaltered. If the value has a `then` method, it is presumed to be a promise
 * but not one of our own, so it is treated as a “thenable” promise and this
 * returns a promise that stands for it. Otherwise, this returns a promise that
 * has already been fulfilled with the value.
 * @param value promise, object with a then method, or a fulfillment value
 * @returns {Promise} the same promise as given, or a promise for the given
 * value
 */
Promise.resolve = Promise_resolve;
function Promise_resolve(value) {
    return Q(value);
}

/**
 * Returns a promise that has been rejected with a reason, which should be an
 * instance of `Error`.
 * @param reason value describing the failure
 * @returns {Promise} rejection
 */
Promise.reject = Q_reject;

/**
 * @returns {boolean} whether the given value is a promise.
 */
Q.isPromise = Q_isPromise;
function Q_isPromise(object) {
    return isObject(object) && !!handlers.get(object);
}

/**
 * @returns {boolean} whether the given value is an object with a then method.
 * @private
 */
function isThenable(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * Synchronously produces a snapshot of the internal state of the promise.  The
 * object will have a `state` property. If the `state` is `"pending"`, there
 * will be no further information. If the `state` is `"fulfilled"`, there will
 * be a `value` property. If the state is `"rejected"` there will be a `reason`
 * property.  If the promise was constructed from a “thenable” and `then` nor
 * any other method has been dispatched on the promise has been called, the
 * state will be `"pending"`. The state object will not be updated if the
 * state changes and changing it will have no effect on the promise. Every
 * call to `inspect` produces a unique object.
 * @returns {{state: string, value?, reason?}}
 */
Promise.prototype.inspect = function Promise_inspect() {
    // the second layer captures only the relevant "state" properties of the
    // handler to prevent leaking the capability to access or alter the
    // handler.
    return Q_getHandler(this).inspect();
};

/**
 * @returns {boolean} whether the promise is waiting for a result.
 */
Promise.prototype.isPending = function Promise_isPending() {
    return Q_getHandler(this).state === "pending";
};

/**
 * @returns {boolean} whether the promise has ended in a result and has a
 * fulfillment value.
 */
Promise.prototype.isFulfilled = function Promise_isFulfilled() {
    return Q_getHandler(this).state === "fulfilled";
};

/**
 * @returns {boolean} whether the promise has ended poorly and has a reason for
 * its rejection.
 */
Promise.prototype.isRejected = function Promise_isRejected() {
    return Q_getHandler(this).state === "rejected";
};

/**
 * TODO
 */
Promise.prototype.toBePassed = function Promise_toBePassed() {
    return Q_getHandler(this).state === "passed";
};

/**
 * @returns {string} merely `"[object Promise]"`
 */
Promise.prototype.toString = function Promise_toString() {
    return "[object Promise]";
};

/**
 * Creates a new promise, waits for this promise to be resolved, and informs
 * either the fullfilled or rejected handler of the result. Whatever result
 * comes of the fulfilled or rejected handler, a value returned, a promise
 * returned, or an error thrown, becomes the resolution for the promise
 * returned by `then`.
 *
 * @param fulfilled
 * @param rejected
 * @returns {Promise} for the result of `fulfilled` or `rejected`.
 */
Promise.prototype.then = function Promise_then(fulfilled, rejected, ms) {
    var self = this;
    var deferred = defer();

    var _fulfilled;
    if (typeof fulfilled === "function") {
        _fulfilled = function Promise_then_fulfilled(value) {
            try {
                deferred.resolve(fulfilled.call(void 0, value));
            } catch (error) {
                deferred.reject(error);
            }
        };
    } else {
        _fulfilled = deferred.resolve;
    }

    var _rejected;
    if (typeof rejected === "function") {
        _rejected = function Promise_then_rejected(error) {
            try {
                deferred.resolve(rejected.call(void 0, error));
            } catch (newError) {
                deferred.reject(newError);
            }
        };
    } else {
        _rejected = deferred.reject;
    }

    this.done(_fulfilled, _rejected);

    if (ms !== void 0) {
        var updateEstimate = function Promise_then_updateEstimate() {
            deferred.setEstimate(self.getEstimate() + ms);
        };
        this.observeEstimate(updateEstimate);
        updateEstimate();
    }

    return deferred.promise;
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param fulfilled
 * @param rejected
 */
Promise.prototype.done = function Promise_done(fulfilled, rejected) {
    var self = this;
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks
    asap(function Promise_done_task() {
        var _fulfilled;
        if (typeof fulfilled === "function") {
            if (Q.onerror) {
                _fulfilled = function Promise_done_fulfilled(value) {
                    if (done) {
                        return;
                    }
                    done = true;
                    try {
                        fulfilled.call(void 0, value);
                    } catch (error) {
                        // fallback to rethrow is still necessary because
                        // _fulfilled is not called in the same event as the
                        // above guard.
                        (Q.onerror || Promise_rethrow)(error);
                    }
                };
            } else {
                _fulfilled = function Promise_done_fulfilled(value) {
                    if (done) {
                        return;
                    }
                    done = true;
                    fulfilled.call(void 0, value);
                };
            }
        }

        var _rejected;
        if (typeof rejected === "function" && Q.onerror) {
            _rejected = function Promise_done_rejected(error) {
                if (done) {
                    return;
                }
                done = true;
                makeStackTraceLong(error, self);
                try {
                    rejected.call(void 0, error);
                } catch (newError) {
                    (Q.onerror || Promise_rethrow)(newError);
                }
            };
        } else if (typeof rejected === "function") {
            _rejected = function Promise_done_rejected(error) {
                if (done) {
                    return;
                }
                done = true;
                makeStackTraceLong(error, self);
                rejected.call(void 0, error);
            };
        } else {
            _rejected = Q.onerror || Promise_rethrow;
        }

        if (typeof process === "object" && process.domain) {
            _rejected = process.domain.bind(_rejected);
        }

        Q_getHandler(self).dispatch(_fulfilled, "then", [_rejected]);
    });
};

function Promise_rethrow(error) {
    throw error;
}

/**
 * TODO
 */
Promise.prototype.thenResolve = function Promise_thenResolve(value) {
    // Wrapping ahead of time to forestall multiple wrappers.
    value = Q(value);
    // Using all is necessary to aggregate the estimated time to completion.
    return Q_all([this, value]).then(function Promise_thenResolve_resolved() {
        return value;
    }, null, 0);
    // 0: does not contribute significantly to the estimated time to
    // completion.
};

/**
 * TODO
 */
Promise.prototype.thenReject = function Promise_thenReject(error) {
    return this.then(function Promise_thenReject_resolved() {
        throw error;
    }, null, 0);
    // 0: does not contribute significantly to the estimated time to
    // completion.
};

/**
 * TODO
 */
Promise.prototype.all = function Promise_all() {
    return this.then(Q_all);
};

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function Promise_allSettled() {
    return this.then(Q_allSettled);
};

/**
 * TODO
 */
Promise.prototype.catch = function Promise_catch(rejected) {
    return this.then(void 0, rejected);
};

/**
 * TODO
 */
Promise.prototype.finally = function Promise_finally(callback, ms) {
    if (!callback) {
        return this;
    }
    callback = Q(callback);
    return this.then(function (value) {
        return callback.call().then(function Promise_finally_fulfilled() {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.call().then(function Promise_finally_rejected() {
            throw reason;
        });
    }, ms);
};

/**
 * TODO
 */
Promise.prototype.observeEstimate = function Promise_observeEstimate(emit) {
    this.rawDispatch(null, "estimate", [emit]);
    return this;
};

/**
 * TODO
 */
Promise.prototype.getEstimate = function Promise_getEstimate() {
    return Q_getHandler(this).estimate;
};

/**
 * TODO
 */
Promise.prototype.dispatch = function Promise_dispatch(op, args) {
    var deferred = defer();
    this.rawDispatch(deferred.resolve, op, args);
    return deferred.promise;
};

/**
 */
Promise.prototype.rawDispatch = function Promise_rawDispatch(resolve, op, args) {
    var self = this;
    asap(function Promise_dispatch_task() {
        Q_getHandler(self).dispatch(resolve, op, args);
    });
};

/**
 * TODO
 */
Promise.prototype.get = function Promise_get(name) {
    return this.dispatch("get", [name]);
};

/**
 * TODO
 */
Promise.prototype.invoke = function Promise_invoke(name /*...args*/) {
    var args = new Array(arguments.length - 1);
    for (var index = 1; index < arguments.length; index++) {
        args[index - 1] = arguments[index];
    }
    return this.dispatch("invoke", [name, args]);
};

/**
 * TODO
 */
Promise.prototype.apply = function Promise_apply(thisp, args) {
    return this.dispatch("call", [args, thisp]);
};

/**
 * TODO
 */
Promise.prototype.call = function Promise_call(thisp /*, ...args*/) {
    var args = new Array(Math.max(0, arguments.length - 1));
    for (var index = 1; index < arguments.length; index++) {
        args[index - 1] = arguments[index];
    }
    return this.dispatch("call", [args, thisp]);
};

/**
 * TODO
 */
Promise.prototype.bind = function Promise_bind(thisp /*, ...args*/) {
    var self = this;
    var args = new Array(Math.max(0, arguments.length - 1));
    for (var index = 1; index < arguments.length; index++) {
        args[index - 1] = arguments[index];
    }
    return function Promise_bind_bound(/*...args*/) {
        var boundArgs = args.slice();
        for (var index = 0; index < arguments.length; index++) {
            boundArgs[boundArgs.length] = arguments[index];
        }
        return self.dispatch("call", [boundArgs, thisp]);
    };
};

/**
 * TODO
 */
Promise.prototype.keys = function Promise_keys() {
    return this.dispatch("keys", []);
};

/**
 * TODO
 */
Promise.prototype.iterate = function Promise_iterate() {
    return this.dispatch("iterate", []);
};

/**
 * TODO
 */
Promise.prototype.spread = function Promise_spread(fulfilled, rejected, ms) {
    return this.all().then(function Promise_spread_fulfilled(array) {
        return fulfilled.apply(void 0, array);
    }, rejected, ms);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Promise.prototype.timeout = function Promsie_timeout(ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function Promise_timeout_task() {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function Promise_timeout_fulfilled(value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function Promise_timeout_rejected(error) {
        clearTimeout(timeoutId);
        deferred.reject(error);
    });

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Promise.prototype.delay = function Promise_delay(ms) {
    return this.then(function Promise_delay_fulfilled(value) {
        var deferred = defer();
        deferred.setEstimate(Date.now() + ms);
        setTimeout(function Promise_delay_task() {
            deferred.resolve(value);
        }, ms);
        return deferred.promise;
    }, null, ms);
};

/**
 * TODO
 */
Promise.prototype.pull = function Promise_pull() {
    return this.dispatch("pull", []);
};

/**
 * TODO
 */
Promise.prototype.pass = function Promise_pass() {
    if (!this.toBePassed()) {
        return new Promise(new Passed(this));
    } else {
        return this;
    }
};


// Thus begins the portion dedicated to the deferred

var promises = new WeakMap();

function Deferred(promise) {
    this.promise = promise;
    // A deferred has an intrinsic promise, denoted by its hidden handler
    // property.  The promise property of the deferred may be assigned to a
    // different promise (as it is in a Queue), but the intrinsic promise does
    // not change.
    promises.set(this, promise);
    var self = this;
    var resolve = this.resolve;
    this.resolve = function (value) {
        resolve.call(self, value);
    };
    var reject = this.reject;
    this.reject = function (error) {
        reject.call(self, error);
    };
}

/**
 * TODO
 */
Deferred.prototype.resolve = function Deferred_resolve(value) {
    var handler = Q_getHandler(promises.get(this));
    if (!handler.messages) {
        return;
    }
    handler.become(Q(value));
};

/**
 * TODO
 */
Deferred.prototype.reject = function Deferred_reject(reason) {
    var handler = Q_getHandler(promises.get(this));
    if (!handler.messages) {
        return;
    }
    handler.become(Q_reject(reason));
};

/**
 * TODO
 */
Deferred.prototype.setEstimate = function Deferred_setEstimate(estimate) {
    estimate = +estimate;
    if (estimate !== estimate) {
        estimate = Infinity;
    }
    if (estimate < 1e12 && estimate !== -Infinity) {
        throw new Error("Estimate values should be a number of miliseconds in the future");
    }
    var handler = Q_getHandler(promises.get(this));
    // TODO There is a bit of capability leakage going on here. The Deferred
    // should only be able to set the estimate for its original
    // Pending, not for any handler that promise subsequently became.
    if (handler.setEstimate) {
        handler.setEstimate(estimate);
    }
};

// Thus ends the public interface

// Thus begins the portion dedicated to handlers

function Fulfilled(value) {
    this.value = value;
    this.estimate = Date.now();
}

Fulfilled.prototype.state = "fulfilled";

Fulfilled.prototype.inspect = function Fulfilled_inspect() {
    return {state: "fulfilled", value: this.value};
};

Fulfilled.prototype.dispatch = function Fulfilled_dispatch(
    resolve, op, operands
) {
    var result;
    if (
        op === "then" ||
        op === "get" ||
        op === "call" ||
        op === "invoke" ||
        op === "keys" ||
        op === "iterate" ||
        op === "pull"
    ) {
        try {
            result = this[op].apply(this, operands);
        } catch (exception) {
            result = Q_reject(exception);
        }
    } else if (op === "estimate") {
        operands[0].call(void 0, this.estimate);
    } else {
        var error = new Error(
            "Fulfilled promises do not support the " + op + " operator"
        );
        result = Q_reject(error);
    }
    if (resolve) {
        resolve(result);
    }
};

Fulfilled.prototype.then = function Fulfilled_then() {
    return this.value;
};

Fulfilled.prototype.get = function Fulfilled_get(name) {
    return this.value[name];
};

Fulfilled.prototype.call = function Fulfilled_call(args, thisp) {
    return this.callInvoke(this.value, args, thisp);
};

Fulfilled.prototype.invoke = function Fulfilled_invoke(name, args) {
    return this.callInvoke(this.value[name], args, this.value);
};

Fulfilled.prototype.callInvoke = function Fulfilled_callInvoke(callback, args, thisp) {
    var waitToBePassed;
    for (var index = 0; index < args.length; index++) {
        if (Q_isPromise(args[index]) && args[index].toBePassed()) {
            waitToBePassed = waitToBePassed || [];
            waitToBePassed.push(args[index]);
        }
    }
    if (waitToBePassed) {
        var self = this;
        return Q_all(waitToBePassed).then(function () {
            return self.callInvoke(callback, args.map(function (arg) {
                if (Q_isPromise(arg) && arg.toBePassed()) {
                    return arg.inspect().value;
                } else {
                    return arg;
                }
            }), thisp);
        });
    } else {
        return callback.apply(thisp, args);
    }
};

Fulfilled.prototype.keys = function Fulfilled_keys() {
    return Object.keys(this.value);
};

Fulfilled.prototype.iterate = function Fulfilled_iterate() {
    return iterate(this.value);
};

Fulfilled.prototype.pull = function Fulfilled_pull() {
    var result;
    if (Object(this.value) === this.value) {
        result = Array.isArray(this.value) ? [] : {};
        for (var name in this.value) {
            result[name] = this.value[name];
        }
    } else {
        result = this.value;
    }
    return Q.push(result);
};


function Rejected(reason) {
    this.reason = reason;
    this.estimate = Infinity;
}

Rejected.prototype.state = "rejected";

Rejected.prototype.inspect = function Rejected_inspect() {
    return {state: "rejected", reason: this.reason};
};

Rejected.prototype.dispatch = function Rejected_dispatch(
    resolve, op, operands
) {
    var result;
    if (op === "then") {
        result = this.then(resolve, operands[0]);
    } else {
        result = this;
    }
    if (resolve) {
        resolve(result);
    }
};

Rejected.prototype.then = function Rejected_then(
    resolve, rejected
) {
    return rejected ? rejected(this.reason) : this;
};


function Pending() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    this.messages = [];
    this.observers = [];
    this.estimate = Infinity;
}

Pending.prototype.state = "pending";

Pending.prototype.inspect = function Pending_inspect() {
    return {state: "pending"};
};

Pending.prototype.dispatch = function Pending_dispatch(resolve, op, operands) {
    this.messages.push([resolve, op, operands]);
    if (op === "estimate") {
        this.observers.push(operands[0]);
        var self = this;
        asap(function Pending_dispatch_task() {
            operands[0].call(void 0, self.estimate);
        });
    }
};

Pending.prototype.become = function Pending_become(promise) {
    this.became = theViciousCycle;
    var handler = Q_getHandler(promise);
    this.became = handler;

    handlers.set(promise, handler);
    this.promise = void 0;

    this.messages.forEach(function Pending_become_eachMessage(message) {
        // makeQ does not have this asap call, so it must be queueing events
        // downstream. TODO look at makeQ to ascertain
        asap(function Pending_become_eachMessage_task() {
            var handler = Q_getHandler(promise);
            handler.dispatch.apply(handler, message);
        });
    });

    this.messages = void 0;
    this.observers = void 0;
};

Pending.prototype.setEstimate = function Pending_setEstimate(estimate) {
    if (this.observers) {
        var self = this;
        self.estimate = estimate;
        this.observers.forEach(function Pending_eachObserver(observer) {
            asap(function Pending_setEstimate_eachObserver_task() {
                observer.call(void 0, estimate);
            });
        });
    }
};

function Thenable(thenable) {
    this.thenable = thenable;
    this.became = null;
    this.estimate = Infinity;
}

Thenable.prototype.state = "thenable";

Thenable.prototype.inspect = function Thenable_inspect() {
    return {state: "pending"};
};

Thenable.prototype.cast = function Thenable_cast() {
    if (!this.became) {
        var deferred = defer();
        var thenable = this.thenable;
        asap(function Thenable_cast_task() {
            try {
                thenable.then(deferred.resolve, deferred.reject);
            } catch (exception) {
                deferred.reject(exception);
            }
        });
        this.became = Q_getHandler(deferred.promise);
    }
    return this.became;
};

Thenable.prototype.dispatch = function Thenable_dispatch(resolve, op, args) {
    this.cast().dispatch(resolve, op, args);
};


function Passed(promise) {
    this.promise = promise;
}

Passed.prototype.state = "passed";

Passed.prototype.inspect = function Passed_inspect() {
    return this.promise.inspect();
};

Passed.prototype.dispatch = function Passed_dispatch(resolve, op, args) {
    return this.promise.rawDispatch(resolve, op, args);
};


// Thus begins the Q Node.js bridge

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.ninvoke = function Q_ninvoke(object, name /*...args*/) {
    var args = new Array(Math.max(0, arguments.length - 1));
    for (var index = 2; index < arguments.length; index++) {
        args[index - 2] = arguments[index];
    }
    var deferred = Q.defer();
    args[index - 2] = deferred.makeNodeResolver();
    Q(object).dispatch("invoke", [name, args]).catch(deferred.reject);
    return deferred.promise;
};

Promise.prototype.ninvoke = function Promise_ninvoke(name /*...args*/) {
    var args = new Array(arguments.length);
    for (var index = 1; index < arguments.length; index++) {
        args[index - 1] = arguments[index];
    }
    var deferred = Q.defer();
    args[index - 1] = deferred.makeNodeResolver();
    this.dispatch("invoke", [name, args]).catch(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a Node.js continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.denodeify(FS.readFile)(__filename, "utf-8")
 * .then(console.log)
 * .done()
 */
Q.denodeify = function Q_denodeify(callback, pattern) {
    return function denodeified() {
        var args = new Array(arguments.length + 1);
        var index = 0;
        for (; index < arguments.length; index++) {
            args[index] = arguments[index];
        }
        var deferred = Q.defer();
        args[index] = deferred.makeNodeResolver(pattern);
        Q(callback).apply(this, args).catch(deferred.reject);
        return deferred.promise;
    };
};

/**
 * Creates a Node.js-style callback that will resolve or reject the deferred
 * promise.
 * @param unpack `true` means that the Node.js-style-callback accepts a
 * fixed or variable number of arguments and that the deferred should be resolved
 * with an array of these value arguments, or rejected with the error argument.
 * An array of names means that the Node.js-style-callback accepts a fixed
 * number of arguments, and that the resolution should be an object with
 * properties corresponding to the given names and respective value arguments.
 * @returns a nodeback
 */
Deferred.prototype.makeNodeResolver = function (unpack) {
    var resolve = this.resolve;
    if (unpack === true) {
        return function variadicNodebackToResolver(error) {
            if (error) {
                resolve(Q_reject(error));
            } else {
                var value = new Array(Math.max(0, arguments.length - 1));
                for (var index = 1; index < arguments.length; index++) {
                    value[index - 1] = arguments[index];
                }
                resolve(value);
            }
        };
    } else if (unpack) {
        return function namedArgumentNodebackToResolver(error) {
            if (error) {
                resolve(Q_reject(error));
            } else {
                var value = {};
                for (var index = 0; index < unpack.length; index++) {
                    value[unpack[index]] = arguments[index + 1];
                }
                resolve(value);
            }
        };
    } else {
        return function nodebackToResolver(error, value) {
            if (error) {
                resolve(Q_reject(error));
            } else {
                resolve(value);
            }
        };
    }
};

/**
 * TODO
 */
Promise.prototype.nodeify = function Promise_nodeify(nodeback) {
    if (nodeback) {
        this.done(function (value) {
            nodeback(null, value);
        }, nodeback);
    } else {
        return this;
    }
};


// DEPRECATED

Q.nextTick = deprecate(asap, "nextTick", "asap package");

Q.resolve = deprecate(Q, "resolve", "Q");

Q.fulfill = deprecate(Q, "fulfill", "Q");

Q.isPromiseAlike = deprecate(isThenable, "isPromiseAlike", "(not supported)");

Q.fail = deprecate(function (value, rejected) {
    return Q(value).catch(rejected);
}, "Q.fail", "Q(value).catch");

Q.fin = deprecate(function (value, regardless) {
    return Q(value).finally(regardless);
}, "Q.fin", "Q(value).finally");

Q.progress = deprecate(function (value) {
    return value;
}, "Q.progress", "no longer supported");

Q.thenResolve = deprecate(function (promise, value) {
    return Q(promise).thenResolve(value);
}, "thenResolve", "Q(value).thenResolve");

Q.thenReject = deprecate(function (promise, reason) {
    return Q(promise).thenResolve(reason);
}, "thenResolve", "Q(value).thenResolve");

Q.isPending = deprecate(function (value) {
    return Q(value).isPending();
}, "isPending", "Q(value).isPending");

Q.isFulfilled = deprecate(function (value) {
    return Q(value).isFulfilled();
}, "isFulfilled", "Q(value).isFulfilled");

Q.isRejected = deprecate(function (value) {
    return Q(value).isRejected();
}, "isRejected", "Q(value).isRejected");

Q.master = deprecate(function (value) {
    return value;
}, "master", "no longer necessary");

Q.makePromise = function () {
    throw new Error("makePromise is no longer supported");
};

Q.dispatch = deprecate(function (value, op, operands) {
    return Q(value).dispatch(op, operands);
}, "dispatch", "Q(value).dispatch");

Q.get = deprecate(function (object, name) {
    return Q(object).get(name);
}, "get", "Q(value).get");

Q.keys = deprecate(function (object) {
    return Q(object).keys();
}, "keys", "Q(value).keys");

Q.post = deprecate(function (object, name, args) {
    return Q(object).post(name, args);
}, "post", "Q(value).invoke (spread arguments)");

Q.mapply = deprecate(function (object, name, args) {
    return Q(object).post(name, args);
}, "post", "Q(value).invoke (spread arguments)");

Q.send = deprecate(function (object, name) {
    return Q(object).post(name, Array.prototype.slice.call(arguments, 2));
}, "send", "Q(value).invoke");

Q.set = function () {
    throw new Error("Q.set no longer supported");
};

Q.delete = function () {
    throw new Error("Q.delete no longer supported");
};

Q.nearer = deprecate(function (value) {
    if (Q_isPromise(value) && value.isFulfilled()) {
        return value.inspect().value;
    } else {
        return value;
    }
}, "nearer", "inspect().value (+nuances)");

Q.fapply = deprecate(function (callback, args) {
    return Q(callback).dispatch("call", [args]);
}, "fapply", "Q(callback).apply(thisp, args)");

Q.fcall = deprecate(function (callback /*, ...args*/) {
    return Q(callback).dispatch("call", [Array.prototype.slice.call(arguments, 1)]);
}, "fcall", "Q(callback).call(thisp, ...args)");

Q.fbind = deprecate(function (object /*...args*/) {
    var promise = Q(object);
    var args = Array.prototype.slice.call(arguments, 1);
    return function fbound() {
        return promise.dispatch("call", [
            args.concat(Array.prototype.slice.call(arguments)),
            this
        ]);
    };
}, "fbind", "bind with thisp");

Q.promise = deprecate(Promise, "promise", "Promise");

Promise.prototype.fapply = deprecate(function (args) {
    return this.dispatch("call", [args]);
}, "fapply", "apply with thisp");

Promise.prototype.fcall = deprecate(function (/*...args*/) {
    return this.dispatch("call", [Array.prototype.slice.call(arguments)]);
}, "fcall", "try or call with thisp");

Promise.prototype.fail = deprecate(function (rejected) {
    return this.catch(rejected);
}, "fail", "catch");

Promise.prototype.fin = deprecate(function (regardless) {
    return this.finally(regardless);
}, "fin", "finally");

Promise.prototype.set = function () {
    throw new Error("Promise set no longer supported");
};

Promise.prototype.delete = function () {
    throw new Error("Promise delete no longer supported");
};

Deferred.prototype.notify = deprecate(function () {
}, "notify", "no longer supported");

Promise.prototype.progress = deprecate(function () {
    return this;
}, "progress", "no longer supported");

// alternative proposed by Redsandro, dropped in favor of post to streamline
// the interface
Promise.prototype.mapply = deprecate(function (name, args) {
    return this.dispatch("invoke", [name, args]);
}, "mapply", "invoke");

Promise.prototype.fbind = deprecate(function () {
    return Q.fbind.apply(Q, [void 0].concat(Array.prototype.slice.call(arguments)));
}, "fbind", "bind(thisp, ...args)");

// alternative proposed by Mark Miller, dropped in favor of invoke
Promise.prototype.send = deprecate(function () {
    return this.dispatch("invoke", [name, Array.prototype.slice.call(arguments, 1)]);
}, "send", "invoke");

// alternative proposed by Redsandro, dropped in favor of invoke
Promise.prototype.mcall = deprecate(function () {
    return this.dispatch("invoke", [name, Array.prototype.slice.call(arguments, 1)]);
}, "mcall", "invoke");

Promise.prototype.passByCopy = deprecate(function (value) {
    return value;
}, "passByCopy", "Q.passByCopy");

// Deprecated Node.js bridge promise methods

Q.nfapply = deprecate(function (callback, args) {
    var deferred = Q.defer();
    var nodeArgs = Array.prototype.slice.call(args);
    nodeArgs.push(deferred.makeNodeResolver());
    Q(callback).apply(this, nodeArgs).catch(deferred.reject);
    return deferred.promise;
}, "nfapply");

Promise.prototype.nfapply = deprecate(function (args) {
    return Q.nfapply(this, args);
}, "nfapply");

Q.nfcall = deprecate(function (callback /*...args*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return Q.nfapply(callback, args);
}, "nfcall");

Promise.prototype.nfcall = deprecate(function () {
    var args = new Array(arguments.length);
    for (var index = 0; index < arguments.length; index++) {
        args[index] = arguments[index];
    }
    return Q.nfapply(this, args);
}, "nfcall");

Q.nfbind = deprecate(function (callback /*...args*/) {
    var baseArgs = Array.prototype.slice.call(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(Array.prototype.slice.call(arguments));
        var deferred = Q.defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).apply(this, nodeArgs).catch(deferred.reject);
        return deferred.promise;
    };
}, "nfbind", "denodeify (with caveats)");

Promise.prototype.nfbind = deprecate(function () {
    var args = new Array(arguments.length);
    for (var index = 0; index < arguments.length; index++) {
        args[index] = arguments[index];
    }
    return Q.nfbind(this, args);
}, "nfbind", "denodeify (with caveats)");

Q.nbind = deprecate(function (callback, thisp /*...args*/) {
    var baseArgs = Array.prototype.slice.call(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(Array.prototype.slice.call(arguments));
        var deferred = Q.defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).apply(this, nodeArgs).catch(deferred.reject);
        return deferred.promise;
    };
}, "nbind", "denodeify (with caveats)");

Q.npost = deprecate(function (object, name, nodeArgs) {
    var deferred = Q.defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("invoke", [name, nodeArgs]).catch(deferred.reject);
    return deferred.promise;
}, "npost", "ninvoke (with spread arguments)");

Promise.prototype.npost = deprecate(function (name, args) {
    return Q.npost(this, name, args);
}, "npost", "Q.ninvoke (with caveats)");

Q.nmapply = deprecate(Q.nmapply, "nmapply", "q/node nmapply");
Promise.prototype.nmapply = deprecate(Promise.prototype.npost, "nmapply", "Q.nmapply");

Q.nsend = deprecate(Q.ninvoke, "nsend", "q/node ninvoke");
Q.nmcall = deprecate(Q.ninvoke, "nmcall", "q/node ninvoke");
Promise.prototype.nsend = deprecate(Promise.prototype.ninvoke, "nsend", "q/node ninvoke");
Promise.prototype.nmcall = deprecate(Promise.prototype.ninvoke, "nmcall", "q/node ninvoke");

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();


}).call(this,require('_process'))
},{"_process":7,"asap":1,"pop-iterate":6,"weak-map":26}],9:[function(require,module,exports){
'use strict';
module.exports = require('./lib/index');

},{"./lib/index":13}],10:[function(require,module,exports){
'use strict';

var randomFromSeed = require('./random/random-from-seed');

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

module.exports = {
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};

},{"./random/random-from-seed":16}],11:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

/**
 * Decode the id to get the version and worker
 * Mainly for debugging and testing.
 * @param id - the shortid-generated id.
 */
function decode(id) {
    var characters = alphabet.shuffled();
    return {
        version: characters.indexOf(id.substr(0, 1)) & 0x0f,
        worker: characters.indexOf(id.substr(1, 1)) & 0x0f
    };
}

module.exports = decode;

},{"./alphabet":10}],12:[function(require,module,exports){
'use strict';

var randomByte = require('./random/random-byte');

function encode(lookup, number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + lookup( ( (number >> (4 * loopCounter)) & 0x0f ) | randomByte() );
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = encode;

},{"./random/random-byte":15}],13:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var encode = require('./encode');
var decode = require('./decode');
var isValid = require('./is-valid');

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1459707606518;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 6;

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = require('./util/cluster-worker-id') || 0;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function generate() {

    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + encode(alphabet.lookup, version);
    str = str + encode(alphabet.lookup, clusterWorkerId);
    if (counter > 0) {
        str = str + encode(alphabet.lookup, counter);
    }
    str = str + encode(alphabet.lookup, seconds);

    return str;
}


/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}


// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.decode = decode;
module.exports.isValid = isValid;

},{"./alphabet":10,"./decode":11,"./encode":12,"./is-valid":14,"./util/cluster-worker-id":17}],14:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var characters = alphabet.characters();
    var len = id.length;
    for(var i = 0; i < len;i++) {
        if (characters.indexOf(id[i]) === -1) {
            return false;
        }
    }
    return true;
}

module.exports = isShortId;

},{"./alphabet":10}],15:[function(require,module,exports){
'use strict';

var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

function randomByte() {
    if (!crypto || !crypto.getRandomValues) {
        return Math.floor(Math.random() * 256) & 0x30;
    }
    var dest = new Uint8Array(1);
    crypto.getRandomValues(dest);
    return dest[0] & 0x30;
}

module.exports = randomByte;

},{}],16:[function(require,module,exports){
'use strict';

// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};

},{}],17:[function(require,module,exports){
'use strict';

module.exports = 0;

},{}],18:[function(require,module,exports){
/*eslint-env browser*/
"use strict";

var Q = require("q");
var CommonSystem = require("./common-system");

module.exports = BrowserSystem;

function BrowserSystem(location, description, options) {
    var self = this;
    CommonSystem.call(self, location, description, options);
}

BrowserSystem.prototype = Object.create(CommonSystem.prototype);
BrowserSystem.prototype.constructor = BrowserSystem;

BrowserSystem.load = CommonSystem.load;

BrowserSystem.prototype.read = function read(location, charset, contentType) {

    var request = new XMLHttpRequest();
    var response = Q.defer();

    function onload() {
        if (xhrSuccess(request)) {
            response.resolve(request.responseText);
        } else {
            onerror();
        }
    }

    function onerror() {
        var error = new Error("Can't XHR " + JSON.stringify(location));
        if (request.status === 404 || request.status === 0) {
            error.code = "ENOENT";
            error.notFound = true;
        }
        response.reject(error);
    }

    try {
        request.open("GET", location, true);
        if (contentType && request.overrideMimeType) {
            request.overrideMimeType(contentType);
        }
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                onload();
            }
        };
        request.onload = request.load = onload;
        request.onerror = request.error = onerror;
        request.send();
    } catch (exception) {
        response.reject(exception);
    }

    return response.promise;
};

// Determine if an XMLHttpRequest was successful
// Some versions of WebKit return 0 for successful file:// URLs
function xhrSuccess(req) {
    return (req.status === 200 || (req.status === 0 && req.responseText));
}


},{"./common-system":20,"q":8}],19:[function(require,module,exports){
/*eslint-env browser*/
// This is the browser implementation for "url",
// redirected from "url" within this package by the
// loader because of the "browser" redirects in package.json.

// This is a very small subset of the Node.js URL module, suitable only for
// resolving relative module identifiers relative to fully qualified base
// URL’s.
// Because the loader only needs this part of the URL module, a
// very compact implementation is possible, teasing the necessary behavior out
// of the browser's own URL resolution mechanism, even though at time of
// writing, browsers do not provide an explicit JavaScript interface.

// The implementation takes advantage of the "href" getter/setter on an "a"
// (anchor) tag in the presence of a "base" tag on the document.
// We either use an existing "base" tag or temporarily introduce a fake
// "base" tag into the header of the page.
// We then temporarily modify the "href" of the base tag to be the base URL
// for the duration of a call to URL.resolve, to be the base URL argument.
// We then apply the relative URL to the "href" setter of an anchor tag,
// and read back the absolute URL from the "href" getter.
// The browser guarantees that the "href" property will report the fully
// qualified URL relative to the page's location, albeit its "base" location.

"use strict";

var head = document.querySelector("head"),
    baseElement = document.createElement("base"),
    relativeElement = document.createElement("a");

baseElement.href = "";

exports.resolve = function resolve(base, relative) {
    var currentBaseElement = head.querySelector("base");
    if (!currentBaseElement) {
        head.appendChild(baseElement);
        currentBaseElement = baseElement;
    }
    base = String(base);
    if (!/^[\w\-]+:/.test(base)) { // isAbsolute(base)
        throw new Error("Can't resolve from a relative location: " + JSON.stringify(base) + " " + JSON.stringify(relative));
    }
    var restore = currentBaseElement.href;
    currentBaseElement.href = base;
    relativeElement.href = relative;
    var resolved = relativeElement.href;
    currentBaseElement.href = restore;
    if (currentBaseElement === baseElement) {
        head.removeChild(currentBaseElement);
    }
    return resolved;
};

},{}],20:[function(require,module,exports){
/*eslint no-console:[0]*/
/*global console*/
"use strict";

var Q = require("q");
var URL = require("./url");
var Identifier = require("./identifier");
var Module = require("./module");
var Resource = require("./resource");
var parseDependencies = require("./parse-dependencies");
var compile = require("./compile");
var has = Object.prototype.hasOwnProperty;

module.exports = System;

function System(location, description, options) {
    var self = this;
    options = options || {};
    description = description || {};
    self.name = description.name || "";
    self.location = location;
    self.description = description;
    self.dependencies = {};
    self.main = null;
    self.resources = options.resources || {}; // by system.name / module.id
    self.modules = options.modules || {}; // by system.name/module.id
    self.systemLocations = options.systemLocations || {}; // by system.name;
    self.systems = options.systems || {}; // by system.name
    self.systemLoadedPromises = options.systemLoadedPromises || {}; // by system.name
    self.buildSystem = options.buildSystem; // or self if undefined
    self.analyzers = {js: self.analyzeJavaScript};
    self.compilers = {js: self.compileJavaScript};
    self.translators = {json: self.translateJson};
    self.internalRedirects = {};
    self.externalRedirects = {};
    self.node = !!options.node;
    self.browser = !!options.browser;
    self.parent = options.parent;
    self.root = options.root || self;
    // TODO options.optimize
    // TODO options.instrument
    self.systems[self.name] = self;
    self.systemLocations[self.name] = self.location;
    self.systemLoadedPromises[self.name] = Q(self);

    if (options.name != null && options.name !== description.name) {
        console.warn(
            "Package loaded by name " + JSON.stringify(options.name) +
            " bears name " + JSON.stringify(description.name)
        );
    }

    // The main property of the description can only create an internal
    // redirect, as such it normalizes absolute identifiers to relative.
    // All other redirects, whether from internal or external identifiers, can
    // redirect to either internal or external identifiers.
    self.main = description.main || "index.js";
    self.internalRedirects[".js"] = "./" + Identifier.resolve(self.main, "");

    // Overlays:
    if (options.browser) { self.overlayBrowser(description); }
    if (options.node) { self.overlayNode(description); }

    // Dependencies:
    if (description.dependencies) {
        self.addDependencies(description.dependencies);
    }
    if (self.root === self && description.devDependencies) {
        self.addDependencies(description.devDependencies);
    }

    // Local per-extension overrides:
    if (description.redirects) { self.addRedirects(description.redirects); }
    if (description.extensions) { self.addExtensions(description.extensions); }
    if (description.translators) { self.addTranslators(description.translators); }
    if (description.analyzers) { self.addAnalyzers(description.analyzers); }
    if (description.compilers) { self.addCompilers(description.compilers); }
}

System.load = function loadSystem(location, options) {
    var self = this;
    return self.prototype.loadSystemDescription(location, "<anonymous>")
    .then(function (description) {
        return new self(location, description, options);
    });
};

System.prototype.import = function importModule(rel, abs) {
    var self = this;
    return self.load(rel, abs)
    .then(function onModuleLoaded() {
        self.root.main = self.lookup(rel, abs);
        return self.require(rel, abs);
    });
};

// system.require(rel, abs) must be called only after the module and its
// transitive dependencies have been loaded, as guaranteed by system.load(rel,
// abs)
System.prototype.require = function require(rel, abs) {
    var self = this;

    // Apart from resolving relative identifiers, this also normalizes absolute
    // identifiers.
    var res = Identifier.resolve(rel, abs);
    if (Identifier.isAbsolute(rel)) {
        if (self.externalRedirects[res] === false) {
            return {};
        }
        if (self.externalRedirects[res]) {
            return self.require(self.externalRedirects[res], res);
        }
        var head = Identifier.head(rel);
        var tail = Identifier.tail(rel);
        if (self.dependencies[head]) {
            return self.getSystem(head, abs).requireInternalModule(tail, abs);
        } else if (self.modules[head]) {
            return self.requireInternalModule(rel, abs, self.modules[rel]);
        } else {
            var via = abs ? " via " + JSON.stringify(abs) : "";
            throw new Error("Can't require " + JSON.stringify(rel) + via + " in " + JSON.stringify(self.name));
        }
    } else {
        return self.requireInternalModule(rel, abs);
    }
};

System.prototype.requireInternalModule = function requireInternalModule(rel, abs, module) {
    var self = this;

    var res = Identifier.resolve(rel, abs);
    var id = self.normalizeIdentifier(res);
    if (self.internalRedirects[id]) {
        return self.require(self.internalRedirects[id], id);
    }

    module = module || self.lookupInternalModule(id);

    // check for load error
    if (module.error) {
        var error = module.error;
        var via = abs ? " via " + JSON.stringify(abs) : "";
        error.message = (
            "Can't require module " + JSON.stringify(module.id) +
            via +
            " in " + JSON.stringify(self.name || self.location) +
            " because " + error.message
        );
        throw error;
    }

    // do not reinitialize modules
    if (module.exports != null) {
        return module.exports;
    }

    // do not initialize modules that do not define a factory function
    if (typeof module.factory !== "function") {
        throw new Error(
            "Can't require module " + JSON.stringify(module.filename) +
            ". No exports. No exports factory."
        );
    }

    module.require = self.makeRequire(module.id, self.root.main);
    module.exports = {};

    // Execute the factory function:
    module.factory.call(
        // in the context of the module:
        null, // this (defaults to global, except in strict mode)
        module.require,
        module.exports,
        module,
        module.filename,
        module.dirname
    );

    return module.exports;
};

System.prototype.makeRequire = function makeRequire(abs, main) {
    var self = this;
    function require(rel) {
        return self.require(rel, abs);
    }
    require.main = main;
    return require;
};

// System:

// Should only be called if the system is known to have already been loaded by
// system.loadSystem.
System.prototype.getSystem = function getSystem(rel, abs) {
    var via;
    var hasDependency = this.dependencies[rel];
    if (!hasDependency) {
        via = abs ? " via " + JSON.stringify(abs) : "";
        throw new Error(
            "Can't get dependency " + JSON.stringify(rel) +
            " in package named " + JSON.stringify(this.name) + via
        );
    }
    var dependency = this.systems[rel];
    if (!dependency) {
        via = abs ? " via " + JSON.stringify(abs) : "";
        throw new Error(
            "Can't get dependency " + JSON.stringify(rel) +
            " in package named " + JSON.stringify(this.name) + via
        );
    }
    return dependency;
};

System.prototype.loadSystem = function (name, abs) {
    var self = this;
    //var hasDependency = self.dependencies[name];
    //if (!hasDependency) {
    //    var error = new Error("Can't load module " + JSON.stringify(name));
    //    error.module = true;
    //    throw error;
    //}
    var loadingSystem = self.systemLoadedPromises[name];
    if (!loadingSystem) {
        loadingSystem = self.actuallyLoadSystem(name, abs);
        self.systemLoadedPromises[name] = loadingSystem;
    }
    return loadingSystem;
};

System.prototype.loadSystemDescription = function loadSystemDescription(location, name) {
    var self = this;
    var descriptionLocation = URL.resolve(location, "package.json");
    return self.read(descriptionLocation, "utf-8", "application/json")
    .then(function (json) {
        try {
            return JSON.parse(json);
        } catch (error) {
            error.message = error.message + " in " +
                JSON.stringify(descriptionLocation);
            throw error;
        }
    }, function (error) {
        error.message = "Can't load package " + JSON.stringify(name) + " at " +
            JSON.stringify(location) + " because " + error.message;
        throw error;
    });
};

System.prototype.actuallyLoadSystem = function (name, abs) {
    var self = this;
    var System = self.constructor;
    var location = self.systemLocations[name];
    if (!location) {
        var via = abs ? " via " + JSON.stringify(abs) : "";
        throw new Error(
            "Can't load package " + JSON.stringify(name) + via +
            " because it is not a declared dependency"
        );
    }
    var buildSystem;
    if (self.buildSystem) {
        buildSystem = self.buildSystem.actuallyLoadSystem(name, abs);
    }
    return Q.all([
        self.loadSystemDescription(location, name),
        buildSystem
    ]).spread(function onDescriptionAndBuildSystem(description, buildSystem) {
        var system = new System(location, description, {
            parent: self,
            root: self.root,
            name: name,
            resources: self.resources,
            modules: self.modules,
            systems: self.systems,
            systemLocations: self.systemLocations,
            systemLoadedPromises: self.systemLoadedPromises,
            buildSystem: buildSystem,
            browser: self.browser,
            node: self.node
        });
        self.systems[system.name] = system;
        return system;
    });
};

System.prototype.getBuildSystem = function getBuildSystem() {
    var self = this;
    return self.buildSystem || self;
};

// Module:

System.prototype.normalizeIdentifier = function (id) {
    var self = this;
    var extension = Identifier.extension(id);
    if (
        !has.call(self.translators, extension) &&
        !has.call(self.analyzers, extension) &&
        !has.call(self.compilers, extension) &&
        extension !== "js" &&
        extension !== "json"
    ) {
        id += ".js";
    }
    return id;
};

System.prototype.load = function load(rel, abs) {
    var self = this;
    return self.deepLoad(rel, abs)
    .then(function () {
        return self.deepCompile(rel, abs, {});
    });
};

System.prototype.deepCompile = function deepCompile(rel, abs, memo) {
    var self = this;

    var res = Identifier.resolve(rel, abs);
    if (Identifier.isAbsolute(rel)) {
        if (self.externalRedirects[res]) {
            return self.deepCompile(self.externalRedirects[res], res, memo);
        }
        var head = Identifier.head(rel);
        var tail = Identifier.tail(rel);
        if (self.dependencies[head]) {
            var system = self.getSystem(head, abs);
            return system.compileInternalModule(tail, "", memo);
        } else {
            // XXX no clear idea what to do in this load case.
            // Should never reject, but should cause require to produce an
            // error.
            return Q();
        }
    } else {
        return self.compileInternalModule(rel, abs, memo);
    }
};

System.prototype.compileInternalModule = function compileInternalModule(rel, abs, memo) {
    var self = this;

    var res = Identifier.resolve(rel, abs);
    var id = self.normalizeIdentifier(res);
    if (self.internalRedirects[id]) {
        return self.deepCompile(self.internalRedirects[id], "", memo);
    }
    var module = self.lookupInternalModule(id, abs);

    // Break the cycle of violence
    if (memo[module.key]) {
        return Q();
    }
    memo[module.key] = true;

    if (module.compiled) {
        return Q();
    }
    module.compiled = true;
    return Q.try(function () {
        return Q.all(module.dependencies.map(function (dependency) {
            return self.deepCompile(dependency, module.id, memo);
        }));
    }).then(function () {
        return self.translate(module);
    }).then(function () {
        return self.compile(module);
    }).catch(function (error) {
        module.error = error;
    });
};

// Loads a module and its transitive dependencies.
System.prototype.deepLoad = function deepLoad(rel, abs, memo) {
    var self = this;
    var res = Identifier.resolve(rel, abs);
    if (Identifier.isAbsolute(rel)) {
        if (self.externalRedirects[res]) {
            return self.deepLoad(self.externalRedirects[res], res, memo);
        }
        var head = Identifier.head(rel);
        var tail = Identifier.tail(rel);
        if (self.dependencies[head]) {
            return self.loadSystem(head, abs).invoke("loadInternalModule", tail, "", memo);
        } else {
            // XXX no clear idea what to do in this load case.
            // Should never reject, but should cause require to produce an
            // error.
            return Q();
        }
    } else {
        return self.loadInternalModule(rel, abs, memo);
    }
};

System.prototype.loadInternalModule = function loadInternalModule(rel, abs, memo) {
    var self = this;

    var res = Identifier.resolve(rel, abs);
    var id = self.normalizeIdentifier(res);
    if (self.internalRedirects[id]) {
        return self.deepLoad(self.internalRedirects[id], "", memo);
    }

    // Extension must be captured before normalization since it is used to
    // determine whether to attempt to fallback to index.js for identifiers
    // that might refer to directories.
    var extension = Identifier.extension(res);

    var module = self.lookupInternalModule(id, abs);

    // Break the cycle of violence
    memo = memo || {};
    if (memo[module.key]) {
        return Q();
    }
    memo[module.key] = true;

    // Return a memoized load
    if (module.loadedPromise) {
        return module.loadedPromise;
    }
    module.loadedPromise = Q.try(function () {
        if (module.factory == null && module.exports == null) {
            return self.read(module.location, "utf-8")
            .then(function (text) {
                module.text = text;
                return self.finishLoadingModule(module, memo);
            }, fallback);
        }
    });

    function fallback(error) {
        var redirect = Identifier.resolve("./index.js", res);
        module.redirect = redirect;
        if (!error || error.notFound && extension === "") {
            return self.loadInternalModule(redirect, abs, memo)
            .catch(function (fallbackError) {
                module.redirect = null;
                // Prefer the original error
                module.error = error || fallbackError;
            });
        } else {
            module.error = error;
        }
    }

    return module.loadedPromise;
};

System.prototype.finishLoadingModule = function finishLoadingModule(module, memo) {
    var self = this;
    return Q.try(function () {
        return self.analyze(module);
    }).then(function () {
        return Q.all(module.dependencies.map(function onDependency(dependency) {
            return self.deepLoad(dependency, module.id, memo);
        }));
    });
};

System.prototype.lookup = function lookup(rel, abs) {
    var self = this;
    var res = Identifier.resolve(rel, abs);
    if (Identifier.isAbsolute(rel)) {
        if (self.externalRedirects[res]) {
            return self.lookup(self.externalRedirects[res], res);
        }
        var head = Identifier.head(res);
        var tail = Identifier.tail(res);
        if (self.dependencies[head]) {
            return self.getSystem(head, abs).lookupInternalModule(tail, "");
        } else if (self.modules[head] && !tail) {
            return self.modules[head];
        } else {
            var via = abs ? " via " + JSON.stringify(abs) : "";
            throw new Error(
                "Can't look up " + JSON.stringify(rel) + via +
                " in " + JSON.stringify(self.location) +
                " because there is no external module or dependency by that name"
            );
        }
    } else {
        return self.lookupInternalModule(rel, abs);
    }
};

System.prototype.lookupInternalModule = function lookupInternalModule(rel, abs) {
    var self = this;

    var res = Identifier.resolve(rel, abs);
    var id = self.normalizeIdentifier(res);

    if (self.internalRedirects[id]) {
        return self.lookup(self.internalRedirects[id], res);
    }

    var filename = self.name + "/" + id;
    // This module system is case-insensitive, but mandates that a module must
    // be consistently identified by the same case convention to avoid problems
    // when migrating to case-sensitive file systems.
    var key = filename.toLowerCase();
    var module = self.modules[key];

    if (module && module.redirect && module.redirect !== module.id) {
        return self.lookupInternalModule(module.redirect);
    }

    if (!module) {
        module = new Module();
        module.id = id;
        module.extension = Identifier.extension(id);
        module.location = URL.resolve(self.location, id);
        module.filename = filename;
        module.dirname = Identifier.dirname(filename);
        module.key = key;
        module.system = self;
        module.modules = self.modules;
        self.modules[key] = module;
    }

    if (module.filename !== filename) {
        module.error = new Error(
            "Can't refer to single module with multiple case conventions: " +
            JSON.stringify(filename) + " and " +
            JSON.stringify(module.filename)
        );
    }

    return module;
};

System.prototype.addExtensions = function (map) {
    var extensions = Object.keys(map);
    for (var index = 0; index < extensions.length; index++) {
        var extension = extensions[index];
        var id = map[extension];
        this.analyzers[extension] = this.makeLoadStep(id, "analyze");
        this.translators[extension] = this.makeLoadStep(id, "translate");
        this.compilers[extension] = this.makeLoadStep(id, "compile");
    }
};

System.prototype.makeLoadStep = function makeLoadStep(id, name) {
    var self = this;
    return function moduleLoaderStep(module) {
        return self.getBuildSystem()
        .import(id)
        .then(function (exports) {
            if (exports[name]) {
                return exports[name](module);
            }
        });
    };
};

// Translate:

System.prototype.translate = function translate(module) {
    var self = this;
    if (
        module.text != null &&
        module.extension != null &&
        self.translators[module.extension]
    ) {
        return self.translators[module.extension](module);
    }
};

System.prototype.addTranslators = function addTranslators(translators) {
    var self = this;
    var extensions = Object.keys(translators);
    for (var index = 0; index < extensions.length; index++) {
        var extension = extensions[index];
        var id = translators[extension];
        self.addTranslator(extension, id);
    }
};

System.prototype.addTranslator = function (extension, id) {
    var self = this;
    self.translators[extension] = self.makeTranslator(id);
};

System.prototype.makeTranslator = function makeTranslator(id) {
    var self = this;
    return function translate(module) {
        return self.getBuildSystem()
        .import(id)
        .then(function onTranslatorImported(translate) {
            if (typeof translate !== "function") {
                throw new Error(
                    "Can't translate " + JSON.stringify(module.id) +
                    " because " + JSON.stringify(id) + " did not export a function"
                );
            }
            module.extension = "js";
            return translate(module);
        });
    };
};

// Analyze:

System.prototype.analyze = function analyze(module) {
    if (
        module.text != null &&
        module.extension != null &&
        this.analyzers[module.extension]
    ) {
        return this.analyzers[module.extension](module);
    }
};

System.prototype.analyzeJavaScript = function analyzeJavaScript(module) {
    module.dependencies.push.apply(module.dependencies, parseDependencies(module.text));
};

System.prototype.addAnalyzers = function addAnalyzers(analyzers) {
    var self = this;
    var extensions = Object.keys(analyzers);
    for (var index = 0; index < extensions.length; index++) {
        var extension = extensions[index];
        var id = analyzers[extension];
        self.addAnalyzer(extension, id);
    }
};

System.prototype.addAnalyzer = function (extension, id) {
    var self = this;
    self.analyzers[extension] = self.makeAnalyzer(id);
};

System.prototype.makeAnalyzer = function makeAnalyzer(id) {
    var self = this;
    return function analyze(module) {
        return self.getBuildSystem()
        .import(id)
        .then(function onAnalyzerImported(analyze) {
            if (typeof analyze !== "function") {
                throw new Error(
                    "Can't analyze " + JSON.stringify(module.id) +
                    " because " + JSON.stringify(id) + " did not export a function"
                );
            }
            return analyze(module);
        });
    };
};

// Compile:

System.prototype.compile = function (module) {
    var self = this;
    if (
        module.factory == null &&
        module.redirect == null &&
        module.exports == null &&
        module.extension != null &&
        self.compilers[module.extension]
    ) {
        return self.compilers[module.extension](module);
    }
};

System.prototype.compileJavaScript = function compileJavaScript(module) {
    return compile(module);
};

System.prototype.translateJson = function translateJson(module) {
    module.text = "module.exports = " + module.text.trim() + ";\n";
};

System.prototype.addCompilers = function addCompilers(compilers) {
    var self = this;
    var extensions = Object.keys(compilers);
    for (var index = 0; index < extensions.length; index++) {
        var extension = extensions[index];
        var id = compilers[extension];
        self.addCompiler(extension, id);
    }
};

System.prototype.addCompiler = function (extension, id) {
    var self = this;
    self.compilers[extension] = self.makeCompiler(id);
};

System.prototype.makeCompiler = function makeCompiler(id) {
    var self = this;
    return function compile(module) {
        return self.getBuildSystem()
        .import(id)
        .then(function (compile) {
            return compile(module);
        });
    };
};

// Resource:

System.prototype.getResource = function getResource(rel, abs) {
    var self = this;
    if (Identifier.isAbsolute(rel)) {
        var head = Identifier.head(rel);
        var tail = Identifier.tail(rel);
        return self.getSystem(head, abs).getInternalResource(tail);
    } else {
        return self.getInternalResource(Identifier.resolve(rel, abs));
    }
};

System.prototype.locateResource = function locateResource(rel, abs) {
    var self = this;
    if (Identifier.isAbsolute(rel)) {
        var head = Identifier.head(rel);
        var tail = Identifier.tail(rel);
        return self.loadSystem(head, abs)
        .then(function onSystemLoaded(subsystem) {
            return subsystem.getInternalResource(tail);
        });
    } else {
        return Q(self.getInternalResource(Identifier.resolve(rel, abs)));
    }
};

System.prototype.getInternalResource = function getInternalResource(id) {
    var self = this;
    // TODO redirects
    var filename = self.name + "/" + id;
    var key = filename.toLowerCase();
    var resource = self.resources[key];
    if (!resource) {
        resource = new Resource();
        resource.id = id;
        resource.filename = filename;
        resource.dirname = Identifier.dirname(filename);
        resource.key = key;
        resource.location = URL.resolve(self.location, id);
        resource.system = self;
        self.resources[key] = resource;
    }
    return resource;
};

// Dependencies:

System.prototype.addDependencies = function addDependencies(dependencies) {
    var self = this;
    var names = Object.keys(dependencies);
    for (var index = 0; index < names.length; index++) {
        var name = names[index];
        self.dependencies[name] = true;
        if (!self.systemLocations[name]) {
            var location = URL.resolve(self.location, "node_modules/" + name + "/");
            self.systemLocations[name] = location;
        }
    }
};

// Redirects:

System.prototype.addRedirects = function addRedirects(redirects) {
    var self = this;
    var sources = Object.keys(redirects);
    for (var index = 0; index < sources.length; index++) {
        var source = sources[index];
        var target = redirects[source];
        self.addRedirect(source, target);
    }
};

System.prototype.addRedirect = function addRedirect(source, target) {
    var self = this;
    if (Identifier.isAbsolute(source)) {
        self.externalRedirects[source] = target;
    } else {
        source = self.normalizeIdentifier(Identifier.resolve(source));
        self.internalRedirects[source] = target;
    }
};

// Etc:

System.prototype.overlayBrowser = function overlayBrowser(description) {
    var self = this;
    if (typeof description.browser === "string") {
        self.addRedirect("", description.browser);
    } else if (description.browser && typeof description.browser === "object") {
        self.addRedirects(description.browser);
    }
};

System.prototype.inspect = function () {
    var self = this;
    return {type: "system", location: self.location};
};

},{"./compile":21,"./identifier":22,"./module":23,"./parse-dependencies":24,"./resource":25,"./url":19,"q":8}],21:[function(require,module,exports){
(function (global){
"use strict";

module.exports = compile;

// By using a named "eval" most browsers will execute in the global scope.
// http://www.davidflanagan.com/2010/12/global-eval-in.html
// Unfortunately execScript doesn't always return the value of the evaluated expression (at least in Chrome)
var globalEval = /*this.execScript ||*/eval;
// For Firebug evaled code isn't debuggable otherwise
// http://code.google.com/p/fbug/issues/detail?id=2198
if (global.navigator && global.navigator.userAgent.indexOf("Firefox") >= 0) {
    globalEval = new Function("_", "return eval(_)");
}

function compile(module) {

    // Here we use a couple tricks to make debugging better in various browsers:
    // TODO: determine if these are all necessary / the best options
    // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
    // 2. append the "//# sourceURL=filename" hack (Safari, Chrome, Firebug)
    //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
    //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
    //      TODO: investigate why this isn't working in Firebug.
    // 3. set displayName property on the factory function (Safari, Chrome)

    var displayName = module.filename.replace(/[^\w\d]|^\d/g, "_");

    try {
        module.factory = globalEval(
            "(function " +
            displayName +
             "(require, exports, module, __filename, __dirname) {" +
            module.text +
            "//*/\n})\n//# sourceURL=" +
            module.system.location + module.id
        );
    } catch (exception) {
        exception.message = exception.message + " in " + module.filename;
        throw exception;
    }

    // This should work and would be simpler, but Firebug does not show scripts executed via "new Function()" constructor.
    // TODO: sniff browser?
    // module.factory = new Function("require", "exports", "module", module.text + "\n//*/"+sourceURLComment);

    module.factory.displayName = module.filename;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
"use strict";

exports.isAbsolute = isAbsolute;
function isAbsolute(path) {
    return (
        path !== "" &&
        path.lastIndexOf("./", 0) < 0 &&
        path.lastIndexOf("../", 0) < 0
    );
}

exports.isBare = isBare;
function isBare(id) {
    var lastSlash = id.lastIndexOf("/");
    return id.indexOf(".", lastSlash) < 0;
}

// TODO @user/name package names

exports.head = head;
function head(id) {
    var firstSlash = id.indexOf("/");
    if (firstSlash < 0) { return id; }
    return id.slice(0, firstSlash);
}

exports.tail = tail;
function tail(id) {
    var firstSlash = id.indexOf("/");
    if (firstSlash < 0) { return ""; }
    return id.slice(firstSlash + 1);
}

exports.extension = extension;
function extension(id) {
    var lastSlash = id.lastIndexOf("/");
    var lastDot = id.lastIndexOf(".");
    if (lastDot <= lastSlash) { return ""; }
    return id.slice(lastDot + 1);
}

exports.dirname = dirname;
function dirname(id) {
    var lastSlash = id.lastIndexOf("/");
    if (lastSlash < 0) {
        return id;
    }
    return id.slice(0, lastSlash);
}

exports.basename = basename;
function basename(id) {
    var lastSlash = id.lastIndexOf("/");
    if (lastSlash < 0) {
        return id;
    }
    return id.slice(lastSlash + 1);
}

exports.resolve = resolve;
function resolve(rel, abs) {
    abs = abs || "";
    var source = rel.split("/");
    var target = [];
    var parts;
    if (source.length && source[0] === "." || source[0] === "..") {
        parts = abs.split("/");
        parts.pop();
        source.unshift.apply(source, parts);
    }
    for (var index = 0; index < source.length; index++) {
        if (source[index] === "..") {
            if (target.length) {
                target.pop();
            }
        } else if (source[index] !== "" && source[index] !== ".") {
            target.push(source[index]);
        }
    }
    return target.join("/");
}

},{}],23:[function(require,module,exports){
"use strict";

module.exports = Module;

function Module() {
    this.id = null;
    this.extension = null;
    this.system = null;
    this.key = null;
    this.filename = null;
    this.dirname = null;
    this.exports = null;
    this.redirect = null;
    this.text = null;
    this.factory = null;
    this.dependencies = [];
    this.loadedPromise = null;
    // for bundles
    this.index = null;
    this.bundled = false;
}

},{}],24:[function(require,module,exports){
"use strict";

module.exports = parseDependencies;
function parseDependencies(text) {
    var dependsUpon = {};
    String(text).replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, id) {
        dependsUpon[id] = true;
    });
    return Object.keys(dependsUpon);
}

},{}],25:[function(require,module,exports){
"use strict";

module.exports = Resource;

function Resource() {
    this.id = null;
    this.filename = null;
    this.dirname = null;
    this.key = null;
    this.location = null;
    this.system = null;
}

},{}],26:[function(require,module,exports){
// Copyright (C) 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Install a leaky WeakMap emulation on platforms that
 * don't provide a built-in one.
 *
 * <p>Assumes that an ES5 platform where, if {@code WeakMap} is
 * already present, then it conforms to the anticipated ES6
 * specification. To run this file on an ES5 or almost ES5
 * implementation where the {@code WeakMap} specification does not
 * quite conform, run <code>repairES5.js</code> first.
 *
 * <p>Even though WeakMapModule is not global, the linter thinks it
 * is, which is why it is in the overrides list below.
 *
 * <p>NOTE: Before using this WeakMap emulation in a non-SES
 * environment, see the note below about hiddenRecord.
 *
 * @author Mark S. Miller
 * @requires crypto, ArrayBuffer, Uint8Array, navigator, console
 * @overrides WeakMap, ses, Proxy
 * @overrides WeakMapModule
 */

/**
 * This {@code WeakMap} emulation is observably equivalent to the
 * ES-Harmony WeakMap, but with leakier garbage collection properties.
 *
 * <p>As with true WeakMaps, in this emulation, a key does not
 * retain maps indexed by that key and (crucially) a map does not
 * retain the keys it indexes. A map by itself also does not retain
 * the values associated with that map.
 *
 * <p>However, the values associated with a key in some map are
 * retained so long as that key is retained and those associations are
 * not overridden. For example, when used to support membranes, all
 * values exported from a given membrane will live for the lifetime
 * they would have had in the absence of an interposed membrane. Even
 * when the membrane is revoked, all objects that would have been
 * reachable in the absence of revocation will still be reachable, as
 * far as the GC can tell, even though they will no longer be relevant
 * to ongoing computation.
 *
 * <p>The API implemented here is approximately the API as implemented
 * in FF6.0a1 and agreed to by MarkM, Andreas Gal, and Dave Herman,
 * rather than the offially approved proposal page. TODO(erights):
 * upgrade the ecmascript WeakMap proposal page to explain this API
 * change and present to EcmaScript committee for their approval.
 *
 * <p>The first difference between the emulation here and that in
 * FF6.0a1 is the presence of non enumerable {@code get___, has___,
 * set___, and delete___} methods on WeakMap instances to represent
 * what would be the hidden internal properties of a primitive
 * implementation. Whereas the FF6.0a1 WeakMap.prototype methods
 * require their {@code this} to be a genuine WeakMap instance (i.e.,
 * an object of {@code [[Class]]} "WeakMap}), since there is nothing
 * unforgeable about the pseudo-internal method names used here,
 * nothing prevents these emulated prototype methods from being
 * applied to non-WeakMaps with pseudo-internal methods of the same
 * names.
 *
 * <p>Another difference is that our emulated {@code
 * WeakMap.prototype} is not itself a WeakMap. A problem with the
 * current FF6.0a1 API is that WeakMap.prototype is itself a WeakMap
 * providing ambient mutability and an ambient communications
 * channel. Thus, if a WeakMap is already present and has this
 * problem, repairES5.js wraps it in a safe wrappper in order to
 * prevent access to this channel. (See
 * PATCH_MUTABLE_FROZEN_WEAKMAP_PROTO in repairES5.js).
 */

/**
 * If this is a full <a href=
 * "http://code.google.com/p/es-lab/wiki/SecureableES5"
 * >secureable ES5</a> platform and the ES-Harmony {@code WeakMap} is
 * absent, install an approximate emulation.
 *
 * <p>If WeakMap is present but cannot store some objects, use our approximate
 * emulation as a wrapper.
 *
 * <p>If this is almost a secureable ES5 platform, then WeakMap.js
 * should be run after repairES5.js.
 *
 * <p>See {@code WeakMap} for documentation of the garbage collection
 * properties of this WeakMap emulation.
 */
(function WeakMapModule() {
  "use strict";

  if (typeof ses !== 'undefined' && ses.ok && !ses.ok()) {
    // already too broken, so give up
    return;
  }

  /**
   * In some cases (current Firefox), we must make a choice betweeen a
   * WeakMap which is capable of using all varieties of host objects as
   * keys and one which is capable of safely using proxies as keys. See
   * comments below about HostWeakMap and DoubleWeakMap for details.
   *
   * This function (which is a global, not exposed to guests) marks a
   * WeakMap as permitted to do what is necessary to index all host
   * objects, at the cost of making it unsafe for proxies.
   *
   * Do not apply this function to anything which is not a genuine
   * fresh WeakMap.
   */
  function weakMapPermitHostObjects(map) {
    // identity of function used as a secret -- good enough and cheap
    if (map.permitHostObjects___) {
      map.permitHostObjects___(weakMapPermitHostObjects);
    }
  }
  if (typeof ses !== 'undefined') {
    ses.weakMapPermitHostObjects = weakMapPermitHostObjects;
  }

  // IE 11 has no Proxy but has a broken WeakMap such that we need to patch
  // it using DoubleWeakMap; this flag tells DoubleWeakMap so.
  var doubleWeakMapCheckSilentFailure = false;

  // Check if there is already a good-enough WeakMap implementation, and if so
  // exit without replacing it.
  if (typeof WeakMap === 'function') {
    var HostWeakMap = WeakMap;
    // There is a WeakMap -- is it good enough?
    if (typeof navigator !== 'undefined' &&
        /Firefox/.test(navigator.userAgent)) {
      // We're now *assuming not*, because as of this writing (2013-05-06)
      // Firefox's WeakMaps have a miscellany of objects they won't accept, and
      // we don't want to make an exhaustive list, and testing for just one
      // will be a problem if that one is fixed alone (as they did for Event).

      // If there is a platform that we *can* reliably test on, here's how to
      // do it:
      //  var problematic = ... ;
      //  var testHostMap = new HostWeakMap();
      //  try {
      //    testHostMap.set(problematic, 1);  // Firefox 20 will throw here
      //    if (testHostMap.get(problematic) === 1) {
      //      return;
      //    }
      //  } catch (e) {}

    } else {
      // IE 11 bug: WeakMaps silently fail to store frozen objects.
      var testMap = new HostWeakMap();
      var testObject = Object.freeze({});
      testMap.set(testObject, 1);
      if (testMap.get(testObject) !== 1) {
        doubleWeakMapCheckSilentFailure = true;
        // Fall through to installing our WeakMap.
      } else {
        module.exports = WeakMap;
        return;
      }
    }
  }

  var hop = Object.prototype.hasOwnProperty;
  var gopn = Object.getOwnPropertyNames;
  var defProp = Object.defineProperty;
  var isExtensible = Object.isExtensible;

  /**
   * Security depends on HIDDEN_NAME being both <i>unguessable</i> and
   * <i>undiscoverable</i> by untrusted code.
   *
   * <p>Given the known weaknesses of Math.random() on existing
   * browsers, it does not generate unguessability we can be confident
   * of.
   *
   * <p>It is the monkey patching logic in this file that is intended
   * to ensure undiscoverability. The basic idea is that there are
   * three fundamental means of discovering properties of an object:
   * The for/in loop, Object.keys(), and Object.getOwnPropertyNames(),
   * as well as some proposed ES6 extensions that appear on our
   * whitelist. The first two only discover enumerable properties, and
   * we only use HIDDEN_NAME to name a non-enumerable property, so the
   * only remaining threat should be getOwnPropertyNames and some
   * proposed ES6 extensions that appear on our whitelist. We monkey
   * patch them to remove HIDDEN_NAME from the list of properties they
   * returns.
   *
   * <p>TODO(erights): On a platform with built-in Proxies, proxies
   * could be used to trap and thereby discover the HIDDEN_NAME, so we
   * need to monkey patch Proxy.create, Proxy.createFunction, etc, in
   * order to wrap the provided handler with the real handler which
   * filters out all traps using HIDDEN_NAME.
   *
   * <p>TODO(erights): Revisit Mike Stay's suggestion that we use an
   * encapsulated function at a not-necessarily-secret name, which
   * uses the Stiegler shared-state rights amplification pattern to
   * reveal the associated value only to the WeakMap in which this key
   * is associated with that value. Since only the key retains the
   * function, the function can also remember the key without causing
   * leakage of the key, so this doesn't violate our general gc
   * goals. In addition, because the name need not be a guarded
   * secret, we could efficiently handle cross-frame frozen keys.
   */
  var HIDDEN_NAME_PREFIX = 'weakmap:';
  var HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'ident:' + Math.random() + '___';

  if (typeof crypto !== 'undefined' &&
      typeof crypto.getRandomValues === 'function' &&
      typeof ArrayBuffer === 'function' &&
      typeof Uint8Array === 'function') {
    var ab = new ArrayBuffer(25);
    var u8s = new Uint8Array(ab);
    crypto.getRandomValues(u8s);
    HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'rand:' +
      Array.prototype.map.call(u8s, function(u8) {
        return (u8 % 36).toString(36);
      }).join('') + '___';
  }

  function isNotHiddenName(name) {
    return !(
        name.substr(0, HIDDEN_NAME_PREFIX.length) == HIDDEN_NAME_PREFIX &&
        name.substr(name.length - 3) === '___');
  }

  /**
   * Monkey patch getOwnPropertyNames to avoid revealing the
   * HIDDEN_NAME.
   *
   * <p>The ES5.1 spec requires each name to appear only once, but as
   * of this writing, this requirement is controversial for ES6, so we
   * made this code robust against this case. If the resulting extra
   * search turns out to be expensive, we can probably relax this once
   * ES6 is adequately supported on all major browsers, iff no browser
   * versions we support at that time have relaxed this constraint
   * without providing built-in ES6 WeakMaps.
   */
  defProp(Object, 'getOwnPropertyNames', {
    value: function fakeGetOwnPropertyNames(obj) {
      return gopn(obj).filter(isNotHiddenName);
    }
  });

  /**
   * getPropertyNames is not in ES5 but it is proposed for ES6 and
   * does appear in our whitelist, so we need to clean it too.
   */
  if ('getPropertyNames' in Object) {
    var originalGetPropertyNames = Object.getPropertyNames;
    defProp(Object, 'getPropertyNames', {
      value: function fakeGetPropertyNames(obj) {
        return originalGetPropertyNames(obj).filter(isNotHiddenName);
      }
    });
  }

  /**
   * <p>To treat objects as identity-keys with reasonable efficiency
   * on ES5 by itself (i.e., without any object-keyed collections), we
   * need to add a hidden property to such key objects when we
   * can. This raises several issues:
   * <ul>
   * <li>Arranging to add this property to objects before we lose the
   *     chance, and
   * <li>Hiding the existence of this new property from most
   *     JavaScript code.
   * <li>Preventing <i>certification theft</i>, where one object is
   *     created falsely claiming to be the key of an association
   *     actually keyed by another object.
   * <li>Preventing <i>value theft</i>, where untrusted code with
   *     access to a key object but not a weak map nevertheless
   *     obtains access to the value associated with that key in that
   *     weak map.
   * </ul>
   * We do so by
   * <ul>
   * <li>Making the name of the hidden property unguessable, so "[]"
   *     indexing, which we cannot intercept, cannot be used to access
   *     a property without knowing the name.
   * <li>Making the hidden property non-enumerable, so we need not
   *     worry about for-in loops or {@code Object.keys},
   * <li>monkey patching those reflective methods that would
   *     prevent extensions, to add this hidden property first,
   * <li>monkey patching those methods that would reveal this
   *     hidden property.
   * </ul>
   * Unfortunately, because of same-origin iframes, we cannot reliably
   * add this hidden property before an object becomes
   * non-extensible. Instead, if we encounter a non-extensible object
   * without a hidden record that we can detect (whether or not it has
   * a hidden record stored under a name secret to us), then we just
   * use the key object itself to represent its identity in a brute
   * force leaky map stored in the weak map, losing all the advantages
   * of weakness for these.
   */
  function getHiddenRecord(key) {
    if (key !== Object(key)) {
      throw new TypeError('Not an object: ' + key);
    }
    var hiddenRecord = key[HIDDEN_NAME];
    if (hiddenRecord && hiddenRecord.key === key) { return hiddenRecord; }
    if (!isExtensible(key)) {
      // Weak map must brute force, as explained in doc-comment above.
      return void 0;
    }

    // The hiddenRecord and the key point directly at each other, via
    // the "key" and HIDDEN_NAME properties respectively. The key
    // field is for quickly verifying that this hidden record is an
    // own property, not a hidden record from up the prototype chain.
    //
    // NOTE: Because this WeakMap emulation is meant only for systems like
    // SES where Object.prototype is frozen without any numeric
    // properties, it is ok to use an object literal for the hiddenRecord.
    // This has two advantages:
    // * It is much faster in a performance critical place
    // * It avoids relying on Object.create(null), which had been
    //   problematic on Chrome 28.0.1480.0. See
    //   https://code.google.com/p/google-caja/issues/detail?id=1687
    hiddenRecord = { key: key };

    // When using this WeakMap emulation on platforms where
    // Object.prototype might not be frozen and Object.create(null) is
    // reliable, use the following two commented out lines instead.
    // hiddenRecord = Object.create(null);
    // hiddenRecord.key = key;

    // Please contact us if you need this to work on platforms where
    // Object.prototype might not be frozen and
    // Object.create(null) might not be reliable.

    try {
      defProp(key, HIDDEN_NAME, {
        value: hiddenRecord,
        writable: false,
        enumerable: false,
        configurable: false
      });
      return hiddenRecord;
    } catch (error) {
      // Under some circumstances, isExtensible seems to misreport whether
      // the HIDDEN_NAME can be defined.
      // The circumstances have not been isolated, but at least affect
      // Node.js v0.10.26 on TravisCI / Linux, but not the same version of
      // Node.js on OS X.
      return void 0;
    }
  }

  /**
   * Monkey patch operations that would make their argument
   * non-extensible.
   *
   * <p>The monkey patched versions throw a TypeError if their
   * argument is not an object, so it should only be done to functions
   * that should throw a TypeError anyway if their argument is not an
   * object.
   */
  (function(){
    var oldFreeze = Object.freeze;
    defProp(Object, 'freeze', {
      value: function identifyingFreeze(obj) {
        getHiddenRecord(obj);
        return oldFreeze(obj);
      }
    });
    var oldSeal = Object.seal;
    defProp(Object, 'seal', {
      value: function identifyingSeal(obj) {
        getHiddenRecord(obj);
        return oldSeal(obj);
      }
    });
    var oldPreventExtensions = Object.preventExtensions;
    defProp(Object, 'preventExtensions', {
      value: function identifyingPreventExtensions(obj) {
        getHiddenRecord(obj);
        return oldPreventExtensions(obj);
      }
    });
  })();

  function constFunc(func) {
    func.prototype = null;
    return Object.freeze(func);
  }

  var calledAsFunctionWarningDone = false;
  function calledAsFunctionWarning() {
    // Future ES6 WeakMap is currently (2013-09-10) expected to reject WeakMap()
    // but we used to permit it and do it ourselves, so warn only.
    if (!calledAsFunctionWarningDone && typeof console !== 'undefined') {
      calledAsFunctionWarningDone = true;
      console.warn('WeakMap should be invoked as new WeakMap(), not ' +
          'WeakMap(). This will be an error in the future.');
    }
  }

  var nextId = 0;

  var OurWeakMap = function() {
    if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
      calledAsFunctionWarning();
    }

    // We are currently (12/25/2012) never encountering any prematurely
    // non-extensible keys.
    var keys = []; // brute force for prematurely non-extensible keys.
    var values = []; // brute force for corresponding values.
    var id = nextId++;

    function get___(key, opt_default) {
      var index;
      var hiddenRecord = getHiddenRecord(key);
      if (hiddenRecord) {
        return id in hiddenRecord ? hiddenRecord[id] : opt_default;
      } else {
        index = keys.indexOf(key);
        return index >= 0 ? values[index] : opt_default;
      }
    }

    function has___(key) {
      var hiddenRecord = getHiddenRecord(key);
      if (hiddenRecord) {
        return id in hiddenRecord;
      } else {
        return keys.indexOf(key) >= 0;
      }
    }

    function set___(key, value) {
      var index;
      var hiddenRecord = getHiddenRecord(key);
      if (hiddenRecord) {
        hiddenRecord[id] = value;
      } else {
        index = keys.indexOf(key);
        if (index >= 0) {
          values[index] = value;
        } else {
          // Since some browsers preemptively terminate slow turns but
          // then continue computing with presumably corrupted heap
          // state, we here defensively get keys.length first and then
          // use it to update both the values and keys arrays, keeping
          // them in sync.
          index = keys.length;
          values[index] = value;
          // If we crash here, values will be one longer than keys.
          keys[index] = key;
        }
      }
      return this;
    }

    function delete___(key) {
      var hiddenRecord = getHiddenRecord(key);
      var index, lastIndex;
      if (hiddenRecord) {
        return id in hiddenRecord && delete hiddenRecord[id];
      } else {
        index = keys.indexOf(key);
        if (index < 0) {
          return false;
        }
        // Since some browsers preemptively terminate slow turns but
        // then continue computing with potentially corrupted heap
        // state, we here defensively get keys.length first and then use
        // it to update both the keys and the values array, keeping
        // them in sync. We update the two with an order of assignments,
        // such that any prefix of these assignments will preserve the
        // key/value correspondence, either before or after the delete.
        // Note that this needs to work correctly when index === lastIndex.
        lastIndex = keys.length - 1;
        keys[index] = void 0;
        // If we crash here, there's a void 0 in the keys array, but
        // no operation will cause a "keys.indexOf(void 0)", since
        // getHiddenRecord(void 0) will always throw an error first.
        values[index] = values[lastIndex];
        // If we crash here, values[index] cannot be found here,
        // because keys[index] is void 0.
        keys[index] = keys[lastIndex];
        // If index === lastIndex and we crash here, then keys[index]
        // is still void 0, since the aliasing killed the previous key.
        keys.length = lastIndex;
        // If we crash here, keys will be one shorter than values.
        values.length = lastIndex;
        return true;
      }
    }

    return Object.create(OurWeakMap.prototype, {
      get___:    { value: constFunc(get___) },
      has___:    { value: constFunc(has___) },
      set___:    { value: constFunc(set___) },
      delete___: { value: constFunc(delete___) }
    });
  };

  OurWeakMap.prototype = Object.create(Object.prototype, {
    get: {
      /**
       * Return the value most recently associated with key, or
       * opt_default if none.
       */
      value: function get(key, opt_default) {
        return this.get___(key, opt_default);
      },
      writable: true,
      configurable: true
    },

    has: {
      /**
       * Is there a value associated with key in this WeakMap?
       */
      value: function has(key) {
        return this.has___(key);
      },
      writable: true,
      configurable: true
    },

    set: {
      /**
       * Associate value with key in this WeakMap, overwriting any
       * previous association if present.
       */
      value: function set(key, value) {
        return this.set___(key, value);
      },
      writable: true,
      configurable: true
    },

    'delete': {
      /**
       * Remove any association for key in this WeakMap, returning
       * whether there was one.
       *
       * <p>Note that the boolean return here does not work like the
       * {@code delete} operator. The {@code delete} operator returns
       * whether the deletion succeeds at bringing about a state in
       * which the deleted property is absent. The {@code delete}
       * operator therefore returns true if the property was already
       * absent, whereas this {@code delete} method returns false if
       * the association was already absent.
       */
      value: function remove(key) {
        return this.delete___(key);
      },
      writable: true,
      configurable: true
    }
  });

  if (typeof HostWeakMap === 'function') {
    (function() {
      // If we got here, then the platform has a WeakMap but we are concerned
      // that it may refuse to store some key types. Therefore, make a map
      // implementation which makes use of both as possible.

      // In this mode we are always using double maps, so we are not proxy-safe.
      // This combination does not occur in any known browser, but we had best
      // be safe.
      if (doubleWeakMapCheckSilentFailure && typeof Proxy !== 'undefined') {
        Proxy = undefined;
      }

      function DoubleWeakMap() {
        if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
          calledAsFunctionWarning();
        }

        // Preferable, truly weak map.
        var hmap = new HostWeakMap();

        // Our hidden-property-based pseudo-weak-map. Lazily initialized in the
        // 'set' implementation; thus we can avoid performing extra lookups if
        // we know all entries actually stored are entered in 'hmap'.
        var omap = undefined;

        // Hidden-property maps are not compatible with proxies because proxies
        // can observe the hidden name and either accidentally expose it or fail
        // to allow the hidden property to be set. Therefore, we do not allow
        // arbitrary WeakMaps to switch to using hidden properties, but only
        // those which need the ability, and unprivileged code is not allowed
        // to set the flag.
        //
        // (Except in doubleWeakMapCheckSilentFailure mode in which case we
        // disable proxies.)
        var enableSwitching = false;

        function dget(key, opt_default) {
          if (omap) {
            return hmap.has(key) ? hmap.get(key)
                : omap.get___(key, opt_default);
          } else {
            return hmap.get(key, opt_default);
          }
        }

        function dhas(key) {
          return hmap.has(key) || (omap ? omap.has___(key) : false);
        }

        var dset;
        if (doubleWeakMapCheckSilentFailure) {
          dset = function(key, value) {
            hmap.set(key, value);
            if (!hmap.has(key)) {
              if (!omap) { omap = new OurWeakMap(); }
              omap.set(key, value);
            }
            return this;
          };
        } else {
          dset = function(key, value) {
            if (enableSwitching) {
              try {
                hmap.set(key, value);
              } catch (e) {
                if (!omap) { omap = new OurWeakMap(); }
                omap.set___(key, value);
              }
            } else {
              hmap.set(key, value);
            }
            return this;
          };
        }

        function ddelete(key) {
          var result = !!hmap['delete'](key);
          if (omap) { return omap.delete___(key) || result; }
          return result;
        }

        return Object.create(OurWeakMap.prototype, {
          get___:    { value: constFunc(dget) },
          has___:    { value: constFunc(dhas) },
          set___:    { value: constFunc(dset) },
          delete___: { value: constFunc(ddelete) },
          permitHostObjects___: { value: constFunc(function(token) {
            if (token === weakMapPermitHostObjects) {
              enableSwitching = true;
            } else {
              throw new Error('bogus call to permitHostObjects___');
            }
          })}
        });
      }
      DoubleWeakMap.prototype = OurWeakMap.prototype;
      module.exports = DoubleWeakMap;

      // define .constructor to hide OurWeakMap ctor
      Object.defineProperty(WeakMap.prototype, 'constructor', {
        value: WeakMap,
        enumerable: false,  // as default .constructor is
        configurable: true,
        writable: true
      });
    })();
  } else {
    // There is no host WeakMap, so we must use the emulation.

    // Emulated WeakMaps are incompatible with native proxies (because proxies
    // can observe the hidden name), so we must disable Proxy usage (in
    // ArrayLike and Domado, currently).
    if (typeof Proxy !== 'undefined') {
      Proxy = undefined;
    }

    module.exports = OurWeakMap;
  }
})();

},{}],27:[function(require,module,exports){
toastr.options = {
  closeButton: false,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: 'toast-bottom-right',
  preventDuplicates: false,
  onclick: null,
  showDuration: 300,
  hideDuration: 1000,
  timeOut: 5000,
  extendedTimeOut: 1000,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
};

window.JSONLint = require('../../static/libs/jsonlint/jsonlint.js');

require('./ng-app');

moment.locale('ru');


},{"../../static/libs/jsonlint/jsonlint.js":102,"./ng-app":53}],28:[function(require,module,exports){
var DSObject, Person, VER_MAJOR, VER_MINOR, assert, fixUrl, ngModule, serviceOwner, validate,
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

fixUrl = function(url) {
  if (!(url = /https?:\/\/.*?($|\/)/.exec(url)[0])) {
    return null;
  }
  if (url.charAt(url.length - 1) !== '/') {
    url = url + '/';
  }
  return url;
};

ngModule.factory('config', [
  '$http', 'localStorageService', (function($http, localStorageService) {
    var Config, config, desc, keepConnection, keepOtherOptions, name, ref, v, ver, verMajor, verMinor, verParts;
    Config = (function(superClass) {
      extend(Config, superClass);

      function Config() {
        return Config.__super__.constructor.apply(this, arguments);
      }

      Config.begin('Config');

      Config.propStr('token', {
        valid: validate.trimString
      });

      Config.propStr('teamwork', {
        init: 'http://teamwork.webprofy.ru/',
        valid: fixUrl
      });

      Config.propCalc('hasRoles', (function() {
        return this.teamwork.indexOf('://teamwork.webprofy.ru/') > 0;
      }));

      Config.propCalc('hasTimeReports', (function() {
        return this.teamwork.indexOf('://teamwork.webprofy.ru/') > 0 || this.teamwork.indexOf('://delightsoft.teamworkpm.net/') > 0;
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

      Config.propNum('selectedCompany', {
        init: -1
      });

      Config.propStr('selectedManager');

      Config.propNum('selectedLoad');

      Config.propNum('activeSidebarTab', {
        init: 0
      });

      Config.propNum('refreshPeriod');

      Config.propNum('autosave', {
        init: 0
      });

      Config.propNum('view3GroupByPerson', {
        init: 0
      });

      Config.propNum('view3HidePeopleWOTasks', {
        init: 0
      });

      Config.propStr('view3FilterByPerson', {
        init: ''
      });

      Config.propStr('view3FilterByProject', {
        init: ''
      });

      Config.propStr('view3FilterByTask', {
        init: ''
      });

      Config.propNum('histStart', {
        init: -1
      });

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


},{"../dscommon/DSObject":93,"../dscommon/util":99,"../utils/angular-local-storage.js":100,"./models/Person":43}],29:[function(require,module,exports){
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

      PeopleWithJson.propObj('cancel', {
        init: null
      });

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
              if (error.hasOwnProperty('status')) {
                toastr.error("Failed to load <i>data/people.json</i>:<br/><br/> " + error.status + " " + error.statusText, null, {
                  positionClass: 'toast-top-center',
                  newestOnTop: true,
                  timeOut: -1
                });
              } else {
                toastr.error("Invalid <i>data/people.json</i>:<br/><br/> " + error.message, null, {
                  positionClass: 'toast-top-center',
                  newestOnTop: true,
                  timeOut: -1
                });
              }
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
            $http.get("data/people.json?t=" + (new Date().getTime()), {
              timeout: cancel,
              transformResponse: (function(data, headers, status) {
                if (status === 200) {
                  return JSONLint.parse(data);
                }
              })
            }).then((function(resp) {
              if (resp.status === 200) {
                _this.set('cancel', null);
                DSDigest.block((function() {
                  var dstags, filterManagers, i, j, k, l, len, len1, len2, len3, m, map, peopleRoles, person, personInfo, personKey, projectId, projectMap, ref, ref1, ref2, selectedManager, selectedRole, twPerson;
                  peopleRoles = $rootScope.peopleRoles = resp.data.roles;
                  if ((selectedRole = $rootScope.selectedRole = config.get('selectedRole'))) {
                    for (j = 0, len = peopleRoles.length; j < len; j++) {
                      i = peopleRoles[j];
                      if (!(i.role === selectedRole)) {
                        continue;
                      }
                      $rootScope.selectedRole = i;
                      break;
                    }
                  }
                  filterManagers = $rootScope.filterManagers = [
                    {
                      name: 'All',
                      $ds_key: null
                    }
                  ];
                  ref = resp.data.people;
                  for (k = 0, len1 = ref.length; k < len1; k++) {
                    personInfo = ref[k];
                    if (teamworkPeople.items.hasOwnProperty(personKey = "" + personInfo.id)) {
                      (twPerson = teamworkPeople.items[personKey]).set('roles', dstags = new DSTags(_this, personInfo.role));
                      dstags.release(_this);
                      if (personInfo.hasOwnProperty('projects')) {
                        if (!Array.isArray(personInfo.projects)) {
                          console.error("Person " + personInfo.name + ": Invalid prop 'projects'");
                        } else {
                          try {
                            twPerson.projects = projectMap = {};
                            ref1 = personInfo.projects;
                            for (l = 0, len2 = ref1.length; l < len2; l++) {
                              projectId = ref1[l];
                              projectMap[projectId] = true;
                            }
                            filterManagers.push(twPerson);
                          } catch (error1) {
                            console.error("Person " + personInfo.name + ": Invalid prop 'projects'");
                          }
                        }
                      }
                    }
                  }
                  if (selectedManager = $rootScope.selectedManager = config.get('selectedManager')) {
                    for (m = 0, len3 = filterManagers.length; m < len3; m++) {
                      i = filterManagers[m];
                      if (!(i.$ds_key === selectedManager)) {
                        continue;
                      }
                      $rootScope.selectedManager = i;
                      break;
                    }
                  }
                  map = {};
                  ref2 = teamworkPeople.items;
                  for (personKey in ref2) {
                    person = ref2[personKey];
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


},{"../../dscommon/DSData":84,"../../dscommon/DSDataServiceBase":87,"../../dscommon/DSDigest":89,"../../dscommon/DSSet":96,"../../dscommon/DSTags":97,"../../dscommon/util":99,"../models/Person":43}],30:[function(require,module,exports){
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


},{"../../dscommon/DSData":84,"../../dscommon/DSDataServiceBase":87,"../../dscommon/DSDigest":89,"../../dscommon/DSDocument":90,"../../dscommon/DSSet":96,"../../dscommon/util":99,"../models/Person":43,"../models/PersonDayStat":44,"../models/Task":48}],31:[function(require,module,exports){
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

      TasksWithTimeTracking.propObj('cancel', {
        init: null
      });

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


},{"../../dscommon/DSData":84,"../../dscommon/DSDataServiceBase":87,"../../dscommon/DSDigest":89,"../../dscommon/DSSet":96,"../../dscommon/DSTags":97,"../../dscommon/util":99,"../models/Task":48,"../models/TaskTimeTracking":50}],32:[function(require,module,exports){
var CHANGES_PERSISTANCE_VER, Comments, DSChangesBase, DSDataEditable, DSDigest, DSSet, DSTags, Person, RMSData, Tag, Task, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataChanges', ['LocalStorageModule', require('../../dscommon/DSDataSource')])).name;

assert = require('../../dscommon/util').assert;

serviceOwner = require('../../dscommon/util').serviceOwner;

error = require('../../dscommon/util').error;

DSDigest = require('../../dscommon/DSDigest');

DSChangesBase = require('../../dscommon/DSChangesBase');

DSDataEditable = require('../../dscommon/DSDataEditable');

DSTags = require('../../dscommon/DSTags');

DSSet = require('../../dscommon/DSSet');

Person = require('../models/Person');

Tag = require('../models/Tag');

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
  'TWTaskLists', 'DSDataSource', 'config', 'localStorageService', '$rootScope', '$http', '$timeout', '$q', (function(TWTaskLists, DSDataSource, config, localStorageService, $rootScope, $http, $timeout, $q) {
    var DSChanges;
    DSChanges = (function(superClass) {
      var removeChanges, reportFailedSave, reportSuccessSave, trimTitle;

      extend(DSChanges, superClass);

      DSChanges.begin('DSChanges');

      DSChanges.propSet('tasks', Task.Editable);

      DSChanges.propObj('dataService');

      DSChanges.propDoc('source', DSDataSource);

      DSChanges.propObj('cancel', {
        init: null
      });

      DSChanges.ds_dstr.push(function() {
        var cancel;
        this.__unwatch2();
        this.__unwatch3();
        if (typeof this.__unwatch4 === "function") {
          this.__unwatch4();
        }
        if (typeof this.__unwatchStatus1 === "function") {
          this.__unwatchStatus1();
        }
        if (typeof this.__unwatchStatus2 === "function") {
          this.__unwatchStatus2();
        }
        if (typeof this.__unwatchStatus3 === "function") {
          this.__unwatchStatus3();
        }
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      });

      function DSChanges(referry, key) {
        DSChangesBase.call(this, referry, key);
      }

      DSChanges.prototype.init = function(dsDataService) {
        var tagsSet;
        this.set('dataService', dsDataService);
        this.set('source', dsDataService.get('dataSource'));
        Task.prototype.__props.tags.read = function(v) {
          var i, len, ref, tagName, tags;
          if (v === null) {
            return null;
          }
          tags = null;
          ref = v.split(',');
          for (i = 0, len = ref.length; i < len; i++) {
            tagName = ref[i];
            if (tagsSet.items.hasOwnProperty(tagName = tagName.trim())) {
              (tags || (tags = {}))[tagName] = tagsSet.items[tagName];
            }
          }
          if (tags === null) {
            return null;
          }
          return new DSTags(this, tags);
        };
        tagsSet = dsDataService.findDataSet(this, {
          type: Tag,
          mode: 'original'
        });
        this.__unwatch2 = tagsSet.watchStatus(this, (function(_this) {
          return function(source, status) {
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
        })(this));
        tagsSet.release(this);
        this.__unwatch3 = $rootScope.$watch((function() {
          return config.get('autosave');
        }), (function(_this) {
          return function(autosave) {
            var saveChanges;
            if (autosave) {
              _this.__unwatch4 = _this.get('tasksSet').watch(_this, {
                add: saveChanges = function() {
                  return $rootScope.$evalAsync(function() {
                    _this.save();
                  });
                },
                change: saveChanges
              });
            } else {
              if (typeof _this.__unwatch4 === "function") {
                _this.__unwatch4();
              }
              _this.__unwatch4 = null;
            }
          };
        })(this));
      };

      DSChanges.prototype.clear = (function() {
        if (typeof this.__unwatchStatus2 === "function") {
          this.__unwatchStatus2();
        }
        delete this.__unwatchStatus2;
        this.reset();
      });

      DSChanges.prototype.load = function() {
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
              this.__unwatchStatus2 = peopleSet.watchStatus(this, (function(_this) {
                return function(source, status, prevStatus, unwatch) {
                  var originalTasks;
                  if (status !== 'ready') {
                    return;
                  }
                  unwatch();
                  originalTasks = _this.get('dataService').findDataSet(_this, {
                    type: Task,
                    mode: 'original',
                    filter: 'all'
                  });
                  _this.__unwatchStatus3 = originalTasks.watchStatus(_this, function(source, status, prevStatus, unwatch) {
                    var f, i, len, loadList, person, personKey, ref, step1, tasksSet, tasksSetPool;
                    if (status !== 'ready') {
                      return;
                    }
                    unwatch();
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
                    TWTaskLists.loadTaskListsAndProjects(_this.get('dataService').get('dataSource'), step1.load).then(function() {
                      DSDigest.block(function() {
                        var ref1, set, task, taskChange, taskEditable, taskKey;
                        set = {};
                        ref1 = step1.changes.tasks;
                        for (taskKey in ref1) {
                          taskChange = ref1[taskKey];
                          if (!taskKey.startsWith('new:')) {
                            if (!(originalTasks.items.hasOwnProperty(taskKey) && !((task = originalTasks.items[taskKey]).get('completed')))) {
                              continue;
                            }
                          } else {
                            console.info('2.');
                            task = Task.pool.find(_this, taskKey);
                            task.set('status', 'new');
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
                      });
                    });
                  });
                  originalTasks.release(_this);
                };
              })(this));
              peopleSet.release(this);
            } else {
              localStorageService.remove('changes');
              this._endLoad(true);
            }
          } else {
            this._endLoad(true);
          }
        }
      };

      DSChanges.prototype.persist = function() {
        if (!this.hasOwnProperty('__persist')) {
          this.__persist = $timeout(((function(_this) {
            return function() {
              delete _this.__persist;
              _this.saveToLocalStorage();
            };
          })(this)));
        }
      };

      DSChanges.prototype.saveToLocalStorage = function() {
        var changes, tasks;
        if (!this.anyChange()) {
          localStorageService.remove('changes');
        } else {
          changes = this.changesToMap();
          tasks = {};
          localStorageService.set('changes', {
            ver: CHANGES_PERSISTANCE_VER,
            changes: changes,
            source: {
              url: config.get('teamwork'),
              token: config.get('token')
            }
          });
        }
      };

      DSChanges.prototype.removeChanges = removeChanges = function(task) {
        var hist;
        (hist = task.$ds_chg.$ds_hist).startBlock();
        try {
          DSDigest.block((function() {
            var propChange, propName, ref;
            ref = task.__change;
            for (propName in ref) {
              propChange = ref[propName];
              if (propName !== '__error' && propName !== '__refreshView') {
                task.set(propName, task.$ds_doc.get(propName));
              }
            }
          }));
        } finally {
          hist.endBlock();
        }
      };

      trimTitle = function(title) {
        if (title.length > 60) {
          return (title.substr(0, 60)) + "...";
        } else {
          return title;
        }
      };

      reportSuccessSave = function(task) {
        if (config.get('autosave')) {
          toastr.success("Task '" + (trimTitle(task.get('title'))) + "' updated", 'Update task', {
            timeOut: 2000
          });
        }
      };

      reportFailedSave = function(reason, task) {
        if (config.get('autosave')) {
          toastr.error("Task '" + (trimTitle(task.get('title'))) + "' update failed. Reason: " + reason, 'Update task', {
            positionClass: 'toast-top-center',
            newestOnTop: true
          });
        }
        removeChanges(task);
      };

      DSChanges.prototype.save = (function(saveInProgress) {
        return function(tasks) {
          var actionError, allTasksSaved, change, comments, commentsOrSplit, dueDateStr, duedate, k, newResponsible, project, projectPeople, promise, propChange, propName, ref, saveTaskAction, split, startDate, tag, tags, task, taskKey, taskUpd, upd;
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
          newResponsible = null;
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
                case 'description':
                  if (!change.hasOwnProperty('split')) {
                    taskUpd['description'] = task.get('description');
                  }
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
                  taskUpd['responsible-party-id'] = (newResponsible = propChange.v) ? [propChange.v.get('id')] : [];
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
          actionError = (function(_this) {
            return function(error, isCancelled) {
              var base;
              if (!isCancelled) {
                if (config.get('autosave')) {
                  reportFailedSave(error, task);
                  removeChanges(task);
                } else {
                  task.__change.__error = error;
                  if (typeof (base = task.__change).__refreshView === "function") {
                    base.__refreshView();
                  }
                }
                _this.set('cancel', null);
              }
              task.release(_this);
              saveInProgress.reject();
              saveInProgress = null;
            };
          })(this);
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
                        task.$ds_chg.$ds_hist.setSameAsServer(task, 'comments');
                        reportSuccessSave(task);
                        task.release(_this);
                        _this.save(tasks);
                      } else {
                        actionError(resp, resp.status === 0);
                      }
                    }), actionError);
                  } else {
                    reportSuccessSave(task);
                    task.release(_this);
                    _this.save(tasks);
                  }
                } else {
                  if (config.get('autosave')) {
                    reportFailedSave(resp.data.MESSAGE, task);
                  } else {
                    task.__change.__error = resp.data.MESSAGE;
                    if (typeof (base = task.__change).__refreshView === "function") {
                      base.__refreshView();
                    }
                  }
                  task.release(_this);
                  _this.save(tasks);
                }
              }), actionError);
            };
          })(this));
          if (newResponsible === null) {
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
                  _this.addPersonToProject(project, newResponsible, saveTaskAction, actionError);
                } else {
                  actionError(resp, resp.status === 0);
                }
              };
            })(this)), actionError);
          } else if (!projectPeople.hasOwnProperty(newResponsible.get('id'))) {
            this.addPersonToProject(project, newResponsible, saveTaskAction);
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


},{"../../dscommon/DSChangesBase":83,"../../dscommon/DSDataEditable":85,"../../dscommon/DSDataSource":88,"../../dscommon/DSDigest":89,"../../dscommon/DSSet":96,"../../dscommon/DSTags":97,"../../dscommon/util":99,"../models/Person":43,"../models/Tag":47,"../models/Task":48,"../models/types/Comments":51,"../utils/RMSData":82}],33:[function(require,module,exports){
var DSChangesBase, DSDataEditable, DSDataFiltered, DSDataServiceBase, DSObject, Person, PersonTimeTracking, Tag, Task, TaskTimeTracking, assert, base64, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/dsDataService', [require('./PeopleWithJson'), require('./TasksWithTimeTracking'), require('./teamwork/TWPeople'), require('./teamwork/TWProjects'), require('./teamwork/TWTaskLists'), require('./teamwork/TWTasks'), require('./teamwork/TWTags'), require('./teamwork/TWTimeTracking'), require('./PersonDayStatData'), require('./dsChanges'), require('../../dscommon/DSDataSource'), require('../config')])).name;

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

Tag = require('../models/Tag');

Task = require('../models/Task');

TaskTimeTracking = require('../models/TaskTimeTracking');

PersonTimeTracking = require('../models/PersonTimeTracking');

ngModule.run([
  'dsDataService', '$rootScope', (function(dsDataService, $rootScope) {
    $rootScope.dataService = dsDataService;
  })
]);

ngModule.factory('dsDataService', [
  'TWPeople', 'TWTasks', 'TWProjects', 'TWTaskLists', 'TWTags', 'TWTimeTracking', 'PeopleWithJson', 'TasksWithTimeTracking', 'PersonDayStatData', 'DSDataSource', 'dsChanges', 'config', '$http', '$rootScope', '$q', (function(TWPeople, TWTasks, TWProjects, TWTaskLists, TWTags, TWTimeTracking, PeopleWithJson, TasksWithTimeTracking, PersonDayStatData, DSDataSource, dsChanges, config, $http, $rootScope, $q) {
    var DSDataService;
    DSDataService = (function(superClass) {
      var ctor;

      extend(DSDataService, superClass);

      function DSDataService() {
        return ctor.apply(this, arguments);
      }

      DSDataService.begin('DSDataService');

      DSDataService.propDoc('dataSource', DSDataSource);

      DSDataService.propPool('editedPeople', DSDataEditable(Person.Editable));

      DSDataService.propPool('editedTasks', DSDataEditable(Task.Editable));

      DSDataService.propPool('tasksPool', DSDataFiltered(Task));

      DSDataService.propPool('personTimeTrackingPool', DSDataFiltered(PersonTimeTracking));

      DSDataService.propBool('showTimeSpent', {
        init: false
      });

      DSDataService.propDoc('changes', DSChangesBase);

      DSDataService.propSet('emptyPersonTimeTracking', PersonTimeTracking);

      DSDataService.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      ctor = (function() {
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
              $rootScope.connected = false;
              return _this.get('dataSource').setConnection(null, null);
            } else {
              if (cancel) {
                cancel.resolve();
                cancel = null;
              }
              onError = (function(error, isCancelled) {
                $rootScope.connected = false;
                if (!isCancelled) {
                  console.error('error: ', error);
                  cancel = null;
                }
                _this.get('dataSource').setConnection(null, null);
              });
              $rootScope.connected = null;
              $http.get(teamwork + "authenticate.json", {
                timeout: (cancel = $q.defer()).promise,
                headers: {
                  Authorization: "Basic " + (base64.encode(token))
                }
              }).then((function(resp) {
                if (resp.status === 200) {
                  $rootScope.connected = true;
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
        var base, base1, base2, base3, base4, base5, base6, changesSet, data, originalSet, set, type;
        DSDataServiceBase.prototype.findDataSet.call(this, owner, params);
        switch (params.type.docType) {
          case 'Tag':
            if (typeof (base = (data = TWTags.pool.find(this, {}))).init === "function") {
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
              case 'Project':
                delete params.source;
                if (typeof (base4 = (data = TWProjects.pool.find(this, params))).init === "function") {
                  base4.init(this);
                }
                (set = data.get('projectsSet')).addRef(owner);
                data.release(this);
                return set;
              case 'TaskList':
                delete params.source;
                if (typeof (base5 = (data = TWTaskLists.pool.find(this, params))).init === "function") {
                  base5.init(this);
                }
                (set = data.get('taskListsSet')).addRef(owner);
                data.release(this);
                return set;
              case 'Task':
                if (params.filter === 'all' && !params.hasOwnProperty('startDate')) {
                  if (!config.get('hasTimeReports') || params.source) {
                    delete params.source;
                    if (typeof (base6 = (data = TWTasks.pool.find(this, params))).init === "function") {
                      base6.init(this);
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
            case 'Person':
            case 'Project':
              void 0;
              break;
            case 'TaskList':
              requestParams.project = srcParams.project;
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
                  if (!(typeof srcParams.filter === 'string' && 0 <= ['all', 'assigned', 'notassigned', 'overdue', 'noduedate', 'clipboard'].indexOf(srcParams.filter))) {
                    throw new Error("Unexpected filter: " + srcParams.filter);
                  }
                }
                requestParams.filter = srcParams.filter;
                if (srcParams.filter === 'all' || srcParams.filter === 'assigned' || srcParams.filter === 'notassigned') {
                  requestParams.startDate = srcParams.startDate;
                  requestParams.endDate = srcParams.endDate;
                }
                if (srcParams.manager) {
                  requestParams.manager = srcParams.manager;
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


},{"../../dscommon/DSChangesBase":83,"../../dscommon/DSDataEditable":85,"../../dscommon/DSDataFiltered":86,"../../dscommon/DSDataServiceBase":87,"../../dscommon/DSDataSource":88,"../../dscommon/DSObject":93,"../../dscommon/util":99,"../../utils/base64":101,"../config":28,"../models/Person":43,"../models/PersonTimeTracking":45,"../models/Tag":47,"../models/Task":48,"../models/TaskTimeTracking":50,"./PeopleWithJson":29,"./PersonDayStatData":30,"./TasksWithTimeTracking":31,"./dsChanges":32,"./teamwork/TWPeople":36,"./teamwork/TWProjects":37,"./teamwork/TWTags":38,"./teamwork/TWTaskLists":39,"./teamwork/TWTasks":40,"./teamwork/TWTimeTracking":41}],34:[function(require,module,exports){
var Task, assert, ngModule, serviceOwner;

assert = require('../../dscommon/util').assert;

serviceOwner = require('../../dscommon/util').serviceOwner;

Task = require('../models/Task.coffee');

module.exports = (ngModule = angular.module('data/persistClipboard', [require('./dsDataService.coffee')])).name;

ngModule.factory('clipboardTasks', [
  'localStorageService', function(localStorageService) {
    var i, k, len, res, v;
    res = {};
    if ((v = localStorageService.get('clipboardTasks')) !== null) {
      for (i = 0, len = v.length; i < len; i++) {
        k = v[i];
        res[k] = true;
      }
    }
    return res;
  }
]);

ngModule.run([
  'dsDataService', 'localStorageService', function(dsDataService, localStorageService) {
    var set, unwatch;
    set = serviceOwner.add(dsDataService.findDataSet(serviceOwner, {
      type: Task,
      mode: 'original',
      filter: 'clipboard'
    }));
    unwatch = serviceOwner.add(set.watchStatus(serviceOwner, function(source, status) {
      var save;
      if (status !== 'ready') {
        return;
      }
      unwatch();
      (save = function() {
        var k;
        localStorageService.set('clipboardTasks', (function() {
          var results;
          results = [];
          for (k in set.items) {
            results.push(k);
          }
          return results;
        })());
      })();
      serviceOwner.add(set.watch(serviceOwner, {
        add: save,
        remove: save
      }));
    }));
  }
]);


},{"../../dscommon/util":99,"../models/Task.coffee":48,"./dsDataService.coffee":33}],35:[function(require,module,exports){
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

      DSDataTeamworkPaged.propObj('cancel', {
        init: null
      });

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
              var res;
              if (resp.status === 200) {
                _this.set('cancel', null);
                if (_this.importResponse(resp.data, resp.status) === WORK_ENTRIES_WHOLE_PAGE) {
                  pageLoad(page + 1);
                  return;
                }
                res = DSDigest.block((function() {
                  return _this.finalizeLoad();
                }));
                if (typeof res === 'object' && res !== null && 'then' in res) {
                  res.then(function() {
                    _this._endLoad(true);
                  });
                } else {
                  _this._endLoad(true);
                }
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


},{"../../../dscommon/DSData":84,"../../../dscommon/DSDigest":89,"../../../dscommon/util":99}],36:[function(require,module,exports){
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


},{"../../../dscommon/DSDataSource":88,"../../../dscommon/util":99,"../../models/Person":43,"./DSDataTeamworkPaged":35}],37:[function(require,module,exports){
var Project, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWProjects', [require('../../../dscommon/DSDataSource'), require('./DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Project = require('../../models/Project');

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
        this.set('request', "projects.json?status=ACTIVE");
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      TWProjects.prototype.startLoad = function() {
        return this.projectsMap = {};
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
        }
        return cnt;
      };

      TWProjects.prototype.finalizeLoad = function() {
        this.get('projectsSet').merge(this, this.projectsMap);
        delete this.projectsMap;
      };

      TWProjects.end();

      return TWProjects;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../dscommon/DSDataSource":88,"../../../dscommon/util":99,"../../models/Project":46,"./DSDataTeamworkPaged":35}],38:[function(require,module,exports){
var Tag, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTags', [require('../../../dscommon/DSDataSource'), require('./DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Tag = require('../../models/Tag');

ngModule.factory('TWTags', [
  'DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$http', '$q', (function(DSDataTeamworkPaged, DSDataSource, $rootScope, $http, $q) {
    var TWTags;
    return TWTags = (function(superClass) {
      extend(TWTags, superClass);

      function TWTags() {
        return TWTags.__super__.constructor.apply(this, arguments);
      }

      TWTags.begin('TWTags');

      TWTags.addPool();

      TWTags.propObj('cancel', {
        init: null
      });

      TWTags.propSet('tags', Tag);

      TWTags.ds_dstr.push((function() {
        this.__unwatch();
      }));

      TWTags.prototype.init = function(dsDataService) {
        this.set('request', "tags.json");
        this.__unwatch = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      };

      TWTags.prototype.startLoad = function() {
        var onError;
        this.tagsMap = {};
        onError = (function(_this) {
          return function(error, isCancelled) {
            if (!isCancelled) {
              _this.set('cancel', null);
            }
            return [];
          };
        })(this);
        this.tagsJson = $http.get("data/tags.json?t=" + (new Date().getTime()), {
          timeout: this.set('cancel', $q.defer()),
          transformResponse: (function(data, headers, status) {
            if (status === 200) {
              return JSONLint.parse(data);
            }
          })
        }).then(((function(_this) {
          return function(resp) {
            var err, i, j, len, t, tags;
            if (resp.status !== 200) {
              return onError(resp, resp.status === 0);
            } else {
              _this.set('cancel', null);
              tags = resp.data;
              if (!Array.isArray(tags)) {
                console.error('invalid tags.json');
                return [];
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
                return [];
              } else {
                return tags;
              }
            }
          };
        })(this)), onError);
      };

      TWTags.prototype.importResponse = function(json) {
        var cnt, j, jsonTag, len, ref, tagColor, tagName, twTag;
        cnt = 0;
        ref = json['tags'];
        for (j = 0, len = ref.length; j < len; j++) {
          jsonTag = ref[j];
          ++cnt;
          twTag = Tag.pool.find(this, (tagName = jsonTag['name']), this.tagsMap);
          twTag.set('id', parseInt(jsonTag['id']));
          twTag.set('name', tagName);
          twTag.set('twColor', (tagColor = jsonTag['color']));
        }
        return 1;
      };

      TWTags.prototype.finalizeLoad = function() {
        return this.tagsJson.then((function(_this) {
          return function(tags) {
            var j, len, tag, tagDoc;
            _this.tagsJson = null;
            for (j = 0, len = tags.length; j < len; j++) {
              tag = tags[j];
              if (!(_this.tagsMap.hasOwnProperty(tag.name))) {
                continue;
              }
              tagDoc = _this.tagsMap[tag.name];
              tagDoc.set('name', tag.name);
              if (tag.hasOwnProperty('priority')) {
                tagDoc.set('priority', tag.priority);
              }
              if (tag.color) {
                tagDoc.set('color', tag.color);
              }
              if (tag.border) {
                tagDoc.set('border', tag.border);
              }
            }
            _this.get('tagsSet').merge(_this, _this.tagsMap);
            delete _this.tagsMap;
          };
        })(this));
      };

      TWTags.end();

      return TWTags;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../dscommon/DSDataSource":88,"../../../dscommon/util":99,"../../models/Tag":47,"./DSDataTeamworkPaged":35}],39:[function(require,module,exports){
var Project, TaskList, assert, error, ngModule, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTaskLists', [require('../../../dscommon/DSDataSource'), require('./DSDataTeamworkPaged')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

Project = require('../../models/Project');

TaskList = require('../../models/TaskList');

serviceOwner = require('../../../dscommon/util').serviceOwner;

ngModule.factory('TWTaskLists', [
  'DSDataTeamworkPaged', 'DSDataSource', '$rootScope', '$q', (function(DSDataTeamworkPaged, DSDataSource, $rootScope, $q) {
    var TWTaskLists;
    return TWTaskLists = (function(superClass) {
      extend(TWTaskLists, superClass);

      function TWTaskLists() {
        return TWTaskLists.__super__.constructor.apply(this, arguments);
      }

      TWTaskLists.begin('TWTaskLists');

      TWTaskLists.addPool();

      TWTaskLists.propSet('taskLists', TaskList);

      TWTaskLists.propDoc('project', Project);

      TWTaskLists.ds_dstr.push((function() {
        this.__unwatch2();
      }));

      TWTaskLists.prototype.init = (function(dsDataService) {
        var project;
        if (this.get('params').hasOwnProperty('project')) {
          this.set('project', project = this.get('params').project);
          this.set('request', "projects/" + (this.project.get('id')) + "/tasklists.json");
        }
        this.__unwatch2 = DSDataSource.setLoadAndRefresh.call(this, dsDataService);
        this.init = null;
      });

      TWTaskLists.prototype.startLoad = function() {
        return this.taskListsMap = {};
      };

      TWTaskLists.prototype.importResponse = function(json) {
        var cnt, i, jsonTaskList, len, project, ref, taskList;
        cnt = 0;
        project = this.get('project');
        ref = json['tasklists'];
        for (i = 0, len = ref.length; i < len; i++) {
          jsonTaskList = ref[i];
          ++cnt;
          taskList = TaskList.pool.find(this, "" + jsonTaskList['id'], this.taskListsMap);
          taskList.set('id', parseInt(jsonTaskList['id']));
          taskList.set('name', jsonTaskList['name']);
          taskList.set('project', project);
          taskList.set('position', jsonTaskList['position']);
        }
        return cnt;
      };

      TWTaskLists.prototype.finalizeLoad = function() {
        this.get('taskListsSet').merge(this, this.taskListsMap);
        delete this.taskListsMap;
      };

      TWTaskLists.loadTaskListsAndProjects = function(dataSource, load) {
        var deferred, nextTaskList;
        deferred = $q.defer();
        if (!load.hasOwnProperty('TaskList')) {
          deferred.resolve();
        } else {
          (nextTaskList = function() {
            var f, i, len, loadList, onError, project, projectKey, ref, ref1, taskListKey;
            ref = load.TaskList;
            for (taskListKey in ref) {
              loadList = ref[taskListKey];
              onError = function(error, isCancelled) {
                if (!isCancelled) {
                  console.error('error: ', error);
                  delete load.TaskList[taskListKey];
                  nextTaskList();
                } else {
                  deferred.resolve();
                }
              };
              dataSource.httpGet("/tasklists/" + taskListKey + ".json", $q.defer()).then((function(resp) {
                var f, i, jsonTaskList, len, project, taskList;
                if (resp.status === 200) {
                  jsonTaskList = resp.data['todo-list'];
                  project = Project.pool.find(serviceOwner, jsonTaskList['projectId']);
                  project.set('id', parseInt(jsonTaskList['projectId']));
                  project.set('name', jsonTaskList['projectName']);
                  taskList = TaskList.pool.find(serviceOwner, taskListKey);
                  taskList.set('id', parseInt(jsonTaskList['id']));
                  taskList.set('name', jsonTaskList['name']);
                  taskList.set('project', project);
                  taskList.set('position', jsonTaskList['position']);
                  for (i = 0, len = loadList.length; i < len; i++) {
                    f = loadList[i];
                    f(taskList);
                  }
                  project.release(serviceOwner);
                  taskList.release(serviceOwner);
                  delete load.TaskList[taskListKey];
                  nextTaskList();
                } else {
                  onError(resp, resp.status === 0);
                }
              }), onError);
              return;
            }
            ref1 = load.Project;
            for (projectKey in ref1) {
              loadList = ref1[projectKey];
              project = Project.pool.find(serviceOwner, projectKey);
              for (i = 0, len = loadList.length; i < len; i++) {
                f = loadList[i];
                f(project);
              }
              project.release(serviceOwner);
            }
            deferred.resolve();
          })();
        }
        return deferred.promise;
      };

      TWTaskLists.end();

      return TWTaskLists;

    })(DSDataTeamworkPaged);
  })
]);


},{"../../../dscommon/DSDataSource":88,"../../../dscommon/util":99,"../../models/Project":46,"../../models/TaskList":49,"./DSDataTeamworkPaged":35}],40:[function(require,module,exports){
var DSData, DSDigest, DSTags, Person, PersonTimeTracking, Project, RMSData, Tag, Task, TaskList, TaskSplit, TaskTimeTracking, assert, error, ngModule, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('data/teamwork/TWTasks', [require('../../../dscommon/DSDataSource'), require('./TWTags')])).name;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

time = require('../../ui/time');

Task = require('../../models/Task');

Tag = require('../../models/Tag');

Person = require('../../models/Person');

TaskList = require('../../models/TaskList');

Project = require('../../models/Project');

TaskTimeTracking = require('../../models/TaskTimeTracking');

PersonTimeTracking = require('../../models/PersonTimeTracking');

DSData = require('../../../dscommon/DSData');

DSDigest = require('../../../dscommon/DSDigest');

DSTags = require('../../../dscommon/DSTags');

TaskSplit = require('../../models/types/TaskSplit');

RMSData = require('../../utils/RMSData');

ngModule.factory('TWTasks', [
  'TWTags', 'DSDataSource', 'dsChanges', 'config', '$injector', '$http', '$q', function(TWTags, DSDataSource, dsChanges, config, $injector, $http, $q) {
    var TWTasks;
    return TWTasks = (function(superClass) {
      var clazz, ctor, importTask, isTaskInDatesRange, loadCompletedTaskForPersonTimeTracking, releaseMaps;

      extend(TWTasks, superClass);

      function TWTasks() {
        return ctor.apply(this, arguments);
      }

      Task.TWTask = TWTasks;

      Task.planTag = config.planTag;

      TWTasks.begin('TWTasks');

      TWTasks.addPool();

      TWTasks.propDoc('source', DSDataSource);

      TWTasks.propStr('request');

      TWTasks.propSet('tasks', Task);

      TWTasks.propPool('completedTasksPool', Task);

      TWTasks.propObj('cancel', {
        init: null
      });

      TWTasks.ds_dstr.push((function() {
        var cancel;
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
        this.__unwatch1();
        this.__unwatch2();
      }));

      clazz = TWTasks;

      TWTasks.prototype.clear = function() {
        var cancel;
        DSData.prototype.clear.call(this);
        if (cancel = this.get('cancel')) {
          cancel.resolve();
        }
      };

      TWTasks.propObj('visiblePersonTTracking', {
        init: {}
      });

      ctor = (function() {
        var completedTasksPool, self, taskSet, visiblePersonTTracking;
        DSData.apply(this, arguments);
        this.peopleMap = {};
        this.projectMap = {};
        this.taskListMap = {};
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

      TWTasks.filter = function(params) {
        var projects, steps;
        steps = [];
        switch (params.filter) {
          case 'all':
            if (moment.isMoment(params.startDate)) {
              steps.push((function(task) {
                return isTaskInDatesRange(params, task);
              }));
            } else {
              steps.push((function(task) {
                return true;
              }));
            }
            break;
          case 'assigned':
            steps.push((function(task) {
              return task.get('responsible') !== null && isTaskInDatesRange(params, task);
            }));
            break;
          case 'notassigned':
            steps.push((function(task) {
              return task.get('responsible') === null && isTaskInDatesRange(params, task);
            }));
            break;
          case 'overdue':
            steps.push((function(task) {
              var date;
              return (date = task.get('duedate')) !== null && date < time.today;
            }));
            break;
          case 'noduedate':
            steps.push((function(task) {
              return task.get('duedate') === null;
            }));
            break;
          case 'clipboard':
            steps.push((function(task) {
              return task.get('clipboard');
            }));
            break;
          default:
            throw new Error("Not supported filter: " + params.filter);
        }
        if (params.manager) {
          if ((projects = Person.pool.items[params.manager].projects)) {
            steps.push(function(task) {
              return projects.hasOwnProperty(task.get('project').get('id'));
            });
          }
        }
        if (steps.length === 1) {
          return steps[0];
        } else {
          return function(task) {
            var i, len, step;
            for (i = 0, len = steps.length; i < len; i++) {
              step = steps[i];
              if (!step(task)) {
                return false;
              }
            }
            return true;
          };
        }
      };

      TWTasks.prototype.init = (function(dsDataService) {
        var filter, params, tagsSet, tasksSet;
        this.set('source', dsDataService.get('dataSource'));
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
        tagsSet = dsDataService.findDataSet(this, {
          type: Tag,
          mode: 'original'
        });
        this.__unwatch2 = tagsSet.watchStatus(this, (function(_this) {
          return function(source, status) {
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
        })(this));
        tagsSet.release(this);
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
        ref1 = this.taskListMap;
        for (k in ref1) {
          v = ref1[k];
          v.release(this);
          delete this.taskListMap[k];
        }
        ref2 = this.projectMap;
        for (k in ref2) {
          v = ref2[k];
          v.release(this);
          delete this.projectMap[k];
        }
      });

      importTask = (function(task, jsonTask) {
        var data, date, desc, duedateStr, estimate, i, k, len, person, project, ref, resp, split, tag, tagDoc, tags, taskList, timeIsLogged, v;
        person = Person.pool.find(this, "" + jsonTask['creator-id'], this.peopleMap);
        project = Project.pool.find(this, "" + jsonTask['project-id'], this.projectMap);
        taskList = TaskList.pool.find(this, "" + jsonTask['todo-list-id'], this.taskListMap);
        taskList.set('project', project);
        task.set('creator', person);
        task.set('project', project);
        task.set('taskList', taskList);
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
          ref = jsonTask['tags'];
          for (i = 0, len = ref.length; i < len; i++) {
            tag = ref[i];
            tagDoc = (tags != null ? tags : tags = {})[tag.name] = Tag.pool.find(this, tag.name);
            tagDoc.set('id', tag.id);
            tagDoc.set('name', tag.name);
            (tags || (tags = {}))[tag.name] = tagDoc;
          }
          if (tags === null) {
            task.set('tags', null);
          } else {
            (task.set('tags', new DSTags(this, tags))).release(this);
            for (k in tags) {
              v = tags[k];
              v.release(this);
            }
          }
        }
        taskList.set('id', parseInt(jsonTask['todo-list-id']));
        taskList.set('name', jsonTask['todo-list-name']);
        project.set('id', parseInt(jsonTask['project-id']));
        project.set('name', jsonTask['project-name']);
      });

      TWTasks.prototype.load = (function() {
        var cancel, clearChangesForClosedTasks, clipboardTasks, importResponse, onError, pageLoad, taskMap;
        if (assert) {
          if (!this.get('source')) {
            throw new Error('load(): Source is not specified');
          }
        }
        if (!this._startLoad()) {
          return;
        }
        clipboardTasks = null;
        $injector.invoke([
          'clipboardTasks', function(_clipboardTasks) {
            clipboardTasks = _clipboardTasks;
          }
        ]);
        taskMap = {};
        importResponse = ((function(_this) {
          return function(json) {
            var i, jsonTask, len, ref, task, taskId, todoItems;
            Task.pool.enableWatch(false);
            try {
              ref = (todoItems = json['todo-items']);
              for (i = 0, len = ref.length; i < len; i++) {
                jsonTask = ref[i];
                task = Task.pool.find(_this, taskId = "" + jsonTask['id'], taskMap);
                task.set('id', parseInt(jsonTask['id']));
                importTask.call(_this, task, jsonTask);
                if (clipboardTasks.hasOwnProperty(taskId)) {
                  task.clipboard = true;
                }
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


},{"../../../dscommon/DSData":84,"../../../dscommon/DSDataSource":88,"../../../dscommon/DSDigest":89,"../../../dscommon/DSTags":97,"../../../dscommon/util":99,"../../models/Person":43,"../../models/PersonTimeTracking":45,"../../models/Project":46,"../../models/Tag":47,"../../models/Task":48,"../../models/TaskList":49,"../../models/TaskTimeTracking":50,"../../models/types/TaskSplit":52,"../../ui/time":67,"../../utils/RMSData":82,"./TWTags":38}],41:[function(require,module,exports){
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
      var ctor;

      extend(TWTimeTracking, superClass);

      function TWTimeTracking() {
        return ctor.apply(this, arguments);
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

      TWTimeTracking.propObj('visibleTTracking', {
        init: {}
      });

      ctor = (function() {
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


},{"../../../dscommon/DSData":84,"../../../dscommon/DSDataSource":88,"../../../dscommon/DSDigest":89,"../../../dscommon/util":99,"../../config":28,"../../db":42,"../../models/PersonTimeTracking":45,"../../models/Task":48,"../../models/TaskTimeTracking":50,"../../models/types/TaskSplit":52,"../../ui/time":67,"../../utils/RMSData":82}],42:[function(require,module,exports){
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
            var db, e;
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


},{"../dscommon/DSObject":93,"../dscommon/util":99}],43:[function(require,module,exports){
var DSDocument, DSTags, Person, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSDocument = require('../../dscommon/DSDocument');

DSTags = require('../../dscommon/DSTags');

module.exports = Person = (function(superClass) {
  var ctor;

  extend(Person, superClass);

  function Person() {
    return ctor.apply(this, arguments);
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

  Person.propNum('id', {
    init: 0
  });

  Person.propStr('name');

  Person.propStr('firstName');

  Person.propStr('avatar');

  Person.propStr('email');

  Person.propDSTags('roles');

  Person.propNum('companyId');

  Person.propBool('currentUser');

  Person.propBool('missing');

  Person.propDuration('contractTime');

  ctor = (function(referry, key) {
    DSDocument.call(this, referry, key);
    this.set('contractTime', moment.duration(8, 'hours'));
  });

  Person.end();

  return Person;

})(DSDocument);


},{"../../dscommon/DSDocument":90,"../../dscommon/DSTags":97,"../../dscommon/util":99}],44:[function(require,module,exports){
var DSObject, Person, PersonDayStat, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

Person = require('./Person');

module.exports = PersonDayStat = (function(superClass) {
  var DayStat, ctor;

  extend(PersonDayStat, superClass);

  function PersonDayStat() {
    return ctor.apply(this, arguments);
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

  ctor = (function(referry, key, person, days) {
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


},{"../../dscommon/DSObject":93,"../../dscommon/util":99,"./Person":43}],45:[function(require,module,exports){
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

  PersonTimeTracking.propNum('personId', {
    init: 0
  });

  PersonTimeTracking.propMoment('date');

  PersonTimeTracking.propNum('taskId', {
    init: 0
  });

  PersonTimeTracking.propDoc('task', Task);

  PersonTimeTracking.propNum('timeMin', {
    init: 0
  });

  PersonTimeTracking.end();

  return PersonTimeTracking;

})(DSObject);


},{"../../dscommon/DSObject":93,"../models/Task":48}],46:[function(require,module,exports){
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

  Project.propNum('id', {
    init: 0
  });

  Project.propStr('name');

  Project.propStr('status');

  Project.propObj('people');

  Project.end();

  return Project;

})(DSObject);


},{"../../dscommon/DSObject":93,"../../dscommon/util":99}],47:[function(require,module,exports){
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

  Tag.propNum('id', {
    init: 0
  });

  Tag.propStr('name');

  Tag.propStr('color');

  Tag.propStr('twColor');

  Tag.propStr('border');

  Tag.propNum('priority', {
    init: 1000
  });

  Tag.end();

  return Tag;

})(DSDocument);


},{"../../dscommon/DSDocument":90,"../../dscommon/util":99}],48:[function(require,module,exports){
var Comments, DSDocument, DSTags, Person, Project, Tag, Task, TaskList, TaskSplit, TaskTimeTracking, assert, error, time,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

time = require('../ui/time');

DSDocument = require('../../dscommon/DSDocument');

Project = require('./Project');

Person = require('./Person');

TaskList = require('./TaskList');

TaskTimeTracking = require('./TaskTimeTracking');

Tag = require('./Tag');

DSTags = require('../../dscommon/DSTags');

Comments = require('./types/Comments');

TaskSplit = require('./types/TaskSplit');

module.exports = Task = (function(superClass) {
  var defaultTag, originalEditableInit, processTagsEditable, processTagsOriginal, updateTaskPriority;

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

  updateTaskPriority = function(task, val) {
    var ref, tag, tagName, tagPriority, topPrior, topTag;
    task.set('plan', !!(val && val.get(Task.planTag)));
    if (val !== null) {
      topPrior = 1000000;
      topTag = null;
      ref = val.map;
      for (tagName in ref) {
        tag = ref[tagName];
        if ((tagPriority = tag.get('priority')) < topPrior) {
          topTag = tag;
          topPrior = tagPriority;
        }
      }
      task.__setCalcPriority(topTag.priority);
      task.__setCalcStyle(topTag);
    } else {
      task.__setCalcPriority(defaultTag.priority);
      task.__setCalcStyle(defaultTag);
    }
  };

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
          updateTaskPriority(task, val);
      }
    }
  };

  processTagsOriginal = {
    __onChange: function(task, propName, val, oldVal) {
      if (propName === 'tags') {
        updateTaskPriority(task, val);
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

  Task.propNum('id', {
    init: 0
  });

  Task.propDoc('project', Project);

  Task.propDoc('taskList', TaskList);

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

  Task.propTaskRelativeSplit('split');

  Task.propDSTags('tags');

  Task.propBool('completed');

  Task.propBool('plan', {
    write: null,
    read: null
  });

  Task.propStr('description', {
    str: function(v) {
      if (!v || v.length === 0) {
        return '';
      } else if (v.length <= 20) {
        return v;
      } else {
        return (v.substr(0, 20)) + "...";
      }
    }
  });

  Task.propEnum('status', ['new', '', 'deleted'], {
    init: '',
    common: true
  });

  Task.propComments('comments');

  Task.propDoc('timeTracking', TaskTimeTracking, {
    write: null
  });

  Task.propStr('firstTimeEntryId', {
    write: null
  });

  Task.propBool('isReady', {
    write: null
  });

  Task.propNum('priority', {
    init: defaultTag.priority,
    calc: true
  });

  Task.propObj('style', {
    init: (function() {
      return defaultTag;
    }),
    calc: true
  });

  Task.propBool('clipboard', {
    init: false,
    common: true
  });

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
    updateTaskPriority(this, this.get('tags'));
  };

  return Task;

})(DSDocument);


},{"../../dscommon/DSDocument":90,"../../dscommon/DSTags":97,"../../dscommon/util":99,"../ui/time":67,"./Person":43,"./Project":46,"./Tag":47,"./TaskList":49,"./TaskTimeTracking":50,"./types/Comments":51,"./types/TaskSplit":52}],49:[function(require,module,exports){
var DSObject, Project, TaskList, assert, error,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

DSObject = require('../../dscommon/DSObject');

Project = require('./Project');

module.exports = TaskList = (function(superClass) {
  extend(TaskList, superClass);

  function TaskList() {
    return TaskList.__super__.constructor.apply(this, arguments);
  }

  TaskList.begin('TaskList');

  TaskList.addPool();

  TaskList.str = (function(v) {
    if (v === null) {
      return '';
    } else {
      return v.get('name');
    }
  });

  TaskList.propNum('id', {
    init: 0
  });

  TaskList.propStr('name');

  TaskList.propDoc('project', Project);

  TaskList.propNum('position');

  TaskList.end();

  return TaskList;

})(DSObject);


},{"../../dscommon/DSObject":93,"../../dscommon/util":99,"./Project":46}],50:[function(require,module,exports){
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

  TaskTimeTracking.propNum('taskId', {
    init: 0
  });

  TaskTimeTracking.propBool('isReady');

  TaskTimeTracking.propNum('totalMin', {
    init: 0
  });

  TaskTimeTracking.propNum('priorTodayMin', {
    init: 0
  });

  TaskTimeTracking.propObj('timeEntries', {
    init: {}
  });

  TaskTimeTracking.end();

  return TaskTimeTracking;

})(DSObject);


},{"../../dscommon/DSObject":93}],51:[function(require,module,exports){
var Comments, DSDocument, assert, error;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSDocument = require('../../../dscommon/DSDocument');

module.exports = Comments = (function() {
  var ctor, zero;

  function Comments() {
    return ctor.apply(this, arguments);
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
        str: function(v) {
          var s;
          if (v.list.length === 0) {
            return '';
          } else if ((s = v.list[0]).length <= 20) {
            return s;
          } else {
            return (s.substr(0, 20)) + "...";
          }
        },
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

  ctor = (function(persisted) {
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


},{"../../../dscommon/DSDocument":90,"../../../dscommon/util":99}],52:[function(require,module,exports){
var DSDocument, TaskSplit, assert, error;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

DSDocument = require('../../../dscommon/DSDocument');

module.exports = TaskSplit = (function() {
  var ctor, zero;

  function TaskSplit() {
    return ctor.apply(this, arguments);
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

  ctor = (function(persisted) {
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


},{"../../../dscommon/DSDocument":90,"../../../dscommon/util":99}],53:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('app', ['ui.router', 'ui.select', require('./ui/ui'), require('./data/dsDataService'), require('./data/persistClipboard'), require('./svc/emails/emails'), require('./db')])).name;

ngModule.run([
  'config', '$rootScope', 'db', (function(config, $rootScope, db) {
    $rootScope.Math = Math;
    $rootScope.taskModal = {};
    $rootScope.startDateVal = null;
    $rootScope.view3ActiveTab = null;
    $rootScope.connnected = null;
  })
]);

ngModule.config([
  '$urlRouterProvider', '$stateProvider', '$locationProvider', (function($urlRouterProvider, $stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
  })
]);


},{"./data/dsDataService":33,"./data/persistClipboard":34,"./db":42,"./svc/emails/emails":54,"./ui/ui":68}],54:[function(require,module,exports){
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
            if (task.get('taskList').get('id') === 462667) {
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
            hours = task.get('title').toLowerCase().indexOf('бронь') !== -1 || task.get('taskList').get('name').toLowerCase().indexOf('бронь') !== -1 ? projectState.optHours : projectState.planHours;
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


},{"../../../utils/base64":101,"../../data/dsDataService":33,"../../models/Person":43,"../../models/Task":48}],55:[function(require,module,exports){
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
        $scope.autosave = !!config.autosave;
        $scope.save = (function() {
          var token, url;
          url = $scope.url.trim();
          token = $scope.token.trim();
          config.teamwork = url;
          config.token = token;
          config.refreshPeriod = $scope.refreshPeriod;
          config.autosave = $scope.autosave ? 1 : 0;
          close();
        });
        $scope.close = close = (function() {
          $rootScope.isShowAccount = false;
        });
      })
    };
  })
]);


},{"../../config":28}],56:[function(require,module,exports){
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
            if (!(doc === null || doc instanceof DSObject)) {
              error.invalidArg('doc');
            }
            if (!(prop === null || (props = doc.__proto__.__props).hasOwnProperty(prop))) {
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


},{"../../dscommon/DSObject":93,"../../dscommon/util":99}],57:[function(require,module,exports){
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

headerHeight = 44;

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
  var ctor;

  function DOMWrapper() {
    return ctor.apply(this, arguments);
  }

  ctor = (function(DOMElement) {
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


},{"../../dscommon/util":99}],58:[function(require,module,exports){
var assert, error, ngModule;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

module.exports = (ngModule = angular.module('ui/noDrag', [])).name;

ngModule.directive("noDrag", function() {
  return {
    link: function($scope, element) {
      var el;
      el = element[0];
      el.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
      });
    }
  };
});


},{"../../dscommon/util":99}],59:[function(require,module,exports){
var assert, error, ngModule, roundPeriod, roundsToBeStable;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

module.exports = (ngModule = angular.module('ui/sameHeight', [])).name;

roundPeriod = 10;

roundsToBeStable = 10;

ngModule.directive("sameHeight", function() {
  return {
    scope: true,
    controller: [
      '$scope', function($scope) {
        this.height = 0;
        this.update = [];
        this.scope = $scope;
      }
    ],
    link: function($scope, element, attrs, ctrl) {
      if (attrs.sameHeight) {
        $scope.$watch(attrs.sameHeight, function() {
          return $scope.resizeInProgress();
        });
      }
    }
  };
});

ngModule.directive("sameHeightSrc", function() {
  return {
    require: '^sameHeight',
    scope: false,
    link: function($scope, element, attr, ctrl) {
      var progress, timer;
      timer = null;
      progress = false;
      ctrl.scope.resizeInProgress = function() {
        var changed, initHeight, prevHeight, roundsCount;
        if (progress) {
          return;
        }
        progress = true;
        initHeight = element.height();
        prevHeight = null;
        roundsCount = roundsToBeStable;
        changed = false;
        timer = setInterval((function() {
          var f, i, j, len, len1, ref, ref1, v;
          if (!changed) {
            if (initHeight !== (prevHeight = element.height())) {
              changed = true;
              ref = ctrl.update;
              for (i = 0, len = ref.length; i < len; i++) {
                f = ref[i];
                f(prevHeight);
              }
            }
          } else {
            v = prevHeight;
            if (v === (prevHeight = element.height())) {
              if (--roundsCount === 0) {
                clearInterval(timer);
                progress = false;
              }
            } else {
              ref1 = ctrl.update;
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                f = ref1[j];
                f(prevHeight);
              }
              roundsCount = roundsToBeStable;
            }
          }
        }), roundPeriod);
      };
      ctrl.scope.$on('$destroy', function() {
        clearInterval(timer);
      });
      $scope.$evalAsync(function() {
        var f, i, len, ref, results, v;
        v = element.height();
        ref = ctrl.update;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          f = ref[i];
          results.push(f(v));
        }
        return results;
      });
    }
  };
});

ngModule.directive("sameHeightDest", function() {
  return {
    require: '^sameHeight',
    scope: false,
    link: function($scope, element, attr, ctrl) {
      ctrl.update.push(function(h) {
        element.height(h);
      });
    }
  };
});


},{"../../dscommon/util":99}],60:[function(require,module,exports){
var assert, error, ngModule, roundPeriod, roundsToBeStable;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

module.exports = (ngModule = angular.module('ui/sameWidth', [])).name;

roundPeriod = 30;

roundsToBeStable = 10;

ngModule.directive("sameWidth", function() {
  return {
    scope: true,
    controller: [
      '$scope', function($scope) {
        this.width = 0;
        this.update = [];
        this.scope = $scope;
      }
    ],
    link: function($scope, element, attrs, ctrl) {
      if (attrs.sameWidth) {
        $scope.$watch(attrs.sameWidth, function() {
          return $scope.resizeInProgress();
        });
      }
    }
  };
});

ngModule.directive("sameWidthSrc", function() {
  return {
    require: '^sameWidth',
    scope: false,
    link: function($scope, element, attr, ctrl) {
      var el, progress, timer;
      timer = null;
      progress = false;
      el = element[0];
      ctrl.scope.resizeInProgress = function() {
        var changed, initWidth, prevWidth, roundsCount;
        if (progress) {
          return;
        }
        progress = true;
        initWidth = el.clientWidth;
        prevWidth = null;
        roundsCount = roundsToBeStable;
        changed = false;
        timer = setInterval((function() {
          var f, i, j, len, len1, ref, ref1, v;
          if (!changed) {
            if (initWidth !== (prevWidth = el.clientWidth)) {
              changed = true;
              ref = ctrl.update;
              for (i = 0, len = ref.length; i < len; i++) {
                f = ref[i];
                f(prevWidth);
              }
            }
          } else {
            v = prevWidth;
            if (v === (prevWidth = el.clientWidth)) {
              if (--roundsCount === 0) {
                clearInterval(timer);
                progress = false;
              }
            } else {
              ref1 = ctrl.update;
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                f = ref1[j];
                f(prevWidth);
              }
              roundsCount = roundsToBeStable;
            }
          }
        }), roundPeriod);
      };
      ctrl.scope.$on('$destroy', function() {
        clearInterval(timer);
      });
      $scope.$evalAsync(function() {
        var f, i, len, ref, results, v;
        v = el.clientWidth;
        ref = ctrl.update;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          f = ref[i];
          results.push(f(v));
        }
        return results;
      });
    }
  };
});

ngModule.directive("sameWidthDest", function() {
  return {
    require: '^sameWidth',
    scope: false,
    link: function($scope, element, attr, ctrl) {
      ctrl.update.push(function(h) {
        element.width(h);
      });
    }
  };
});


},{"../../dscommon/util":99}],61:[function(require,module,exports){
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
      var ctor;

      extend(TaskSplitWeekView, superClass);

      function TaskSplitWeekView() {
        return ctor.apply(this, arguments);
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

      ctor = (function($scope, key, getDuedate, split, monday) {
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


},{"../../../dscommon/DSObject":93,"../../../dscommon/DSView":98,"../../../dscommon/util":99,"../../models/Person":43,"../../models/PersonDayStat":44,"../../models/Task":48,"../../models/types/TaskSplit":52,"../time":67}],62:[function(require,module,exports){
var Comments, DSDigest, DSDocument, DSObject, Person, Task, assert, error, ngModule, serviceOwner, shortid,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../../../dscommon/util').assert;

error = require('../../../dscommon/util').error;

shortid = require('shortid');

serviceOwner = require('../../../dscommon/util').serviceOwner;

DSObject = require('../../../dscommon/DSObject');

DSDocument = require('../../../dscommon/DSDocument');

DSDigest = require('../../../dscommon/DSDigest');

Comments = require('../../models/types/Comments');

Person = require('../../models/Person');

Task = require('../../models/Task');

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

      AddCommentAndSave.propStr('reason', {
        init: ''
      });

      AddCommentAndSave.propBool('plansChange');

      AddCommentAndSave.prototype.show = (function(document, showDialog, changes) {
        var anyChange, changesSet, doc, i, j, len, len1, newChanges, newTask, newTaskId, plansChange, promise, propDesc, propName, ref, ref1, ref2, ref3, value;
        if (assert) {
          if (!(document !== null && (document.$new || ((Array.isArray(document) && document.length > 0 && document[0] instanceof DSDocument) || document instanceof DSDocument)))) {
            error.invalidArg('document');
          }
          if (typeof showDialog !== 'boolean') {
            error.invalidArg('showDialog');
          }
          if (!(changes !== null && typeof changes === 'object')) {
            error.invalidArg('changes');
          }
        }
        this.__deferred = $q.defer();
        this.get('documentsList').merge(this, []);
        if (document.$new) {
          newTask = Task.pool.find(this, newTaskId = "new:" + (shortid()));
          newTask.set('status', 'new');
          this.set('document', (document = (changesSet = dsChanges.get('tasksSet')).$ds_pool.find(this, newTaskId)));
          document.release(this);
        } else {
          if (Array.isArray(document)) {
            for (i = 0, len = document.length; i < len; i++) {
              doc = document[i];
              doc.addRef(this);
            }
            this.get('documentsList').merge(this, document);
            document = this.set('document', document[0]);
          } else {
            this.set('document', document);
          }
        }
        if (changes.hasOwnProperty('plan') && !changes.plan) {
          if (Array.isArray(document)) {
            for (j = 0, len1 = document.length; j < len1; j++) {
              doc = document[j];
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
        if (changes.hasOwnProperty('duedate') && !changes.hasOwnProperty('clipboard')) {
          if (((ref = (Array.isArray(document) ? document[0] : document).get('duedate')) != null ? ref.valueOf() : void 0) !== ((ref1 = changes.duedate) != null ? ref1.valueOf() : void 0)) {
            changes.clipboard = false;
          }
        }
        newChanges = [];
        anyChange = false;
        ref2 = document.__props;
        for (propName in ref2) {
          propDesc = ref2[propName];
          if (changes.hasOwnProperty(propName)) {
            if (!((ref3 = document.$u) != null ? ref3.hasOwnProperty(propName) : void 0)) {
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


},{"../../../dscommon/DSDigest":89,"../../../dscommon/DSDocument":90,"../../../dscommon/DSObject":93,"../../../dscommon/util":99,"../../config":28,"../../data/dsChanges":32,"../../data/dsDataService":33,"../../models/Person":43,"../../models/Task":48,"../../models/types/Comments":51,"shortid":9}],63:[function(require,module,exports){
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
        var dragEnd, dragStart, el, listenerFunc;
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
        dragStart = listenerFunc = function(ev) {
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
        };
        dragEnd = function(ev) {
          $rootScope.modal = {
            type: null
          };
          element.removeClass('drag-start');
          $rootScope.$digest();
          return true;
        };
        el = element[0];
        $scope.$watch(attrs.rmsTask + ".$u", function(val) {
          if (val) {
            el.draggable = true;
            el.addEventListener('dragstart', dragStart);
            el.addEventListener('dragend', dragEnd);
          } else {
            el.draggable = false;
            el.removeEventListener('dragstart', dragStart);
            el.removeEventListener('dragend', dragEnd);
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


},{}],64:[function(require,module,exports){
var ngModule;

module.exports = (ngModule = angular.module('ui/tasks/rmsTaskAdd', [])).name;

ngModule.directive('rmsTaskAdd', [
  '$rootScope', function($rootScope) {
    return {
      link: function($scope, element) {
        var dragEnd, dragStart, el, i, len, ref;
        $scope.addTask = function() {
          return $rootScope.modal = {
            type: 'task-edit'
          };
        };
        dragStart = function(ev) {
          element.addClass('drag-start');
          ev.dataTransfer.effectAllowed = 'move';
          ev.dataTransfer.setData('new', true);
          ev.dataTransfer.setDragImage(element[0], 20, 20);
          return true;
        };
        dragEnd = function(ev) {
          element.removeClass('drag-start');
          return true;
        };
        ref = $('*', element).addBack();
        for (i = 0, len = ref.length; i < len; i++) {
          el = ref[i];
          el.draggable = true;
          el.addEventListener('dragstart', dragStart);
          el.addEventListener('dragend', dragEnd);
        }
      }
    };
  }
]);


},{}],65:[function(require,module,exports){
var DSDataEditable, DSDigest, DSTags, Person, PersonDayStat, Project, Tag, Task, Task$u, TaskList, TaskSplit, assert, ngModule, splitViewWeeksCount, time;

module.exports = (ngModule = angular.module('ui/tasks/rmsTaskEdit', [require('../../data/dsChanges'), require('../../data/dsDataService'), require('./TaskSplitWeekView'), require('./addCommentAndSave')])).name;

assert = require('../../../dscommon/util').assert;

time = require('../../ui/time');

DSDigest = require('../../../dscommon/DSDigest');

DSTags = require('../../../dscommon/DSTags');

DSDataEditable = require('../../../dscommon/DSDataEditable');

Tag = require('../../models/Tag');

Task = require('../../models/Task');

TaskList = require('../../models/TaskList');

Person = require('../../models/Person');

Project = require('../../models/Project');

TaskSplit = require('../../models/types/TaskSplit');

PersonDayStat = require('../../models/PersonDayStat');

Task$u = DSDataEditable(Task.Editable).$u;

splitViewWeeksCount = 3;

ngModule.directive('rmsTaskEdit', [
  'TaskSplitWeekView', 'dsDataService', 'dsChanges', 'addCommentAndSave', '$rootScope', '$window', '$timeout', (function(TaskSplitWeekView, dsDataService, dsChanges, addCommentAndSave, $rootScope, $window, $timeout) {
    return {
      restrict: 'A',
      scope: true,
      link: (function($scope, element, attrs) {
        var allProjects, close, duedate, edit, first, last, makeSplitView, modal, newTask, newTaskSplitWeekView, newTaskValues, releaseSplitView, split, task, thisWeek, unwatchA, unwatchSplitLastDate, updateTagsToSelect, weeks;
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
        $scope.$on('$destroy', function() {
          if (typeof $scope._unwatch === "function") {
            $scope._unwatch();
          }
          if (typeof $scope._unwatch2 === "function") {
            $scope._unwatch2();
          }
          if (typeof $scope._unwatch3 === "function") {
            $scope._unwatch3();
          }
          if (typeof $scope._unwatch4 === "function") {
            $scope._unwatch4();
          }
          if (edit.tags && edit.tags !== task.get('tags')) {
            edit.tags.release($scope);
          }
        });
        if ((edit.newTask = newTask = task === void 0)) {
          newTaskValues = $rootScope.newTaskValues;
          edit.project = (newTaskValues != null ? newTaskValues.project : void 0) || null;
          edit.taskList = (newTaskValues != null ? newTaskValues.taskList : void 0) || null;
          edit.responsible = (newTaskValues != null ? newTaskValues.taskList : void 0) || null;
          edit.title = null;
          edit.description = null;
          edit.duedate = duedate = (newTaskValues != null ? newTaskValues.duedate : void 0) ? moment(newTaskValues.duedate) : null;
          edit.estimate = (newTaskValues != null ? newTaskValues.estimate : void 0) ? moment.duration(newTaskValues.estimate) : null;
          edit.tags = (newTaskValues != null ? newTaskValues.tags : void 0) ? new DSTags($scope, newTaskValues.tags) : null;
          unwatchA = null;
          allProjects = dsDataService.findDataSet($scope, {
            type: Project,
            mode: 'original'
          });
          allProjects.watchStatus($scope, function(source, status, prevStatus, unwatch) {
            var i, len, project, projectKey, ref;
            $scope._unwatch3 = function() {
              var i, len, project, ref;
              if (typeof unwatchA === "function") {
                unwatchA();
              }
              unwatch();
              allProjects.release($scope);
              ref = $scope.projectsList;
              for (i = 0, len = ref.length; i < len; i++) {
                project = ref[i];
                project.release($scope);
              }
              $scope.projectsList = null;
            };
            if (status !== 'ready') {
              return;
            }
            unwatch();
            $scope._unwatch3 = null;
            ref = ($scope.projectsList = ((function() {
              var ref, results;
              ref = allProjects.items;
              results = [];
              for (projectKey in ref) {
                project = ref[projectKey];
                results.push(project);
              }
              return results;
            })()).sort(function(l, r) {
              return l.get('name').localeCompare(r.get('name'));
            }));
            for (i = 0, len = ref.length; i < len; i++) {
              project = ref[i];
              project.addRef($scope);
            }
            if (!unwatchA) {
              unwatchA = $scope.$watch((function() {
                var ref1;
                return (ref1 = edit.project) != null ? ref1.$ds_key : void 0;
              }), function(projectKey) {
                var allTodoLists, j, k, len1, len2, ref1, ref2, taskList;
                $scope.taskListsList = null;
                edit.taskList = null;
                if (projectKey) {
                  if ($scope.taskListsList) {
                    ref1 = $scope.taskListsList;
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                      taskList = ref1[j];
                      taskList.release($scope);
                    }
                    $scope.taskListsList = null;
                  }
                  allTodoLists = dsDataService.findDataSet($scope, {
                    type: TaskList,
                    mode: 'original',
                    project: edit.project
                  });
                  allTodoLists.watchStatus($scope, function(source, status, prevStatus, unwatch) {
                    var k, len2, ref2, todoList, todoListKey;
                    $scope._unwatch4 = function() {
                      var k, len2, ref2;
                      unwatch();
                      allTodoLists.release($scope);
                      if ($scope.taskLists) {
                        ref2 = $scope.taskLists;
                        for (k = 0, len2 = ref2.length; k < len2; k++) {
                          taskList = ref2[k];
                          taskList.release($scope);
                        }
                        $scope.taskLists = null;
                      }
                    };
                    if (status !== 'ready') {
                      return;
                    }
                    unwatch();
                    $scope._unwatch4 = null;
                    ref2 = ($scope.taskListsList = ((function() {
                      var ref2, results;
                      ref2 = allTodoLists.items;
                      results = [];
                      for (todoListKey in ref2) {
                        todoList = ref2[todoListKey];
                        results.push(todoList);
                      }
                      return results;
                    })()).sort(function(l, r) {
                      return l.get('position') - r.get('position');
                    }));
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                      project = ref2[k];
                      project.addRef($scope);
                    }
                    return allTodoLists.release($scope);
                  });
                } else {
                  if ($scope.taskLists) {
                    ref2 = $scope.taskLists;
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                      taskList = ref2[k];
                      taskList.release($scope);
                    }
                    $scope.taskLists = null;
                  }
                }
              });
            }
            allProjects.release($scope);
          });
          $scope.task = task = {
            $new: true,
            $u: Task$u,
            get: function(propName) {
              switch (propName) {
                case 'split':
                case 'duedate':
                case 'responsible':
                case 'tags':
                  return null;
                default:
                  throw new Error("Unexpected prop: " + propName);
              }
            }
          };
        } else {
          edit.project = task.get('project');
          edit.taskList = task.get('taskList');
          edit.title = task.get('title');
          edit.duedate = duedate = task.get('duedate');
          edit.estimate = task.get('estimate');
          edit.responsible = task.get('responsible');
          edit.description = task.get('description');
          edit.tags = task.get('tags');
        }
        $scope.$watch((function() {
          return edit.tags;
        }), function(val) {
          var tag, tagName;
          $scope.orderedTags = val ? ((function() {
            var ref, results;
            ref = val.map;
            results = [];
            for (tagName in ref) {
              tag = ref[tagName];
              results.push(tag);
            }
            return results;
          })()).sort(function(l, r) {
            var d;
            if ((d = l.get('priority') - r.get('priority')) !== 0) {
              return d;
            } else {
              return l.get('name').localeCompare(r.get('name'));
            }
          }) : [];
        });
        (updateTagsToSelect = function() {
          var allTags;
          allTags = dsDataService.findDataSet($scope, {
            type: Tag,
            mode: 'original'
          });
          allTags.watchStatus($scope, function(source, status, prevStatus, unwatch) {
            var tag, tagName;
            $scope._unwatch2 = unwatch;
            if (status !== 'ready') {
              return;
            }
            unwatch();
            $scope._unwatch2 = null;
            $scope.tagsToSelect = ((function() {
              var ref, ref1, results;
              ref = allTags.items;
              results = [];
              for (tagName in ref) {
                tag = ref[tagName];
                if (!((ref1 = edit.tags) != null ? ref1.get(tagName) : void 0)) {
                  results.push(tag);
                }
              }
              return results;
            })()).sort(function(l, r) {
              var d;
              if ((d = l.get('priority') - r.get('priority')) !== 0) {
                return d;
              } else {
                return l.get('name').localeCompare(r.get('name'));
              }
            });
            allTags.release($scope);
          });
        })();
        edit.tagsSelected = null;
        $scope.$watch((function() {
          return edit.tagsSelected;
        }), function() {
          var oldTags, tagsValue;
          if (!edit.tagsSelected) {
            return;
          }
          tagsValue = (oldTags = edit.tags) ? edit.tags.clone($scope) : new DSTags($scope);
          tagsValue.set(edit.tagsSelected.name, edit.tagsSelected);
          edit.tags = tagsValue;
          if (oldTags && task.get('tags') !== oldTags) {
            oldTags.release($scope);
          }
          edit.tagsSelected = null;
          updateTagsToSelect();
        });
        $scope.tagsRemove = function(tag) {
          var oldTags, tagsValue;
          if (Object.keys((oldTags = edit.tags).map).length > 1) {
            tagsValue = oldTags.clone($scope);
            tagsValue.set(tag.name, false);
            edit.tags = tagsValue;
          } else {
            edit.tags = null;
          }
          if (oldTags && task.get('tags') !== oldTags) {
            oldTags.release($scope);
          }
          updateTagsToSelect();
        };
        edit.splitDiff = null;
        edit.firstWeek = thisWeek = moment().startOf('week');
        edit.splitDuedate = duedate !== null ? duedate : moment().startOf('day');
        if (edit.isSplit = (edit.split = (split = task.get('split')) !== null ? split.clone() : null) !== null && edit.duedate !== null && edit.estimate !== null) {
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
            var estimate, project, res, responsible, tags, taskList, val;
            res = [(project = edit.project) === null ? null : project.$ds_key, (taskList = edit.taskList) === null ? null : taskList.$ds_key, edit.title, edit.description, (duedate = edit.duedate) === null ? null : duedate.valueOf(), (estimate = edit.estimate) === null ? null : estimate.valueOf(), (responsible = edit.responsible) === null ? null : responsible.$ds_key, (tags = edit.tags) === null ? null : tags.valueOf()];
            if ((split = edit.split) !== null && (val = split.valueOf()).length > 0) {
              res = res.concat(val);
            }
            return res;
          }), (function(val, oldVal) {
            $scope.changes = val !== oldVal;
            if (val[4] === null || val[5] === null) {
              edit.isSplit = false;
            }
          }), true);
          $scope.$watch((function() {
            return edit.isSplit;
          }), (function(isSplit, oldIsSplit) {
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
            if (isSplit !== oldIsSplit && ((ref = edit.split) != null ? ref.valueOf().length : void 0) > 0) {
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
        }
        $scope.splitPrevWeek = (function() {
          var monday;
          edit.firstWeek = monday = moment(edit.firstWeek).subtract(1, 'week');
          edit.splitView.unshift(newTaskSplitWeekView(monday));
          edit.splitView.pop().release($scope);
        });
        $scope.splitNextWeek = (function() {
          var monday;
          monday = moment(edit.firstWeek.add(1, 'week')).add(splitViewWeeksCount - 1, 'week');
          edit.splitView.push(newTaskSplitWeekView(monday));
          edit.splitView.shift().release($scope);
        });
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
          update = {};
          if (task.$new) {
            update.project = edit.project;
            update.taskList = edit.taskList;
          }
          update.title = edit.title;
          update.duedate = edit.duedate;
          update.estimate = edit.estimate;
          update.responsible = edit.responsible;
          update.split = edit.isSplit && edit.split.valueOf().length > 0 ? edit.split : null;
          update.tags = edit.tags;
          update.description = edit.description;
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
          initSplit = initDuedate !== null && edit.responsible === $scope.task.get('responsible') ? $scope.task.get('split') : null;
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


},{"../../../dscommon/DSDataEditable":85,"../../../dscommon/DSDigest":89,"../../../dscommon/DSTags":97,"../../../dscommon/util":99,"../../data/dsChanges":32,"../../data/dsDataService":33,"../../models/Person":43,"../../models/PersonDayStat":44,"../../models/Project":46,"../../models/Tag":47,"../../models/Task":48,"../../models/TaskList":49,"../../models/types/TaskSplit":52,"../../ui/time":67,"./TaskSplitWeekView":61,"./addCommentAndSave":62}],66:[function(require,module,exports){
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
        var modal, tag, tagName, tags, task;
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
        $scope.task = task = modal.task;
        $scope.orderedTags = (tags = task.get('tags')) ? ((function() {
          var ref, results;
          ref = tags.map;
          results = [];
          for (tagName in ref) {
            tag = ref[tagName];
            results.push(tag);
          }
          return results;
        })()).sort(function(l, r) {
          var d;
          if ((d = l.get('priority') - r.get('priority')) !== 0) {
            return d;
          } else {
            return l.get('name').localeCompare(r.get('name'));
          }
        }) : [];
      })
    };
  })
]);


},{"../../../dscommon/DSObject":93,"../../../dscommon/util":99}],67:[function(require,module,exports){
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


},{}],68:[function(require,module,exports){
var DSObjectBase, PersonDayStat, assert, error, ngModule, totalRelease, uiCtrl;

assert = require('../../dscommon/util').assert;

error = require('../../dscommon/util').error;

totalRelease = require('../../dscommon/util').totalRelease;

DSObjectBase = require('../../dscommon/DSObjectBase');

PersonDayStat = require('../models/PersonDayStat');

module.exports = (ngModule = angular.module('ui/ui', ['ui.router', 'ngSanitize', require('./views/view1/View1'), require('./views/view2/View2'), require('./views/view3/View3'), require('./views/changes/ViewChanges'), require('./account/rmsAccount'), require('./widgets/widgetDate'), require('./widgets/widgetDuration'), require('./tasks/rmsTask'), require('./tasks/rmsTaskEdit'), require('./tasks/TaskSplitWeekView'), require('./tasks/rmsTaskInfo'), require('./tasks/rmsTaskAdd'), require('./tasks/addCommentAndSave'), require('./layout'), require('./filters'), require('./noDrag'), require('./sameHeight'), require('./sameWidth')])).name;

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


},{"../../dscommon/DSObjectBase":94,"../../dscommon/util":99,"../models/PersonDayStat":44,"./account/rmsAccount":55,"./filters":56,"./layout":57,"./noDrag":58,"./sameHeight":59,"./sameWidth":60,"./tasks/TaskSplitWeekView":61,"./tasks/addCommentAndSave":62,"./tasks/rmsTask":63,"./tasks/rmsTaskAdd":64,"./tasks/rmsTaskEdit":65,"./tasks/rmsTaskInfo":66,"./views/changes/ViewChanges":69,"./views/view1/View1":71,"./views/view2/View2":75,"./views/view3/View3":76,"./widgets/widgetDate":80,"./widgets/widgetDuration":81}],69:[function(require,module,exports){
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
      var ctor;

      extend(ViewChange, superClass);

      function ViewChange() {
        return ctor.apply(this, arguments);
      }

      ViewChange.begin('ViewChange');

      ViewChange.propData('tasks', Task, {
        mode: 'changes'
      });

      ViewChange.propPool('poolChanges', Change);

      ViewChange.propList('changes', Change);

      ViewChange.propNum('renderVer', 0);

      ctor = (function($scope, key) {
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
        var change, changes, conflictValue, isDark, poolChanges, prop, propChange, propName, props, ref, ref1, refreshView, remove, task, taskChanges, taskKey, tasksSet, tasksStatus, v;
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
          task.__change.__refreshView = refreshView;
          remove = (function(task) {
            return function() {
              dsChanges.removeChanges(task);
              refreshView();
            };
          })(task);
          taskChanges = [];
          ref1 = task.__change;
          for (propName in ref1) {
            propChange = ref1[propName];
            if (!(propName !== '__error' && propName !== '__refreshView' && propName !== 'clipboard')) {
              continue;
            }
            prop = props[propName];
            taskChanges.push(change = poolChanges.find(this, task.$ds_key + "." + propName));
            change.set('isDark', isDark);
            change.set('index', prop.index);
            change.set('prop', propName);
            change.set('value', (v = propChange.v) === null ? ' -' : prop.str(propChange.v));
            change.set('conflict', prop.equal((conflictValue = task.$ds_doc.get(propName)), propChange.s) ? null : conflictValue === null ? ' -' : prop.str(conflictValue));
          }
          taskChanges.sort(function(l, r) {
            return l.get('index') - r.get('index');
          });
          taskChanges[0].set('doc', task);
          taskChanges[0].remove = remove;
          Array.prototype.push.apply(changes, taskChanges);
          if (task.__change.__error) {
            changes.push(change = poolChanges.find(this, task.$ds_key + ".__error"));
            change.set('isDark', isDark);
            change.set('error', task.__change.__error);
          }
        }
        this.get('changesList').merge(this, changes);
        this.set('renderVer', this.get('renderVer') + 1);
      });

      ViewChange.end();

      return ViewChange;

    })(DSView);
  })
]);


},{"../../../../dscommon/DSDigest":89,"../../../../dscommon/DSObject":93,"../../../../dscommon/DSView":98,"../../../../dscommon/util":99,"../../../data/dsChanges":32,"../../../models/Person":43,"../../../models/Task":48,"./models/Change":70}],70:[function(require,module,exports){
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

  Change.propNum('index');

  Change.end();

  return Change;

})(DSObject);


},{"../../../../../dscommon/DSDocument":90,"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99}],71:[function(require,module,exports){
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
      var ctor, positionTaskView, taskViewsSortRule;

      extend(View1, superClass);

      function View1() {
        return ctor.apply(this, arguments);
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

      View1.propNum('renderVer', 0);

      View1.propObj('hiddenPeople', {
        init: {}
      });

      View1.propNum('hiddenPeopleCount', {
        init: 0
      });

      View1.ds_dstr.push((function() {
        this.__unwatchA();
        this.__unwatchB();
        this.__unwatchC();
      }));

      ctor = (function($scope, key) {
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
              id: -1,
              name: 'All'
            }, $scope.selectedCompany = {
              id: 23872,
              name: 'WebProfy'
            }, {
              id: 50486,
              name: 'Freelancers'
            }
          ];
          selectedCompany = config.get('selectedCompany');
          ref1 = $scope.filterCompanies;
          for (l = 0, len2 = ref1.length; l < len2; l++) {
            i = ref1[l];
            if (!(i.id === selectedCompany)) {
              continue;
            }
            $scope.selectedCompany = i;
            break;
          }
        }
        this.__unwatchA = $scope.$watch(((function(_this) {
          return function() {
            var ref2, ref3;
            return [(ref2 = _this.get('startDate')) != null ? ref2.valueOf() : void 0, $scope.mode, $scope.dataService.showTimeSpent, (ref3 = $scope.selectedManager) != null ? ref3.$ds_key : void 0];
          };
        })(this)), ((function(_this) {
          return function(arg) {
            var mode, selectedManager, showTimeSpent, startDateVal;
            startDateVal = arg[0], mode = arg[1], showTimeSpent = arg[2], selectedManager = arg[3];
            _this.dataUpdate({
              startDate: moment(startDateVal),
              endDate: moment(startDateVal).add(6, 'days'),
              mode: mode,
              showTimeSpent: showTimeSpent,
              manager: selectedManager ? selectedManager : null
            });
          };
        })(this)), true);
        this.__unwatchB = $scope.$watch((function() {
          return [$scope.selectedRole, $scope.selectedCompany, $scope.selectedManager, $scope.selectedLoad];
        }), ((function(_this) {
          return function(arg) {
            var selectedCompany, selectedLoad, selectedManager, selectedRole;
            selectedRole = arg[0], selectedCompany = arg[1], selectedManager = arg[2], selectedLoad = arg[3];
            if ($rootScope.peopleRoles) {
              config.set('selectedRole', selectedRole ? selectedRole.role : null);
              if (!(selectedRole != null ? selectedRole.role : void 0)) {
                $scope.selectedRole = null;
              }
            }
            if ($rootScope.filterManagers) {
              config.set('selectedManager', selectedManager ? selectedManager.$ds_key : null);
              if (!(selectedManager != null ? selectedManager.$ds_key : void 0)) {
                $scope.selectedManager = null;
              }
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
        var companyId, days, daysTemp, f0, f1, f2, filter, hiddenPeople, j, k, len1, loadFilter, peopleStatus, personDayStat, personDayStatStatus, personTimeTracking, personTimeTrackingStatus, poolRows, r, ref, ref1, ref2, ref3, role, rolesMap, rows, selectedPeople, selectedRole, startDate, tasksByPerson, tasksStatus, timeByPerson, timeSpentTemp;
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
          if (((ref = this.scope.selectedCompany) != null ? ref.id : void 0) !== -1) {
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
            if ((personDayStatStatus = this.get('data').get('personDayStatStatus')) !== 'ready' && personDayStatStatus !== 'update') {
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
          if ((personTimeTrackingStatus = this.data.personTimeTrackingStatus) === 'ready' || personTimeTrackingStatus === 'update') {
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
        this.set('renderVer', this.get('renderVer') + 1);
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
        return maxY + 1;
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
          if (ev.dataTransfer.getData('task')) {
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


},{"../../../../dscommon/DSDigest":89,"../../../../dscommon/DSView":98,"../../../../dscommon/util":99,"../../../config":28,"../../../data/dsChanges":32,"../../../data/dsDataService":33,"../../../data/teamwork/TWTasks":40,"../../../models/Person":43,"../../../models/PersonDayStat":44,"../../../models/PersonTimeTracking":45,"../../../models/Tag":47,"../../../models/Task":48,"../../tasks/addCommentAndSave":62,"./models/Day":72,"./models/Row":73,"./models/TaskView":74}],72:[function(require,module,exports){
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


},{"../../../../../dscommon/DSObject":93}],73:[function(require,module,exports){
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

  Row.propBool('expand', {
    init: false
  });

  Row.end();

  return Row;

})(DSObject);


},{"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99,"../../../../models/Person":43,"../../../../models/PersonDayStat":44,"./TaskView":74}],74:[function(require,module,exports){
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

  TaskView.propNum('x', {
    init: 0,
    valid: validate.required
  });

  TaskView.propNum('y', {
    init: 0,
    valid: validate.required
  });

  TaskView.propNum('len', {
    init: 1,
    valid: validate.required
  });

  TaskView.propObj('split');

  TaskView.end();

  return TaskView;

})(DSObject);


},{"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99,"../../../../models/PersonTimeTracking":45,"../../../../models/Task":48}],75:[function(require,module,exports){
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
      var ctor, taskViewsSortRule;

      extend(View2, superClass);

      function View2() {
        return ctor.apply(this, arguments);
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

      View2.propNum('tasksNotAssignedHeight', {
        init: 0
      });

      View2.propNum('renderVer', 0);

      View2.ds_dstr.push((function() {
        this.__unwatchA();
      }));

      ctor = (function($scope, key) {
        DSView.call(this, $scope, key);
        this.__unwatchA = $scope.$watch((function() {
          var ref, ref1;
          return [(ref = $scope.$parent.view.startDate) != null ? ref.valueOf() : void 0, $scope.mode, (ref1 = $scope.selectedManager) != null ? ref1.$ds_key : void 0];
        }), ((function(_this) {
          return function(arg) {
            var mode, selectedManager, startDateVal;
            startDateVal = arg[0], mode = arg[1], selectedManager = arg[2];
            _this.dataUpdate({
              startDate: moment(startDateVal),
              endDate: moment(startDateVal).add(6, 'days'),
              mode: mode,
              manager: selectedManager ? selectedManager : null
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
        this.set('renderVer', this.get('renderVer') + 1);
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
          if (ev.dataTransfer.getData('task')) {
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
          }
          $rootScope.$digest();
          ev.stopPropagation();
          return false;
        });
      }
    };
  }
]);


},{"../../../../dscommon/DSDigest":89,"../../../../dscommon/DSView":98,"../../../../dscommon/util":99,"../../../data/dsChanges":32,"../../../data/dsDataService":33,"../../../data/teamwork/TWTasks":40,"../../../models/Task":48,"../../tasks/addCommentAndSave":62,"../view1/View1":71,"../view1/models/TaskView":74}],76:[function(require,module,exports){
var PersonView, Project, ProjectView, Row, Task, TaskList, TaskListView, assert, error, ngModule,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = (ngModule = angular.module('ui/views/view3/View3', [require('../../../config'), require('../../../data/dsDataService'), require('../../../../dscommon/DSView'), require('../../tasks/addCommentAndSave'), require('../../../data/teamwork/TWTasks')])).name;

assert = require('../../../../dscommon/util').assert;

error = require('../../../../dscommon/util').error;

Task = require('../../../models/Task');

TaskList = require('../../../models/TaskList');

Project = require('../../../models/Project');

PersonView = require('./models/PersonView');

ProjectView = require('./models/ProjectView');

TaskListView = require('./models/TaskListView');

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
        watch: ['duedate', 'priority', 'clipboard']
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
          var ref;
          return [$scope.mode, config.activeSidebarTab, (ref = $scope.selectedManager) != null ? ref.$ds_key : void 0];
        }), ((function(_this) {
          return function(arg) {
            var active, mode, selectedManager;
            mode = arg[0], active = arg[1], selectedManager = arg[2];
            $rootScope.view3ActiveTab = active;
            if (!selectedManager) {
              selectedManager = null;
            }
            switch (active) {
              case -1:
                if (typeof _this.__unwatchB === "function") {
                  _this.__unwatchB();
                }
                _this.dataUpdate({
                  filter: 'clipboard',
                  mode: mode,
                  manager: selectedManager
                });
                break;
              case 0:
                if (typeof _this.__unwatchB === "function") {
                  _this.__unwatchB();
                }
                _this.dataUpdate({
                  filter: 'noduedate',
                  mode: mode,
                  manager: selectedManager
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
                      endDate: nextWeekEndDate,
                      manager: selectedManager
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
                  mode: mode,
                  manager: selectedManager
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
        var filterByPerson, filterByProject, filterByTask, i, k, len, personView, personViewKey, poolPeople, poolProjects, projects, r, ref, ref1, ref2, ref3, resultRows, rows, status, tasks, tasksByPeople, tasksByProject, tasksByTaskList, v;
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
          tasksByTaskList = _.groupBy(tasks, (function(task) {
            return task.get('taskList').$ds_key;
          }));
          tasksByProject = _.groupBy(tasksByTaskList, (function(taskList) {
            return taskList[0].get('project').$ds_key;
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
              projectView.get('taskListsList').merge(_this, _.map(projectGroup, (function(taskListGroup) {
                var taskListKey, taskListView;
                taskListKey = taskListGroup[0].get('taskList').$ds_key;
                taskListView = projectView.poolTaskLists.find(_this, taskListKey);
                taskListView.set('taskList', TaskList.pool.items[taskListKey]);
                taskListView.set('tasksCount', _.size(taskListGroup));
                taskListView.set('totalEstimate', _.reduce(taskListGroup, (function(sum, task) {
                  var estimate;
                  if ((estimate = task.get('estimate'))) {
                    return sum.add(estimate);
                  } else {
                    return sum;
                  }
                }), moment.duration(0)));
                taskListView.get('tasksList').merge(_this, (_.map(taskListGroup, (function(task) {
                  return task.addRef(_this);
                }))).sort(TWTasks.tasksSortRule));
                return taskListView;
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
                tasksByTaskList = _.groupBy(tasksByPeople[personViewKey], (function(task) {
                  return task.get('taskList').$ds_key;
                }));
                tasksByProject = _.groupBy(tasksByTaskList, (function(taskList) {
                  return taskList[0].get('project').$ds_key;
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
                    projectView.get('taskListsList').merge(_this, _.map(projectGroup, (function(taskListGroup) {
                      var taskListKey, taskListView;
                      taskListKey = taskListGroup[0].get('taskList').$ds_key;
                      taskListView = projectView.poolTaskLists.find(_this, taskListKey);
                      taskListView.set('taskList', TaskList.pool.items[taskListKey]);
                      taskListView.set('tasksCount', _.size(taskListGroup));
                      taskListView.set('totalEstimate', _.reduce(taskListGroup, (function(sum, task) {
                        var estimate;
                        if ((estimate = task.get('estimate'))) {
                          return sum.add(estimate);
                        } else {
                          return sum;
                        }
                      }), moment.duration(0)));
                      taskListView.get('tasksList').merge(_this, (_.map(taskListGroup, (function(task) {
                        return task.addRef(_this);
                      }))).sort(TWTasks.tasksSortRule));
                      return taskListView;
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
          var fields, modal, tasks;
          if (ev.dataTransfer.getData('task')) {
            if (!(ev.ctrlKey && !(modal = $rootScope.modal).task.split && modal.task.duedate !== null)) {
              tasks = [$rootScope.modal.task];
            } else {
              tasks = getDropTasksGroup();
            }
            fields = {
              plan: false
            };
            switch (activeTab()) {
              case -1:
                fields.duedate = null;
                fields.clipboard = true;
                break;
              case 0:
                fields.duedate = null;
                break;
              case 1:
                fields.duedate = moment($rootScope.startDateVal).add(1, 'week');
            }
            addCommentAndSave(tasks, ev.shiftKey, fields);
          }
          $rootScope.$digest();
          ev.stopPropagation();
          return false;
        });
      }
    };
  }
]);


},{"../../../../dscommon/DSView":98,"../../../../dscommon/util":99,"../../../config":28,"../../../data/dsDataService":33,"../../../data/teamwork/TWTasks":40,"../../../models/Project":46,"../../../models/Task":48,"../../../models/TaskList":49,"../../tasks/addCommentAndSave":62,"../view1/models/Row":73,"./models/PersonView":77,"./models/ProjectView":78,"./models/TaskListView":79}],77:[function(require,module,exports){
var DSObject, Person, PersonView, Project, ProjectView, Row, TaskListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Person = require('../../../../models/Person');

Project = require('../../../../models/Project');

ProjectView = require('./ProjectView');

TaskListView = require('./TaskListView');

Row = require('../../view1/models/Row');

module.exports = PersonView = (function(superClass) {
  extend(PersonView, superClass);

  function PersonView() {
    return PersonView.__super__.constructor.apply(this, arguments);
  }

  PersonView.begin('PersonView');

  PersonView.propDoc('row', Row);

  PersonView.propPool('poolProjects', ProjectView);

  PersonView.propList('projects', TaskListView);

  PersonView.end();

  return PersonView;

})(DSObject);


},{"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99,"../../../../models/Person":43,"../../../../models/Project":46,"../../view1/models/Row":73,"./ProjectView":78,"./TaskListView":79}],78:[function(require,module,exports){
var DSObject, Project, ProjectView, TaskListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Project = require('../../../../models/Project');

TaskListView = require('./TaskListView');

module.exports = ProjectView = (function(superClass) {
  extend(ProjectView, superClass);

  function ProjectView() {
    return ProjectView.__super__.constructor.apply(this, arguments);
  }

  ProjectView.begin('ProjectView');

  ProjectView.propDoc('project', Project);

  ProjectView.propPool('poolTaskLists', TaskListView);

  ProjectView.propList('taskLists', TaskListView);

  ProjectView.end();

  return ProjectView;

})(DSObject);


},{"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99,"../../../../models/Project":46,"./TaskListView":79}],79:[function(require,module,exports){
var DSObject, Task, TaskList, TaskListView, validate,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DSObject = require('../../../../../dscommon/DSObject');

validate = require('../../../../../dscommon/util').validate;

Task = require('../../../../models/Task');

TaskList = require('../../../../models/TaskList');

module.exports = TaskListView = (function(superClass) {
  extend(TaskListView, superClass);

  function TaskListView() {
    return TaskListView.__super__.constructor.apply(this, arguments);
  }

  TaskListView.begin('TaskListView');

  TaskListView.propDoc('taskList', TaskList);

  TaskListView.propList('tasks', Task);

  TaskListView.propNum('tasksCount', {
    init: 0
  });

  TaskListView.propDuration('totalEstimate');

  TaskListView.propBool('isExpand', {
    init: true
  });

  TaskListView.end();

  return TaskListView;

})(DSObject);


},{"../../../../../dscommon/DSObject":93,"../../../../../dscommon/util":99,"../../../../models/Task":48,"../../../../models/TaskList":49}],80:[function(require,module,exports){
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


},{}],81:[function(require,module,exports){
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


},{}],82:[function(require,module,exports){
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


},{"../../dscommon/util":99}],83:[function(require,module,exports){
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
  var ctor, loadOneDoc;

  extend(DSChangesBase, superClass);

  function DSChangesBase() {
    return ctor.apply(this, arguments);
  }

  DSChangesBase.begin('DSChangesBase');

  DSChangesBase.noCache();

  DSChangesBase.propDoc('hist', DSHistory);

  DSChangesBase.propNum('count', {
    init: 0
  });

  ctor = (function(referry, key) {
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


},{"./DSData":84,"./DSDigest":89,"./DSDocument":90,"./DSHistory":91,"./DSPool":95,"./util":99}],84:[function(require,module,exports){
var DSData, DSObject, assert, error, modeReleaseDataOnReload, serviceOwner,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

serviceOwner = require('./util').serviceOwner;

modeReleaseDataOnReload = require('./util').modeReleaseDataOnReload;

DSObject = require('./DSObject');

module.exports = DSData = (function(superClass) {
  var ctor;

  extend(DSData, superClass);

  function DSData() {
    return ctor.apply(this, arguments);
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

  ctor = (function(referry, key, params) {
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


},{"./DSObject":93,"./util":99}],85:[function(require,module,exports){
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


},{"./DSData":84,"./DSDigest":89,"./DSDocument":90,"./DSSet":96,"./util":99}],86:[function(require,module,exports){
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


},{"./DSData":84,"./DSDigest":89,"./DSObject":93,"./DSSet":96,"./util":99}],87:[function(require,module,exports){
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


},{"./DSObject":93,"./DSPool":95,"./util":99}],88:[function(require,module,exports){
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
      var ctor;

      extend(DSDataSource, superClass);

      function DSDataSource() {
        return ctor.apply(this, arguments);
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

      ctor = (function(referry, key) {
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


},{"../utils/base64":101,"./DSDigest":89,"./DSObject":93,"./util":99}],89:[function(require,module,exports){
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


},{"./util":99}],90:[function(require,module,exports){
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
        var change, empty, i, j, l, len, lst, prop, ref1, ref2, s, val;
        if ((prop = item.__props[propName]).common) {
          if (this.$ds_evt) {
            ref1 = this.$ds_evt;
            for (i = ref1.length - 1; i >= 0; i += -1) {
              lst = ref1[i];
              lst.__onChange.call(lst, this, propName, value, oldVal);
            }
          }
        } else if ((change = this.__change) && change.hasOwnProperty(propName)) {
          if (prop.equal((val = (prop = change[propName]).v), value)) {
            if ((s = prop.s) instanceof DSObjectBase) {
              s.release(this);
            }
            if (val instanceof DSObjectBase) {
              val.release(this);
            }
            delete change[propName];
            empty = true;
            for (j = 0, len = change.length; j < len; j++) {
              propName = change[j];
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
        } else if (this.$ds_evt) {
          ref2 = this.$ds_evt;
          for (l = ref2.length - 1; l >= 0; l += -1) {
            lst = ref2[l];
            lst.__onChange.call(lst, this, propName, value, oldVal);
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
            if (prop.common) {
              return Object.defineProperty(Editable.prototype, propName, {
                get: function() {
                  return this.$ds_doc[propName];
                },
                set: function(value) {
                  var oldVal;
                  if ((oldVal = this.$ds_doc[propName]) !== value) {
                    this.$ds_doc[propName] = value;
                    this.$ds_chg.$ds_hist.add(this, propName, value, oldVal);
                  }
                }
              });
            } else {
              return Object.defineProperty(Editable.prototype, propName, {
                get: getValue = function() {
                  var change;
                  change = this.__change;
                  if (change && change.hasOwnProperty(propName)) {
                    return change[propName].v;
                  }
                  return this.$ds_doc[propName];
                },
                set: function(value) {
                  var change, changePair, empty, i, j, lst, oldVal, ref2, ref3, s, serverValue;
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
                      this.$ds_chg.$ds_hist.add(this, propName, value, oldVal);
                    } else if (equal((serverValue = this.$ds_doc[propName]), value)) {
                      this.$ds_chg.$ds_hist.add(this, propName, value, (changePair = change[propName]).v);
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
                      this.$ds_chg.$ds_hist.add(this, propName, value, oldVal);
                    }
                    if (this.$ds_evt) {
                      ref3 = this.$ds_evt;
                      for (j = ref3.length - 1; j >= 0; j += -1) {
                        lst = ref3[j];
                        lst.__onChange.call(lst, this, propName, value, oldVal);
                      }
                    }
                  }
                }
              });
            }
          })(prop.name, prop.valid, prop.equal);
        }
      }

      DSObject.end.call(Editable);

      return Editable;

    })(originalDocClass);
  });

  return DSDocument;

})(DSObject);


},{"./DSObject":93,"./DSObjectBase":94,"./DSSet":96,"./util":99}],91:[function(require,module,exports){
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
  var _reset, blockCount, blockId, ctor, hasRedo, skipAdd;

  extend(DSHistory, superClass);

  function DSHistory() {
    return ctor.apply(this, arguments);
  }

  DSHistory.begin('DSHistory');

  DSHistory.ds_dstr.push((function() {
    _reset.call(this);
  }));

  ctor = (function(referry, key) {
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
    var b, cnt, h, hist, histTop, j, len, m, ref, v, val;
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
      if ((this.histTop = histTop = hist.length) > 200) {
        cnt = -1;
        while (true) {
          b = hist[++cnt].b;
          while (++cnt < histTop) {
            if ((h = hist[cnt]).b === b) {
              if ((v = h.n) instanceof DSObjectBase) {
                v.release(this);
              }
              if ((v = h.o) instanceof DSObjectBase) {
                v.release(this);
              }
            } else {
              break;
            }
          }
          if ((histTop - cnt) <= 200) {
            break;
          }
        }
        this.hist = hist = hist.slice(cnt);
        this.histTop = hist.length;
      }
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


},{"./DSDigest":89,"./DSDocument":90,"./DSObject":93,"./DSObjectBase":94,"./util":99}],92:[function(require,module,exports){
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
  var ctor;

  extend(DSList, superClass);

  function DSList() {
    return ctor.apply(this, arguments);
  }

  DSList.begin('DSList');

  ctor = (function(referry, key, type) {
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


},{"./DSObjectBase":94,"./util":99}],93:[function(require,module,exports){
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
  var ctor;

  extend(DSObject, superClass);

  function DSObject() {
    return ctor.apply(this, arguments);
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

  ctor = (function(referry, key) {
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


},{"./DSList":92,"./DSObjectBase":94,"./DSPool":95,"./DSSet":96,"./util":99}],94:[function(require,module,exports){
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
  var ctor1, globalId, sequenceId, sourceId, statusByPrior, statusValues, totalPool;

  function DSObjectBase() {
    return ctor1.apply(this, arguments);
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

  ctor1 = (function(referry, key) {
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
    return this.__proto__.$ds_docType + "@" + this.$ds_key + (typeof this.$ds_pool === 'object' ? ' <- ' + this.$ds_pool : '');
  });

  DSObjectBase.prototype.toJSON = function() {
    return this.__proto__.$ds_docType + "@" + this.$ds_key;
  };

  DSObjectBase.prototype.writeMap = (function() {
    var prop, propName, ref, res;
    res = {};
    ref = this.__proto__.__props;
    for (propName in ref) {
      prop = ref[propName];
      if (prop.write) {
        res[propName] = prop.write(this["_" + propName]);
      }
    }
    return res;
  });

  DSObjectBase.prototype.readMap = (function(map) {
    var propDesc, propName, props, val, value;
    props = this.__proto__.__props;
    for (propName in map) {
      value = map[propName];
      if (props.hasOwnProperty(propName) && (propDesc = props[propName]).read) {
        this[propName] = val = propDesc.read.call(this, value);
        if (val instanceof DSObjectBase) {
          val.release(this);
        }
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
      if (!(typeof opts.common === 'undefined' || typeof opts.common === 'boolean')) {
        throw new Error('Invalid value of opts.common');
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
      if (!(!opts.hasOwnProperty('write') || !opts.write || typeof opts.write === 'function')) {
        throw new Error('Invalid value of opts.write');
      }
      if (!(!opts.hasOwnProperty('read') || !opts.read || typeof opts.read === 'function')) {
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
      if (opts.hasOwnProperty('readonly') && !opts.readonly && opts.hasOwnProperty('common') && opts.common) {
        throw new Error('Ambiguous opts.readonly and opts.common');
      }
      if (opts.hasOwnProperty('calc') && opts.calc && opts.hasOwnProperty('common') && opts.common) {
        throw new Error('Ambiguous opts.calc and opts.common');
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
      index: _.size(this.prototype.__props),
      type: opts.type,
      write: opts.write || ((opts.hasOwnProperty('write') && !opts.write) || opts.calc || opts.common ? null : (function(v) {
        if (v === null) {
          return null;
        } else {
          return v.valueOf();
        }
      })),
      read: opts.read || ((opts.hasOwnProperty('read') && !opts.read) || opts.calc || opts.common ? null : (function(v) {
        return v;
      })),
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
      calc: opts.calc || false,
      common: opts.common || false
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

  DSObjectBase.propSimple = (function(type, name, opts) {
    var q, valid;
    if (assert) {
      if (!(type === 'number' || type === 'boolean' || type === 'string' || type === 'object')) {
        error.invalidArg('type');
      }
      if (typeof name !== 'string') {
        error.invalidArg('name');
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
    return this.prop(_.assign({
      name: name,
      type: type,
      init: typeof init === 'undefined' || init === null ? null : typeof init === 'function' || type !== 'object' ? init : (function() {
        return _.clone(init);
      }),
      valid: valid,
      write: opts && (opts.calc || opts.common) ? null : (function(v) {
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
    }, opts));
  });

  DSObjectBase.propNum = (function(name, opts) {
    this.propSimple('number', name, opts);
  });

  DSObjectBase.propBool = (function(name, opts) {
    return this.propSimple('boolean', name, opts);
  });

  DSObjectBase.propStr = (function(name, opts) {
    return this.propSimple('string', name, opts);
  });

  DSObjectBase.propObj = (function(name, opts) {
    return this.propSimple('object', name, opts);
  });

  DSObjectBase.propDoc = (function(name, type, opts) {
    var localName, q, valid;
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
    return this.prop(_.assign({
      name: name,
      type: type,
      init: null,
      valid: valid,
      write: opts && (opts.calc || opts.common) ? null : (function(v) {
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
    }, opts));
  });

  DSObjectBase.propCalc = (function(name, func, opts) {
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (!func || typeof func !== 'function') {
        error.invalidArg('func');
      }
    }
    return this.prop(_.assign({
      name: name,
      type: 'calc',
      func: func
    }, opts));
  });

  DSObjectBase.propConst = (function(name, value, opts) {
    if (assert) {
      if (!typeof name === 'string') {
        error.invalidArg('name');
      }
      if (typeof value === 'undefined') {
        error.invalidArg('value');
      }
    }
    return this.prop(_.assign({
      name: name,
      type: 'const',
      value: value
    }, opts));
  });

  DSObjectBase.propEnum = (function(name, values, opts) {
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
    return this.prop(_.assign({
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
    }, opts));
  });

  DSObjectBase.propMoment = (function(name, valid, opts) {
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
    return this.prop(_.assign({
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
    }, opts));
  });

  DSObjectBase.propDuration = (function(name, valid, opts) {
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
    return this.prop(_.assign({
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
    }, opts));
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


},{"./util":99}],95:[function(require,module,exports){
var DSDigest, DSObjectBase, DSPool, assert, error, traceWatch,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('./util').assert;

error = require('./util').error;

traceWatch = require('./util').traceWatch;

DSObjectBase = require('./DSObjectBase');

DSDigest = require('./DSDigest');

module.exports = DSPool = (function(superClass) {
  var ctor, renderItem;

  extend(DSPool, superClass);

  function DSPool() {
    return ctor.apply(this, arguments);
  }

  DSPool.begin('DSPool');

  ctor = (function(referry, key, type, watchOn) {
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


},{"./DSDigest":89,"./DSObjectBase":94,"./util":99}],96:[function(require,module,exports){
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
  var _add, _remove, ctor;

  extend(DSSet, superClass);

  function DSSet() {
    return ctor.apply(this, arguments);
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

  ctor = (function(referry, key, type, data) {
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


},{"./DSObjectBase":94,"./util":99}],97:[function(require,module,exports){
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
        if (!(enums === void 0 || typeof enums === 'string')) {
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


},{"./DSObjectBase":94,"./util":99}],98:[function(require,module,exports){
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
      var ctor, viewSequence;

      extend(DSView, superClass);

      function DSView() {
        return ctor.apply(this, arguments);
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

      ctor = (function($scope, key) {
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
        var data, i, k, len, newSet, reactOnUpdate, ref, ref1, v;
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
            reactOnUpdate = true;
            if (v.watch !== null) {
              ref1 = v.watch;
              for (i = 0, len = ref1.length; i < len; i++) {
                k = ref1[i];
                reactOnUpdate = false;
                break;
              }
            } else {
              reactOnUpdate = false;
            }
            v.unwatchStatus = (function(_this) {
              return function(reactOnUpdate) {
                return newSet.watchStatus(_this, (function(source, status, prevStatus) {
                  var newStatus;
                  if ((prevStatus = _this.dataStatus) !== (newStatus = DSObject.integratedStatus(_this.__srcList))) {
                    _this.dataStatus = newStatus;
                    if (reactOnUpdate || !((newStatus === 'ready' && prevStatus === 'update') || (newStatus === 'update' && prevStatus === 'ready'))) {
                      _this.__dirty++;
                    }
                  }
                }));
              };
            })(this)(reactOnUpdate);
          }
        }
        if (!this.hasOwnProperty('__unwatch2')) {
          this.__unwatch2 = this.__scope.$watch(((function(_this) {
            return function() {
              return _this.__dirty;
            };
          })(this)), ((function(_this) {
            return function(val, oldVal) {
              var ref2, rest, src, srcName;
              if (traceView) {
                rest = '';
                ref2 = _this.__src;
                for (srcName in ref2) {
                  src = ref2[srcName];
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


},{"../app/data/dsDataService":33,"./DSObject":93,"./DSSet":96,"./util":99}],99:[function(require,module,exports){
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
    var ctor;

    function ServiceOwner() {
      return ctor.apply(this, arguments);
    }

    ctor = (function() {
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


},{}],100:[function(require,module,exports){
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
},{}],101:[function(require,module,exports){
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


},{}],102:[function(require,module,exports){
(function (process){
/* Jison generated parser */
var jsonlint = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: // replace escaped characters with actual character
          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b');
        
break;
case 2:this.$ = Number(yytext);
break;
case 3:this.$ = null;
break;
case 4:this.$ = true;
break;
case 5:this.$ = false;
break;
case 6:return this.$ = $$[$0-1];
break;
case 13:this.$ = {};
break;
case 14:this.$ = $$[$0-1];
break;
case 15:this.$ = [$$[$0-2], $$[$0]];
break;
case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:this.$ = [];
break;
case 19:this.$ = $$[$0-1];
break;
case 20:this.$ = [$$[$0]];
break;
case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this._input = this.match.slice(n) + this._input;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/\n.*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
            this.yytext += match[0];
            this.match += match[0];
            this.yyleng = this.yytext.length;
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
};
lexer.rules = [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}};


;
return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
// Zork: Commented out for clarity
//exports.parser = jsonlint;
exports.parse = function () { return jsonlint.parse.apply(jsonlint, arguments); }
// Hack: Zork: I had comment this out, since it requires an nodeJS module
//exports.main = function commonjsMain(args) {
//    if (!args[1])
//        throw new Error('Usage: '+args[0]+' FILE');
//    if (typeof process !== 'undefined') {
//        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
//    } else {
//        var cwd = require("file").path(require("file").cwd());
//        var source = cwd.join(args[1]).read({charset: "utf-8"});
//    }
//    return exports.parser.parse(source);
//}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}
}).call(this,require('_process'))
},{"_process":7,"system":18}]},{},[27]);
