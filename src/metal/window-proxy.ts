/*
Copyright 2016 LinkedIn Corp. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software  distributed under the License is distributed on an "AS IS" BASIS,  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

// detect the presence of DOM
const nop = () => 0;

interface WindowProxy {
  hasDOM: boolean;
  getScrollTop: Function;
  getScrollLeft: Function;
  getHeight: Function;
  getWidth: Function;
  rAF: Function;
}

let hasDOM = !!((typeof window !== 'undefined') && window && (typeof document !== 'undefined') && document);

let W: WindowProxy = {
  hasDOM,
  getScrollTop: nop,
  getScrollLeft: nop,
  getHeight: nop,
  getWidth: nop,
  rAF: hasDOM && !!window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : () => {}
};

function hasDomSetup() {
  let se = typeof (<any>document).scrollingElement !== 'undefined';
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

export {
  WindowProxy
};

export default W;
