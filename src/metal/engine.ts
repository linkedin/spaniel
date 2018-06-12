/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

// Using named and default exports together. Consumers of your bundle will have to use bundle['default']
// to access the default export, which may not be what you want. Use `exports: 'named'` to disable this warning
import { EngineInterface } from './interfaces';
import W from './window-proxy';
// import Backburner from 'backburner';
export class Engine implements EngineInterface {
  private reads: Array<Function> = [];
  private work: Array<Function> = [];
  private running: boolean = false;
  private batchingWrapper: Function;
  // public bb: Backburner;
  constructor() {
    // if (!this.bb) { this.bb = new Backburner(['read', 'write']); }
  }
  scheduleRead(callback: Function) {
    this.reads.unshift(callback);
    this.run();
  }
  scheduleWork(callback: Function) {
    this.work.unshift(callback);
    this.run();
  }
  private run() {
    if (!this.running) {
      this.running = true;
      W.rAF(() => {
        // bb.join(() => {
          for (let i = 0, rlen = this.reads.length; i < rlen; i++) {
            this.reads.pop()();
          }
          for (let i = 0, wlen = this.work.length; i < wlen; i++) {
            this.work.pop()();
          }
          this.running = false;
          if (this.work.length > 0 || this.reads.length > 0) {
            this.run();
          }
        // });
      });
    }
  }
}

let globalEngine: EngineInterface = null;

export function setGlobalEngine(engine: EngineInterface): boolean {
  if (!!globalEngine) {
    return false;
  }
  globalEngine = engine;
  return true;
}

export function getGlobalEngine() {
  return globalEngine || (globalEngine = new Engine());
}
