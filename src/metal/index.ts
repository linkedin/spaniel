/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import w from './window-proxy';
import { default as QueueElement, QueueDOMElement } from './element';
import { default as Queue, DOMQueue, FunctionQueue } from './queue';
import { QueueElementInterface, QueueDOMElementInterface, FrameInterface, QueueInterface } from './interfaces';
import {
  generateToken,
  ElementScheduler,
  Scheduler,
  PredicatedScheduler,
  Frame,
  getGlobalScheduler
} from './scheduler';
import { Engine } from './engine';
import { on, off, scheduleRead, scheduleWork } from './events';

interface AbsoluteRect {
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface Offset {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export {
  Offset,
  FrameInterface,
  QueueElementInterface,
  QueueDOMElementInterface,
  QueueInterface,
  Queue,
  DOMQueue,
  FunctionQueue,
  QueueElement,
  QueueDOMElement,
  ElementScheduler,
  PredicatedScheduler,
  Scheduler,
  Engine,
  generateToken,
  Frame,
  getGlobalScheduler,
  on,
  off,
  scheduleRead,
  scheduleWork
};
