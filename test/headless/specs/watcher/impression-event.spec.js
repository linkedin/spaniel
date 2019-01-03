/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import { default as testModule, WatcherTestClass } from './../../test-module';

import constants from './../../../constants.js';

const {
  time: { IMPRESSION_THRESHOLD, RAF_THRESHOLD, SMALL },
  ITEM_TO_OBSERVE
} = constants;

testModule(
  'Impression event',
  class extends WatcherTestClass {
    ['@test should not fire if item is exposed but not impressed']() {
      return this.context
        .scrollTo(50)
        .wait(RAF_THRESHOLD * 2)
        .assertOnce(ITEM_TO_OBSERVE, 'exposed')
        .assertNever(ITEM_TO_OBSERVE, 'impressed')
        .assertOnce(ITEM_TO_OBSERVE, 'exposed')
        .done();
    }

    ['@test should not fire if item is visible, but not enough time lapsed']() {
      return this.context
        .scrollTo(200)
        .wait(20)
        .assertNever(ITEM_TO_OBSERVE, 'impressed')
        .done();
    }

    ['@test should not fire when item is visible, moves several times, but not enough time lapsed']() {
      return this.context
        .scrollTo(150)
        .wait(RAF_THRESHOLD)
        .scrollTo(250)
        .wait(RAF_THRESHOLD)
        .scrollTo(0)
        .assertNever(ITEM_TO_OBSERVE, 'impressed')
        .done();
    }

    ['@test should fire only once when item is moved into viewport and remains the threshold time']() {
      return this.context
        .scrollTo(200)
        .wait(IMPRESSION_THRESHOLD * 2)
        .assertOnce(ITEM_TO_OBSERVE, 'impressed')
        .done();
    }

    ['@test should fire only once when item is moved into viewport, is moved while remaining in viewport, after the threshold time']() {
      return this.context
        .scrollTo(300)
        .wait(SMALL)
        .scrollTo(250)
        .wait(SMALL)
        .scrollTo(275)
        .wait(SMALL)
        .assertNever(ITEM_TO_OBSERVE, 'impressed', 'should not be impressed before threshold')
        .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD * 5)
        .assertOnce(ITEM_TO_OBSERVE, 'impressed', 'should be impressed after threshold')
        .done();
    }

    ['@test should fire only once when item is moved into viewport, out, and then back in, all before threshold time']() {
      return this.context
        .scrollTo(200)
        .wait(RAF_THRESHOLD)
        .scrollTo(0)
        .wait(RAF_THRESHOLD)
        .assertNever(ITEM_TO_OBSERVE, 'impressed')
        .scrollTo(200)
        .wait(IMPRESSION_THRESHOLD + RAF_THRESHOLD)
        .assertOnce(ITEM_TO_OBSERVE, 'impressed')
        .done();
    }
  }
);
