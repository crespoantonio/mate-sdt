import { Locator, expect } from '@playwright/test';

/**
 * M.A.T.E. Framework - Base Component Object (BaseComponent)
 * Encapsulates self-contained UI widgets (modals, headers, toast notifications, navigation bars).
 *
 * Rules:
 * 1. Scope actions strictly within the root component locator.
 * 2. Reusable across multiple Page Objects without code duplication.
 */
export class NotificationToastComponent {
  readonly rootLocator: Locator;
  readonly messageText: Locator;
  readonly closeButton: Locator;

  constructor(parentLocator: Locator) {
    this.rootLocator = parentLocator.getByRole('alert');
    this.messageText = this.rootLocator.locator('[data-testid="toast-message"]');
    this.closeButton = this.rootLocator.getByRole('button', { name: /close|cerrar/i });
  }

  async assertToastSuccess(expectedMessage: string): Promise<void> {
    await expect(this.rootLocator).toBeVisible();
    await expect(this.messageText).toContainText(expectedMessage);
  }

  async dismiss(): Promise<void> {
    await this.closeButton.click();
    await expect(this.rootLocator).toBeHidden();
  }
}
