/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import sinon from 'sinon';
import {
  default as testModule,
  TestClass
} from './../../test-module';

testModule('Watcher', class extends TestClass {
  ['@test unwatch works']() {
    return this.context.evaluate(() => {
      window.STATE.exposed = 0;
      window.watcher = new spaniel.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      window.watcher.watch(window.target, function() {
        window.STATE.exposed++;
      });
    })
    .wait(50)
    .scrollTo(200)
    .wait(50)
    .scrollTo(0)
    .wait(50)
    .evaluate(() => {
      window.watcher.unwatch(window.target);
    })
    .wait(50)
    .scrollTo(200)
    .wait(50)
    .getExecution()
    .evaluate(function() {
      return window.STATE.exposed;
    }).then(function(result) {
      assert.equal(result, 1, 'Callback fired only once');
    });
  }
  ['@test unwatching from one watcher does not unwatch others']() {
    return this.context.evaluate(() => {
      window.STATE.exposed = 0;
      window.watcher1 = new spaniel.Watcher();
      window.watcher2 = new spaniel.Watcher();
      window.target = document.querySelector('.tracked-item[data-id="6"]');
      window.watcher1.watch(window.target, function() {
        window.STATE.exposed++;
      });
      window.watcher2.watch(window.target, function() {
        window.STATE.exposed++;
      });
    })
    .wait(50)
    .scrollTo(200)
    .wait(50)
    .scrollTo(0)
    .wait(50)
    .evaluate(() => {
      window.watcher1.unwatch(window.target);
    })
    .wait(50)
    .scrollTo(200)
    .wait(50)
    .getExecution()
    .evaluate(function() {
      return window.STATE.exposed;
    }).then(function(result) {
      assert.equal(result, 3, 'Callback fired 3 times');
    });
  }
  ['@test watched item callbacks fire in order']() {
    return this.context.evaluate(() => {
      window.STATE.order = [];
      window.watcher = new spaniel.Watcher();
      var t1 = document.querySelector('.tracked-item[data-id="1"]');
      var t2 = document.querySelector('.tracked-item[data-id="2"]');
      window.watcher.watch(t1, function() {
        window.STATE.order.push(1);
      });
      window.watcher.watch(t2, function() {
        window.STATE.order.push(2);
      });
    })
    .wait(50)
    .getExecution()
    .evaluate(function() {
      return window.STATE.order;
    }).then(function(result) {
      assert.equal(result[0], 1, 'First watched item callback fires first');
      assert.equal(result[1], 2, 'Second watched item callback fires second');
    });
  }
});