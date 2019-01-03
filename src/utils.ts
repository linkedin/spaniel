export function entrySatisfiesRatio(entry: IntersectionObserverEntry, threshold: number) {
  let { boundingClientRect, intersectionRatio } = entry;

  // Edge case where item has no actual area
  if (boundingClientRect.width === 0 || boundingClientRect.height === 0) {
    let { boundingClientRect, intersectionRect } = entry;
    return (
      boundingClientRect.left === intersectionRect.left &&
      boundingClientRect.top === intersectionRect.top &&
      intersectionRect.width >= 0 &&
      intersectionRect.height >= 0
    );
  } else {
    return intersectionRatio > threshold || (intersectionRatio === 1 && threshold === 1);
  }
}
