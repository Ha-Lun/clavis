import { test, expect } from '@playwright/test';

test.describe('Live Production Deployment Verification (https://clavis.lundstromslogiska.se)', () => {
  test('a. Sitemap XML Validation (/sitemap.xml)', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const body = await response.text();
    console.log('=== SITEMAP.XML START ===');
    console.log(body);
    console.log('=== SITEMAP.XML END ===');

    expect(body).toMatch(/<\?xml|<urlset/i);
    expect(body).not.toContain('vercel.app');
    expect(body).toContain('<loc>https://clavis.lundstromslogiska.se/</loc>');
    expect(body).toContain('<loc>https://clavis.lundstromslogiska.se/login</loc>');
    expect(body).toContain('<loc>https://clavis.lundstromslogiska.se/signup</loc>');
  });

  test('b. Robots.txt Validation (/robots.txt)', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const body = await response.text();
    console.log('=== ROBOTS.TXT START ===');
    console.log(body);
    console.log('=== ROBOTS.TXT END ===');

    expect(body).toContain('Sitemap: https://clavis.lundstromslogiska.se/sitemap.xml');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /api/');
  });

  test('c. Public Landing Page Rendering (/)', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Assert <title> contains Clavis
    await expect(page).toHaveTitle(/Clavis/i);

    // Assert <meta name="description"> is present and non-empty
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
    const content = await metaDescription.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.trim().length).toBeGreaterThan(0);

    // Assert <h1> is visible with text containing "The Socratic AI Teaching Assistant"
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('The Socratic AI Teaching Assistant');

    // Assert CTAs linking to /login and /signup are visible
    const loginLink = page.locator('a[href="/login"]').first();
    const signupLink = page.locator('a[href="/signup"]').first();
    await expect(loginLink).toBeVisible();
    await expect(signupLink).toBeVisible();

    // Take a full page screenshot to test-results/landing-page.png
    await page.screenshot({ path: 'test-results/landing-page.png', fullPage: true });
  });

  test('d. Sign In Page (/login)', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Assert email and password input fields are visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Assert title contains Sign In or Clavis
    await expect(page).toHaveTitle(/Sign In|Clavis/i);
  });

  test('e. Sign Up Page (/signup)', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Assert email and password input fields are visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInputs.first()).toBeVisible();
    expect(await passwordInputs.count()).toBeGreaterThanOrEqual(1);
  });

  test('f. OpenGraph Dynamic Image (/opengraph-image)', async ({ request }) => {
    const response = await request.get('/opengraph-image');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/image\/(png|.*)/i);
  });
});
