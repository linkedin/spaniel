/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  generateToken,
  Frame,
  Scheduler,
  PredicatedScheduler,
  Queue,
  FunctionQueue,
  getGlobalScheduler
} from './index';

import {
  FrameInterface
} from './interfaces';

import w from './window-proxy';

interface EventRecordInterface {
  listen: (callback: Function) => any;
  unlisten: (callback: Function) => void;
  trigger: (value?: any) => void;
}

class GenericEventRecord {
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

class RAFEventRecord {
  private scheduler: PredicatedScheduler;
  public state: Frame;
  constructor(predicate: (frame: Frame) => Boolean) {
    this.scheduler = new PredicatedScheduler(predicate.bind(this));
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

interface EventStore {
  scroll: RAFEventRecord;
  resize: RAFEventRecord;
  destroy: GenericEventRecord;
  unload: GenericEventRecord;
  hide: GenericEventRecord;
  show: GenericEventRecord;
  [eventName: string]: EventRecordInterface;
}

let eventStore: EventStore = null;

function getEventStore(): EventStore {
  return eventStore || (eventStore = {
    scroll: new RAFEventRecord(function(frame: Frame) {
      let { scrollTop, scrollLeft } = this.state;
      this.state = frame;
      return scrollTop !== frame.scrollTop || scrollLeft !== frame.scrollLeft;
    }),
    resize: new RAFEventRecord(function(frame: Frame) {
      let { width, height } = this.state;
      this.state = frame;
      return height !== frame.height || width !== frame.width;
    }),
    destroy: new GenericEventRecord(),
    unload: new GenericEventRecord(),
    hide: new GenericEventRecord(),
    show: new GenericEventRecord()
  });
}

if (w.hasDOM) {
  window.addEventListener('unload', function(e: any) {
    // First fire internal event to fire any observer callbacks
    trigger('unload');

    // Then fire external event to allow flushing of any beacons
    trigger('destroy');
  });
  document.addEventListener('visibilitychange', function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      trigger('show');
    } else {
      trigger('hide');
    }
  });
}

export function on(eventName: string, callback: (frame: FrameInterface, id: string) => void) {
  let evt = getEventStore()[eventName];
  if (evt) {
    evt.listen(callback);
  }
}

export function off(eventName: string, callback: Function) {
  if (eventStore) {
    let evt = eventStore[eventName];
    if (evt) {
      evt.unlisten(callback);
    }
  }
}

export function trigger(eventName: string, value?: any) {
  if (eventStore) {
    let evt = eventStore[eventName];
    if (evt) {
      evt.trigger(value);
    }
  }
}

/**
 * Schedule a callback to be batched along with other DOM read/query work.
 * Use to schedule any DOM reads. Doing so will avoid DOM thrashing.
 */
export function scheduleWork(callback: Function) {
  getGlobalScheduler().scheduleWork(callback);
}

/**
 * Schedule a callback to be batched along with other DOM write/mutation
 * work. Use to schedule any DOM changes. Doing so will avoid DOM thrashing.
 */
export function scheduleRead(callback: Function) {
  getGlobalScheduler().scheduleRead(callback);
}