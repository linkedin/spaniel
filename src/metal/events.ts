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
  Frame,
  PredicatedScheduler,
  FunctionQueue,
  Engine
} from './index';

import {
  FrameInterface
} from './interfaces';

import w from './window-proxy';

export interface EventRecordInterface {
  listen: (callback: Function) => any;
  unlisten: (callback: Function) => void;
  trigger: (value?: any) => void;
}

export class GenericEventRecord {
  queue: FunctionQueue = new FunctionQueue();
  listen(callback: (frame: FrameInterface, id: string) => void) {
    this.queue.push(callback);
  }
  unlisten(callback: Function) {
    this.queue.remove(callback);
  }
  trigger(value?: any) {
    for (let i = 0; i < this.queue.items.length; i++) {
      this.queue.items[i](value);
    }
  }
}

export class RAFEventRecord {
  private scheduler: PredicatedScheduler;
  public state: Frame;
  constructor(predicate: (frame: Frame) => Boolean, engine: Engine) {
    this.scheduler = new PredicatedScheduler(predicate.bind(this), engine);
  }
  trigger(value?: any) {}
  listen(callback: (frame: Frame) => void) {
    this.state = Frame.generate();
    this.scheduler.watch(callback);
  }
  unlisten(cb: Function) {
    this.scheduler.unwatch(cb);
  }
}

export interface EventStore {
  scroll: RAFEventRecord;
  resize: RAFEventRecord;
  destroy: GenericEventRecord;
  unload: GenericEventRecord;
  hide: GenericEventRecord;
  show: GenericEventRecord;
  [eventName: string]: EventRecordInterface;
}