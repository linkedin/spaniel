/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

// BEGIN SpanielContext Harness

// Data structures that SpanielContext can assert against
var ASSERTIONS = [[]];
var INDEX = 0;

var GLOBAL_TEST_EVENTS = {
  push: function(event) {
    ASSERTIONS[INDEX].push(event);
  },
  increment: function() {
    INDEX++;
    ASSERTIONS[INDEX] = [];
  }
};

window.watcher = new spaniel.Watcher({
  time: 100,
  ratio: 0.8
});

var elements = document.getElementsByClassName('tracked-item');

for (var i = 0; i < elements.length; i++) {
  (function(el) {
    if (i < 6) {
      var id = el.getAttribute('data-id');
      window.watcher.watch(el, function(e, meta) {
        var end = meta && meta.duration ? ' for ' + meta.duration + ' milliseconds' : '';
        console.log(id + ' ' + e + end);
        GLOBAL_TEST_EVENTS.push({
          id: parseInt(id),
          e: e,
          meta: meta || {}
        });
      });
    }
  })(elements[i]);
}

// END SpanielContext Harness

// Example usage of SpanielObserver
var target = document.querySelector('.tracked-item[data-id="5"]');
let observer = new spaniel.SpanielObserver(function(changes) {
  console.log(changes[0]);
}, {
  rootMargin: '0px 0px',
  threshold: [{
    label: 'impressed',
    ratio: 0.5,
    time: 1000
  }]
});
observer.observe(target);
