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

const { time: { RAF_THRESHOLD }, ITEM_TO_OBSERVE } = constants;

testModule('Watcher Exposed Event', class extends WatcherTestClass {
  ['@test should not fire if item is not exposed']() {
    return this.context.assertNever(ITEM_TO_OBSERVE, 'exposed')
      .done();
  }

  ['@test should fire if item is exposed']() {
    return this.context.wait(20)
      .scrollTo(300)
      .wait(RAF_THRESHOLD * 4)
      .assertOnce(ITEM_TO_OBSERVE, 'exposed')
      .done();
  }

  ['@test should fire once if item is exposed and window moves while still exposed']() {
    return this.context.scrollTo(100)
      .scrollTo(140)
      .scrollTo(120)
      .wait(RAF_THRESHOLD)
      .assertOnce(ITEM_TO_OBSERVE, 'exposed')
      .done();
  }

  ['@test should fire twice if moved in, out, and then back in viewport']() {
    return this.context.scrollTo(100)
      .scrollTo(140)
      .wait(RAF_THRESHOLD)
      .scrollTo(120)
      .wait(RAF_THRESHOLD)
      .scrollTo(0)
      .wait(RAF_THRESHOLD)
      .scrollTo(50)
      .wait(RAF_THRESHOLD)
      .assertEvent(ITEM_TO_OBSERVE, 'exposed', 2)
      .done();
  }
});
