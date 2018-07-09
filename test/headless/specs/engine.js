/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  TestClass
} from './../test-module';

import constants from './../../constants.js';

const { 
  time: { 
    RAF_THRESHOLD
  },
  VIEWPORT
} = constants;

testModule('Engine', class extends TestClass {
  ['@test can scheduleRead']() {
    return this.context.evaluate(() => {
      let observer = new spaniel.IntersectionObserver(function() {
        window.STATE.impressions++;
      });
      observer.observe(target);
    })
    .wait(RAF_THRESHOLD * 5)
    .scrollTo(100)
    .getExecution()
    .evaluate(function() {
      return window.lastVersion !== spaniel.__w__.version;
    }).then(function(result) {
      assert.isTrue(result, 'The window isDirty');
    });
  }
  ['@test can scheduleWork']() {
    return this.context.evaluate(() => {
      window.lastVersion = spaniel.__w__.version;
    })
    .wait(RAF_THRESHOLD * 5)
    .viewport(VIEWPORT.WIDTH + 100, VIEWPORT.HEIGHT + 100)   
    .wait(RAF_THRESHOLD * 5)
    .viewport(VIEWPORT.WIDTH, VIEWPORT.HEIGHT)   
    .getExecution()
    .evaluate(function() {
      return window.lastVersion !== spaniel.__w__.version;
    }).then(function(result) {
      assert.isTrue(result, 'The window isDirty');
    });
  }
});