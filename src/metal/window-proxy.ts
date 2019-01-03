/*
Copyright 2017 LinkedIn Corp. Licensed under the Apache License,
Version 2.0 (the "License"); you may not use this file except in
compliance with the License. You may obtain a copy of the License
at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

// detect the presence of DOM
const nop = () => 0;

import { IntersectionObserverClass } from '../interfaces';

interface WindowProxy {
  hasDOM: boolean;
  hasRAF: boolean;
  getScrollTop: Function;
  getScrollLeft: Function;
  getHeight: Function;
  getWidth: Function;
  rAF: Function;
  IntersectionObserver: IntersectionObserverClass;
}

const hasDOM = !!(typeof window !== 'undefined' && window && typeof document !== 'undefined' && document);
const hasRAF = hasDOM && !!window.requestAnimationFrame;

let W: WindowProxy = {
  hasRAF,
  hasDOM,
  getScrollTop: nop,
  getScrollLeft: nop,
  getHeight: nop,
  getWidth: nop,
  rAF: hasRAF
    ? window.requestAnimationFrame.bind(window)
    : (callback: Function) => {
        callback();
      },
  IntersectionObserver: hasDOM && (window as any).IntersectionObserver
};

function hasDomSetup() {
  let se = (<any>document).scrollingElement != null;
  W.getScrollTop = se ? () => (<any>document).scrollingElement.scrollTop : () => (<any>window).scrollY;
  W.getScrollLeft = se ? () => (<any>document).scrollingElement.scrollLeft : () => (<any>window).scrollX;
}

if (hasDOM) {
  // Set the height and width immediately because they will be available at this point
  W.getHeight = () => (<any>window).innerHeight;
  W.getWidth = () => (<any>window).innerWidth;

  if ((<any>document).readyState !== 'loading') {
    hasDomSetup();
  } else {
    (<any>document).addEventListener('DOMContentLoaded', hasDomSetup);
  }
}

export { WindowProxy };

export default W;
