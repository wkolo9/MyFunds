import { type Page, type Locator, expect } from '@playwright/test';
import { AddAssetModal } from './AddAssetModal';

export class PortfolioPage {
  readonly page: Page;
  readonly addAssetButton: Locator;
  readonly addAssetModal: AddAssetModal;

  constructor(page: Page) {
    this.page = page;
    this.addAssetButton = page.getByTestId('add-asset-button');
    this.addAssetModal = new AddAssetModal(page);
  }

  async goto() {
    await this.page.goto('/portfolio');
  }

  async clickAddAsset() {
    await this.addAssetButton.click();
  }

  async getAddAssetModal(): Promise<AddAssetModal> {
    await this.addAssetModal.isVisible();
    return this.addAssetModal;
  }

  async getAssetRow(ticker: string) {
    return this.page.getByTestId(`asset-row-${ticker.toLowerCase()}`);
  }

  async expectAssetVisible(ticker: string) {
    await expect(this.page.getByTestId(`asset-row-${ticker.toLowerCase()}`)).toBeVisible();
  }
}
