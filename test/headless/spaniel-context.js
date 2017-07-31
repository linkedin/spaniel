/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import rsvp from 'rsvp';
import Nightmare from 'nightmare';

const TIMEOUT = 20;

export default class SpanielContext {
  constructor() {
    this._nightmare = Nightmare({ show: false }),
    this._nightmare.viewport(400, 400);
    this._events = [];
    this._results = [];
    this._assertions = [];

    this._execution = this._nightmare.goto('http://localhost:3000/').wait(TIMEOUT).evaluate(function() {
      window.STATE = {};
      window.createDiv = function(id) {
        var div = document.createElement('div');
        div.id = id;
        document.body.appendChild(div);
      }
      window.spanielInstance = new spaniel.SpanielInstance();
    });
  }

  close() {
    return this._execution.end();
  }

  getExecution() {
    return this._execution;
  }

  evaluate(func) {
    this._execution = this._execution.evaluate(func);
    return this;
  }

  getEvents() {
    this._execution = this._execution.evaluate(function() {
      return EVENTS;
    });
    return this._execution;
  }

  mark() {
    this._execution = this._execution.evaluate(function() {
      GLOBAL_TEST_EVENTS.increment();
    });
    return this._execution;
  }

  unwatch(id) {
    this._execution = this._execution.wait(10).evaluate(function(id) {
      var target = document.querySelector('.tracked-item[data-id="' + id + '"]');
      window.watcher.unwatch(target);
    }, id)
    return this;
  }

  assertEvent(id, type, message, expectedCount) {
    if (typeof message === 'number') {
      expectedCount = message;
      message = null;
    }
    expectedCount = typeof expectedCount === 'number' ? expectedCount : 1;
    return this.assert(function(event) {
      return event.id === id && event.e === type;
    }, message, expectedCount);
  }

  assertNever(id, type, message) {
    return this.assertEvent(id, type, message, 0);
  }

  assertOnce(id, type, message) {
    return this.assertEvent(id, type, message, 1);
  }

  assert(predicate, message, expectedCount) {
    this.mark();
    this._assertions.push({
      predicate: predicate,
      message: message,
      expectedCount: expectedCount
    });
    return this;
  }

  _assert(events, predicate, message, expectedCount) {
    if (typeof message === 'number') {
      expectedCount = message;
      message = null;
    }

    expectedCount = typeof expectedCount === 'number' ? expectedCount : 1;

    let count = 0;
    for (let i = 0; i < events.length; i++) {
      if (predicate(events[i])) {
        count++;
      }
    }
    assert.equal(count, expectedCount, message);
  }

  scrollTo(top, left) {
    this._execution = this._execution.scrollTo(top, left).wait(TIMEOUT);
    return this;
  }

  wait(time) {
    this._execution = this._execution.wait(time);
    return this;
  }

  done() {
    if (this._assertions.length < 1) {
      throw 'No assertions were made';
    }

    return this._execution.wait(10).evaluate(function() {
      return ASSERTIONS;
    }).end().then(function(assertionEvents) {
      let events = [];
      for (let i = 0; i < this._assertions.length; i++) {
        events = events.concat(assertionEvents[i]);
        let a = this._assertions[i];
        this._assert(events, a.predicate, a.message, a.expectedCount);
      }
    }.bind(this));
  }

  onDOMReady() {
    this.wait('.tracked-item[data-id="1"]');
    return this;
  }

  waitForImpression(identifierNum) {
    if (identifierNum) {
      this.wait(`#impression-div-${identifierNum}`, 200);
    } else {
      this.wait('#impression-div', 200);
    }
    return this;
  }

  waitForVisible(identifierNum) {
    if (identifierNum) {
      this.wait(`#visible-div-${identifierNum}`, 200);
    } else {
      this.wait('#visible-div', 200);
    }
    return this;
  }

  waitForExposed(identifierNum) {
    console.log('Waiting for exposed' + identifierNum);
    if (identifierNum) {
      this.wait(`#exposed-div-${identifierNum}`, 200);
    } else {
      this.wait('#exposed-div', 200);
    }
    return this;
  }

  waitForNthElemEvent(elementNum, event, identifierNum) {
    console.log('Waiting for ' + elementNum + ' - ' + event + ' : ' + identifierNum);
    if (identifierNum) {
      this.wait(`#${elementNum}-element-${event}-div-${identifierNum}`, 200);
    } else {
      this.wait(`#${elementNum}-${event}-div`, 200);
    }
    return this;
  }
}
