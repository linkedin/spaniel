/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

export interface SpanielTrackedElement extends HTMLElement {
  __spanielId: string;
}

export interface SpanielThreshold {
  label: string;
  ratio: number;
  time?: number;
}

export interface SpanielObserverInit {
  root?: SpanielTrackedElement;
  rootMargin?: DOMString | DOMMargin; // default: 0px
  threshold: SpanielThreshold[]; // default: 0
  ALLOW_CACHED_SCHEDULER?: boolean;
  BACKGROUND_TAB_FIX?: boolean;
  USE_NATIVE_IO?: boolean;
}

export interface TimeCompat {
  highResTime: number;
  unixTime: number;
}

export interface SpanielRecord {
  target: SpanielTrackedElement;
  payload: any;
  thresholdStates: SpanielThresholdState[];
  lastSeenEntry: MaybeInternalIntersectionObserverEntry | null;
}

export interface SpanielThresholdState {
  lastSatisfied: Boolean;
  lastEntry: MaybeInternalIntersectionObserverEntry | null;
  threshold: SpanielThreshold;
  lastVisible: TimeCompat;
  visible: boolean;
  timeoutId?: number;
}

export interface SpanielIntersectionObserverEntryInit {
  highResTime: DOMHighResTimeStamp;
  unixTime: number;
  rootBounds: SpanielRect;
  boundingClientRect: SpanielRect;
  intersectionRect: SpanielRect & ClientRect;
  target: SpanielTrackedElement;
}

export interface SpanielRect extends Partial<DOMRectReadOnly> {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface SpanielObserverEntry {
  isIntersecting: boolean;
  duration: number;
  visibleTime: number;
  intersectionRatio: number;
  entering: boolean;
  label?: string;
  payload?: any;
  unixTime: number;
  highResTime: number;
  time: number;
  target: Element;
  boundingClientRect: SpanielRect;
  intersectionRect: SpanielRect;
  rootBounds: SpanielRect | null;
}

export interface InternalIntersectionObserverEntry {
  time: number;
  highResTime: DOMHighResTimeStamp;
  target: Element;
  boundingClientRect: SpanielRect;
  intersectionRect: SpanielRect;
  rootBounds: SpanielRect | null;
  intersectionRatio: number;
  isIntersecting: boolean;
}

export interface MaybeInternalIntersectionObserverEntry {
  time: number;
  unixTime?: number;
  highResTime?: DOMHighResTimeStamp;
  target: Element;
  boundingClientRect: SpanielRect;
  intersectionRect: SpanielRect & ClientRect;
  rootBounds: SpanielRect | null;
  intersectionRatio: number;
  isIntersecting: boolean;
}

export interface IntersectionObserverClass {
  new (callback: IntersectionObserverCallback, options?: IntersectionObserverInit): IntersectionObserver;
}

export interface SpanielObserverInterface {
  disconnect: () => void;
  unobserve: (element: SpanielTrackedElement) => void;
  observe: (target: Element, payload: any) => string;
}

export type DOMString = string;
export type DOMHighResTimeStamp = number;

export interface DOMMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DOMRectReadOnly extends DOMRectInit, DOMMargin {}

export interface IntersectionObserverInit {
  root?: SpanielTrackedElement;
  rootMargin?: DOMString; // default: 0px
  threshold?: number | number[]; // default: 0
  ALLOW_CACHED_SCHEDULER?: boolean;
}
