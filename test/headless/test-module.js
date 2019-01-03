/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { assert } from 'chai';
import Context from './context';
import SpanielContext from './spaniel-context';

// General approach shamelessly stolen and tweaked from
// https://github.com/emberjs/ember.js/blob/master/packages/ember-glimmer/tests/utils/abstract-test-case.js

export class TestClass {
  constructor() {
    this.context = this.generateContext();
  }
  teardown() {
    this.context.close();
  }
  generateContext() {
    return new Context();
  }
}

export class WatcherTestClass extends TestClass {
  generateContext() {
    return new SpanielContext();
  }
}

export default function(moduleName, TestModuleClass) {
  describe(moduleName, () => {
    let proto = TestModuleClass.prototype;

    while (proto !== Object.prototype) {
      let keys = Object.getOwnPropertyNames(proto);
      keys.forEach(generateTest);
      proto = Object.getPrototypeOf(proto);
    }

    function generateTest(name) {
      if (name.indexOf('@test ') === 0) {
        it(name.slice(5), () => {
          let testInstance = new TestModuleClass();
          return testInstance[name].call(testInstance).then(() => {
            testInstance.teardown();
          });
        });
      }
    }
  });
}
