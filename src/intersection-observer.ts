/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  RAFStream,
  StreamInterface,
  Frame,
  QueueDOMElementInterface,
  Stream,
  Queue,
  DOMQueue,
  Terminal
} from 'ventana';

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface DOMMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SpanielTrackedElement extends Element {
  __spanielId: string;
}

export type DOMString = string;
export type DOMHighResTimeStamp = number;

export interface DOMRectReadOnly extends DOMRectInit, DOMMargin {}

export interface DOMRectInit {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IntersectionObserverInit {
  root?: SpanielTrackedElement;
  rootMargin?: DOMString; // default: 0px
  threshold?: number | number[]; // default: 0
}

interface EntryEvent {
  entry: IntersectionObserverEntry;
  item: QueueDOMElementInterface;
  numSatisfiedThresholds: number;
}

function marginToRect(margin: DOMMargin): DOMRectInit {
  let { left, right, top, bottom } = margin;
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

export interface IntersectionObserverEntryInit {
  time: DOMHighResTimeStamp;
  rootBounds: DOMRectInit;
  boundingClientRect: DOMRectInit;
  intersectionRect: DOMRectInit;
  target: SpanielTrackedElement;
}

function rootMarginToDOMMargin(rootMargin: DOMString): DOMMargin {
  let c = rootMargin.split(' ').map((n) => parseInt(n, 10));
  switch (c.length) {
    case 2:
      return { top: c[0], left: c[1], bottom: c[0], right: c[1] };
    case 3:
      return { top: c[0], left: c[1], bottom: c[2], right: c[1] };
    case 4:
      return { top: c[0], left: c[1], bottom: c[2], right: c[3] };
    default:
      return { top: 0, left: 0, bottom: 0, right: 0};
  }
}

export class IntersectionObserver {
  private id: string;
  private entryQueue: Queue;
  private entryEventStream: StreamInterface;
  private callback: Function;

  protected root: SpanielTrackedElement;
  protected rootMarginString: DOMString;
  protected rootMargin: DOMMargin;
  protected thresholds: number[];
  private records: { [index: string]: EntryEvent};

  reset() {
    let keys = Object.keys(this.records);
    for (let i = 0; i < keys.length; i++) {
      this.records[keys[i]].numSatisfiedThresholds = 0;
    }
  }
  observe(target: SpanielTrackedElement) {
    let id = target.__spanielId = target.__spanielId || uuid();
    this.entryQueue.push({
      id: id,
      el: target,
      callback: (entry: IntersectionObserverEntry) => {
        this.callback.call(null, [entry]);
      }
    });
  }
  unobserve(target: SpanielTrackedElement) {
    this.entryQueue.remove(target);
    delete this.records[target.__spanielId];
  }
  disconnect() {
    this.entryQueue.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  private generateEntryEvent(frame: Frame, item: QueueDOMElementInterface): EntryEvent {
    let count: number = 0;
    let entry = this.entryFromQueueElement(frame, item);
    let ratio = entry.intersectionRatio;

    for (let i = 0; i < this.thresholds.length; i++) {
      let threshold = this.thresholds[i];
      if (ratio > threshold || (threshold === 1 && ratio === 1)) {
        count++;
      }
    }
    return {
      item,
      numSatisfiedThresholds: count,
      entry
    };
  }

  private entryFromQueueElement(frame: Frame, item: QueueDOMElementInterface) {
    let rootBounds: DOMRectInit = {
      x: this.rootMargin.left,
      y: this.rootMargin.top,
      width: frame.width - (this.rootMargin.right + this.rootMargin.left),
      height: frame.height - (this.rootMargin.bottom + this.rootMargin.top)
    };

    let width = Math.min(rootBounds.x + rootBounds.width, item.bcr.right) - Math.max(rootBounds.x, item.bcr.left);
    let height = Math.min(rootBounds.y + rootBounds.height, item.bcr.bottom) - Math.max(rootBounds.y, item.bcr.top);

    let intersectionRect: DOMRectInit = {
      x: -1,
      y: -1,
      width,
      height
    };

    return new IntersectionObserverEntry({
      time: frame.timestamp,
      rootBounds,
      target: <SpanielTrackedElement>item.el,
      boundingClientRect: marginToRect(item.bcr),
      intersectionRect
    });
  }

  constructor(callback: Function, options: IntersectionObserverInit = {}) {
    this.records = {};
    this.callback = callback;
    this.id = uuid();
    options.threshold = options.threshold || 0;
    this.rootMargin = rootMarginToDOMMargin(options.rootMargin || '0px');

    if (Array.isArray(options.threshold)) {
      this.thresholds = <Array<number>>options.threshold;
    } else {
      this.thresholds = [<number>options.threshold];
    }
    this.entryQueue = new DOMQueue(`spaniel-observer-queue-${this.id}`);
    RAFStream.pipe(new Stream({
      queue: this.entryQueue,
      process: (frame: Frame, item: QueueDOMElementInterface) => {
        if (frame.isMeasure()) {
          item.bcr = item.el.getBoundingClientRect();
          return this.generateEntryEvent(frame, item);
        }
      }
    })).pipe(new Terminal((e: EntryEvent) => {
      let { item, numSatisfiedThresholds, entry } = e;
      let id = item.id;
      let record: EntryEvent = this.records[id] || (this.records[id] = {
        entry,
        item,
        numSatisfiedThresholds: 0
      });

      if (numSatisfiedThresholds !== record.numSatisfiedThresholds) {
        record.numSatisfiedThresholds = numSatisfiedThresholds;
        item.callback(entry);
      }
    }));
  }
};

export class IntersectionObserverEntry implements IntersectionObserverEntryInit {
  time: DOMHighResTimeStamp;
  intersectionRatio: number;
  rootBounds: DOMRectInit;
  boundingClientRect: DOMRectInit;
  intersectionRect: DOMRectInit;
  target: SpanielTrackedElement;

  constructor(entryInit: IntersectionObserverEntryInit) {
    this.time = entryInit.time;
    this.rootBounds = entryInit.rootBounds;
    this.boundingClientRect = entryInit.boundingClientRect;
    this.intersectionRect = entryInit.intersectionRect;
    this.target = entryInit.target;

    let {
      intersectionRect,
      boundingClientRect
    } = entryInit;
    this.intersectionRatio = (intersectionRect.width * intersectionRect.height) / (boundingClientRect.height * boundingClientRect.width);
  }
};
