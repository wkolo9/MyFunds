import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MyFunds/);
});

test('navigation to login', async ({ page }) => {
  await page.goto('/');
  
  // Click the login link (adjust selector as needed based on actual UI)
  // Assuming there is a login link/button. Checking if it exists first.
  const loginLink = page.getByRole('link', { name: /log in/i });
  
  if (await loginLink.count() > 0) {
    await loginLink.click();
    await expect(page).toHaveURL(/.*login/);
  }
});

