# 3-Layer Stateful Memory Evaluation Standard (`mate-ai-*`)

Aligned with **Google's Context Engineering: Sessions, Memory (May 2026)**, stateful AI agents with persistent memory MUST be evaluated across three distinct layers instead of relying solely on end-to-end chat output assertions.

## Layer 1 — Memory Generation & Consolidation
- **What we measure:** Precision, Recall, and F1 score of extracted facts (`CREATE`, `UPDATE`, `DELETE`, `NOOP`) against a Golden Memory Set (`golden-memory-set.template.json`).
- **Async Contract (`ORA-MEM-GEN-ASYNC`):** Memory generation/consolidation MUST execute asynchronously (`wait_for_completion: false`, OTel span `memory.generate`) so conversational turns never stall.
- **Pre-Persistence PII Redaction:** Secrets, JWTs, API keys, emails, and credit cards MUST be scrubbed *before* any memory store write.

## Layer 2 — Memory Retrieval
- **What we measure:** `Recall@K` (`>= 0.85`), `MRR` / `NDCG@K`, and blended ranking (`0.5 * Relevance + 0.2 * Recency + 0.3 * Importance`).
- **Latency SLA (`ORA-MEM-LATENCY`):** Retrieval P95 latency MUST stay **`<= 200ms` (0.2s)**.

## Layer 3 — End-to-End Agent Behavior
- **Over-Influence Resistance:** Irrelevant stored memories must not hijack explicit current-turn instructions.
- **Dialogue Injection & Memory Poisoning:** Untrusted user/tool content must not plant persistent false instructions (`[INFERRED]`/`[TBD]` cannot enter procedural playbooks).
- **Cross-User / Cross-Tenant ACL Isolation:** User A's declarative memories must never leak to User B; shared procedural memories must be strictly anonymized.
- **Concurrency (`THR-MEM-RACE`):** Parallel writes to the same memory key must serialize cleanly without silent clobbering.

## Span-Level Fault Isolation Tags
When an E2E memory failure occurs, `memory_trace_auditor` isolates the exact failing subsystem:
- `[RETRIEVER_DEFECT]` — Required memory existed in store, but was missed in top-K or exceeded `200ms` P95.
- `[MEMORY_ETL_DEFECT]` — Extraction missed, hallucinated, or leaked PII into the memory store (`memory.generate`).
- `[COMPACTION_DEFECT]` — Session compaction dropped critical state or exceeded rolling summary bounds.
- `[GENERATOR_DEFECT]` — Correct memory was retrieved cleanly, yet the LLM ignored or contradicted it.
