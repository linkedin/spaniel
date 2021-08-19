import { expect, test } from '@playwright/test';
import { SpanielObserverEntry } from '../../../src/interfaces';
import { getPageAssertions, getPageTime, pageHide, pageScroll, pageShow, timestampsAreClose } from '../utils';

function runTests() {
  test('basic fields for initial events are close to page load time', async ({ page }) => {
    const loadTime = await getPageTime(page);
    const delay = 1500;
    await page.waitForTimeout(delay);
    const assertions = await getPageAssertions<SpanielObserverEntry>(page);
    expect(assertions.length).toEqual(2);
    for (let i = 0; i < assertions.length; i++) {
      const a = assertions[i];
      timestampsAreClose(loadTime, a.time);
      expect(a.entering).toBeTruthy();
      expect(a.isIntersecting).toBeTruthy();
    }
    expect(assertions[0].threshold.ratio).toEqual(0);
    expect(assertions[1].threshold.ratio).toEqual(0.5);
    expect(assertions[1].threshold.time).toEqual(1000);
  });

  test('time for shown events after being hidden a long time by scrolling are correct', async ({ page }) => {
    await pageScroll(page, 1000);
    const delay = 2000;
    await page.waitForTimeout(delay);
    await pageScroll(page, 0);
    const time = await getPageTime(page);
    await page.waitForTimeout(1100);
    const assertions = await getPageAssertions<SpanielObserverEntry>(page);
    expect(assertions.length).toEqual(4);
    for (let i = 2; i < assertions.length; i++) {
      const a = assertions[i];
      timestampsAreClose(time, a.time);
      expect(a.entering).toBeTruthy();
      expect(a.isIntersecting).toBeTruthy();
    }
  });

  test('tab hidden entries have correct fields', async ({ page }) => {
    const loadTime = await getPageTime(page);
    const delay = 1500;
    await page.waitForTimeout(delay);
    await pageHide(page);
    await page.waitForTimeout(500);
    const assertions = await getPageAssertions<SpanielObserverEntry>(page);
    expect(assertions.length).toEqual(4);
    // Exiting events
    for (let i = 2; i < assertions.length; i++) {
      const a = assertions[i];
      timestampsAreClose(delay, a.duration);
      expect(a.isIntersecting).toBeFalsy();
      expect(a.entering).toBeFalsy();
      timestampsAreClose(loadTime + delay, a.time);
    }
  });

  test('tab shown entries have correct fields', async ({ page }) => {
    const loadTime = await getPageTime(page);
    const delay = 1500;
    const pause = 500;
    await page.waitForTimeout(delay);
    await pageHide(page);
    await page.waitForTimeout(pause);
    await pageShow(page);
    await page.waitForTimeout(delay);
    const assertions = await getPageAssertions<SpanielObserverEntry>(page);
    expect(assertions.length).toEqual(6);
    // Tab shown events
    for (let i = 4; i < assertions.length; i++) {
      const a = assertions[i];
      expect(a.isIntersecting).toBeTruthy();
      expect(a.entering).toBeTruthy();
      timestampsAreClose(loadTime + delay + pause, a.time);
    }
  });
}

export function spanielObserverModule() {
  test.describe('Spaniel Observer Without native IO >', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/spaniel-observer.html');
    });
    runTests();
  });

  test.describe('Spaniel Observer With native IO >', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/spaniel-observer.html?native=true');
    });
    runTests();
  });
}
