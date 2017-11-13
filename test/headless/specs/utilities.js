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
  ITEM_TO_OBSERVE,
  VIEWPORT
} = constants;

testModule('Window Proxy', class extends TestClass {
  ['@test destroy works']() {
    return this.context.evaluate(() => {
      window.watcher = new spaniel.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      window.watcher.watch(window.target, () => {});
    })
    .wait(RAF_THRESHOLD * 5)
    .evaluate(() => {
      window.watcher.destroy();
    })
    .getExecution()
    .evaluate(function() {
      return spaniel.__w__.onWindowIsDirtyListeners.length;
    }).then(function(result) {
      assert.equal(result, 0, 'All window isDirty listeners have been removed');
    });
  }
  ['@test can listen to window isDirty']() {
    return this.context.evaluate(() => {
      window.watcher = new spaniel.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      window.watcher.watch(window.target, () => {});
    })
    .wait(RAF_THRESHOLD * 5)
    .getExecution()
    .evaluate(function() {
      let id = window.watcher.observer.observer.scheduler.id;
      return spaniel.__w__.onWindowIsDirtyListeners.filter(listener => listener.id === id);
    }).then(function(result) {
      assert.lengthOf(result, 1, 'This watcher is listening on window isDirty');
    });
  }
  ['@test window isDirty validation on scroll']() {
    return this.context.evaluate(() => {
      window.testIsDirty = false;
      spaniel.__w__.onWindowIsDirtyListeners.push({fn: () => { window.testIsDirty = true }, scope: window, id: 'foo1' });
    })
    .wait(RAF_THRESHOLD * 5)
    .scrollTo(10)
    .getExecution()
    .evaluate(function() {
      return window.testIsDirty;
    }).then(function(result) {
      assert.isTrue(result, 'The window isDirty');
    });
  }
  ['@test window isDirty validation on resize']() {
    return this.context.evaluate(() => {
      window.testIsDirty = false;
      spaniel.__w__.onWindowIsDirtyListeners.push({fn: () => { window.testIsDirty = true }, scope: window, id: 'foo2' });
    })
    .wait(RAF_THRESHOLD * 5)
    .viewport(VIEWPORT.WIDTH + 100, VIEWPORT.HEIGHT + 100)   
    .wait(RAF_THRESHOLD * 5)
    .viewport(VIEWPORT.WIDTH, VIEWPORT.HEIGHT)   
    .getExecution()
    .evaluate(function() {
      return window.testIsDirty;
    }).then(function(result) {
      assert.isTrue(result, 'The window isDirty');
    });
  }
});

testModule('elementSatisfiesRatio', class extends TestClass {
  ['@test passes true into callback when ratio satisfied']() {
    return this.context.evaluate(function() {
      window.STATE.satisfied = null;
      var el = document.querySelector('.tracked-item[data-id="1"]');
      spaniel.elementSatisfiesRatio(el, 1, function(a) {
        window.STATE.satisfied = true;
      })
    })
    .wait(RAF_THRESHOLD * 5)
    .getExecution()
    .wait(RAF_THRESHOLD)
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
    .wait(RAF_THRESHOLD * 8)
    .getExecution()
    .wait(RAF_THRESHOLD)
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
    .wait(RAF_THRESHOLD * 4)
    .getExecution()
    .wait(RAF_THRESHOLD)
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
    .wait(RAF_THRESHOLD * 3)
    .scrollTo(20)
    .wait(RAF_THRESHOLD * 3)
    .getExecution()
    .wait(RAF_THRESHOLD)
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
    .wait(RAF_THRESHOLD * 5)
    .evaluate(function() {
      spaniel.off('scroll', window.STATE.scrollHandler);;
    })
    .scrollTo(30)
    .wait(RAF_THRESHOLD * 3)
    .scrollTo(30)
    .wait(RAF_THRESHOLD * 3)
    .getExecution()
    .wait(RAF_THRESHOLD)
    .evaluate(function() {
      return window.STATE.scrollEvents;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired once');
    });
  }
});
