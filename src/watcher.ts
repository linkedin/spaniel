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
} from './spaniel-observer';

import {
  SpanielObserverEntry,
  DOMString,
  DOMMargin,
  SpanielTrackedElement
} from './interfaces';

import {
  SpanielInstance
} from './spaniel-instance';

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
}

function onEntry(entries: SpanielObserverEntry[]) {
  entries.forEach((entry: SpanielObserverEntry) => {
    const { label, duration } = entry;
    const opts: WatcherCallbackOptions = {
      duration
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
  parentSpanielInstance: SpanielInstance;
  constructor(config: WatcherConfig = {}, parentSpanielInstance: SpanielInstance) {
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
    this.parentSpanielInstance = parentSpanielInstance;
    this.observer = new SpanielObserver(onEntry, {
      rootMargin,
      threshold,
      root
   }, this.parentSpanielInstance);
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