import { generateEntry } from './intersection-observer';
import { DOMMargin } from './interfaces';
import { getGlobalScheduler, Frame } from './metal/index';

export function calculateIsIntersecting({ intersectionRect }: { intersectionRect: ClientRect }) {
  return intersectionRect.width > 0 || intersectionRect.height > 0;
}

export function queryElement(el: Element, callback: (bcr: ClientRect, frame: Frame) => void) {
  getGlobalScheduler().queryElement(el, callback);
}

export function elementSatisfiesRatio(
  el: HTMLElement,
  ratio: number = 0,
  callback: (result: Boolean) => void,
  rootMargin: DOMMargin = { top: 0, bottom: 0, left: 0, right: 0 }
) {
  queryElement(el, (bcr: ClientRect, frame: Frame) => {
    let entry = generateEntry(frame, bcr, el, rootMargin);
    callback(entry.isIntersecting && entry.intersectionRatio >= ratio);
  });
}
