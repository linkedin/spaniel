import { expect, Page } from '@playwright/test';
import { WatcherCallbackOptions } from '../../src/interfaces';

export function timestampsAreClose(a?: number, b?: number) {
  if (!a || !b) {
    throw new Error('Provided timestamp is falsy');
  }
  const delta = 100;
  expect(b).toBeLessThan(a + delta);
  expect(b).toBeGreaterThan(a - delta);
}

interface SpanielAssertion {
  id: number;
  e: string;
  meta: WatcherCallbackOptions;
}

export async function getPageAssertions(page: Page): Promise<SpanielAssertion[][]> {
  return page.evaluate(async () => {
    return (window as any).ASSERTIONS as any;
  });
}

export async function getPageTime(page: Page) {
  return page.evaluate(async () => {
    return Date.now();
  });
}

interface PageState {
  time: number;
  assertions: SpanielAssertion[][];
}

/*
 * Helper for grabbing the initial page load time and then assertions from the initial page load
 */
export async function getInitialPageState(page: Page, expectedAssertions: number): Promise<PageState> {
  const INITIAL_EVENT_GRACE_PERIOD = 500;

  const time = await getPageTime(page);

  // Wait for initial impression events to fire
  await page.waitForTimeout(INITIAL_EVENT_GRACE_PERIOD);
  const assertions = await getPageAssertions(page);
  expect(assertions.length).toBe(1);

  // This assertion just makes sure the INITIAL_EVENT_GRACE_PERIOD works
  // If the following assertion fails, probably means the page is taking longer
  // Than expected to boot
  expect(assertions[0].length).toBe(expectedAssertions);

  return {
    time,
    assertions
  };
}

export async function getPageState(page: Page): Promise<PageState> {
  const [time, assertions] = await Promise.all([getPageTime(page), getPageAssertions(page)]);
  return {
    time,
    assertions
  };
}
const STANDARD_SCROLL_WAIT = 250;
export async function pageScroll(page: Page, amount: number, waitAfter: boolean | number = false) {
  await page.evaluate(a => window.scrollTo(0, a), amount);
  if (!waitAfter) {
    return;
  }
  await page.waitForTimeout(typeof waitAfter === 'boolean' ? STANDARD_SCROLL_WAIT : waitAfter);
}
