---
name: mate-ai-observability
description: >-
  AI Quality Pack — AI Agent Observability, OpenTelemetry/OpenInference Trace Forensics & Production-to-Dataset Loop.
  USE WHEN: instrumenting or auditing AI Agent execution traces (OpenTelemetry GenAI conventions,
  OpenInference spans, Langfuse, Arize Phoenix), diagnosing why an agent or RAG pipeline failed
  (Retriever vs. Generator vs. Tool Loop), enforcing token/step/latency budgets, or converting
  failed production traces into new Golden Dataset test cases.
  DO NOT USE WHEN designing initial datasets from scratch (use `mate-ai-dataset`) or configuring
  Promptfoo red-teaming plugins (use `mate-ai-redteam`).
  SYNERGY: Diagnoses root causes for `mate-ai-evals` and `mate-triage`, enforces operational SLAs
  defined in `specs/*.mate-spec.md`, and feeds failed production traces back into `mate-ai-dataset`.
---

# 🔭 M.A.T.E. AI Quality Pack: Agent Observability & Trace Forensics (`mate-ai-observability`)

In traditional web applications, an HTTP `200 OK` usually means the request succeeded. In AI Agent and RAG systems, **an HTTP `200 OK` can hide a catastrophic failure**:
- The agent got stuck in a 12-step recursive tool call loop burning $0.85 in tokens before guessing an answer.
- The vector database returned 0 relevant chunks (`Retriever Failure`), and the LLM confidently hallucinated a policy (`Generator Failure`).
- A sub-agent silently swallowed an MCP tool error and fabricated a confirmation number.

**You cannot test an AI Agent as a pure black box of `Input ➔ Output` text.** M.A.T.E. makes **AI Observability & Trace Inspection** a first-class testing pillar.

---

## 1. The Open Standards Observability Stack (OTel + OpenInference)

M.A.T.E. standardizes on vendor-neutral telemetry using **OpenTelemetry (OTel) GenAI Semantic Conventions** and **OpenInference** span kinds, compatible with **Langfuse**, **Arize Phoenix**, and local JSON trace files (`tests/ai-evals/traces/`):

| Span Kind (`openinference.span.kind`) | Key Attributes Audited by M.A.T.E. | What QA Must Verify |
| :--- | :--- | :--- |
| **`AGENT`** | `agent.name`, total child spans, total duration | Did the orchestrator route to the right specialist agent and finish within `max_latency_ms`? |
| **`RETRIEVAL`** | `retrieval.documents` (chunk IDs, scores, text) | Were the expected ground-truth chunks actually retrieved with high similarity scores? |
| **`TOOL`** | `tool.name`, `tool.parameters`, `tool.output`, `status` | Did the agent pass valid schema parameters? Did any forbidden tool execute? |
| **`LLM` / `GENERATION`** | `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | Did token consumption stay within `max_tokens` budget? Was temperature set deterministically where required? |
| **`GUARDRAIL`** | `guardrail.triggered`, `guardrail.reason` | Did input/output safety guardrails trigger on adversarial or PII payloads? |

---

## 2. The 4 Deterministic Trace Audits (`otel_trace_auditor.ts`)

Run the M.A.T.E. Trace Auditor (`npm run eval:traces` / `node tests/ai-evals/traces/otel_trace_auditor.js`) against captured agent traces to enforce 4 hard engineering invariants:

1. **Anti-Loop / Step Efficiency Audit (`ORA-AI-STEPS`):**
   - Fails if total `TOOL` + `LLM` steps exceed `observability_sla.max_steps` (default `5`), or if the exact same `tool.name` + `tool.parameters` pair is called `>= 2` times consecutively (*Infinite Retry Loop*).
2. **Token & Cost Budget Audit (`ORA-AI-TOKENS`):**
   - Sums `input_tokens + output_tokens` across all spans in the trace and fails if the total exceeds `observability_sla.max_tokens`.
3. **RAG Retriever vs. Generator Fault Isolation (`ORA-AI-RAG`):**
   - Inspects `RETRIEVAL` spans: if `retrieval.documents` is empty or has similarity scores `< threshold`, classifies the defect as **`[RETRIEVER_DEFECT]`** (chunking/embedding/query-rewrite issue) rather than blaming the LLM prompt!
4. **Forbidden Tool Execution Audit (`INV-AI-TOOLS`):**
   - Verifies across every nested sub-agent span that no tool in `forbidden_tools` was ever invoked, even if the final text response looks polite.

---

## 3. The Production-to-Dataset Flywheel (Closing the Loop)

Observability is not just for dashboards—it is your **continuous dataset generator**:
1. **Monitor Online Traces (Langfuse / Arize Phoenix):** Filter production traces by user thumbs-down feedback, guardrail triggers, high latency (`> 8s`), or low online LLM-as-a-Judge scores.
2. **Export & Sanitize:** Strip any customer PII from the trace payload.
3. **Promote to Golden Dataset (`mate-ai-dataset`):** Append the trace's `input`, `retrieval_context`, and expected behavior into `tests/ai-evals/datasets/DS-<module>.json` with `"provenance": "[PROD_TRACE_REGRESSION]"`.
4. **Verify in CI (`mate-ai-evals`):** Now every future prompt or model update is automatically tested against real production failure modes!

---

## 4. Stateful Memory Trace Auditing & Span-Level Fault Isolation (`memory_trace_auditor.js`)

Run `node tests/ai-evals/traces/memory_trace_auditor.js` to enforce:
- **Layer 2 Latency SLA (`ORA-MEM-LATENCY`):** `memory.retrieve` P95 latency **`<= 200ms`**.
- **Layer 1 Async Contract (`ORA-MEM-GEN-ASYNC`):** `memory.generate` executes with `wait_for_completion: false` and zero unredacted PII.
- **Span-Level Fault Isolation Tags:** Classify every failure cleanly as `[RETRIEVER_DEFECT]`, `[MEMORY_ETL_DEFECT]`, `[COMPACTION_DEFECT]`, or `[GENERATOR_DEFECT]`.
- **Black-Box Handoff:** Emit sanitized regression digests via `npx mate-sdt session advance` back to `mate-ai-dataset` / `mate-triage`.

## Zero-Assumption Escalation & Sub-Agent Isolation Protocol

- **Ask, Never Guess (`STATUS: BLOCKED_ON_USER_INPUT`):** Inspect local context (`MATE-PROJECT-MAP.md`, `specs/`, code) and live browser/API responses first. Never invent business thresholds, auth boundaries, or SLA numbers. Tag any genuine requirement gap as `[TBD: <exact question for PO/Dev/QA>]` inside `## Open Questions for Human QA`, finish all unblocked work, and halt when `npx mate-sdt validate` or `npx mate-sdt gate` returns `STATUS: BLOCKED_ON_USER_INPUT` to ask the human.
- **Sub-Agent Context Isolation (`--subagent` & `mate.handoff/v1`):** When delegating to a sub-agent or running a multi-stage pipeline (Reader/Extractor -> Spec Scorer -> Code Writer -> Independent Reviewer), build a scoped prompt via `npx mate-sdt context <module> --subagent <skill-name>` (`.mate/subagent-prompt-<module>-<skill>.md`). Pass only the structured `mate.handoff/v1` digest between stages (or run `--compact` in single-agent IDEs) so raw exploratory noise never pollutes downstream context windows.
