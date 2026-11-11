# 🌐 M.A.T.E. Polyglot Stack Reference (Java & Python Adapters)

While the default opinionated stack of `mate-sdt` is **TypeScript + Playwright + Grafana k6 + Stryker Mutator**, the M.A.T.E. Spec-Driven Testing (SDT) methodology is 100% language-agnostic at the specification layer (`specs/*.mate-spec.md` and `MATE-PROJECT-MAP.md`).

Use this reference when applying M.A.T.E. in **Java** or **Python** enterprise repositories.

---

## ☕ 1. Java Enterprise Stack (Selenium / Playwright Java / RestAssured / Pitest)

### Directory Mapping
```text
project-root/
├── MATE-PROJECT-MAP.md
├── specs/
│   └── [module].mate-spec.md
├── pom.xml (or build.gradle)
└── src/
    ├── main/java/com/company/qa/
    │   ├── pages/               <-- BasePage & Page Objects (SRP / OCP)
    │   ├── components/          <-- Reusable UI WebElement Components
    │   ├── api/                 <-- RestAssured RequestSpecs & Typed Clients
    │   └── models/              <-- Jackson/Lombok DTOs & Records (strict types)
    └── test/java/com/company/qa/
        ├── fixtures/            <-- JUnit 5 Extensions (@ExtendWith) for DIP
        ├── e2e/                 <-- P0/P1 UI workflow tests
        ├── api/                 <-- RestAssured contract & schema tests
        └── threats/             <-- Concurrency (CompletableFuture) & fuzzing
```

### SOLID & M.A.T.E. Rules for Java
- **Dependency Inversion (DIP):** Use **JUnit 5 Extensions (`ParameterResolver`, `BeforeEachCallback`)** or Guice/Spring DI to inject Page Objects and `RequestSpecification` instances—never scatter `DriverManager.getDriver()` calls inside `@Test` methods.
- **Zero Arbitrary Sleeps:** `Thread.sleep()` is strictly forbidden. Use `WebDriverWait` with `ExpectedConditions` or Awaitility (`await().atMost(...)`) for async API polling.
- **Pillar T Mutation Engine:** Use **Pitest (`org.pitest:pitest-maven`)** inside a rootless Podman container (`maven:3.9-eclipse-temurin-21`) with `<mutationThreshold>85</mutationThreshold>`.

---

## 🐍 2. Python Stack (Playwright Python / Pytest / Requests / Mutmut)

### Directory Mapping
```text
project-root/
├── MATE-PROJECT-MAP.md
├── specs/
│   └── [module].mate-spec.md
├── pyproject.toml
├── src/
│   ├── pages/                   <-- BasePage & Page Objects (type-annotated)
│   ├── components/              <-- Reusable UI Component classes
│   ├── api/                     <-- Typed API Clients (requests / httpx)
│   └── models/                  <-- Pydantic v2 BaseModel schemas
└── tests/
    ├── conftest.py              <-- Pytest DIP fixtures (@pytest.fixture)
    ├── e2e/                     <-- P0/P1 UI tests
    ├── api/                     <-- API contract tests validated with Pydantic
    └── threats/                 <-- Hypothesis property-based fuzzing & race tests
```

### SOLID & M.A.T.E. Rules for Python
- **Strict Typing & Contracts:** All API payloads and test data models must use **Pydantic v2 (`BaseModel`)** with strict type hints (`mypy --strict`). Dictionaries without schema validation (`dict[str, Any]`) are forbidden in contract assertions.
- **Dependency Inversion (DIP):** Inject all Page Objects, API clients, and authenticated sessions through `conftest.py` `@pytest.fixture` functions.
- **Zero Arbitrary Sleeps:** `time.sleep()` is strictly forbidden. Use Playwright's `expect(locator)` auto-retrying assertions.
- **Pillar T Fuzzing & Mutation:** Combine **Hypothesis** for adversarial property-based fuzzing with **mutmut** or **cosmic-ray** inside rootless Podman (`python:3.12-slim`) targeting `>= 85%` killed mutants.
