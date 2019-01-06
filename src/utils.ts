export function calculateIsIntersecting({ intersectionRect }: { intersectionRect: ClientRect }) {
  return intersectionRect.width > 0 || intersectionRect.height > 0;
}
