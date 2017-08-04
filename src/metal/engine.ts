/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { EngineInterface } from './interfaces';
import W from './window-proxy';

const NUM_SKIPPED_FRAMES = 3;

export interface OptimizedEngineInterface {
  onMutate?: (func: Function) => void;
  scheduleWork?: (func: Function) => void;
}

export class Engine implements EngineInterface {
  protected reads: Array<Function> = [];
  protected work: Array<Function> = [];
  protected running: Boolean = false;
  protected skipCounter: number = NUM_SKIPPED_FRAMES + 1;
  protected optimizedEngine: Boolean = false;
  scheduleRead(callback: Function) {
    this.reads.unshift(callback);
    this.run();
  }
  scheduleWork(callback: Function) {
    this.work.unshift(callback);
    this.run();
  }
  run() {
    if (!this.running) {
      this.running = true;
      W.rAF(() => {
        this.running = false;
        if (this.skipCounter > NUM_SKIPPED_FRAMES) {
          this.skipCounter = 0;
          for (let i = 0, rlen = this.reads.length; i < rlen; i++) {
            this.reads.pop()();
          }
          for (let i = 0, wlen = this.work.length; i < wlen; i++) {
            this.work.pop()();
          }
        }
        if (!this.optimizedEngine) {
          this.skipCounter++;
          if (this.work.length > 0 || this.reads.length > 0) {
            this.run();
          }
        } else {
          this.skipCounter = NUM_SKIPPED_FRAMES + 1;
        }
      });
    }
  }
  isOptimizedEngine() {
    return this.isOptimizedEngine;
  }
}

export class OptimizedEngine extends Engine {
  constructor(onMutate: (func: Function) => void, scheduleWork?: (func: Function) => void) {
    super();
    this.optimizedEngine = true;
    onMutate && onMutate(this.run.bind(this));
    scheduleWork && (this.scheduleWork = scheduleWork);
  }
  scheduleRead(callback: Function) {
    this.reads.unshift(callback);
  }
  scheduleWork(callback: Function) {
    this.work.unshift(callback);
  }
}