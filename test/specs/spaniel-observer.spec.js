/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, softwaredistributed under the License is distributed on an "AS IS" BASIS,WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

var expect = chai.expect;

function runTest(threshold, options) {
  if (!threshold) {
    throw new Error('You must provide a threshold to test');
  }
  options = options || {};
  var thresholds = [threshold];
  var timeout = 50 + (options.timeout || 0);
  var entries = [];
  var target = options.target;
  if (!target) {
    target = document.createElement('div');
    target.style.height = '10px';
  }
  document.body.appendChild(target);
  var observer = new spaniel.SpanielObserver(
    function(changes) {
      for (var i = 0; i < changes.length; i++) {
        entries.push(changes[i]);
      }
    },
    {
      rootMargin: '0px 0px',
      threshold: thresholds,
      BACKGROUND_TAB_FIX: options.BACKGROUND_TAB_FIX
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
}

function cleanUp(value) {
  value.observer.destroy();
  value.target.remove();
  value.entries.length = 0;
}

function wait50ms(result) {
  return new RSVP.Promise(function(resolve) {
    setTimeout(function() {
      resolve(result);
    }, 50);
  });
}

describe('SpanielObserver', function() {
  it('should fire impression event with correct info', function() {
    return runTest({
      label: 'impression',
      meta: {
        foo: 'my-special-meta'
      },
      ratio: 0.5
    })
      .then(function(result) {
        var entries = result.entries;
        expect(entries.length).to.equal(1);
        var entry = entries[0];
        expect(entry.entering, true);
        expect(entry.label, 'impression');
        expect(entry.intersectionRatio, 1);
        expect(entry.thresholdMeta.foo, 'my-special-meta');
        return result;
      })
      .then(cleanUp);
  });

  it('should fire impression exiting event when tab is hidden', function() {
    return runTest({
      label: 'impression',
      ratio: 0.5
    })
      .then(function(result) {
        result.observer.onTabHidden();
        return new RSVP.Promise(function(resolve) {
          setTimeout(function() {
            expect(result.entries.length).to.equal(2, 'Two events have been fired');
            expect(result.entries[1].entering).to.equal(false, 'Second event is exiting');
            resolve(result);
          }, 50);
        });
      })
      .then(cleanUp);
  });

  it('should fire impression exiting event twice when tab is hidden, reshown, and then hidden again', function() {
    return runTest({
      label: 'impression',
      ratio: 0.5,
      time: 1
    })
      .then(function(result) {
        result.observer.onTabHidden();
        return wait50ms(result);
      })
      .then(function(result) {
        expect(result.entries.length).to.equal(2, 'Two events have been fired');
        expect(result.entries[1].entering).to.equal(false, 'Second event is exiting');
        result.observer.onTabShown();
        return wait50ms(result);
      })
      .then(function(result) {
        result.observer.onTabHidden();
        return wait50ms(result);
      })
      .then(function(result) {
        expect(result.entries.length).to.equal(4, 'Three events have been fired');
        expect(result.entries[2].entering).to.equal(true, 'second to last event is entering');
        expect(result.entries[3].entering).to.equal(false, 'last event is exiting');

        // Assert that duration is only the time visible on screen
        // Not including the time the tab was backgrounded
        expect(Math.abs(result.entries[3].duration - 50)).to.be.lessThan(10); // 10ms of wiggle room
        return result;
      })
      .then(cleanUp);
  });

  it('should not fire impression exiting event when tab is hidden before threshold time', function() {
    return runTest({
      label: 'impression',
      ratio: 0.5,
      time: 1000
    })
      .then(function(result) {
        result.observer.onTabHidden();
        return new RSVP.Promise(function(resolve) {
          setTimeout(function() {
            expect(result.entries.length).to.equal(0, 'No events have been fired');
            resolve(result);
          }, 50);
        });
      })
      .then(cleanUp);
  });

  it('should not break when unobserving the same element twice', function() {
    return runTest({
      label: 'impression',
      ratio: 0.5,
      time: 1000
    })
      .then(function(result) {
        return RSVP.resolve().then(function() {
          result.observer.unobserve(result.target);
          result.observer.unobserve(result.target);
          return result;
        });
      })
      .then(cleanUp);
  });

  it('should support observing elements with zero height and width', function() {
    var target = document.createElement('div');
    target.style.height = '0px';
    target.style.width = '0px';
    target.style.marginTop = '10px';
    target.style.marginLeft = '10px';

    return runTest(
      {
        label: 'exposed',
        ratio: 0
      },
      {
        target: target
      }
    )
      .then(function(result) {
        var entries = result.entries;
        expect(entries.length).to.equal(1);
        var entry = entries[0];
        expect(entry.entering, true);
        expect(entry.intersectionRatio, 0);
        return result;
      })
      .then(cleanUp);
  });

  it('should not execute callback on element of zero height and width when not in viewport', function() {
    var target = document.createElement('div');
    target.style.height = '0px';
    target.style.width = '0px';
    target.style.marginTop = '1000px';
    target.style.marginLeft = '10px';

    return runTest(
      {
        label: 'exposed',
        ratio: 0
      },
      {
        target: target
      }
    )
      .then(function(result) {
        var entries = result.entries;
        expect(entries.length).to.equal(0);
        return result;
      })
      .then(cleanUp);
  });

  it('should start paused if in a background tab', function() {
    var target = document.createElement('div');
    spaniel.__w__.document = { visibilityState: 'hidden' };

    return runTest(
      {
        label: 'impression',
        ratio: 0.5
      },
      {
        target: target,
        BACKGROUND_TAB_FIX: true
      }
    )
      .then(function(result) {
        // Observer should be paused right out of the gate
        expect(result.observer.paused).to.equal(true);

        // Closing the tab when it never entered the foreground should not trigger any impression events
        result.observer.onWindowClosed();
        expect(result.observer.paused).to.equal(true);
        expect(result.entries.length).to.equal(0);
        return result;
      })
      .then(cleanUp);
  });

  it('duration should be correct when starting from a backgrounded tab, opening the tab, then closing the tab', function() {
    spaniel.__w__.document = { visibilityState: 'hidden' };

    return (
      runTest(
        {
          label: 'impression',
          ratio: 0.5,
          time: 1
        },
        {
          BACKGROUND_TAB_FIX: true
        }
      )
        // Wait before opening the tab
        .then(wait50ms)
        .then(function(result) {
          result.observer.onTabShown();
          return wait50ms(result);
        })
        .then(function(result) {
          result.observer.onTabHidden();
          return wait50ms(result);
        })
        .then(function(result) {
          expect(result.entries.length).to.equal(2, 'Two events have been fired');
          expect(result.entries[1].entering).to.equal(false, 'Second event is exiting');

          expect(Math.abs(result.entries[1].duration - 50)).to.be.lessThan(10); // 10ms of wiggle room
          return wait50ms(result);
        })
        .then(cleanUp)
    );
  });
});
