import { SpanielClientRectInterface } from './metal/interfaces';

export function entrySatisfiesRatio(entry: IntersectionObserverEntry, threshold: number) {
  let { boundingClientRect, intersectionRatio } = entry;

  // Edge case where item has no actual area
  if (boundingClientRect.width === 0 || boundingClientRect.height === 0) {
    let { boundingClientRect, intersectionRect } = entry;
    return boundingClientRect.left === intersectionRect.left &&
      boundingClientRect.top === intersectionRect.top &&
      intersectionRect.width >= 0 &&
      intersectionRect.height >= 0;
  } else {
    return intersectionRatio > threshold || (intersectionRatio === 1 && threshold === 1);
  }
}

export function getBoundingClientRect(element: Element): SpanielClientRectInterface  {
  try {
    return element.getBoundingClientRect() as SpanielClientRectInterface;
  } catch (e) {
    if (typeof e === 'object' && e !== null && (e.number & 0xFFFF) === 16389) {
      return { top: 0, bottom: 0, left: 0, width: 0, height: 0, right: 0, x: 0, y: 0 };
    } else {
      throw e;
    }
  }
}

export function throttle(cb: Function, thottleDelay: number = 5, scope = window) {
  let cookie: any;
  return () => {
    scope.clearTimeout(cookie);
    cookie = scope.setTimeout(cb, thottleDelay);
  };
}