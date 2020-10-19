/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import {
  DOMMargin,
  DOMString,
  IntersectionObserverInit,
  SpanielObserverEntry,
  SpanielObserverInit,
  SpanielObserverInterface,
  SpanielRecord,
  SpanielThreshold,
  SpanielThresholdState,
  SpanielTrackedElement
} from './interfaces';
import { SpanielIntersectionObserver } from './intersection-observer';
import { generateToken, off, on, scheduleWork } from './metal/index';
import w from './metal/window-proxy';
import { calculateIsIntersecting } from './utils';

let emptyRect = { x: 0, y: 0, width: 0, height: 0 };

const IntersectionObserver = !!w.IntersectionObserver ? w.IntersectionObserver : SpanielIntersectionObserver;

export function DOMMarginToRootMargin(d: DOMMargin): DOMString {
  return `${d.top}px ${d.right}px ${d.bottom}px ${d.left}px`;
}

export class SpanielObserver implements SpanielObserverInterface {
  callback: (entries: SpanielObserverEntry[]) => void;
  observer: SpanielIntersectionObserver | IntersectionObserver;
  thresholds: SpanielThreshold[];
  recordStore: { [key: string]: SpanielRecord };
  queuedEntries: SpanielObserverEntry[];
  private paused: boolean;
  private onWindowClosed: () => void;
  private onTabHidden: () => void;
  private onTabShown: () => void;
  constructor(callback: (entries: SpanielObserverEntry[]) => void, options?: SpanielObserverInit) {
    this.paused = false;
    this.queuedEntries = [];
    this.recordStore = {};
    this.callback = callback;
    let { root, rootMargin, threshold, ALLOW_CACHED_SCHEDULER, BACKGROUND_TAB_FIX } =
      options ||
      ({
        threshold: []
      } as SpanielObserverInit);
    rootMargin = rootMargin || '0px';
    let convertedRootMargin: DOMString =
      typeof rootMargin !== 'string' ? DOMMarginToRootMargin(rootMargin) : rootMargin;
    this.thresholds = threshold.sort((t: SpanielThreshold) => t.ratio);

    let o: IntersectionObserverInit = {
      root,
      rootMargin: convertedRootMargin,
      threshold: this.thresholds.map((t: SpanielThreshold) => t.ratio),
      ALLOW_CACHED_SCHEDULER
    };
    this.observer = new IntersectionObserver(
      (records: IntersectionObserverEntry[]) => this.internalCallback(records),
      o
    );

    this.onTabHidden = this._onTabHidden.bind(this);
    this.onWindowClosed = this._onWindowClosed.bind(this);
    this.onTabShown = this._onTabShown.bind(this);

    if (w.hasDOM) {
      on('beforeunload', this.onWindowClosed);
      on('hide', this.onTabHidden);
      on('show', this.onTabShown);
      if (BACKGROUND_TAB_FIX) {
        this.paused = w.document.visibilityState !== 'visible';
      }
    }
  }
  private _onWindowClosed() {
    this.onTabHidden();
  }
  private setAllHidden() {
    let ids = Object.keys(this.recordStore);
    let time = Date.now();
    for (let i = 0; i < ids.length; i++) {
      this.handleRecordExiting(this.recordStore[ids[i]], time);
    }
    this.flushQueuedEntries();
  }
  private _onTabHidden() {
    this.paused = true;
    this.setAllHidden();
  }
  private _onTabShown() {
    this.paused = false;

    let ids = Object.keys(this.recordStore);
    let time = Date.now();
    for (let i = 0; i < ids.length; i++) {
      let entry = this.recordStore[ids[i]].lastSeenEntry;
      if (entry) {
        let { intersectionRatio, boundingClientRect, rootBounds, intersectionRect, isIntersecting, target } = entry;
        this.handleObserverEntry({
          intersectionRatio,
          boundingClientRect,
          time,
          isIntersecting,
          rootBounds,
          intersectionRect,
          target
        });
      }
    }
  }
  private internalCallback(records: IntersectionObserverEntry[]) {
    records.forEach(this.handleObserverEntry.bind(this));
  }
  private flushQueuedEntries() {
    if (this.queuedEntries.length > 0) {
      this.callback(this.queuedEntries);
      this.queuedEntries = [];
    }
  }
  private generateSpanielEntry(entry: IntersectionObserverEntry, state: SpanielThresholdState): SpanielObserverEntry {
    let { intersectionRatio, time, rootBounds, boundingClientRect, intersectionRect, isIntersecting, target } = entry;
    let record = this.recordStore[(<SpanielTrackedElement>target).__spanielId];

    return {
      intersectionRatio,
      isIntersecting,
      time,
      rootBounds,
      boundingClientRect,
      intersectionRect,
      target: <SpanielTrackedElement>target,
      duration: 0,
      entering: false,
      payload: record.payload,
      label: state.threshold.label
    };
  }
  private handleRecordExiting(record: SpanielRecord, time: number = Date.now()) {
    record.thresholdStates.forEach((state: SpanielThresholdState) => {
      const boundingClientRect = record.lastSeenEntry && record.lastSeenEntry.boundingClientRect;
      this.handleThresholdExiting(
        {
          intersectionRatio: -1,
          isIntersecting: false,
          time,
          payload: record.payload,
          label: state.threshold.label,
          entering: false,
          rootBounds: emptyRect,
          boundingClientRect: boundingClientRect || emptyRect,
          intersectionRect: emptyRect,
          duration: time - state.lastVisible,
          target: record.target
        },
        state
      );
      state.lastSatisfied = false;
      state.visible = false;
      state.lastEntry = null;
    });
  }
  private handleThresholdExiting(spanielEntry: SpanielObserverEntry, state: SpanielThresholdState) {
    let { time } = spanielEntry;
    let hasTimeThreshold = !!state.threshold.time;
    if (state.lastSatisfied && (!hasTimeThreshold || (hasTimeThreshold && state.visible))) {
      // Make into function
      spanielEntry.duration = time - state.lastVisible;
      spanielEntry.entering = false;
      state.visible = false;
      this.queuedEntries.push(spanielEntry);
    }

    clearTimeout(state.timeoutId);
  }
  private handleObserverEntry(entry: IntersectionObserverEntry) {
    let { time } = entry;
    let target = <SpanielTrackedElement>entry.target;
    let record = this.recordStore[target.__spanielId];

    if (record) {
      record.lastSeenEntry = entry;
      if (!this.paused) {
        record.thresholdStates.forEach((state: SpanielThresholdState) => {
          // Find the thresholds that were crossed. Since you can have multiple thresholds
          // for the same ratio, could be multiple thresholds
          let hasTimeThreshold = !!state.threshold.time;
          let spanielEntry: SpanielObserverEntry = this.generateSpanielEntry(entry, state);

          const ratioSatisfied = entry.intersectionRatio >= state.threshold.ratio;

          // The spaniel polyfill doesn't have isIntersecting, so only calculate if it doesn't exist, i.e. we aren't using
          // the native intersectionobserver
          const isIntersecting =
            typeof spanielEntry.isIntersecting === 'boolean'
              ? spanielEntry.isIntersecting
              : calculateIsIntersecting(entry);
          const isSatisfied = ratioSatisfied && isIntersecting;

          if (isSatisfied != state.lastSatisfied) {
            if (isSatisfied) {
              spanielEntry.entering = true;
              if (hasTimeThreshold) {
                state.lastVisible = time;
                const timerId: number = Number(
                  setTimeout(() => {
                    state.visible = true;
                    spanielEntry.duration = Date.now() - state.lastVisible;
                    this.callback([spanielEntry]);
                  }, state.threshold.time)
                );
                state.timeoutId = timerId;
              } else {
                state.visible = true;
                this.queuedEntries.push(spanielEntry);
              }
            } else {
              this.handleThresholdExiting(spanielEntry, state);
            }

            state.lastEntry = entry;
            state.lastSatisfied = isSatisfied;
          }
        });
        this.flushQueuedEntries();
      }
    }
  }
  disconnect() {
    this.setAllHidden();
    this.observer.disconnect();
    this.recordStore = {};
  }

  /*
   * Must be called when the SpanielObserver is done being used.
   * This will prevent memory leaks.
   */
  destroy() {
    this.disconnect();
    if (w.hasDOM) {
      off('beforeunload', this.onWindowClosed);
      off('hide', this.onTabHidden);
      off('show', this.onTabShown);
    }
  }
  unobserve(element: SpanielTrackedElement) {
    let record = this.recordStore[element.__spanielId];
    if (record) {
      delete this.recordStore[element.__spanielId];
      this.observer.unobserve(element);
      scheduleWork(() => {
        this.handleRecordExiting(record);
        this.flushQueuedEntries();
      });
    }
  }
  observe(target: Element, payload: any = null) {
    let trackedTarget = target as SpanielTrackedElement;
    let id = (trackedTarget.__spanielId = trackedTarget.__spanielId || generateToken());

    this.recordStore[id] = {
      target: trackedTarget,
      payload,
      lastSeenEntry: null,
      thresholdStates: this.thresholds.map((threshold: SpanielThreshold) => ({
        lastSatisfied: false,
        lastEntry: null,
        threshold,
        visible: false,
        lastVisible: 0
      }))
    };
    this.observer.observe(trackedTarget);
    return id;
  }
}
