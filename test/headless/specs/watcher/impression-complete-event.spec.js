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

const { time: { IMPRESSION_THRESHOLD, RAF_THRESHOLD }, ITEM_TO_OBSERVE, NUM_SKIPPED_FRAMES } = constants;

class ImpressionCompleteEventTestClass extends WatcherTestClass {
  setupTest(customSetup) {
    return this.context.evaluate(customSetup || (() => {
      watcher.disconnect();
      var el = document.querySelector('.tracked-item[data-id="5"]')
      var id = el.getAttribute('data-id');
      window.STATE.exposedFirst = 0;
      window.STATE.exposedFifth = 0;
      window.STATE.impressedFifth = 0;
      window.watcher.watch(el, function(e, meta) {
        if (e == 'exposed') {
          window.STATE.exposedFifth++;
          createDiv('fifth-element-exposed-div-' + window.STATE.exposedFifth);
        } else if (e == 'impressed') {
          window.STATE.impressedFifth++;
          createDiv('fifth-element-impressed-div-' + window.STATE.impressedFifth);
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
      window.watcher.watch(referenceElement, function(e, meta) {
        if (e == 'exposed') {
          window.STATE.exposedFirst++;
          createDiv('first-element-exposed-div-' + window.STATE.exposedFirst);
        }
      });
    }));
  }
}

testModule('Impression Complete event', class extends ImpressionCompleteEventTestClass {
  ['@test should not fire if item is not exposed']() {
    return this.setupTest()
      .onDOMReady()
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire if item is visible, but not enough time lapsed']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(100)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire when item is moved into viewport and remains the threshold time, but has not yet left viewport']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(100)
      .wait(IMPRESSION_THRESHOLD)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire when item is visible, moves several times, enough time has lapsed, but has not left viewport']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(100)
      .wait(IMPRESSION_THRESHOLD)
      .scrollTo(110)
      .wait(IMPRESSION_THRESHOLD)
      .scrollTo(150)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, remains for threshold time, then moves out of viewport']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForNthElemEvent('fifth', 'exposed', '1')
      .wait(IMPRESSION_THRESHOLD)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '1')
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire when item is moved into viewport, remains for threshold time, then unwatched']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForNthElemEvent('fifth', 'exposed', '1')
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD)
      .waitForNthElemEvent('fifth', 'impressed', '1')
      .unwatch(ITEM_TO_OBSERVE)
      .wait(RAF_THRESHOLD * NUM_SKIPPED_FRAMES)
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should pass impression duration, within 50ms accuracy, to callback']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(150)
      .wait(IMPRESSION_THRESHOLD * 3)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '1')
      .assert(function(e) {
        return e.meta.duration >= (IMPRESSION_THRESHOLD * 3 - (RAF_THRESHOLD * NUM_SKIPPED_FRAMES)) && e.meta.duration <= (IMPRESSION_THRESHOLD * 3 + (RAF_THRESHOLD * NUM_SKIPPED_FRAMES)) && e.id === 5 && e.e === 'impression-complete';
      }, 1)
      .done();
  }

  ['@test should fire only once when item is moved into viewport, is moved while remaining in viewport, after the threshold time, then moves out of viewport']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForNthElemEvent('fifth', 'exposed', '1')
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * NUM_SKIPPED_FRAMES)
      .scrollTo(100)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '1')
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire twice if moved into viewport for threshold and back out twice']() {
    return this.setupTest()
      .onDOMReady()
      .scrollTo(200)
      .waitForNthElemEvent('fifth', 'exposed', '1')
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * NUM_SKIPPED_FRAMES)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '1')
      .scrollTo(250)
      .waitForNthElemEvent('fifth', 'exposed', '2')
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * NUM_SKIPPED_FRAMES)
      .scrollTo(0)
      .waitForNthElemEvent('first', 'exposed', '2')
      .assertEvent(ITEM_TO_OBSERVE, 'impression-complete', 2)
      .done();
  }
});
