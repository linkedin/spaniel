/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { SpanielObserver } from './native-spaniel-observer';

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
  root?: SpanielTrackedElement;
}

export type EventName = 'impressed' | 'exposed' | 'visible' | 'impression-complete';

export type WatcherCallback = (eventName: EventName, callback: WatcherCallbackOptions) => void;

export interface Threshold {
  label: EventName;
  time: number;
  ratio: number;
}

export interface WatcherCallbackOptions {
  duration: number;
  visibleTime?: number;
  boundingClientRect: DOMRectInit;
}

function onEntry(entries: SpanielObserverEntry[]) {
  entries.forEach((entry: SpanielObserverEntry) => {
    const { label, duration, boundingClientRect } = entry;
    const opts: WatcherCallbackOptions = {
      duration,
      boundingClientRect
    };
    if (entry.entering) {
      entry.payload.callback(label, opts);
    } else if (entry.label === 'impressed') {
      opts.visibleTime = entry.time - entry.duration;
      entry.payload.callback('impression-complete', opts);
    }
  });
}

export class Watcher {
  observer: SpanielObserver;
  constructor(ObserverClass: IntersectionObserverClass, config: WatcherConfig = {}) {
    let { time, ratio, rootMargin, root } = config;

    let threshold: Threshold[] = [
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
      threshold,
      root
    });
  }
  watch(el: Element, callback: WatcherCallback) {
    this.observer.observe(el, {
      callback
    });
  }
  unwatch(el: Element) {
    this.observer.unobserve(el as SpanielTrackedElement);
  }
  disconnect() {
    this.observer.disconnect();
  }
}
