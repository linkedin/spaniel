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
  entrySatisfiesRatio
} from './utils';

import {
  SpanielIntersectionObserver
} from './intersection-observer';

import {
  IntersectionObserverInit,
  DOMString,
  DOMMargin,
  SpanielObserverInterface,
  SpanielThreshold,
  SpanielObserverInit,
  SpanielRecord,
  SpanielThresholdState,
  SpanielObserverEntry,
  SpanielTrackedElement
} from './interfaces';

import {
  SpanielInstance
} from './spaniel-instance';

import w from './metal/window-proxy';

import { generateToken } from './metal/index';

let emptyRect = { x: 0, y: 0, width: 0, height: 0 };

const IntersectionObserver = !!w.IntersectionObserver ? w.IntersectionObserver : undefined;

export function DOMMarginToRootMargin(d: DOMMargin): DOMString {
  return `${d.top}px ${d.right}px ${d.bottom}px ${d.left}px`;
}

export class SpanielObserver implements SpanielObserverInterface {
  callback: (entries: SpanielObserverEntry[]) => void;
  observer: IntersectionObserver;
  thresholds: SpanielThreshold[];
  recordStore: { [key: string]: SpanielRecord; };
  queuedEntries: SpanielObserverEntry[];
  parentSpanielInstance: SpanielInstance;
  private paused: boolean;
  private onWindowClosed: () => void;
  private onTabHidden: () => void;
  private onTabShown: () => void;
  constructor(callback: (entries: SpanielObserverEntry[]) => void, options: SpanielObserverInit = {}, parentSpanielInstance: SpanielInstance) {
    this.paused = false;
    this.queuedEntries = [];
    this.recordStore = {};
    this.callback = callback;
    let { root, rootMargin, threshold } = options;
    this.parentSpanielInstance = parentSpanielInstance;
    rootMargin = rootMargin || '0px';
    let convertedRootMargin: DOMString = typeof rootMargin !== 'string' ? DOMMarginToRootMargin(rootMargin) : rootMargin;
    this.thresholds = threshold.sort((t: SpanielThreshold) => t.ratio );

    let o: IntersectionObserverInit = {
      root,
      rootMargin: convertedRootMargin,
      threshold: this.thresholds.map((t: SpanielThreshold) => t.ratio)
    };

    this.onTabHidden = this._onTabHidden.bind(this);
    this.onWindowClosed = this._onWindowClosed.bind(this);
    this.onTabShown = this._onTabShown.bind(this);
    // if (!!w.IntersectionObserver) {
    //   this.observer = new IntersectionObserver((records: IntersectionObserverEntry[]) => this.internalCallback(records), o);
    // } else {
    //   this.observer = new SpanielIntersectionObserver(, parentSpanielInstance);
    // }
    this.observer = new parentSpanielInstance.IntersectionObserver((records: IntersectionObserverEntry[]) => this.internalCallback(records), o);
    if (w.hasDOM) {
      this.parentSpanielInstance.on('unload', this.onWindowClosed.bind(this));
      this.parentSpanielInstance.on('hide', this.onTabHidden.bind(this));
      this.parentSpanielInstance.on('show', this.onTabShown.bind(this));
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
        let {
          intersectionRatio,
          boundingClientRect,
          rootBounds,
          intersectionRect,
          target
        } = entry;
        this.handleObserverEntry({
          intersectionRatio,
          boundingClientRect,
          time,
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
    let {
      intersectionRatio,
      time,
      rootBounds,
      boundingClientRect,
      intersectionRect,
      target
    } = entry;
    let record = this.recordStore[(<SpanielTrackedElement>target).__spanielId];

    return {
      intersectionRatio,
      time,
      rootBounds,
      boundingClientRect,
      intersectionRect,
      target: <SpanielTrackedElement>target,
      duration: 0,
      entering: null,
      payload: record.payload,
      label: state.threshold.label
    };
  }
  private handleRecordExiting(record: SpanielRecord, time: number = Date.now()) {
    record.thresholdStates.forEach((state: SpanielThresholdState) => {
      this.handleThresholdExiting({
        intersectionRatio: -1,
        time,
        payload: record.payload,
        label: state.threshold.label,
        entering: false,
        rootBounds: emptyRect,
        boundingClientRect: emptyRect,
        intersectionRect: emptyRect,
        duration: time - state.lastVisible,
        target: record.target
      }, state);
      state.lastSatisfied = false;
      state.visible = false;
      state.lastEntry = null;
    });
  }
  private handleThresholdExiting(spanielEntry: SpanielObserverEntry, state: SpanielThresholdState) {
    let { time, intersectionRatio } = spanielEntry;
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
    const { time } = entry;
    const target = <SpanielTrackedElement>entry.target;
    const record = this.recordStore[target.__spanielId];
    if (record) {
      record.lastSeenEntry = entry;
      if (!this.paused) {
        record.thresholdStates.forEach((state: SpanielThresholdState) => {
          // Find the thresholds that were crossed. Since you can have multiple thresholds
          // for the same ratio, could be multiple thresholds
          let hasTimeThreshold = !!state.threshold.time;
          let spanielEntry: SpanielObserverEntry = this.generateSpanielEntry(entry, state);

          const ratioSatisfied = entrySatisfiesRatio(entry, state.threshold.ratio);

          if (ratioSatisfied && !state.lastSatisfied) {
            spanielEntry.entering = true;
            if (hasTimeThreshold) {
              state.lastVisible = time;
              const timerId: number = Number(setTimeout(() => {
                state.visible = true;
                spanielEntry.duration = Date.now() - state.lastVisible;
                this.callback([spanielEntry]);
              }, state.threshold.time));
              state.timeoutId = timerId;
            } else {
              state.visible = true;
              this.queuedEntries.push(spanielEntry);
            }
          } else if (!ratioSatisfied) {
            this.handleThresholdExiting(spanielEntry, state);
          }

          state.lastEntry = entry;
          state.lastSatisfied = ratioSatisfied;
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
      this.parentSpanielInstance.off('unload', this.onWindowClosed);
      this.parentSpanielInstance.off('hide', this.onTabHidden);
      this.parentSpanielInstance.off('show', this.onTabShown);
    }
  }
  unobserve(element: SpanielTrackedElement) {
    let record = this.recordStore[element.__spanielId];
    if (record) {
      delete this.recordStore[element.__spanielId];
      this.observer.unobserve(element);
      this.parentSpanielInstance.getScheduler().scheduleWork(() => {
        this.handleRecordExiting(record);
        this.flushQueuedEntries();
      });
    }
  }
  observe(target: Element, payload: any = null) {
    let trackedTarget = target as SpanielTrackedElement;
    let id = trackedTarget.__spanielId = trackedTarget.__spanielId || generateToken();

    this.recordStore[id] = {
      target: trackedTarget,
      payload,
      lastSeenEntry: null,
      thresholdStates: this.thresholds.map((threshold: SpanielThreshold) => ({
        lastSatisfied: false,
        lastEntry: null,
        threshold,
        visible: false,
        lastVisible: null
      }))
    };
    this.observer.observe(trackedTarget);
    return id;
  }
}
