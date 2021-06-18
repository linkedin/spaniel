/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { SpanielObserver } from './spaniel-observer';
import { SpanielObserverEntry, DOMString, DOMMargin, SpanielTrackedElement } from './interfaces';

export interface WatcherConfig {
  ratio?: number;
  time?: number;
  rootMargin?: DOMString | DOMMargin;
  root?: SpanielTrackedElement;
  ALLOW_CACHED_SCHEDULER?: boolean;
  BACKGROUND_TAB_FIX?: boolean;
  USE_NATIVE_IO?: boolean;
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
  intersectionRect: DOMRectInit;
}

function onEntry(entries: SpanielObserverEntry[]) {
  entries.forEach((entry: SpanielObserverEntry) => {
    const { label, duration, boundingClientRect, intersectionRect } = entry;
    const opts: WatcherCallbackOptions = {
      duration,
      boundingClientRect,
      visibleTime: entry.visibleTime,
      intersectionRect
    };
    if (entry.entering) {
      entry.payload.callback(label, opts);
    } else if (entry.label === 'impressed') {
      entry.payload.callback('impression-complete', opts);
    }
  });
}

export class Watcher {
  observer: SpanielObserver;
  constructor(config: WatcherConfig = {}) {
    let { time, ratio, rootMargin, root, ALLOW_CACHED_SCHEDULER, BACKGROUND_TAB_FIX, USE_NATIVE_IO } = config;

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

    this.observer = new SpanielObserver(onEntry, {
      rootMargin,
      threshold,
      root,
      ALLOW_CACHED_SCHEDULER,
      BACKGROUND_TAB_FIX,
      USE_NATIVE_IO
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

  /*
   * Must be called when the Watcher is done being used.
   * This will prevent memory leaks.
   */
  destroy() {
    this.observer.destroy();
  }
}
