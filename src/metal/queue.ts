/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  QueueInterface,
  QueueElementInterface,
  QueueDOMElementInterface
} from './interfaces';

export abstract class BaseQueue implements QueueInterface {
  protected items: Array<any>;
  constructor() {
    this.items = [];
  }

  abstract removePredicate(identifier: any, element: any): void;

  remove(identifier: string | Element | Function) {
    let len = this.items.length;
    for (let i = 0; i < len; i++) {
      if (this.removePredicate(identifier, this.items[i])) {
        this.items.splice(i, 1);
        i--;
        len--;
      }
    }
  }

  clear() {
    this.items = [];
  }

  push(element: any) {
    this.items.push(element);
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export default class Queue extends BaseQueue implements QueueInterface {
  items: Array<QueueElementInterface>;
  removePredicate(identifier: string, element: QueueElementInterface) {
    if (typeof identifier === 'string') {
      return element.id === identifier;
    } else {
      return element.callback === identifier;
    }
  }
}

export class FunctionQueue extends BaseQueue implements QueueInterface {
  items: Array<Function>;
  removePredicate(identifier: Function, element: Function) {
    return element === identifier;
  }
}

export class DOMQueue extends BaseQueue implements QueueInterface {
  items: Array<QueueDOMElementInterface>;
  removePredicate(identifier: Element | string | Function, element: QueueDOMElementInterface) {
    if (typeof identifier === 'string') {
      return element.id === identifier;
    } else if (typeof identifier === 'function') {
      return element.callback === identifier;
    } else {
      return element.el === identifier;
    }
  }
}
