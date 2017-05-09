/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  WatcherTestClass
} from './../../test-module';

testModule('Visible event', class extends WatcherTestClass {
  ['@test should not fire if item is exposed but not visible']() {
    return this.context.scrollTo(50)
      .assertOnce(5, 'exposed')
      .assertNever(5, 'visible')
      .done();
  }

  ['@test should fire if item is visible']() {
    return this.context.scrollTo(200)
      .assertOnce(5, 'visible')
      .done();
  }

  ['@test should fire only once when item is moved while visible']() {
    return this.context.scrollTo(200)
      .wait(50)
      .scrollTo(300)
      .wait(50)
      .scrollTo(250)
      .assertOnce(5, 'visible')
      .done();
  }

  ['@test should fire only twice when item is moved into viewport, out, and then back in']() {
    return this.context.scrollTo(200)
      .wait(50)
      .scrollTo(300)
      .wait(50)
      .scrollTo(250)
      .assertOnce(5, 'visible')
      .scrollTo(10)
      .wait(50)
      .scrollTo(200)
      .assertEvent(5, 'visible', 2)
      .done();
  }
});
