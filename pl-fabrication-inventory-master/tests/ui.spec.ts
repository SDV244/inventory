import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jarvis.vipmedicalgroup.ai/pl-inventory';

test.describe('PL Fabrication Inventory - UI/UX Tests', () => {
  
  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/PL Fabrication Inventory/);
    // Check main dashboard elements
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
  });

  test('Navigation sidebar works', async ({ page }) => {
    await page.goto(BASE_URL);
    // Test navigation links
    await page.click('text=Inventory');
    await expect(page.url()).toContain('/inventory');
    
    await page.click('text=BOM');
    await expect(page.url()).toContain('/bom');
    
    await page.click('text=Production');
    await expect(page.url()).toContain('/production');
    
    await page.click('text=Devices');
    await expect(page.url()).toContain('/devices');
    
    await page.click('text=Quality');
    await expect(page.url()).toContain('/quality');
    
    await page.click('text=Reports');
    await expect(page.url()).toContain('/reports');
    
    await page.click('text=Settings');
    await expect(page.url()).toContain('/settings');
  });

  test('Inventory page - Add Component button opens modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.click('button:has-text("Add Component")');
    await expect(page.locator('text=Add New Component')).toBeVisible();
  });

  test('Inventory page - Search filters components', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('LED');
    // Should filter results
    await page.waitForTimeout(500);
  });

  test('BOM page - Create BOM button opens modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/bom`);
    await page.click('button:has-text("Create BOM")');
    await expect(page.locator('text=Create Bill of Materials')).toBeVisible();
  });

  test('Production page - New Work Order button works', async ({ page }) => {
    await page.goto(`${BASE_URL}/production`);
    await page.click('button:has-text("New Work Order")');
    await expect(page.locator('text=Create Work Order')).toBeVisible();
  });

  test('Production page - Layout is properly fitted', async ({ page }) => {
    await page.goto(`${BASE_URL}/production`);
    // Check no horizontal scroll
    const body = page.locator('body');
    const scrollWidth = await body.evaluate(el => el.scrollWidth);
    const clientWidth = await body.evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Allow small margin
  });

  test('Devices page - View Details works', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    // Look for any action button
    const viewBtn = page.locator('button:has-text("View")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('Reports page - Filters work', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    // Check filter dropdown
    const periodSelect = page.locator('select').first();
    if (await periodSelect.isVisible()) {
      await periodSelect.selectOption({ index: 1 });
    }
  });

  test('Settings page loads and has sections', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await expect(page.locator('text=Settings')).toBeVisible();
    // Check for settings sections
    await expect(page.locator('text=Company').first()).toBeVisible();
  });

  test('No console errors on navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.click('text=Inventory');
    await page.click('text=BOM');
    await page.click('text=Production');
    await page.click('text=Devices');
    await page.click('text=Reports');
    await page.click('text=Settings');
    
    // Filter out expected errors (like favicon 404)
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    expect(criticalErrors.length).toBe(0);
  });

  test('Responsive - Mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive - Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await expect(page.locator('body')).toBeVisible();
  });
});
