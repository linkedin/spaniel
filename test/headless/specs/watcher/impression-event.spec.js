/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  WatcherTestClass
} from './../../test-module';

testModule('Impression event', class extends WatcherTestClass {
  ['@test should not fire if item is exposed but not impressed']() {
    return this.context.scrollTo(50)
      .assertOnce(5, 'exposed')
      .assertNever(5, 'impressed')
      .assertOnce(5, 'exposed')
      .done();
  }

  ['@test should not fire if item is visible, but not enough time lapsed']() {
    return this.context.scrollTo(200)
      .wait(20)
      .assertNever(5, 'impressed').done();
  }

  ['@test should not fire when item is visible, moves several times, but not enough time lapsed']() {
    return this.context.scrollTo(150)
      .wait(5)
      .scrollTo(250)
      .wait(5)
      .scrollTo(0)
      .wait(5)
      .assertNever(5, 'impressed').done();
  }

  ['@test should fire only once when item is moved into viewport and remains the threshold time']() {
    return this.context.scrollTo(200)
      .wait(200)
      .assertOnce(5, 'impressed')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, is moved while remaining in viewport, after the threshold time']() {
    return this.context.scrollTo(300)
      .wait(5)
      .scrollTo(250)
      .wait(5)
      .scrollTo(275)
      .assertNever(5, 'impressed', 'should not be impressed before threshold')
      .wait(100)
      .assertOnce(5, 'impressed', 'should be impressed after threshold')
      .done();
  }

  ['@test should fire only once when item is moved into viewport, out, and then back in, all before threshold time']() {
    return this.context.scrollTo(200)
      .wait(5)
      .scrollTo(0)
      .wait(5)
      .assertNever(5, 'impressed')
      .scrollTo(200)
      .wait(110)
      .assertOnce(5, 'impressed')
      .done();
  }
});
