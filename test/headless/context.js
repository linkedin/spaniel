/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import rsvp from 'rsvp';
import Nightmare from 'nightmare';

const TIMEOUT = 10;
const MAC_WINDOW_BAR_HEIGHT = 22; // See https://github.com/segmentio/nightmare/issues/722

export default class Context {
  constructor() {
    this._nightmare = Nightmare({ show: false }),
    this._nightmare.viewport(400, 400 + MAC_WINDOW_BAR_HEIGHT);
    this._events = [];
    this._results = [];
    this._assertions = [];
    this._execution = this._root = this._nightmare.goto('http://localhost:3000/').wait(10).evaluate(function() {
      window.STATE = {};
      window.createDiv = function(id) {
        var div = document.createElement('div');
        div.id = id;
        document.body.appendChild(div);
      }
      window.spanielContext = new spaniel.SpanielContext();
    });
  }
  close() {
    return this._root.end();
  }

  getExecution() {
    return this._execution;
  }

  evaluate(func) {
    this._execution = this._execution.evaluate(func);
    return this;
  }

  assert(func, assertion) {
    this._execution.evaluate(func).then(assertion);
    return this;
  }

  viewport(width, height) {
    this._execution = this._execution.viewport(width, height).wait(TIMEOUT);
    return this;
  }

  scrollTo(top, left) {
    this._execution = this._execution.scrollTo(top, left).wait(TIMEOUT);
    return this;
  }

  wait(time) {
    this._execution = this._execution.wait(time);
    return this;
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

  waitForImpressionCompelete(identifierNum) {
    if (identifierNum) {
      this.wait(`#complete-div-${identifierNum}`, 200);
    } else {
      this.wait('#complete-div', 200);
    }
    return this;
  }

  waitForExposed(identifierNum) {
    if (identifierNum) {
      this.wait(`#exposed-div-${identifierNum}`, 200);
    } else {
      this.wait('#exposed-div', 200);
    }
    return this;
  }

  waitForScroll(identifierNum) {
    if (identifierNum) {
      this.wait(`#scroll-div-${identifierNum}`, 200);
    } else {
      this.wait('#scroll-div', 200);
    }
    return this;
  }

  waitForNthElemEvent(elementNum, event, identifierNum) {
    if (identifierNum) {
      this.wait(`#${elementNum}-element-${event}-div-${identifierNum}`, 200);
    } else {
      this.wait(`#${elementNum}-${event}-div`, 200);
    }
    return this;
  }

  waitForRatioSatisfiedDiv() {
    this.wait('#satisfied-div', 200);
    return this;
  }
}
