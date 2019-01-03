/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import constants from '../constants';
import Nightmare from 'nightmare';
import rsvp from 'rsvp';

const { VIEWPORT, NIGHTMARE, MAC_WINDOW_BAR_HEIGHT } = constants;

export default class Context {
  constructor() {
    (this._nightmare = Nightmare(NIGHTMARE.OPTIONS)),
      this._nightmare.viewport(VIEWPORT.WIDTH, VIEWPORT.HEIGHT + MAC_WINDOW_BAR_HEIGHT);
    this._events = [];
    this._results = [];
    this._assertions = [];
    this._execution = this._root = this._nightmare
      .goto('http://localhost:3000/')
      .wait(NIGHTMARE.TIMEOUT)
      .evaluate(function() {
        window.STATE = {};
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
    this._execution = this._execution.viewport(width, height).wait(NIGHTMARE.TIMEOUT);
    return this;
  }

  scrollTo(top, left) {
    this._execution = this._execution.scrollTo(top, left).wait(NIGHTMARE.TIMEOUT);
    return this;
  }

  wait(time) {
    this._execution = this._execution.wait(time);
    return this;
  }
}
