import { test, expect } from '@playwright/test';
import { PortfolioPage } from './pom/PortfolioPage';

test.describe('Portfolio Management', () => {
  test('should add a new asset via modal', async ({ page }) => {
    // Mock API responses
    await page.route('/api/sectors', async (route) => {
      await route.fulfill({
        json: { sectors: [{ id: '1', name: 'Technology' }] },
      });
    });

    await page.route('/api/portfolio/summary*', async (route) => {
      await route.fulfill({
        json: { total_value: 1000, sectors: [] },
      });
    });

    // Initial empty state
    await page.route('/api/portfolio?currency=USD', async (route) => {
      await route.fulfill({
        json: { assets: [] },
      });
    });

    const portfolioPage = new PortfolioPage(page);
    await portfolioPage.goto();

    // Ensure page is loaded and hydrated
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('add-asset-button')).toBeVisible();

    // Debug: Check if button is enabled and works
    await expect(page.getByTestId('add-asset-button')).toBeEnabled();

    // Click using dispatchEvent if standard click fails (sometimes needed for shadcn triggers)
    await page.getByTestId('add-asset-button').click();
    
    // Explicit wait for dialog
    const modal = await portfolioPage.getAddAssetModal();

    // Mock response for asset creation
    await page.route('/api/portfolio', async (route) => {
        const data = route.request().postDataJSON();
        expect(data).toMatchObject({
            ticker: 'AAPL',
            quantity: '10',
            sector_id: '1'
        });
        
        await route.fulfill({
            json: {
                id: 'new-asset-id',
                ticker: 'AAPL',
                quantity: 10,
                sector_id: '1',
                sector_name: 'Technology',
                current_price: 150,
                current_value: 1500
            }
        });
    });

    // Mock updated list after addition
    // The component usually refetches the list after mutation
    let listFetchCount = 0;
    await page.route('/api/portfolio?currency=USD', async (route) => {
        listFetchCount++;
        if (listFetchCount === 1) {
            // First fetch (already handled above but route override order matters)
            await route.fulfill({ json: { assets: [] } });
        } else {
             // Subsequent fetches (after add)
            await route.fulfill({
                json: {
                    assets: [
                        {
                            id: 'new-asset-id',
                            ticker: 'AAPL',
                            quantity: 10,
                            sector_id: '1',
                            sector_name: 'Technology',
                            current_price: 150,
                            current_value: 1500
                        }
                    ]
                }
            });
        }
    });

    // Fill form
    await modal.fillTicker('AAPL');
    await modal.fillQuantity(10);
    await modal.selectSector('Technology');
    
    // Submit
    await modal.submit();

    // Verify
    // 1. Modal closes
    await expect(modal.dialog).toBeHidden();
    
    // 2. Asset appears in table
    await portfolioPage.expectAssetVisible('AAPL');
  });
});

