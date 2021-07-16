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
  EngineInterface,
  SchedulerInterface,
  ElementSchedulerInterface,
  FrameInterface,
  QueueInterface,
  MetaInterface
} from './interfaces';
import W from './window-proxy';

import { default as Queue, DOMQueue } from './queue';
import { getGlobalEngine } from './engine';

import { getBoundingClientRect } from '../utils';

const TOKEN_SEED = 'xxxx'.replace(/[xy]/g, function(c) {
  let r = (Math.random() * 16) | 0,
    v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});
let tokenCounter = 0;

export class Frame implements FrameInterface {
  constructor(
    public dateNow: number,
    public highResTime: number,
    public scrollTop: number,
    public scrollLeft: number,
    public width: number,
    public height: number,
    public x: number,
    public y: number,
    public top: number,
    public left: number
  ) {}
  static generate(root: Element | Window = window): Frame {
    const rootMeta = this.revalidateRootMeta(root);
    return new Frame(
      Date.now(),
      performance.now(),
      rootMeta.scrollTop,
      rootMeta.scrollLeft,
      rootMeta.width,
      rootMeta.height,
      rootMeta.x,
      rootMeta.y,
      rootMeta.top,
      rootMeta.left
    );
  }
  static revalidateRootMeta(root: any = document): MetaInterface {
    let _clientRect = null;
    let _rootMeta: MetaInterface = {
      width: 0,
      height: 0,
      scrollTop: 0,
      scrollLeft: 0,
      x: 0,
      y: 0,
      top: 0,
      left: 0
    };

    // if root is dirty update the cached values
    if (W.isDirty) {
      W.updateMeta();
    }

    if (root === window || root === document) {
      _rootMeta.height = W.meta.height;
      _rootMeta.width = W.meta.width;
      _rootMeta.scrollLeft = W.meta.scrollLeft;
      _rootMeta.scrollTop = W.meta.scrollTop;

      return _rootMeta;
    }

    _clientRect = getBoundingClientRect(root);
    _rootMeta.scrollTop = root.scrollTop;
    _rootMeta.scrollLeft = root.scrollLeft;
    _rootMeta.width = _clientRect.width;
    _rootMeta.height = _clientRect.height;
    _rootMeta.x = _clientRect.x;
    _rootMeta.y = _clientRect.y;
    _rootMeta.top = _clientRect.top;
    _rootMeta.left = _clientRect.left;

    return _rootMeta;
  }
}

export function generateToken() {
  return tokenCounter++ + TOKEN_SEED;
}

export abstract class BaseScheduler {
  protected root: Element | Window;
  protected engine: EngineInterface;
  protected queue: QueueInterface;
  protected isTicking: Boolean = false;
  protected toRemove: Array<string | Element | Function> = [];
  protected id?: string;

  constructor(customEngine?: EngineInterface, root?: Element | Window | null) {
    if (customEngine) {
      this.engine = customEngine;
    } else {
      this.engine = getGlobalEngine();
    }

    this.root = root || window;
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
      this.applyQueue(Frame.generate(this.root));
      this.engine.scheduleRead(this.tick.bind(this));
    }
  }
  scheduleWork(callback: Function) {
    this.engine.scheduleWork(callback);
  }
  scheduleRead(callback: Function) {
    this.engine.scheduleRead(callback);
  }
  queryElement(el: Element, callback: (clientRect: ClientRect, frame: Frame) => void) {
    let clientRect: ClientRect;
    let frame: Frame;
    this.engine.scheduleRead(() => {
      clientRect = getBoundingClientRect(el);
      frame = Frame.generate(this.root);
    });
    this.engine.scheduleWork(() => {
      callback(clientRect, frame);
    });
  }
  unwatch(id: string | Element | Function) {
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
    super(undefined, window);
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
  protected lastVersion: number = W.version;
  protected ALLOW_CACHED_SCHEDULER: boolean;

  constructor(customEngine?: EngineInterface, root?: Element | Window | null, ALLOW_CACHED_SCHEDULER: boolean = false) {
    super(customEngine, root);
    this.queue = new DOMQueue();
    this.ALLOW_CACHED_SCHEDULER = ALLOW_CACHED_SCHEDULER;
  }

  get isDirty(): boolean {
    return W.version !== this.lastVersion;
  }

  applyQueue(frame: Frame) {
    for (let i = 0; i < this.queue.items.length; i++) {
      let { callback, el, id, clientRect } = this.queue.items[i];

      if (this.isDirty || !clientRect || !this.ALLOW_CACHED_SCHEDULER) {
        clientRect = this.queue.items[i].clientRect = getBoundingClientRect(el);
      }

      callback(frame, id, clientRect);
    }

    this.lastVersion = W.version;
  }

  watch(
    el: Element,
    callback: (frame: FrameInterface, id: string, clientRect: ClientRect) => void,
    id?: string
  ): string {
    this.startTicking();
    id = id || generateToken();
    let clientRect = null;

    this.queue.push({
      el,
      callback,
      id,
      clientRect
    });
    return id;
  }
}

let globalScheduler: Scheduler | null = null;

export function getGlobalScheduler() {
  return globalScheduler || (globalScheduler = new Scheduler());
}
