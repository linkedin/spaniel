/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import sinon from 'sinon';
import { default as testModule, TestClass } from './../test-module';

class SpanielObserverTestClass extends TestClass {
  setupTest(customSetup) {
    return this.context.evaluate(
      customSetup ||
        (() => {
          window.STATE.impressions = 0;
          window.STATE.completes = 0;
          window.target = document.querySelector('.tracked-item[data-id="1"]');
          window.observer = new spaniel.SpanielObserver(
            function(changes) {
              for (var i = 0; i < changes.length; i++) {
                if (changes[i].entering) {
                  window.STATE.impressions++;
                } else {
                  window.STATE.completes++;
                }
              }
            },
            {
              threshold: [
                {
                  label: 'impressed',
                  ratio: 0.5,
                  time: 200
                }
              ]
            }
          );
          window.observer.observe(window.target);
        })
    );
  }
}

testModule(
  'SpanielObserver',
  class extends SpanielObserverTestClass {
    ['@test observing a visible element should not fire if threshold time has not passed']() {
      return this.setupTest()
        .wait(100)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 0, 'Callback not fired');
        });
    }
    ['@test observing a visible element should fire after threshold time has passed']() {
      return this.setupTest()
        .wait(250)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired once');
        });
    }
    ['@test unobserving after threshold results in exiting event']() {
      return this.setupTest()
        .wait(300)
        .evaluate(function() {
          window.observer.unobserve(window.target);
        })
        .wait(20)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions === 1 && window.STATE.completes === 1;
        })
        .then(function(result) {
          assert.equal(result, true, 'Entering and exiting event each fired once');
        });
    }
    ['@test unobserving before threshold results in no events']() {
      return this.setupTest()
        .wait(20)
        .evaluate(function() {
          window.observer.unobserve(window.target);
        })
        .wait(300)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions + window.STATE.completes;
        })
        .then(function(result) {
          assert.equal(result, 0, 'Callback not fired');
        });
    }
    ['@test unobserving inside observer callback results in one entering entry and one exiting entry']() {
      return this.setupTest(() => {
        window.STATE.impressions = 0;
        window.STATE.completes = 0;
        window.target = document.querySelector('.tracked-item[data-id="1"]');
        window.observer = new spaniel.SpanielObserver(
          function(changes) {
            for (var i = 0; i < changes.length; i++) {
              if (changes[i].entering) {
                window.STATE.impressions++;
              } else {
                window.STATE.completes++;
              }
            }
            window.observer.unobserve(window.target);
          },
          {
            threshold: [
              {
                label: 'impressed',
                ratio: 0.5,
                time: 0
              }
            ]
          }
        );
        window.observer.observe(window.target);
      })
        .wait(300)
        .evaluate(function() {
          window.observer.unobserve(window.target);
        })
        .wait(20)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions === 1 && window.STATE.completes === 1;
        })
        .then(function(result) {
          assert.equal(result, true, 'Entering and exiting event each fired once');
        });
    }
  }
);
