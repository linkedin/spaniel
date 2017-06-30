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

const { time: { IMPRESSION_THRESHOLD, RAF_THRESHOLD, SMALL }, ITEM_TO_OBSERVE, NUM_SKIPPED_FRAMES } = constants;

class ImpressionEventTestClass extends WatcherTestClass {
  setupTest(customSetup) {
    return this.context.evaluate(customSetup || (() => {
      watcher.disconnect();
      var el = document.querySelector('.tracked-item[data-id="5"]')
      var id = el.getAttribute('data-id');
      window.watcher.watch(el, function(e, meta) {
        if (e == 'visible') {
          createDiv('visible-div');
        } else if (e == 'exposed') {
          createDiv('exposed-div');
        }
        var end = meta && meta.duration ? ' for ' + meta.duration + ' milliseconds' : '';
        console.log(id + ' ' + e + end);
        GLOBAL_TEST_EVENTS.push({
          id: parseInt(id),
          e: e,
          meta: meta || {}
        });
      });

      var referenceElement = document.querySelector('.tracked-item[data-id="1"]');
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

testModule('Impression event', class extends ImpressionEventTestClass {
  ['@test should not fire if item is exposed but not impressed']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(50)
      .waitForExposed()
      .assertOnce(ITEM_TO_OBSERVE, 'exposed')
      .assertNever(ITEM_TO_OBSERVE, 'impressed')
      .assertOnce(ITEM_TO_OBSERVE, 'exposed')
      .done();
  }

  ['@test should not fire if item is visible, but not enough time lapsed']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .assertNever(ITEM_TO_OBSERVE, 'impressed')
      .done();
  }

  ['@test should not fire when item is visible, moves several times, but not enough time lapsed']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(150)
      .scrollTo(250)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '1')
      .assertNever(ITEM_TO_OBSERVE, 'impressed')
      .done();
  }

  ['@test should fire only once when item is moved into viewport and remains the threshold time']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForVisible()
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'impressed')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, is moved while remaining in viewport, after the threshold time']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(300)
      .scrollTo(250)
      .scrollTo(275)
      .assertNever(ITEM_TO_OBSERVE, 'impressed', 'should not be impressed before threshold')
      .waitForVisible()
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'impressed', 'should be impressed after threshold')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, out, and then back in, all before threshold time']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .wait(RAF_THRESHOLD * 3)
      .scrollTo(0)
      .assertNever(ITEM_TO_OBSERVE, 'impressed')
      .scrollTo(200)
      .waitForVisible()
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'impressed')
      .done();
  }
});
