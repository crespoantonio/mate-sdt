import { APIRequestContext, APIResponse, expect } from '@playwright/test';

/**
 * M.A.T.E. Framework - Base API Client (BaseApiClient)
 * Enforces Single Responsibility (SRP), Open/Closed (OCP), and deterministic contract checks.
 */
export abstract class BaseApiClient {
  protected readonly request: APIRequestContext;
  protected readonly basePath: string;

  constructor(request: APIRequestContext, basePath: string) {
    this.request = request;
    this.basePath = basePath;
  }

  protected async get(path: string, headers?: Record<string, string>): Promise<APIResponse> {
    return this.request.get(`${this.basePath}${path}`, { headers });
  }

  protected async post<T extends object>(
    path: string,
    data: T,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    return this.request.post(`${this.basePath}${path}`, { data, headers });
  }

  /**
   * Asserts exact HTTP status code and JSON Content-Type invariant.
   */
  async assertJsonResponse<T>(response: APIResponse, expectedStatus: number): Promise<T> {
    expect(
      response.status(),
      `Expected HTTP ${expectedStatus} but received ${response.status()}: ${await response.text()}`
    ).toBe(expectedStatus);

    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');

    return (await response.json()) as T;
  }
}
