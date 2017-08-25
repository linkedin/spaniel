/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import sinon from 'sinon';
import {
  default as testModule,
  TestClass
} from './../../test-module';

import constants from './../../../constants.js';

const { time: { RAF_THRESHOLD } } = constants;

testModule('Watcher', class extends TestClass {
  ['@test unwatch works']() {
    return this.context.evaluate(() => {
      window.STATE.exposed = 0;
      window.STATE.exposedFirst = 0;
      window.watcher = new spanielContext.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      
      window.watcher.watch(window.target, function() {
        window.STATE.exposed++;
        createDiv('exposed-div-' + window.STATE.exposed);
      });
      
      var referenceElement = document.querySelector('.tracked-item[data-id="1"]');
      window.watcher.watch(referenceElement, function(e, meta) {
        if (e == 'exposed') {
          window.STATE.exposedFirst++;
          createDiv('first-element-exposed-div-' + window.STATE.exposedFirst);
        }
      });
    })
    .onDOMReady()
    .scrollTo(200)
    .waitForExposed(1)
    .scrollTo(0)
    .waitForNthElemEvent('first', 'exposed', '1')
    .evaluate(() => {
      window.watcher.unwatch(window.target);
    })
    .scrollTo(200)
    .getExecution()
    .evaluate(function() {
      return window.STATE.exposed;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired only once');
    });
  }
  ['@test destroy works']() {
    return this.context.evaluate(() => {
      window.STATE.exposed = 0;
      window.watcher = new spanielContext.Watcher();
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
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired only once');
    });
  }
  ['@test unwatching from one watcher does not unwatch others']() {
    return this.context.evaluate(() => {
      window.STATE.exposed = 0;
      window.STATE.exposedFirst = 0;
      window.watcher1 = new spanielContext.Watcher();
      window.watcher2 = new spanielContext.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      window.watcher1.watch(window.target, function() {
        window.STATE.exposed++;
        createDiv('exposed-div-' + window.STATE.exposed);
      });
      window.watcher2.watch(window.target, function() {
        window.STATE.exposed++;
        createDiv('exposed-div-' + window.STATE.exposed);
      });
      
      var referenceElement = document.querySelector('.tracked-item[data-id="1"]');
      window.watcher.watch(referenceElement, function(e, meta) {
        if (e == 'exposed') {
          window.STATE.exposedFirst++;
          createDiv('first-element-exposed-div-' + window.STATE.exposedFirst);
        }
      });
    })
    .onDOMReady()
    .scrollTo(200)
    .waitForExposed(1)
    .scrollTo(0)
    .waitForNthElemEvent('first', 'exposed', '1')
    .evaluate(() => {
      window.watcher1.unwatch(window.target);
    })
    .scrollTo(200)
    .waitForExposed(3)
    .getExecution()
    .evaluate(function() {
      return window.STATE.exposed;
    }).then(function(result) {
      assert.equal(result, 3, 'Callback fired 3 times');
    });
  }
  ['@test watched item callbacks fire in order']() {
    return this.context.evaluate(() => {
      window.STATE.order = [];
      window.watcher = new spanielContext.Watcher();
      var t1 = document.querySelector('.tracked-item[data-id="1"]');
      var t2 = document.querySelector('.tracked-item[data-id="2"]');
      window.watcher.watch(t1, function() {
        window.STATE.order.push(1);
        createDiv('exposed-div-1');
      });
      window.watcher.watch(t2, function() {
       createDiv('exposed-div-2');
        window.STATE.order.push(2);
      });
    })
    .onDOMReady()
    .waitForExposed(1)
    .waitForExposed(2)
    .getExecution()
    .evaluate(function() {
      return window.STATE.order;
    }).then(function(result) {
      assert.equal(result[0], 1, 'First watched item callback fires first');
      assert.equal(result[1], 2, 'Second watched item callback fires second');
    });
  }
});