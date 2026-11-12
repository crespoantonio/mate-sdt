import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base-page.template';

/**
 * M.A.T.E. Framework - Dependency Inversion Fixtures (DIP)
 *
 * Rules:
 * 1. Tests must never manually instantiate `new PageObject(page)`.
 * 2. Injected fixtures manage initialization, authenticated context, and teardown.
 * 3. Supports Multi-Role & Multi-Tenant architecture (isolated contexts per role/tenant).
 */

// Example concrete Page Objects
export class OrderCheckoutPage extends BasePage {
  readonly submitButton = this.page.getByRole('button', { name: /confirm order/i });
  readonly garmentCounter = this.page.getByTestId('garment-count');

  async confirmOrder(): Promise<void> {
    await this.submitButton.click();
  }
}

export class AdminDashboardPage extends BasePage {
  readonly usersTable = this.page.getByTestId('admin-users-table');
  readonly unlockButton = this.page.getByRole('button', { name: /unlock/i });

  async unlockUser(email: string): Promise<void> {
    await this.usersTable.getByText(email).click();
    await this.unlockButton.click();
  }
}

// Multi-Role & Multi-Tenant Fixture Declarations
export type UserRole = 'admin' | 'manager' | 'customer' | 'auditor';

export type MateFixtures = {
  // --- Standard Page Objects ---
  checkoutPage: OrderCheckoutPage;
  adminDashboardPage: AdminDashboardPage;

  // --- Multi-Role Pre-Authenticated Pages (Isolated Contexts) ---
  adminPage: Page;
  customerPage: Page;

  // --- Dynamic Multi-Tenant / Multi-Role Factory ---
  asTenant: (tenantId: string, role?: UserRole) => Promise<{ page: Page; context: BrowserContext }>;
};

/**
 * Helper to resolve storageState path for a given role or tenant.
 * Stored in gitignored `playwright/.auth/` directory.
 */
function getStorageStateForRole(role: string, tenantId?: string): string {
  const prefix = tenantId ? `${tenantId}-${role}` : role;
  return `playwright/.auth/${prefix}.auth-state.json`;
}

// Extend base test with M.A.T.E. fixtures
export const test = base.extend<MateFixtures>({
  // 1. Page Object with default page context
  checkoutPage: async ({ page }, use) => {
    await use(new OrderCheckoutPage(page));
  },

  adminDashboardPage: async ({ adminPage }, use) => {
    await use(new AdminDashboardPage(adminPage));
  },

  // 2. Pre-Authenticated Admin Page (Dedicated isolated browser context)
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: getStorageStateForRole('admin'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // 3. Pre-Authenticated Customer Page (Dedicated isolated browser context)
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: getStorageStateForRole('customer'),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // 4. Dynamic Multi-Tenant Factory (Supports testing cross-tenant isolation in a single test)
  asTenant: async ({ browser }, use) => {
    const createdContexts: BrowserContext[] = [];

    const factory = async (tenantId: string, role: UserRole = 'customer') => {
      const storageState = getStorageStateForRole(role, tenantId);
      const context = await browser.newContext({
        storageState: storageState,
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });
      createdContexts.push(context);
      const page = await context.newPage();
      return { page, context };
    };

    await use(factory);

    // Guaranteed teardown of all dynamically spawned tenant contexts
    for (const ctx of createdContexts) {
      await ctx.close();
    }
  },
});

export { expect };
