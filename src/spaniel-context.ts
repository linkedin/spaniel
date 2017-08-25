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
  OptimizedEngineInterface,
  OptimizedEngine,
  Engine
} from './metal/engine';

import {
  SpanielObserver
} from './spaniel-observer';

import {
  SpanielIntersectionObserver,
  generateEntry
} from './intersection-observer';

import {
  entrySatisfiesRatio
} from './utils';

import {
  SpanielObserverEntry,
  DOMMargin,
  IntersectionObserverClass,
  SpanielObserverInit,
  IntersectionObserverInit
} from './interfaces';

import {
  EventStore,
  RAFEventRecord,
  GenericEventRecord
} from './metal/events';

import {
  Scheduler,
  Frame
} from './metal/index';

import {
  FrameInterface
} from './metal/interfaces';
import { Watcher, WatcherConfig } from './watcher';

import w from './metal/window-proxy';

let IntersectionObserver: IntersectionObserverClass = !!w.IntersectionObserver ? w.IntersectionObserver : undefined;

export interface SpanielIntersectionObserverInterface {
  new(callback: Function, options: IntersectionObserverInit): SpanielIntersectionObserver;
}

function generateIntersectionObserverClass(parent: SpanielContext): SpanielIntersectionObserverInterface {
  return class SpanielIntersectionObserverClass extends SpanielIntersectionObserver {
    constructor(callback: Function, options: IntersectionObserverInit = {}) {
      super(callback, options, parent);
    }
  };
}

export interface SpanielObserverInterface {
  new (callback: (entries: SpanielObserverEntry[]) => void, options: SpanielObserverInit): SpanielObserver;
}

function generateSpanielObserver(parent: SpanielContext): SpanielObserverInterface {
  return class SpanielObserverClass extends SpanielObserver {
    constructor(callback: (entries: SpanielObserverEntry[]) => void, options: SpanielObserverInit = {}) {
      super(callback, options, parent);
    }
  };
}

export interface WatcherInterface {
  new(config: WatcherConfig): Watcher;
}

function generateWatcher(parent: SpanielContext): WatcherInterface {
  return class WatcherClass extends Watcher {
    constructor(config: WatcherConfig = {}) {
      super(config, parent);
    }
  };
}

export class SpanielContext {
  public IntersectionObserver: IntersectionObserverClass;
  private engine: Engine;
  private scheduler: Scheduler;
  public scheduleRead: (callback: Function) => void;
  public scheduleWork: (callback: Function) => void;
  public eventStore: EventStore;
  public SpanielObserver: SpanielObserverInterface;
  public Watcher: WatcherInterface;
  constructor(UserIntersectionObserver?: IntersectionObserverClass, engine?: OptimizedEngineInterface ) {
    if (engine) {
      this.engine = new OptimizedEngine(engine.onMutate, engine.scheduleWork);
    } else {
      this.engine = new Engine();
    }
    this.scheduler = new Scheduler(this.engine);
    this.scheduleRead = this.scheduler.scheduleRead;
    this.scheduleWork = this.scheduler.scheduleWork;
    this.IntersectionObserver = UserIntersectionObserver || (IntersectionObserver) ? IntersectionObserver : generateIntersectionObserverClass(this);
    this.SpanielObserver = generateSpanielObserver(this);
    this.Watcher = generateWatcher(this);
    if (w.hasDOM) {
      window.addEventListener('unload', (e: any) => {
        // First fire internal event to fire any observer callbacks
        this.trigger('unload');

        // Then fire external event to allow flushing of any beacons
        this.trigger('destroy');
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.trigger('show');
        } else {
          this.trigger('hide');
        }
      });
    }
  }
  getEventStore(): EventStore {
    return this.eventStore || (this.eventStore = {
      scroll: new RAFEventRecord(function(frame: Frame) {
        let { scrollTop, scrollLeft } = this.state;
        this.state = frame;
        return scrollTop !== frame.scrollTop || scrollLeft !== frame.scrollLeft;
      }, this.engine),
      resize: new RAFEventRecord(function(frame: Frame) {
        let { width, height } = this.state;
        this.state = frame;
        return height !== frame.height || width !== frame.width;
      }, this.engine),
      destroy: new GenericEventRecord(),
      unload: new GenericEventRecord(),
      hide: new GenericEventRecord(),
      show: new GenericEventRecord()
    });
  }

  on(eventName: string, callback: (frame: FrameInterface, id: string) => void) {
    let evt = this.getEventStore()[eventName];
    if (evt) {
      evt.listen(callback);
    }
  }

  off(eventName: string, callback: Function) {
    if (this.eventStore) {
      let evt = this.eventStore[eventName];
      if (evt) {
        evt.unlisten(callback);
      }
    }
  }

  trigger(eventName: string, value?: any) {
    if (this.eventStore) {
      let evt = this.eventStore[eventName];
      if (evt) {
        evt.trigger(value);
      }
    }
  }

  queryElement(el: Element, callback: (bcr: ClientRect, frame: Frame) => void) {
    this.scheduler.queryElement(el, callback);
  }

  elementSatisfiesRatio(el: Element, ratio: number = 0, callback: (result: Boolean) => void, rootMargin: DOMMargin = { top: 0, bottom: 0, left: 0, right: 0}) {
    this.queryElement(el, (bcr: ClientRect, frame: Frame) => {
      let entry = generateEntry(frame, bcr, el, rootMargin);
      callback(entrySatisfiesRatio(entry, ratio));
    });
  }

  getScheduler(): Scheduler {
    return this.scheduler;
  }

  getEngine(): Engine {
    return this.engine;
  }
}