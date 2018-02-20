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

const { time: { IMPRESSION_THRESHOLD, RAF_THRESHOLD }, ITEM_TO_OBSERVE } = constants;

testModule('Impression Complete event', class extends WatcherTestClass {
  ['@test should not fire if item is not exposed']() {
    return this.context.assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire if item is visible, but not enough time lapsed']() {
    return this.context.scrollTo(100)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire when item is moved into viewport and remains the threshold time, but has not yet left viewport']() {
    return this.context.scrollTo(100)
      .wait(IMPRESSION_THRESHOLD)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should not fire when item is visible, moves several times, enough time has lapsed, but has not left viewport']() {
    return this.context.scrollTo(100)
      .wait(IMPRESSION_THRESHOLD)
      .scrollTo(110)
      .wait(IMPRESSION_THRESHOLD)
      .scrollTo(150)
      .assertNever(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, remains for threshold time, then moves out of viewport']() {
    return this.context.scrollTo(200)
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 4)
      .scrollTo(0)
      .wait(IMPRESSION_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire when item is moved into viewport, remains for threshold time, then unwatched']() {
    return this.context.scrollTo(200)
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 4)
      .unwatch(ITEM_TO_OBSERVE)
      .wait(RAF_THRESHOLD * 2)
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should pass impression duration, within 50ms accuracy, to callback']() {
    return this.context.scrollTo(150)
      .wait(IMPRESSION_THRESHOLD * 5)
      .scrollTo(0)
      .wait(RAF_THRESHOLD)
      .assert(function(e) {
        return e.meta.duration >= 495 && e.meta.duration <= 545 && e.id === 5 && e.e === 'impression-complete';
      }, 1)
      .done();
  }

  ['@test should fire only once when item is moved into viewport, is moved while remaining in viewport, after the threshold time, then moves out of viewport']() {
    return this.context.scrollTo(200)
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 4)
      .scrollTo(100)
      .wait(RAF_THRESHOLD * 5)
      .scrollTo(0)
      .wait(RAF_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'impression-complete')
      .done();
  }

  ['@test should fire twice if moved into viewport for threshold and back out twice']() {
    return this.context.scrollTo(200)
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 4)
      .scrollTo(0)
      .wait(RAF_THRESHOLD * 5)
      .scrollTo(250)
      .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 4)
      .scrollTo(0)
      .wait(RAF_THRESHOLD)
      .assertEvent(ITEM_TO_OBSERVE, 'impression-complete', 2)
      .done();
  }
});
