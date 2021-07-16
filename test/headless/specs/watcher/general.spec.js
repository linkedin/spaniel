/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import { default as testModule, TestClass } from './../../test-module';

import constants from './../../../constants.js';

const {
  time: { RAF_THRESHOLD }
} = constants;

testModule(
  'Watcher',
  class extends TestClass {
    ['@test unwatch works']() {
      return this.context
        .evaluate(() => {
          window.STATE.exposed = 0;
          window.watcher = new spaniel.Watcher();
          window.target = document.querySelector('.tracked-item[data-id="6"]');
          window.watcher.watch(window.target, function() {
            window.STATE.exposed++;
          });
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(0)
        .wait(RAF_THRESHOLD * 5)
        .evaluate(() => {
          window.watcher.unwatch(window.target);
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .getExecution()
        .evaluate(function() {
          return window.STATE.exposed;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired only once');
        });
    }
    ['@test destroy works']() {
      return this.context
        .evaluate(() => {
          window.STATE.exposed = 0;
          window.watcher = new spaniel.Watcher();
          window.target = document.querySelector('.tracked-item[data-id="6"]');
          window.watcher.watch(window.target, function() {
            window.STATE.exposed++;
          });
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(0)
        .wait(RAF_THRESHOLD * 5)
        .evaluate(() => {
          window.watcher.destroy();
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .getExecution()
        .evaluate(function() {
          return window.STATE.exposed;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired only once');
        });
    }
    ['@test unwatching from one watcher does not unwatch others']() {
      return this.context
        .evaluate(() => {
          window.STATE.exposed = 0;
          window.watcher1 = new spaniel.Watcher();
          window.watcher2 = new spaniel.Watcher();
          window.target = document.querySelector('.tracked-item[data-id="6"]');
          window.watcher1.watch(window.target, function() {
            window.STATE.exposed++;
          });
          window.watcher2.watch(window.target, function() {
            window.STATE.exposed++;
          });
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(0)
        .wait(RAF_THRESHOLD * 5)
        .evaluate(() => {
          window.watcher1.unwatch(window.target);
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .getExecution()
        .evaluate(function() {
          return window.STATE.exposed;
        })
        .then(function(result) {
          assert.equal(result, 3, 'Callback fired 3 times');
        });
    }
    ['@test watched item callbacks fire in order']() {
      return this.context
        .evaluate(() => {
          window.STATE.order = [];
          window.watcher = new spaniel.Watcher();
          var t1 = document.querySelector('.tracked-item[data-id="1"]');
          var t2 = document.querySelector('.tracked-item[data-id="2"]');
          window.watcher.watch(t1, function() {
            window.STATE.order.push(1);
          });
          window.watcher.watch(t2, function() {
            window.STATE.order.push(2);
          });
        })
        .wait(RAF_THRESHOLD * 5)
        .getExecution()
        .evaluate(function() {
          return window.STATE.order;
        })
        .then(function(result) {
          assert.equal(result[0], 1, 'First watched item callback fires first');
          assert.equal(result[1], 2, 'Second watched item callback fires second');
        });
    }
    ['@test watcher callbacks pass correct params for impressed']() {
      return this.context
        .evaluate(() => {
          window.STATE.startTime = Date.now();
          window.STATE.params = null;
          window.watcher = new spaniel.Watcher({
            time: 200,
            ratio: 0.5
          });
          var el = document.querySelector('.tracked-item[data-id="1"]');
          window.watcher.watch(el, function(eventName, meta) {
            if (eventName === 'impressed') {
              window.STATE.params = meta;
            }
          });
        })
        .wait(200 + RAF_THRESHOLD * 2)
        .getExecution()
        .evaluate(function() {
          return window.STATE;
        })
        .then(function(result) {
          assert.isOk(result.params, 'there is a metadata passed as a parameter');
          assert.isOk(result.params.intersectionRect, 'has intersectionRect');
          assert.isNumber(result.params.intersectionRect.bottom, 'intersectionRect.bottom is real number');
          assert.isNumber(result.params.intersectionRect.height, 'intersectionRect.height is real number');
          assert.isNumber(result.params.intersectionRect.left, 'intersectionRect.left is real number');
          assert.isNumber(result.params.intersectionRect.right, 'intersectionRect.right is real number');
          assert.isNumber(result.params.intersectionRect.top, 'intersectionRect.top is real number');
          assert.isNumber(result.params.intersectionRect.width, 'intersectionRect.width is real number');
          assert.isAtLeast(result.params.visibleTime, result.startTime, 'visibleTime is not too early');
          assert.isAtMost(
            result.params.visibleTime,
            result.startTime + RAF_THRESHOLD * 2,
            'visibleTime is not too late'
          );
          assert.isAtLeast(result.params.duration, 200, 'duration is not too little');
          assert.isAtMost(result.params.duration, 200 + RAF_THRESHOLD * 2, 'duration is not too much');
        });
    }
    ['@test watcher callbacks pass correct params for impression-complete']() {
      return this.context
        .evaluate(() => {
          window.STATE.startTime = Date.now();
          window.STATE.params = null;
          window.watcher = new spaniel.Watcher({
            time: 300,
            ratio: 0.5
          });
          var el = document.querySelector('.tracked-item[data-id="1"]');
          window.watcher.watch(el, function(eventName, meta) {
            if (eventName === 'impression-complete') {
              window.STATE.params = meta;
            }
          });
        })
        .wait(600 + RAF_THRESHOLD * 2)
        .scrollTo(600)
        .wait(RAF_THRESHOLD * 2)
        .getExecution()
        .evaluate(function() {
          return window.STATE;
        })
        .then(function(result) {
          assert.isOk(result.params, 'there is a metadata passed as a parameter');
          assert.isOk(result.params.intersectionRect, 'has intersectionRect');
          assert.isNumber(result.params.intersectionRect.bottom, 'intersectionRect.bottom is real number');
          assert.isNumber(result.params.intersectionRect.height, 'intersectionRect.height is real number');
          assert.isNumber(result.params.intersectionRect.left, 'intersectionRect.left is real number');
          assert.isNumber(result.params.intersectionRect.right, 'intersectionRect.right is real number');
          assert.isNumber(result.params.intersectionRect.top, 'intersectionRect.top is real number');
          assert.isNumber(result.params.intersectionRect.width, 'intersectionRect.width is real number');
          assert.isAtLeast(result.params.visibleTime, result.startTime, 'visibleTime is not too early');
          assert.isAtMost(
            result.params.visibleTime,
            result.startTime + RAF_THRESHOLD * 2,
            'visibleTime is not too late'
          );
          assert.isAtLeast(result.params.duration, 600, 'duration is not too little');
          assert.isAtMost(result.params.duration, 600 + RAF_THRESHOLD * 4, 'duration is not too much');
        });
    }
    ['@test cached vs live clientRect should always be the same']() {
      return this.context
        .evaluate(() => {
          window.watcher = new spaniel.Watcher();
          window.target = document.querySelector('.tracked-item[data-id="6"]');
          window.watcher.watch(window.target, () => {});
        })
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(10)
        .wait(RAF_THRESHOLD * 5)
        .getExecution()
        .evaluate(function() {
          let a = [];
          let queueItems = window.watcher.observer.observer.scheduler.queue.items;
          let cachedClientRect = queueItems[0].clientRect;
          let liveClientRect = queueItems[0].el.getBoundingClientRect();
          a.push(cachedClientRect, liveClientRect);

          return a;
        })
        .then(function(result) {
          assert.deepEqual(result[0], result[1], 'The element cached clientRect and live clientRect are identical');
        });
    }

    ['@test should fire impression with 0 time threshold']() {
      return this.context
        .evaluate(() => {
          window.watcher = new spaniel.Watcher({
            time: 0,
            ratio: 0.5
          });
          window.STATE.impressed = [];
          window.STATE.impressionComplete = [];
          const el = document.querySelector('.tracked-item[data-id="1"]');
          window.watcher.watch(el, function(eventName, meta) {
            if (eventName === 'impressed') {
              window.STATE.impressed.push(meta);
            } else if (eventName === 'impression-complete') {
              window.STATE.impressionComplete.push(meta);
            }
          });
        })
        .wait(600 + RAF_THRESHOLD * 2)
        .scrollTo(600)
        .wait(RAF_THRESHOLD * 2)
        .getExecution()
        .evaluate(function() {
          const { impressed, impressionComplete } = window.STATE;
          delete window.STATE.impressed;
          delete window.STATE.impressionComplete;
          return [impressed, impressionComplete];
        })
        .then(function([impressed, impressionComplete]) {
          assert.equal(impressed.length, 1, 'impression is fired');
          assert.isAtLeast(impressed[0].duration, 0, 'impression fired immediately, duration at least 0');
          assert.isAtMost(
            impressed[0].duration,
            1,
            'impression fired immediately, but allow duration to be close to 0'
          );
          assert.equal(impressionComplete.length, 1, 'impression-complete is fired');
          assert.isAtLeast(impressionComplete[0].duration, 600);
          assert.isAtMost(
            impressionComplete[0].duration,
            600 + RAF_THRESHOLD * 4,
            'impression-complete has correct duration'
          );
        });
    }
  }
);
