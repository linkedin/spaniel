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
import {
  MetaInterface
} from './interfaces';

const nop = () => 0;

interface WindowProxy {
  hasDOM: boolean;
  hasRAF: boolean;
  getScrollTop: Function;
  getScrollLeft: Function;
  getHeight: Function;
  getWidth: Function;
  rAF: Function;
  meta: MetaInterface;
}

const hasDOM = !!((typeof window !== 'undefined') && window && (typeof document !== 'undefined') && document);
const hasRAF = hasDOM && !!window.requestAnimationFrame;
const throttleDelay: number = 30;

let resizeTimeout: number = 0;
let scrollTimeout: number = 0;
let W: WindowProxy = {
  hasRAF,
  hasDOM,
  getScrollTop: nop,
  getScrollLeft: nop,
  getHeight: nop,
  getWidth: nop,
  rAF: hasRAF ? window.requestAnimationFrame.bind(window) : (callback: Function) => { callback(); },
  meta: {
    width: 0,
    height: 0,
    scrollTop: 0,
    scrollLeft: 0
  }
};

function hasDomSetup() {
  let se = (<any>document).scrollingElement != null;
  W.getScrollTop = se ? () => (<any>document).scrollingElement.scrollTop : () => (<any>window).scrollY;
  W.getScrollLeft = se ? () => (<any>document).scrollingElement.scrollLeft : () => (<any>window).scrollX;
}

// Memoize window meta dimensions
function windowSetDimensionsMeta() {
  W.meta.height = W.getHeight();
  W.meta.width = W.getWidth();
}

function windowSetScrollMeta() {
  W.meta.scrollLeft = W.getScrollLeft();
  W.meta.scrollTop = W.getScrollTop();
}

// Only invalidate window dimensions on resize
function resizeThrottle() {
  window.clearTimeout(resizeTimeout);

  resizeTimeout = window.setTimeout(() => {
    windowSetDimensionsMeta();
  }, throttleDelay);
}

// Only invalidate window scroll on scroll
function scrollThrottle() {
  window.clearTimeout(scrollTimeout);

  scrollTimeout = window.setTimeout(() => {
    windowSetScrollMeta();
  }, throttleDelay);
}

if (hasDOM) {
  // Set the height and width immediately because they will be available at this point
  W.getHeight = () => (<any>window).innerHeight;
  W.getWidth = () => (<any>window).innerWidth;

  windowSetDimensionsMeta();
  windowSetScrollMeta();

  if ((<any>document).readyState !== 'loading') {
    hasDomSetup();
  } else {
    (<any>document).addEventListener('DOMContentLoaded', hasDomSetup);
  }

  window.addEventListener('resize', resizeThrottle, false);
  window.addEventListener('scroll', scrollThrottle, false);
}

export {
  WindowProxy
};

export default W;
