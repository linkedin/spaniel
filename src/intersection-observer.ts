/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  Frame,
  QueueDOMElementInterface,
  DOMQueue,
  ElementScheduler,
  Engine,
  generateToken
} from './metal/index';

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

  // Non-spec flag that tells the observer to not actually observe anything
  // Creates a single entry point for turning off any work done. Useful for
  // server-side rendering when we don't actually need to obsere anything.
  dormant?: boolean;

  root?: SpanielTrackedElement;
  rootMargin?: DOMString; // default: 0px
  threshold?: number | number[]; // default: 0
}

interface EntryEvent {
  entry: IntersectionObserverEntry;
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
  private scheduler: ElementScheduler;
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
  observe(target: Element) {
    let trackedTarget = target as SpanielTrackedElement;

    let id = trackedTarget.__spanielId = trackedTarget.__spanielId || generateToken();

    this.scheduler.watch(target, (frame: Frame, id: string, bcr: ClientRect) => {
      this.onTick(frame, id, bcr, trackedTarget);
    }, trackedTarget.__spanielId);
    return id;
  }
  private onTick(frame: Frame, id: string,  bcr: ClientRect, el: Element) {
    let { numSatisfiedThresholds, entry } = this.generateEntryEvent(frame, bcr, el);
    let record: EntryEvent = this.records[id] || (this.records[id] = {
      entry,
      numSatisfiedThresholds: 0
    });

    if (numSatisfiedThresholds !== record.numSatisfiedThresholds) {
      record.numSatisfiedThresholds = numSatisfiedThresholds;
      this.scheduler.scheduleWork(() => {
        this.callback([entry]);
      });
    }
  }
  unobserve(target: SpanielTrackedElement) {
    this.scheduler.unwatch(target.__spanielId);
    delete this.records[target.__spanielId];
  }
  disconnect() {
    this.scheduler.unwatchAll();
    this.records = {};
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  private generateEntryEvent(frame: Frame, bcr: ClientRect, el: Element): EntryEvent {
    let count: number = 0;
    let entry = generateEntry(frame, bcr, el, this.rootMargin);
    let ratio = entry.intersectionRatio;

    for (let i = 0; i < this.thresholds.length; i++) {
      let threshold = this.thresholds[i];
      if (entrySatisfiesRatio(entry, threshold)) {
        count++;
      }
    }
    return {
      numSatisfiedThresholds: count,
      entry
    };
  }

  constructor(callback: Function, options: IntersectionObserverInit = {}) {
    if (options.dormant) {
      // If we are in dormant mode, observe should do nothing
      this.observe = (target: Element) => '';
    }
    this.records = {};
    this.callback = callback;
    this.id = generateToken();
    options.threshold = options.threshold || 0;
    this.rootMargin = rootMarginToDOMMargin(options.rootMargin || '0px');

    if (Array.isArray(options.threshold)) {
      this.thresholds = <Array<number>>options.threshold;
    } else {
      this.thresholds = [<number>options.threshold];
    }

    this.scheduler = new ElementScheduler();
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
    let boundingArea = boundingClientRect.height * boundingClientRect.width;
    this.intersectionRatio = boundingArea > 0 ? (intersectionRect.width * intersectionRect.height) / boundingArea : 0;
  }
};

export function entrySatisfiesRatio(entry: IntersectionObserverEntry, threshold: number) {
  let { boundingClientRect, intersectionRatio } = entry;

  // Edge case where item has no actual area
  if (boundingClientRect.width === 0 || boundingClientRect.height === 0) {
    let { boundingClientRect, intersectionRect } = entry;
    return boundingClientRect.x === intersectionRect.x &&
      boundingClientRect.y === intersectionRect.y &&
      intersectionRect.width >= 0 &&
      intersectionRect.height >= 0;
  } else {
    return intersectionRatio > threshold || (intersectionRatio === 1 && threshold === 1);
  }
}

export function generateEntry(frame: Frame, bcr: ClientRect, el: Element, rootMargin: DOMMargin) {
  let rootBounds: DOMRectInit = {
    x: rootMargin.left,
    y: rootMargin.top,
    width: frame.width - (rootMargin.right + rootMargin.left),
    height: frame.height - (rootMargin.bottom + rootMargin.top)
  };

  let intersectX = Math.max(rootBounds.x, bcr.left);
  let intersectY = Math.max(rootBounds.y, bcr.top);

  let width = Math.min(rootBounds.x + rootBounds.width, bcr.right) - intersectX;
  let height = Math.min(rootBounds.y + rootBounds.height, bcr.bottom) - intersectY;

  let intersectionRect: DOMRectInit = {
    x: width >= 0 ? intersectX : 0,
    y: intersectY >= 0 ? intersectY : 0,
    width,
    height
  };

  return new IntersectionObserverEntry({
    time: frame.timestamp,
    rootBounds,
    target: <SpanielTrackedElement>el,
    boundingClientRect: marginToRect(bcr),
    intersectionRect
  });
}