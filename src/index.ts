/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { SpanielIntersectionObserver } from './intersection-observer';
import { SpanielTrackedElement, IntersectionObserverClass } from './interfaces';
import { SpanielObserver } from './spaniel-observer';
import { setGlobalEngine, getGlobalEngine } from './metal/engine';
import { on, off, scheduleWork, scheduleRead } from './metal/index';
import w from './metal/window-proxy';

export { Watcher, WatcherConfig } from './watcher';
export { queryElement, elementSatisfiesRatio } from './utils';

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
  getGlobalEngine
};
