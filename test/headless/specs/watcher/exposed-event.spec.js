/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  WatcherTestClass
} from './../../test-module';

testModule('Watcher Exposed Event', class extends WatcherTestClass {
  ['@test should not fire if item is not exposed']() {
    return this.context.assertNever(5, 'exposed')
      .done();
  }

  ['@test should fire if item is exposed']() {
    return this.context.wait(10).scrollTo(300).wait(10).assertOnce(5, 'exposed')
      .done();
  }

  ['@test should fire once if item is exposed and window moves while still exposed']() {
    return this.context.scrollTo(100)
      .scrollTo(140)
      .scrollTo(120)
      .assertOnce(5, 'exposed')
        .done();
  }

  ['@test should fire twice if moved in, out, and then back in viewport']() {
    return this.context.scrollTo(100)
      .scrollTo(140)
      .scrollTo(120)
      .scrollTo(0)
      .scrollTo(50)
      .assertEvent(5, 'exposed', 2)
        .done();
  }
});
