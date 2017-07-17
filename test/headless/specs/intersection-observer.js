/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, softwaredistributed under the License is distributed on an "AS IS" BASIS,WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import { default as testModule, TestClass } from './../test-module';

import constants from './../../constants.js';

const {
  time: { IMPRESSION_THRESHOLD }
} = constants;

testModule(
  'IntersectionObserver',
  class extends TestClass {
    ['@test observing a visible element should fire callback immediately']() {
      return this.context
        .evaluate(() => {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="1"]');
          let observer = new spaniel.IntersectionObserver(function() {
            window.STATE.impressions++;
          });
          observer.observe(target);
        })
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired once');
        });
    }

    ['@test observing a visible element with a single threshold should fire callback immediately']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="1"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              threshold: 0.9
            }
          );
          observer.observe(target);
        })
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired once');
        });
    }

    ['@test observing a hidden element should fire an event with a ratio of 0']() {
      return this.context
        .evaluate(() => {
          window.STATE.intersectionEvents = 0;
          window.STATE.impressions = 0;
          let target = (window.testTarget = document.querySelector('.tracked-item[data-id="1"]'));
          target.style.display = 'none';
          let observer = new spaniel.IntersectionObserver(function(entries) {
            window.STATE.intersectionEvents++;

            if (entries[0].intersectionRatio > 0) {
              window.STATE.impressions++;
            }
          });
          observer.observe(target);
        })
        .wait(IMPRESSION_THRESHOLD)
        .getExecution()
        .evaluate(function() {
          return window.STATE;
        })
        .then(function({ impressions, intersectionEvents }) {
          assert.equal(impressions, 0, 'No visible events');
          assert.equal(intersectionEvents, 1, 'Callback fired once');
        });
    }

    ['@test hiding an observed element should fire an event without isIntersecting']() {
      return this.context
        .evaluate(() => {
          window.STATE.intersectionEvents = 0;
          window.STATE.impressions = 0;
          let target = (window.testTarget = document.querySelector('.tracked-item[data-id="1"]'));
          let observer = new spaniel.IntersectionObserver(function(entries) {
            window.STATE.intersectionEvents++;

            if (entries[0].isIntersecting) {
              window.STATE.impressions++;
            }
          });
          observer.observe(target);
        })
        .wait(IMPRESSION_THRESHOLD)
        .evaluate(function() {
          window.testTarget.style.display = 'none';
        })
        .wait(IMPRESSION_THRESHOLD)
        .getExecution()
        .evaluate(function() {
          return window.STATE;
        })
        .then(function({ impressions, intersectionEvents }) {
          assert.equal(intersectionEvents, 2, 'Callback fired twice');
          assert.equal(impressions, 1, 'One visible event');
        });
    }

    ['@test observing a non visible element should not fire']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="5"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              threshold: 0.75
            }
          );
          observer.observe(target);
        })
        .scrollTo(74)
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 0, 'Callback fired zero times');
        });
    }

    ['@test observing a non visible element and then scrolling just past threshold should fire once']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="5"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              threshold: 0.75
            }
          );
          observer.observe(target);
        })
        .wait(100)
        .scrollTo(80)
        .wait(100)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired once');
        });
    }

    ['@test observing a non visible element and then scrolling just past threshold and then back out should fire twice']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="5"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              threshold: 0.75
            }
          );
          observer.observe(target);
        })
        .wait(100)
        .scrollTo(80)
        .wait(100)
        .scrollTo(70)
        .wait(100)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 2, 'Callback fired twice');
        });
    }

    ['@test setting rootMargin and then scrolling just past threshold and then back out should fire twice']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let target = document.querySelector('.tracked-item[data-id="5"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              threshold: 0.75,
              rootMargin: '25px 0px'
            }
          );
          observer.observe(target);
        })
        .wait(100)
        .scrollTo(105)
        .wait(100)
        .scrollTo(95)
        .wait(100)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 2, 'Callback fired twice');
        });
    }

    ['@test unobserve should work with single element']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          window.target = document.querySelector('.tracked-item[data-id="1"]');
          window.observer = new spaniel.IntersectionObserver(function() {
            window.STATE.impressions++;
          });
          window.observer.observe(window.target);
        })
        .wait(50)
        .evaluate(function() {
          window.observer.unobserve(window.target);
        })
        .wait(50)
        .scrollTo(500)
        .wait(50)
        .scrollTo(0)
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 1, 'Callback fired only once');
        });
    }

    ['@test disconnect should work with multiple elements']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          target1 = document.querySelector('.tracked-item[data-id="1"]');
          target2 = document.querySelector('.tracked-item[data-id="2"]');
          target3 = document.querySelector('.tracked-item[data-id="3"]');
          window.observer = new spaniel.IntersectionObserver(function() {
            window.STATE.impressions++;
          });
          window.observer.observe(target1);
          window.observer.observe(target2);
          window.observer.observe(target3);
        })
        .wait(50)
        .evaluate(function() {
          window.observer.disconnect();
        })
        .wait(50)
        .scrollTo(500)
        .wait(50)
        .scrollTo(0)
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 3, 'Callback fired 3 times');
        });
    }

    ['@test can restart observing after disconnect']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          target1 = document.querySelector('.tracked-item[data-id="1"]');
          target2 = document.querySelector('.tracked-item[data-id="2"]');
          target3 = document.querySelector('.tracked-item[data-id="3"]');
          window.observer = new spaniel.IntersectionObserver(function() {
            window.STATE.impressions++;
          });
          window.observer.observe(target1);
          window.observer.observe(target2);
          window.observer.observe(target3);
        })
        .wait(50)
        .evaluate(function() {
          window.observer.disconnect();
        })
        .wait(50)
        .evaluate(function() {
          window.observer.observe(document.querySelector('.tracked-item[data-id="1"]'));
        })
        .wait(50)
        .scrollTo(500)
        .wait(50)
        .scrollTo(0)
        .wait(50)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 6, 'Callback fired 6 times');
        });
    }

    ['@test observing an occluded element within a root and scrolling it into view should fire callbacks']() {
      return this.context
        .evaluate(function() {
          window.STATE.impressions = 0;
          let root = document.getElementById('root');
          let rootTarget = document.querySelector('.tracked-item-root[data-root-target-id="5"]');
          let observer = new spaniel.IntersectionObserver(
            function() {
              window.STATE.impressions++;
            },
            {
              root: root,
              threshold: 0.5
            }
          );
          observer.observe(rootTarget);
          root.addEventListener('scroll', () => spaniel.invalidate(), false);
        })
        .wait(100)
        .evaluate(function() {
          root.scrollTop = 350;
        })
        .wait(100)
        .evaluate(function() {
          root.scrollTop = 0;
        })
        .wait(100)
        .getExecution()
        .evaluate(function() {
          return window.STATE.impressions;
        })
        .then(function(result) {
          assert.equal(result, 2, 'Callback fired twice');
        });
    }
  }
);
