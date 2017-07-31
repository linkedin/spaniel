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

const { time: { RAF_THRESHOLD }, ITEM_TO_OBSERVE, NUM_SKIPPED_FRAMES } = constants;

testModule('elementSatisfiesRatio', class extends TestClass {
  ['@test passes true into callback when ratio satisfied']() {
    return this.context.evaluate(function() {
      window.STATE.satisfied = null;
      var el = document.querySelector('.tracked-item[data-id="1"]');
      spanielInstance.elementSatisfiesRatio(el, 1, function(a) {
        window.STATE.satisfied = true;
        createDiv('satisfied-div');
        document.body.appendChild(div);
      })
    })
    .waitForRatioSatisfiedDiv()
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
      spanielInstance.elementSatisfiesRatio(el, 1, function(a) {
        window.STATE.satisfied = false;
        createDiv('satisfied-div');
      })
    })
    .waitForRatioSatisfiedDiv('#satisfied-div')
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
      spanielInstance.on('scroll', function() {
        window.STATE.scrollEvents++;
        createDiv('scroll-div-' + window.STATE.scrollEvents);
      });
    })
    .scrollTo(10)
    .waitForScroll(1)
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
      spanielInstance.on('scroll', function() {
        window.STATE.scrollEvents++;
        createDiv('scroll-div-' + window.STATE.scrollEvents);
      });
    })
    .scrollTo(10)
    .waitForScroll(1)
    .scrollTo(20)
    .waitForScroll(2)
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
        createDiv('scroll-div-' + window.STATE.scrollEvents);
      };
      spanielInstance.on('scroll',  window.STATE.scrollHandler);
    })
    .scrollTo(10)
    .waitForScroll(1)
    .evaluate(function() {
      spanielInstance.off('scroll', window.STATE.scrollHandler);;
    })
    .scrollTo(30)
    .scrollTo(30)
    .getExecution()
    .evaluate(function() {
      return window.STATE.scrollEvents;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired once');
    });
  }
});
