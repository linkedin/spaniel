/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  EngineInterface,
  SchedulerInterface,
  ElementSchedulerInterface,
  FrameInterface,
  QueueInterface
} from './interfaces';
import W from './window-proxy';

import { default as Queue, DOMQueue} from './queue';
import { getGlobalEngine } from './engine';

const TOKEN_SEED = 'xxxx'.replace(/[xy]/g, function(c) {
  let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});
let tokenCounter = 0;

export class Frame implements FrameInterface {
  constructor(
    public timestamp: number,
    public scrollTop: number,
    public scrollLeft: number,
    public width: number,
    public height: number
  ) {}
  static generate(): Frame {
    return new Frame(
      Date.now(),
      W.getScrollTop(),
      W.getScrollLeft(),
      W.getWidth(),
      W.getHeight()
    );
  }
}

export function generateToken() {
  return tokenCounter++ + TOKEN_SEED;
}

export abstract class BaseScheduler {
  protected engine: EngineInterface;
  protected queue: QueueInterface;
  protected isTicking: Boolean = false;
  protected toRemove: Array<string| Element | Function> = [];
  constructor(customEngine?: EngineInterface) {
    if (customEngine) {
      this.engine = customEngine;
    } else {
      this.engine = getGlobalEngine();
    }
  }
  protected abstract applyQueue(frame: Frame): void;

  protected tick() {
    if (this.queue.isEmpty()) {
      this.isTicking = false;
    } else {
      if (this.toRemove.length > 0) {
        for (let i = 0; i < this.toRemove.length; i++) {
          this.queue.remove(this.toRemove[i]);
        }
        this.toRemove = [];
      }
      this.applyQueue(Frame.generate());
      this.engine.scheduleRead(this.tick.bind(this));
    }
  }
  scheduleWork(callback: Function) {
    this.engine.scheduleWork(callback);
  }
  scheduleRead(callback: Function) {
    this.engine.scheduleRead(callback);
  }
  queryElement(el: Element, callback: (bcr: ClientRect, frame: Frame) => void) {
    let bcr: ClientRect = null;
    let frame: Frame = null;
    this.engine.scheduleRead(() => {
      bcr = el.getBoundingClientRect();
      frame = Frame.generate();
    });
    this.engine.scheduleWork(() => {
      callback(bcr, frame);
    });
  }
  unwatch(id: string| Element | Function) {
    this.toRemove.push(id);
  }
  unwatchAll() {
    this.queue.clear();
  }
  startTicking() {
    if (!this.isTicking) {
      this.isTicking = true;
      this.engine.scheduleRead(this.tick.bind(this));
    }
  }
}

export class Scheduler extends BaseScheduler implements SchedulerInterface {
  protected queue: Queue = new Queue();
  applyQueue(frame: Frame) {
    for (let i = 0; i < this.queue.items.length; i++) {
      let { id, callback } = this.queue.items[i];
      callback(frame, id);
    }
  }
  watch(callback: (frame: FrameInterface) => void): string {
    this.startTicking();
    let id = generateToken();
    this.queue.push({
      callback,
      id
    });
    return id;
  }
}

export class PredicatedScheduler extends Scheduler implements SchedulerInterface {
  predicate: (frame: Frame) => Boolean;
  constructor(predicate: (frame: Frame) => Boolean) {
    super(null);
    this.predicate = predicate;
  }
  applyQueue(frame: Frame) {
    if (this.predicate(frame)) {
      super.applyQueue(frame);
    }
  }
}

export class ElementScheduler extends BaseScheduler implements ElementSchedulerInterface {
  protected queue: DOMQueue;
  constructor(customEngine?: EngineInterface) {
    super(customEngine);
    this.queue = new DOMQueue();
  }
  applyQueue(frame: Frame) {
    for (let i = 0; i < this.queue.items.length; i++) {
      let { callback, el, id } = this.queue.items[i];
      let bcr = el.getBoundingClientRect();
      callback(frame, id, bcr);
    }
  }
  watch(el: Element, callback: (frame: FrameInterface, id: string, bcr: ClientRect) => void, id?: string): string {
    this.startTicking();
    id = id || generateToken();
    this.queue.push({
      el,
      callback,
      id
    });
    return id;
  }
}

let globalScheduler: Scheduler = new Scheduler();

export function getGlobalScheduler() {
  return globalScheduler;
}
