/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import sinon from 'sinon';
import {
  default as testModule,
  TestClass
} from './../test-module';

class SpanielObserverTestClass extends TestClass {
  setupTest() {
    return this.context.evaluate(() => {
      window.STATE.impressions = 0;
      let target = document.querySelector('.tracked-item[data-id="1"]');
      let observer = new spaniel.SpanielObserver(function(changes) {
        for (var i = 0; i < changes.length; i++) {
          if (changes[i].entering) {
            window.STATE.impressions++;
          }
        }
      }, {
        threshold: [{
          label: 'impressed',
          ratio: 0.5,
          time: 200
        }]
      });
      observer.observe(target);
    });
  }
}

testModule('SpanielObserver', class extends SpanielObserverTestClass {
  ['@test observing a visible element should not fire if threshold time has not passed']() {
    return this.setupTest()
      .wait(100)
      .getExecution()
      .evaluate(function() {
        return window.STATE.impressions;
      }).then(function(result) {
        assert.equal(result, 0, 'Callback not fired');
      });
  }

  ['@test observing a visible element should fire after threshold time has passed']() {
    return this.setupTest()
      .wait(250)
      .getExecution()
      .evaluate(function() {
        return window.STATE.impressions;
      }).then(function(result) {
        assert.equal(result, 1, 'Callback fired once');
      });
  }
});
