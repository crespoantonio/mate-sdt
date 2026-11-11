import { Page, Locator, expect } from '@playwright/test';

/**
 * M.A.T.E. Framework - Base Page Object (BasePage)
 * Implements Single Responsibility (SRP) and Open/Closed (OCP).
 *
 * Rules:
 * 1. Zero arbitrary sleeps (page.waitForTimeout is strictly forbidden).
 * 2. Uses locator-based web assertions with auto-retries.
 * 3. Encapsulates page-level navigation and state validation.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the target page URL path.
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Asserts that the page has reached a specific URL pattern.
   */
  async assertUrl(pattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  /**
   * Asserts that a core locator is visible before interacting.
   */
  protected async expectVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible();
  }
}
