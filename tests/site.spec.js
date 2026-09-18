const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1100 },
];

async function scrollPage(page) {
  const images = page.locator('img[loading=\"lazy\"]');
  const count = await images.count();

  for (let index = 0; index < count; index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded();
  }

  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const viewport of viewports) {
  test(`layout is stable at ${viewport.name}`, async ({ page }) => {
    const issues = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        issues.push(`console:${message.text()}`);
      }
    });
    page.on('pageerror', (error) => issues.push(`pageerror:${error.message}`));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/catrinar_v6/');
    await expect(page.getByRole('heading', { name: 'MOVE PEOPLE. TRANSFORM LEARNING.' })).toBeVisible();
    await expect(page.getByRole('link', { name: /start a conversation/i })).toHaveAttribute(
      'href',
      'mailto:mihaicatrinar@gmail.com'
    );
    await expect(page.getByRole('link', { name: /explore the act course/i })).toHaveAttribute(
      'href',
      'https://www.conceptualtransfer.com/courses/conceptual-transfer-in-physical-ed-health'
    );
    await scrollPage(page);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    const imagesLoaded = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.currentSrc || img.getAttribute('src'))
        .every((img) => img.complete && img.naturalWidth > 0)
    );
    expect(imagesLoaded).toBe(true);
    expect(issues).toEqual([]);
  });
}

test('mobile menu opens, closes on escape, and unlocks on resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catrinar_v6/');

  const toggle = page.locator('.menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  await expect(page.locator('#site-navigation a').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);

  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  await expect(page.locator('#site-navigation')).toBeVisible();
});

test('lightbox traps focus and restores opener on close', async ({ page }) => {
  await page.goto('/catrinar_v6/');
  const opener = page.getByRole('link', { name: 'Beach study' });
  await opener.click();

  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toHaveAttribute('open', '');
  await expect(page.locator('#site-shell')).toHaveJSProperty('inert', true);
  await expect(page.getByRole('button', { name: 'Close image' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Open original image' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close image' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
  await expect(page.locator('#site-shell')).toHaveJSProperty('inert', false);
  await expect(opener).toBeFocused();
});

test('motion follows OS by default, explicit toggle wins, and blocked localStorage does not break init', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/catrinar_v6/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');

  await page.getByRole('button', { name: 'Turn motion off' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await context.close();

  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked localStorage');
      },
    });
  });
  const blockedPage = await blockedContext.newPage();
  const pageErrors = [];
  blockedPage.on('pageerror', (error) => pageErrors.push(error.message));
  await blockedPage.goto('/catrinar_v6/');
  await expect(blockedPage.getByRole('heading', { name: 'MOVE PEOPLE. TRANSFORM LEARNING.' })).toBeVisible();
  expect(pageErrors).toEqual([]);
  await blockedContext.close();
});

test('no-JS fallback keeps mobile navigation visible and gallery links useful', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/catrinar_v6/');

  await expect(page.locator('#site-navigation')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Beach study' })).toHaveAttribute('href', 'assets/images/beach-study.jpg');

  await page.getByRole('link', { name: 'Beach study' }).scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: 'Beach study' }).click();
  await expect(page).toHaveURL(/assets\/images\/beach-study\.jpg$/);
  await context.close();
});
