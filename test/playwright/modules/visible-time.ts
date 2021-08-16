import { test, expect } from '@playwright/test';
import { getPageAssertions, getPageState, pageScroll, timestampsAreClose } from '../utils';

export function visibleTimeModule() {
  test('visibleTime for initial events are close to page load time', async ({ page }) => {
    const { time, assertions } = await getPageState(page);
    expect(assertions.length).toBe(1);
    for (let i = 0; i < assertions[0].length; i++) {
      const a = assertions[0][i];
      timestampsAreClose(time, a.meta.visibleTime);
    }
  });

  test('visibleTime for events after scrolling is still from initial load', async ({ page }) => {
    const initialState = await getPageState(page);
    expect(initialState.assertions.length).toBe(1);
    const initialAssertionIndex = initialState.assertions[0].length;
    await page.waitForTimeout(500);
    await pageScroll(page, 1000);
    const assertions = await getPageAssertions(page);
    for (let i = initialAssertionIndex; i < assertions[0].length; i++) {
      const a = assertions[0][i];
      timestampsAreClose(initialState.time, a.meta.visibleTime);
    }
  });

  test('duration impression-complete is the time items were in viewport', async ({ page }) => {
    const initialState = await getPageState(page);
    const timeInViewport = 500;
    await page.waitForTimeout(timeInViewport);
    expect(initialState.assertions.length).toBe(1);
    await pageScroll(page, 1000, true);
    const assertions = await getPageAssertions(page);
    const impressionCompleteAssertions = assertions[0].filter(a => a.e === 'impression-complete');
    for (let i = 0; i < impressionCompleteAssertions.length; i++) {
      const a = impressionCompleteAssertions[i];
      timestampsAreClose(timeInViewport, a.meta.duration);
    }
    expect(impressionCompleteAssertions.length).toBeGreaterThanOrEqual(5);
  });
}
