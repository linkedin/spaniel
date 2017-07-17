/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

var runTest = function(threshold, options) {
  if (!threshold) {
    throw new Error('You must provide a threshold to test');
  }
  options = options || {};
  var thresholds = [threshold];
  var timeout = 100 + (options.timeout || 0);
  var entries = [];
  var target = options.target || document.createElement('div');
  target.style.height = '10px';
  document.body.appendChild(target);
  var observer = new spaniel.SpanielObserver(
    function(changes) {
      for (var i = 0; i < changes.length; i++) {
        entries.push(changes[i]);
      }
    },
    {
      rootMargin: '0px 0px',
      threshold: thresholds
    }
  );
  observer.observe(target);
  return new RSVP.Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve({
        observer: observer,
        entries: entries,
        target: target
      });
    }, timeout);
  });
};

function cleanUp(value) {
  value.observer.disconnect();
}

function wait100ms(result) {
  return new RSVP.Promise(function(resolve) {
    setTimeout(function() {
      resolve(result);
    }, 100);
  });
}
