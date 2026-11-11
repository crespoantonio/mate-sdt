import { test as base, expect } from '@playwright/test';
import { BasePage } from './base-page.template';

/**
 * M.A.T.E. Framework - Dependency Inversion Fixtures (DIP)
 *
 * Rules:
 * 1. Tests must never manually instantiate `new PageObject(page)`.
 * 2. Injected fixtures manage initialization, authenticated context, and teardown.
 */

// Example concrete Page Object
class OrderCheckoutPage extends BasePage {
  readonly submitButton = this.page.getByRole('button', { name: /confirm order/i });
  readonly garmentCounter = this.page.getByTestId('garment-count');

  async confirmOrder(): Promise<void> {
    await this.submitButton.click();
  }
}

// Declare fixture types
type MateFixtures = {
  checkoutPage: OrderCheckoutPage;
  authenticatedSession: void;
};

// Extend base test with M.A.T.E. fixtures
export const test = base.extend<MateFixtures>({
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new OrderCheckoutPage(page);
    await use(checkoutPage);
  },

  authenticatedSession: async ({ page }, use) => {
    // Seed authenticated cookies / tokens directly without UI overhead
    await page.context().addCookies([
      {
        name: 'session_token',
        value: 'mock-mate-token-secure',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);
    await use();
  },
});

export { expect };
