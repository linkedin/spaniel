/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import {
  default as testModule,
  TestClass
} from './../test-module';

testModule('elementSatisfiesRatio', class extends TestClass {
  ['@test passes true into callback when ratio satisfied']() {
    return this.context.evaluate(function() {
      window.STATE.satisfied = null;
      var el = document.querySelector('.tracked-item[data-id="1"]');
      spaniel.elementSatisfiesRatio(el, 1, function(a) {
        window.STATE.satisfied = true;
      })
    })
    .wait(30)
    .getExecution()
    .evaluate(function() {
      return window.STATE.satisfied;
    }).then(function(result) {
      assert.equal(result, true, 'Callback passed true');
    });
  }

  ['@test passes false into callback when ratio not satisfied']() {
    return this.context.evaluate(function() {
      window.STATE.satisfied = null;
      var el = document.querySelector('.tracked-item[data-id="10"]');
      spaniel.elementSatisfiesRatio(el, 1, function(a) {
        window.STATE.satisfied = false;
      })
    })
    .wait(30)
    .getExecution()
    .evaluate(function() {
      return window.STATE.satisfied;
    }).then(function(result) {
      assert.equal(result, false, 'Callback passed false');
    });
  }
});

testModule('Eventing', class extends TestClass {
  ['@test scroll event callback fires']() {
    return this.context.evaluate(function() {
      window.STATE.scrollEvents = 0;
      spaniel.on('scroll', function() {
        window.STATE.scrollEvents++;
      });
    })
    .scrollTo(10)
    .wait(20)
    .getExecution()
    .evaluate(function() {
      return window.STATE.scrollEvents;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired once');
    });
  }

  ['@test scroll event callback fires twice with two scrolls']() {
    return this.context.evaluate(function() {
      window.STATE.scrollEvents = 0;
      spaniel.on('scroll', function() {
        window.STATE.scrollEvents++;
      });
    })
    .scrollTo(10)
    .wait(30)
    .scrollTo(20)
    .wait(30)
    .getExecution()
    .evaluate(function() {
      return window.STATE.scrollEvents;
    }).then(function(result) {
      assert.equal(result, 2, 'Callback fired twice');
    });
  }

  ['@test scroll event callback can be unbound']() {
    return this.context.evaluate(function() {
      window.STATE.scrollEvents = 0;
      window.STATE.scrollHandler = function() {
        window.STATE.scrollEvents++;
      };
      spaniel.on('scroll',  window.STATE.scrollHandler);
    })
    .scrollTo(10)
    .wait(30)
    .evaluate(function() {
      spaniel.off('scroll', window.STATE.scrollHandler);;
    })
    .scrollTo(30)
    .wait(20)
    .scrollTo(30)
    .wait(20)
    .getExecution()
    .evaluate(function() {
      return window.STATE.scrollEvents;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired once');
    });
  }
});
