/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  IntersectionObserver,
  DOMString,
  DOMMargin,
  SpanielTrackedElement,
  entrySatisfiesRatio,
  generateEntry
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
  off,
  scheduleWork,
  scheduleRead,
  Frame
} from './metal/index';

export {
  on,
  off,
  scheduleRead,
  scheduleWork,
  IntersectionObserver,
  SpanielObserver,
  SpanielTrackedElement,
  setGlobalEngine,
  getGlobalEngine
};

export function queryElement(el: Element, callback: (bcr: ClientRect, frame: Frame) => void) {
  getGlobalScheduler().queryElement(el, callback);
}

export function elementSatisfiesRatio(el: Element, ratio: number = 0, callback: (result: Boolean) => void, rootMargin: DOMMargin = { top: 0, bottom: 0, left: 0, right: 0}) {
  queryElement(el, (bcr: ClientRect, frame: Frame) => {
    let entry = generateEntry(frame, bcr, el, rootMargin);
    callback(entrySatisfiesRatio(entry, ratio));
  });
}

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

export interface WatcherConfig {
  ratio?: number;
  time?: number;
  rootMargin?: DOMString | DOMMargin;
}

export class Watcher {
  observer: SpanielObserver;
  constructor(config: WatcherConfig = {}) {
    let { time, ratio, rootMargin } = config;

    let threshold = [
      {
        label: 'exposed',
        time: 0,
        ratio: 0
      }
    ];

    if (time) {
      threshold.push({
        label: 'impressed',
        time,
        ratio: ratio || 0
      });
    }
    
    if (ratio) {
      threshold.push({
        label: 'visible',
        time: 0,
        ratio
      });
    }

    this.observer = new SpanielObserver(onEntry, {
      rootMargin,
      threshold
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

