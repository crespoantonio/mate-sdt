# 🤖 AI Agent, Chatbot & RAG Quality Engineering Guide (`mate-sdt`)

The **M.A.T.E. AI Quality Pack** extends Spec-Driven Testing (SDT) to **Autonomous AI Agents, Tool-Calling MCP Systems, Conversational Chatbots, and Retrieval-Augmented Generation (RAG) Pipelines**.

Because not every software project tests AI components, M.A.T.E. ships this capability as an **on-demand modular pack** that can be installed during `npx mate-sdt install` or added at any time via:

```bash
npx mate-sdt setup-ai
# or during installation:
npx mate-sdt install --with-ai-evals
```

---

## 1. Why Traditional QA Fails on AI Agents (And How M.A.T.E. Solves It)

| Traditional Web/API Testing | AI Agent, Chatbot & RAG Testing (M.A.T.E. AI Pack) |
| :--- | :--- |
| Deterministic string equality (`expect(res).toBe("OK")`). | **Hybrid Deterministic + Probabilistic Oracles** (`ToolCorrectness = 1.0`, `Faithfulness >= 0.90`). |
| Fixed form inputs (`email`, `password`). | **Infinite Natural-Language Input Space** requiring Socratic Dataset Discovery & Synthetic Evolutions. |
| HTTP `200 OK` means success. | HTTP `200 OK` can hide an **infinite tool loop**, a **$2.00 token spike**, or a **hallucinated policy**—requiring **OpenTelemetry / OpenInference Trace Forensics**. |
| Security = SQLi / XSS. | Security = **Direct & Indirect Prompt Injection, Tool RBAC/BOLA Bypass, Excessive Agency, and PII Leakage**. |

---

## 2. The 4 Synergistic Skills of the M.A.T.E. AI Quality Pack

1. **`mate-ai-dataset` (Socratic Discovery & Synthetic Dataset Engineering):**
   - Conducts a mandatory **5-Dimension Socratic Interview** with the user/tester when no dataset exists.
   - Enforces a **Human-in-the-Loop 5-Seed Approval Gate** (`SEED-01` to `SEED-05`) before scaling the dataset.
   - Applies **6 Complexity Evolutions** (*Reasoning, Multi-Context, Constrained, Ambiguous, Temporal Conflict, Adversarial*) to build `tests/ai-evals/datasets/DS-<module>.json`.
2. **`mate-ai-evals` (Dual-Engine Evaluation: Promptfoo + DeepEval):**
   - **Promptfoo (`tests/ai-evals/promptfoo/promptfooconfig.yaml`):** Declarative YAML harness, deterministic JS tool trajectory checks, latency SLAs, and side-by-side model/prompt matrices.
   - **DeepEval (`tests/ai-evals/deepeval/test_agent_deepeval.py`):** Python/Pytest RAG Triad metrics (`FaithfulnessMetric`, `AnswerRelevancyMetric`, `ContextualPrecisionMetric`, `ContextualRecallMetric`) and Agent metrics (`ToolCorrectnessMetric`, `TaskCompletionMetric`).
3. **`mate-ai-redteam` (Pillar T — OWASP LLM & Agentic Security Red Teaming):**
   - Automates adversarial probing via `npx promptfoo@latest redteam` against Direct/Indirect Prompt Injection, Tool RBAC/BOLA (`rbac`, `bola`), PII Leakage (`pii:direct`), System Prompt Extraction, and Hallucinated Contracts.
4. **`mate-ai-observability` (OpenTelemetry / OpenInference Trace Forensics):**
   - Integrates with **Langfuse**, **Arize Phoenix**, and local OTel JSON spans (`GENERATION`, `TOOL`, `RETRIEVAL`, `AGENT`, `GUARDRAIL`).
   - Audits traces deterministically (`tests/ai-evals/traces/otel_trace_auditor.js`) for infinite retry loops (`ORA-AI-LOOP`), step budgets (`max_steps <= 5`), token budgets (`max_tokens <= 3500`), and isolates `[RETRIEVER_DEFECT]` vs. `[GENERATOR_DEFECT]`.
   - Closes the **Production-to-Dataset Flywheel** by promoting failed production traces into `DS-<module>.json` (`provenance: "[PROD_TRACE_REGRESSION]"`).

---

## 3. CLI Commands & NPM Scripts Added by `npx mate-sdt setup-ai`

| Command | Description |
| :--- | :--- |
| `npx mate-sdt setup-ai` | Installs the 4 AI Quality Skills, `/mate-flow-ai-agent` workflow, starter configs (`promptfoo`, `deepeval`, `otel`), and `package.json` scripts. |
| `npx mate-sdt dataset <module>` | Generates the 5-Dimension Discovery Sheet (`DS-<module>-discovery.md`) and Golden Dataset (`DS-<module>.json`). |
| `npm run eval:promptfoo` | Runs functional, trajectory, and RAG evaluations via Promptfoo. |
| `npm run eval:redteam` | Runs OWASP LLM & Agentic security probes via Promptfoo Red Team. |
| `npm run eval:deepeval` | Runs RAG Triad and Agent Trajectory metrics via DeepEval. |
| `npm run eval:traces` | Runs the deterministic OpenTelemetry/OpenInference Agent Trace Auditor. |
