/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  WatcherTestClass
} from './../../test-module';

import constants from './../../../constants.js';

const { time: { RAF_THRESHOLD }, ITEM_TO_OBSERVE, NUM_SKIPPED_FRAMES } = constants;

class VisibleEventTestClass extends WatcherTestClass {
  setupTest(customSetup) {
    return this.context.evaluate(customSetup || (() => {
      watcher.disconnect();
      var el = document.querySelector('.tracked-item[data-id="5"]')
      var id = el.getAttribute('data-id');
      window.STATE.exposed = 0;
      
      window.watcher.watch(el, function(e, meta) {
        var end = meta && meta.duration ? ' for ' + meta.duration + ' milliseconds' : '';
        console.log(id + ' ' + e + end);
        if (e == 'exposed') {
          window.STATE.exposed++;
          createDiv("exposed-div-" + window.STATE.exposed);
        }
        GLOBAL_TEST_EVENTS.push({
          id: parseInt(id),
          e: e,
          meta: meta || {}
        });
      });

      var referenceElement = document.querySelector('.tracked-item[data-id="1"]')
      window.STATE.exposedFirst = 0;
      window.watcher.watch(referenceElement, function(e, meta) {
        if (e == 'exposed') {
          window.STATE.exposedFirst++;
          createDiv('first-element-exposed-div-' + window.STATE.exposedFirst);
        }
      });
    }));
  }
}

testModule('Visible event', class extends VisibleEventTestClass {
  ['@test should not fire if item is exposed but not visible']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(50)
      .waitForExposed(1)
      .assertOnce(ITEM_TO_OBSERVE, 'exposed')
      .assertNever(ITEM_TO_OBSERVE, 'visible')
      .done();
  }

  ['@test should fire if item is visible']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForExposed(1)
      .assertOnce(ITEM_TO_OBSERVE, 'visible')
      .done();
  }

  ['@test should fire only once when item is moved while visible']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForExposed(1)
      .scrollTo(300)
      .scrollTo(250)
      .assertOnce(ITEM_TO_OBSERVE, 'visible')
      .done();
  }

  ['@test should fire only twice when item is moved into viewport, out, and then back in']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForExposed(1)
      .scrollTo(300)
      .scrollTo(250)
      .assertOnce(ITEM_TO_OBSERVE, 'visible')
      .scrollTo(10)
      .waitForNthElemEvent('first', 'exposed', '1')
      .scrollTo(200)
      .waitForExposed(2)
      .assertEvent(ITEM_TO_OBSERVE, 'visible', 2)
      .done();
  }
});
