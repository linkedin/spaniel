/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  SpanielObserver
} from './native-spaniel-observer';

import {
  SpanielObserverEntry,
  DOMString,
  DOMMargin,
  SpanielTrackedElement,
  IntersectionObserverClass
} from './interfaces';

export interface WatcherConfig {
  ratio?: number;
  time?: number;
  rootMargin?: DOMString | DOMMargin;
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

export class Watcher {
  observer: SpanielObserver;
  constructor(ObserverClass: IntersectionObserverClass, config: WatcherConfig = {}) {
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

    this.observer = new SpanielObserver(ObserverClass, onEntry, {
      rootMargin,
      threshold
   });
  }
  watch(el: Element, callback: Function) {
    this.observer.observe(el, {
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