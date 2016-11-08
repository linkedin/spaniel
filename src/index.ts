/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  IntersectionObserver,
  DOMString,
  DOMMargin,
  SpanielTrackedElement
} from './intersection-observer';

import {
  SpanielObserver,
  SpanielObserverEntry
} from './spaniel-observer';

import {
  setGlobalEngine,
  getGlobalEngine
} from './metal/engine';

import {
  Scheduler,
  getGlobalScheduler,
  on,
  off
} from './metal/index';

export {
  on,
  off,
  IntersectionObserver,
  SpanielObserver,
  SpanielTrackedElement,
  setGlobalEngine,
  getGlobalEngine
};

function onEntry(entries: SpanielObserverEntry[]) {
  entries.forEach((entry: SpanielObserverEntry) => {
    if (entry.entering) {
      entry.payload.callback(entry.label, {
        duration: entry.duration
      });
    } else if (entry.label === 'impressed') {
      entry.payload.callback('impression-complete', {
        duration: entry.duration,
        visibleTime: entry.time - entry.duration
      });
    }
  });
}

export function scheduler() {
  return new Scheduler(getGlobalEngine());
}

export interface WatcherConfig {
  ratio?: number;
  time?: number;
  rootMargin?: DOMString | DOMMargin;
}

export class Watcher {
  observer: SpanielObserver;
  constructor(config: WatcherConfig = {}) {
    let { time, ratio, rootMargin } = config;

    // Set defaults
    time = time || 300;
    ratio = ratio || 0.5;

    this.observer = new SpanielObserver(onEntry, {
      rootMargin,
      threshold: [
        {
          label: 'impressed',
          time,
          ratio
        },
        {
          label: 'visible',
          time: 0,
          ratio
        },
        {
          label: 'exposed',
          time: 0,
          ratio: 0
        }
      ]
   });
  }
  watch(el: Element, callback: Function) {
    this.observer.observe(<SpanielTrackedElement>el, {
      callback
    });
  }
  unwatch(el: SpanielTrackedElement) {
    this.observer.unobserve(el);
  }
  disconnect() {
    this.observer.disconnect();
  }
}

