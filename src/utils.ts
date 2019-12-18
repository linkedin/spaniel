import { SpanielClientRectInterface } from './metal/interfaces';

export function calculateIsIntersecting({ intersectionRect }: { intersectionRect: ClientRect }) {
  return intersectionRect.width >= 0 && intersectionRect.height >= 0;
}

export function getBoundingClientRect(element: Element): SpanielClientRectInterface {
  try {
    return element.getBoundingClientRect() as SpanielClientRectInterface;
  } catch (e) {
    if (typeof e === 'object' && e !== null && (e.number & 0xffff) === 16389) {
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
