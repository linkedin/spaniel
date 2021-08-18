import { expect, test } from '@playwright/test';
import { SpanielObserverEntry } from '../../../src/interfaces';
import { getPageAssertions, getPageTime, pageHide, timestampsAreClose } from '../utils';

function runTests() {
  test('time for initial events are close to page load time', async ({ page }) => {
    const loadTime = await getPageTime(page);
    const delay = 1500;
    await page.waitForTimeout(delay);
    const assertions = await getPageAssertions<SpanielObserverEntry>(page);
    expect(assertions.length).toEqual(2);
    for (let i = 0; i < assertions.length; i++) {
      const a = assertions[i];
      timestampsAreClose(loadTime, a.time);
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
