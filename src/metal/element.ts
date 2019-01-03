/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import { QueueElementInterface, QueueDOMElementInterface, FrameInterface } from './interfaces';

class QueueElement implements QueueElementInterface {
  callback: (frame: FrameInterface, id: string) => void;
  id: string;
}

export default QueueElement;

export class QueueDOMElement implements QueueDOMElementInterface {
  el: Element;
  callback: (frame: FrameInterface, id: string, clientRect: ClientRect) => void;
  id: string;
  clientRect: ClientRect;
}
