import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.resolve(process.cwd(), 'playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // 1. Go to login page
  await page.goto('/auth/login');

  // Wait for hydration/JS to load to prevent input clearing
  await page.waitForLoadState('networkidle');
  
  // 2. Fill credentials
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
      throw new Error('E2E_USERNAME or E2E_PASSWORD env vars are missing');
  }

  const emailInput = page.getByTestId('email-input');
  const passwordInput = page.getByTestId('password-input');

  // Fill and verify to handle potential hydration race conditions
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);

  await passwordInput.fill(password);
  await expect(passwordInput).toHaveValue(password);
  
  // 3. Submit
  await page.getByTestId('submit-login-button').click();

  // 4. Wait for successful login (redirect to home or portfolio)
  // We expect to be redirected away from /auth/login
  await expect(page).not.toHaveURL(/.*auth\/login/);
  // Optionally check for a specific element on dashboard
  // await expect(page.getByText('Portfolio')).toBeVisible();

  // 5. Save storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});

