/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import { default as testModule, WatcherTestClass } from './../../test-module';

import constants from './../../../constants.js';

const {
  time: { RAF_THRESHOLD },
  ITEM_TO_OBSERVE
} = constants;

testModule(
  'Visible event',
  class extends WatcherTestClass {
    ['@test should not fire if item is exposed but not visible']() {
      return this.context
        .scrollTo(50)
        .wait(RAF_THRESHOLD * 2)
        .assertOnce(ITEM_TO_OBSERVE, 'exposed')
        .assertNever(ITEM_TO_OBSERVE, 'visible')
        .done();
    }

    ['@test should fire if item is visible']() {
      return this.context
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .assertOnce(ITEM_TO_OBSERVE, 'visible')
        .done();
    }

    ['@test should fire only once when item is moved while visible']() {
      return this.context
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(300)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(250)
        .assertOnce(ITEM_TO_OBSERVE, 'visible')
        .done();
    }

    ['@test should fire only twice when item is moved into viewport, out, and then back in']() {
      return this.context
        .scrollTo(200)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(300)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(250)
        .assertOnce(ITEM_TO_OBSERVE, 'visible')
        .scrollTo(10)
        .wait(RAF_THRESHOLD * 5)
        .scrollTo(200)
        .wait(RAF_THRESHOLD)
        .assertEvent(ITEM_TO_OBSERVE, 'visible', 2)
        .done();
    }
  }
);
