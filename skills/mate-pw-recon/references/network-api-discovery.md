# Black-Box Network API Reverse-Engineering (When Backend Has No Swagger/OpenAPI)

When a QA team works in a **standalone QA folder** outside the backend repository and has no OpenAPI/Swagger documentation, use `@playwright/cli` (`mate-pw-recon`) to discover and reverse-engineer the backend API contracts directly from live browser traffic.

---

## 1. Capturing API Calls During Live UI Reconnaissance

As you walk through a user flow in `playwright-cli`, inspect the network log after each action:

```bash
# 1. Open the live web application
playwright-cli open https://staging.example.com/checkout

# 2. Trigger the business action in the UI
playwright-cli fill e4 "SAVE20"
playwright-cli click e7

# 3. Inspect captured HTTP requests and status codes
playwright-cli network
```

---

## 2. Deep Payload & Schema Extraction via `run-code`

When you need to capture the exact request headers, request body, and JSON response body of a specific XHR/fetch call to build a typed `BaseApiClient` (`src/api/`), use `playwright-cli run-code`:

```bash
playwright-cli run-code "async page => {
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/') && res.request().method() === 'POST'),
    page.getByRole('button', { name: 'Place Order' }).click()
  ]);
  return {
    url: response.url(),
    method: response.request().method(),
    requestHeaders: response.request().headers(),
    requestPayload: response.request().postDataJSON(),
    status: response.status(),
    responseBody: await response.json().catch(() => null)
  };
}"
```

---

## 3. Translating Observed Traffic into M.A.T.E. API Suites (`mate-assert-api`)

1. **Document in `specs/[module].mate-spec.md` (`[OBSERVED]`):**
   Record the discovered endpoint path, HTTP method, authentication mechanism (Bearer token, session cookie, CSRF header), request payload, and response structure inside `<intent_model>` with the `[OBSERVED]` confidence tag.
2. **Generate Strict TypeScript Interfaces (`src/models/[module].model.ts`):**
   Convert the observed JSON request/response into strict TypeScript types (zero `any`).
3. **Create the Typed API Client (`src/api/[module].client.ts`):**
   Extend `BaseApiClient` so `tests/api/[module].spec.ts` can test 20+ boundary, negative (`400/422`), unauthorized (`401/403`), and forbidden state transition (`409`) scenarios in milliseconds without opening a browser!
4. **Feed Grafana k6 (`mate-performance-k6`):**
   Reuse the discovered endpoint URL and payload structure to build `tests/nfr/[module]-load.k6.js`.
