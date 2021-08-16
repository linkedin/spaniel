/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { calculateIsIntersecting } from './utils';

import { Frame, ElementScheduler, generateToken } from './metal/index';

import {
  SpanielTrackedElement,
  DOMString,
  DOMRectPojo,
  IntersectionObserverInit,
  DOMMargin,
  SpanielIntersectionObserverEntryInit
} from './interfaces';

interface EntryEvent {
  entry: IntersectionObserverEntry;
  numSatisfiedThresholds: number;
}

function marginToRect(margin: DOMMargin): DOMRectPojo {
  let { left, right, top, bottom } = margin;
  return {
    left,
    x: left,
    top,
    y: top,
    bottom,
    right,
    width: right - left,
    height: bottom - top
  };
}

function rootMarginToDOMMargin(rootMargin: DOMString): DOMMargin {
  let c = rootMargin.split(' ').map(n => parseInt(n, 10));
  switch (c.length) {
    case 2:
      return { top: c[0], left: c[1], bottom: c[0], right: c[1] };
    case 3:
      return { top: c[0], left: c[1], bottom: c[2], right: c[1] };
    case 4:
      return { top: c[0], left: c[1], bottom: c[2], right: c[3] };
    default:
      return { top: 0, left: 0, bottom: 0, right: 0 };
  }
}

export class SpanielIntersectionObserver implements IntersectionObserver {
  private scheduler: ElementScheduler;
  private callback: Function;

  public root: SpanielTrackedElement | null;
  public rootMargin: DOMString;
  protected rootMarginObj: DOMMargin;
  public thresholds: number[];
  private records: { [index: string]: EntryEvent };

  observe(target: HTMLElement) {
    let trackedTarget = target as SpanielTrackedElement;

    let id = (trackedTarget.__spanielId = trackedTarget.__spanielId || generateToken());

    this.scheduler.watch(
      target,
      (frame: Frame, id: string, clientRect: DOMRectReadOnly) => {
        this.onTick(frame, id, clientRect, trackedTarget);
      },
      trackedTarget.__spanielId
    );
    return id;
  }
  private onTick(frame: Frame, id: string, clientRect: DOMRectReadOnly, el: SpanielTrackedElement) {
    let { numSatisfiedThresholds, entry } = this.generateEntryEvent(frame, clientRect, el);
    let record: EntryEvent =
      this.records[id] ||
      (this.records[id] = {
        entry,
        numSatisfiedThresholds: 0
      });

    if (
      numSatisfiedThresholds !== record.numSatisfiedThresholds ||
      entry.isIntersecting !== record.entry.isIntersecting
    ) {
      record.numSatisfiedThresholds = numSatisfiedThresholds;
      record.entry = entry;
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
  private generateEntryEvent(frame: Frame, clientRect: DOMRectReadOnly, el: HTMLElement): EntryEvent {
    let count: number = 0;
    let entry = generateEntry(frame, clientRect, el, this.rootMarginObj);

    for (let i = 0; i < this.thresholds.length; i++) {
      let threshold = this.thresholds[i];
      if (entry.intersectionRatio >= threshold) {
        count++;
      }
    }
    return {
      numSatisfiedThresholds: count,
      entry
    };
  }

  constructor(callback: Function, options: IntersectionObserverInit = {}) {
    this.records = {};
    this.callback = callback;
    options.threshold = options.threshold || 0;
    this.rootMarginObj = rootMarginToDOMMargin(options.rootMargin || '0px');
    this.root = options.root || null;
    if (Array.isArray(options.threshold)) {
      this.thresholds = <Array<number>>options.threshold;
    } else {
      this.thresholds = [<number>options.threshold];
    }

    this.scheduler = new ElementScheduler(undefined, this.root, options.ALLOW_CACHED_SCHEDULER);
  }
}

function addRatio(entryInit: SpanielIntersectionObserverEntryInit): IntersectionObserverEntry {
  const { time, rootBounds, boundingClientRect, intersectionRect, target } = entryInit;
  const boundingArea = boundingClientRect.height * boundingClientRect.width;
  const intersectionRatio = boundingArea > 0 ? (intersectionRect.width * intersectionRect.height) / boundingArea : 0;

  return {
    time,
    rootBounds: pojoToToDOMRectReadOnly(rootBounds),
    boundingClientRect: pojoToToDOMRectReadOnly(boundingClientRect),
    intersectionRect: pojoToToDOMRectReadOnly(intersectionRect),
    target,
    intersectionRatio,
    isIntersecting: calculateIsIntersecting({ intersectionRect })
  };
}

// Casting to ignore that we are not returning toJSON property of DOMRectReadOnly
// TODO: Either drop support for browser that do not support natively creating DOMRectReadOnly
// or figure out way to performantly crate DOMReactReadOnly objects
function pojoToToDOMRectReadOnly(pojo: DOMRectPojo): DOMRectReadOnly {
  return pojo as DOMRectReadOnly;
}

function emptyRect(): DOMRectReadOnly {
  return pojoToToDOMRectReadOnly({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0
  });
}

export function generateEntry(
  frame: Frame,
  clientRect: ClientRect,
  el: HTMLElement,
  rootMargin: DOMMargin
): IntersectionObserverEntry {
  if (el.style.display === 'none') {
    return {
      boundingClientRect: emptyRect(),
      intersectionRatio: 0,
      intersectionRect: emptyRect(),
      isIntersecting: false,
      rootBounds: emptyRect(),
      target: el,
      time: frame.timestamp
    };
  }
  let { bottom, right } = clientRect;
  let rootBounds: DOMRectPojo = {
    left: frame.left + rootMargin.left,
    top: frame.top + rootMargin.top,
    x: frame.left + rootMargin.left,
    y: frame.top + rootMargin.top,
    bottom: rootMargin.bottom,
    right: rootMargin.right,
    width: frame.width - (rootMargin.right + rootMargin.left),
    height: frame.height - (rootMargin.bottom + rootMargin.top)
  };

  let intersectX = Math.max(rootBounds.left, clientRect.left);
  let intersectY = Math.max(rootBounds.top, clientRect.top);

  let width = Math.min(rootBounds.left + rootBounds.width, clientRect.right) - intersectX;
  let height = Math.min(rootBounds.top + rootBounds.height, clientRect.bottom) - intersectY;

  let intersectionRect: DOMRectPojo = {
    left: width >= 0 ? intersectX : 0,
    top: intersectY >= 0 ? intersectY : 0,
    x: width >= 0 ? intersectX : 0,
    y: intersectY >= 0 ? intersectY : 0,
    width,
    height,
    right,
    bottom
  };

  return addRatio({
    time: frame.timestamp,
    rootBounds: pojoToToDOMRectReadOnly(rootBounds),
    target: <SpanielTrackedElement>el,
    boundingClientRect: pojoToToDOMRectReadOnly(marginToRect(clientRect)),
    intersectionRect: pojoToToDOMRectReadOnly(intersectionRect)
  });
}
