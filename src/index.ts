/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { SpanielIntersectionObserver, generateEntry } from './intersection-observer';

import { SpanielTrackedElement, DOMMargin, IntersectionObserverClass } from './interfaces';

export { Watcher, WatcherConfig } from './watcher';

import { SpanielObserver } from './spaniel-observer';

import { setGlobalEngine, getGlobalEngine } from './metal/engine';

import { getGlobalScheduler, on, off, scheduleWork, scheduleRead, Frame } from './metal/index';

import w from './metal/window-proxy';

import { invalidate } from './metal/window-proxy';

const IntersectionObserver: IntersectionObserverClass = !!w.IntersectionObserver
  ? w.IntersectionObserver
  : SpanielIntersectionObserver;

export {
  on,
  off,
  scheduleRead,
  scheduleWork,
  IntersectionObserver,
  SpanielObserver,
  SpanielTrackedElement,
  setGlobalEngine,
  getGlobalEngine,
  w as __w__,
  invalidate
};

export function queryElement(el: Element, callback: (clientRect: ClientRect, frame: Frame) => void) {
  getGlobalScheduler().queryElement(el, callback);
}

export function elementSatisfiesRatio(
  el: HTMLElement,
  ratio: number = 0,
  callback: (result: Boolean) => void,
  rootMargin: DOMMargin = { top: 0, bottom: 0, left: 0, right: 0 }
) {
  queryElement(el, (clientRect: ClientRect, frame: Frame) => {
    let entry = generateEntry(frame, clientRect, el, rootMargin);
    callback(entry.isIntersecting && entry.intersectionRatio >= ratio);
  });
}
