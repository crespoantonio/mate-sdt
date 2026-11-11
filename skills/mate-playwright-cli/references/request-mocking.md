# 🌐 Network Mocking & Pillar T Chaos Fault Injection

Use `playwright-cli route` and `run-code` to test **Pillar T (`<threat_scenarios>`)** resilience: downstream 503 outages, slow gateway timeouts, malformed responses, and circuit-breaker fallbacks.

---

## 1. CLI Route Commands

```bash
# Simulate a 503 Service Unavailable outage on an external payment gateway
playwright-cli route "**/api/v1/payments/**" --status=503 --body='{"error":"Gateway Timeout"}' --content-type=application/json

# Mock a deterministic JSON contract response
playwright-cli route "**/api/v1/orders" --body='[{"id":"ord-1","status":"CONFIRMED"}]' --content-type=application/json

# Strip auth headers to test 401 handling
playwright-cli route "**/api/**" --remove-header=authorization,cookie

# List active routes and clean up
playwright-cli route-list
playwright-cli unroute "**/api/v1/payments/**"
playwright-cli unroute
```

---

## 2. Advanced Pillar T Chaos Injection with `run-code`

### Simulate Network Drop / Aborted Connection
```bash
playwright-cli run-code "async page => {
  await page.route('**/api/v1/checkout', route => route.abort('internetdisconnected'));
}"
# Valid abort reasons: connectionrefused, timedout, connectionreset, internetdisconnected
```

### Simulate High-Latency Downstream Dependency (Circuit Breaker Test)
```bash
playwright-cli run-code "async page => {
  await page.route('**/api/v1/shipping-quote', async route => {
    await new Promise(r => setTimeout(r, 4500));
    await route.fulfill({ status: 504, body: JSON.stringify({ error: 'Upstream Timeout' }) });
  });
}"
```

### Encapsulating Network Mocks in M.A.T.E. Fixtures
When promoting a chaos scenario into `tests/threats/*.spec.ts`, encapsulate the route handler inside a reusable fixture or helper in `src/fixtures/` rather than duplicating inline `page.route` blocks across tests.
