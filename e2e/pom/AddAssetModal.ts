import { type Page, type Locator, expect } from '@playwright/test';

export class AddAssetModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly tickerInput: Locator;
  readonly quantityInput: Locator;
  readonly sectorSelectTrigger: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('add-asset-dialog');
    this.tickerInput = page.getByTestId('asset-ticker-input');
    this.quantityInput = page.getByTestId('asset-quantity-input');
    this.sectorSelectTrigger = page.getByTestId('sector-select-trigger');
    this.submitButton = page.getByTestId('submit-asset-button');
  }

  async isVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async fillTicker(ticker: string) {
    await this.tickerInput.fill(ticker);
  }

  async fillQuantity(quantity: number | string) {
    await this.quantityInput.fill(quantity.toString());
  }

  async selectSector(sectorName: string) {
    await this.sectorSelectTrigger.click();
    // Assuming sector names are converted to lowercase and dashed for test-id as per previous turn
    // data-test-id={`sector-option-${sector.name.toLowerCase().replace(/\s+/g, '-')}`}
    const sectorId = `sector-option-${sectorName.toLowerCase().replace(/\s+/g, '-')}`;
    await this.page.getByTestId(sectorId).click();
  }

  async selectOtherSector() {
    await this.sectorSelectTrigger.click();
    await this.page.getByTestId('sector-option-other').click();
  }

  async createNewSector(newSectorName: string) {
    await this.sectorSelectTrigger.click();
    await this.page.getByTestId('create-new-sector-option').click();
    await this.page.getByTestId('new-sector-name-input').fill(newSectorName);
    await this.page.getByTestId('confirm-new-sector-button').click();
  }

  async submit() {
    await this.submitButton.click();
  }
}

