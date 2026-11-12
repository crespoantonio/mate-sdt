---
name: mate-ai-evals
description: >-
  AI Quality Pack — Dual-Engine Functional, RAG Triad & Agent Trajectory Evaluation (Promptfoo + DeepEval).
  USE WHEN configuring or running automated evaluations for AI Agents, Chatbots, or RAG pipelines
  using Promptfoo (`promptfooconfig.yaml`) or DeepEval (`test_*.py`), asserting tool-call accuracy
  (`trajectory:tool-args-match`, `ToolCorrectnessMetric`), task completion (`TaskCompletionMetric`),
  or the RAG Triad (Faithfulness, Answer Relevancy, Contextual Precision/Recall).
  DO NOT USE WHEN interviewing the user to create a dataset from scratch (use `mate-ai-dataset` first)
  or running OWASP security red-teaming attacks (use `mate-ai-redteam`).
  SYNERGY: Consumes `tests/ai-evals/datasets/DS-*.json` from `mate-ai-dataset`, correlates trace
  metrics with `mate-ai-observability`, and enforces the Anti-Greenwashing Mandate via `mate-triage`.
---

# ⚖️ M.A.T.E. AI Quality Pack: Agent & RAG Evaluation Engine (`mate-ai-evals`)

Testing AI systems requires moving from binary string matching (`expect(text).toBe("exact string")`) to **Hybrid Deterministic + Probabilistic Evaluation**:
1. **Deterministic Guardrails:** Exact tool-call selection, JSON schema compliance, argument validation, forbidden tool checks, and latency/token budgets.
2. **Probabilistic LLM-as-a-Judge Metrics:** RAG Triad (*Faithfulness*, *Answer Relevancy*, *Contextual Precision/Recall*) and Agent Trajectory scoring (*Task Completion*, *Step Efficiency*, *G-Eval Rubrics*).

M.A.T.E. provides **Dual-Engine Support** combining **Promptfoo** (Node/TS/YAML CLI) and **DeepEval** (Python/Pytest LLM Evaluation Framework).

---

## 1. Choosing the Right Engine (or Combining Both)

| Capability | Promptfoo (`npx promptfoo@latest eval`) | DeepEval (`deepeval test run`) |
| :--- | :--- | :--- |
| **Best For** | Declarative YAML/TS harnesses, fast CLI execution, side-by-side Prompt/Model matrix comparisons, JS assertions, and Red Teaming. | Deep RAG Triad metrics (`Faithfulness`, `ContextualPrecision`), `@observe()` agent trajectory tracing (`TaskCompletionMetric`, `ToolCorrectnessMetric`), and Python AI stacks. |
| **Config Location** | `tests/ai-evals/promptfoo/promptfooconfig.yaml` | `tests/ai-evals/deepeval/test_agent_evals.py` |
| **Dataset Source** | Reads `tests/ai-evals/datasets/DS-<module>.json` | Reads `tests/ai-evals/datasets/DS-<module>.json` |

---

## 2. The 3 Evaluation Layers for AI Systems

### Layer A: The RAG Triad (Knowledge Grounding)
Whenever an AI system retrieves context from a Vector DB, search index, or document store, you MUST evaluate all three vertices of the **RAG Triad**:
1. **Context Precision & Recall (Retriever Quality):** Did the retriever fetch the exact chunks needed to answer the query, and rank relevant chunks at the top (`>= 0.80`)?
2. **Faithfulness / Groundedness (Zero Hallucination):** Is every claim in the LLM's output strictly derived from the `retrieval_context` without fabricating facts (`>= 0.90`)?
3. **Answer Relevancy (Generator Quality):** Did the response directly and concisely address the user's original intent (`>= 0.85`)?

### Layer B: Agentic Tool-Calling & Trajectory Layer
When testing an autonomous agent with tools/MCP servers:
1. **Tool Selection & Argument Accuracy (`ToolCorrectnessMetric` / `trajectory:tool-args-match`):** Did the agent invoke the right tool with the exact required parameters?
2. **Forbidden Tool Invariant (`INV-AI`):** Assert deterministically that no tool listed in `forbidden_tools` (e.g., `issue_refund`, `delete_user`) was ever called.
3. **End-to-End Task Completion (`TaskCompletionMetric`):** Across the entire multi-step reasoning trace, did the agent actually accomplish the user's goal without getting stuck in a retry loop?

### Layer C: Multi-Turn Conversational Coherence
For chatbots and multi-turn agents:
1. **Knowledge Retention:** Does Turn $N$ preserve entities, constraints, and pronouns established in Turn $1$?
2. **Persona & Guardrail Consistency:** Does the assistant maintain its tone and compliance boundaries even after 5+ turns of user pressure?

---

## 3. Anti-Greenwashing Mandate for AI Evaluations

> **CRITICAL RULE:** Never lower an evaluation metric threshold (e.g., changing `faithfulness_threshold: 0.90` to `0.40`), delete a failing Golden test case, or weaken an LLM-rubric just to make a hallucinating RAG or misfiring Agent pass CI!

If an AI evaluation fails on a Golden test case:
1. **Keep the test case and its original threshold** in `DS-<module>.json`, `promptfooconfig.yaml`, or `test_agent_evals.py`.
2. Inspect the execution trace (`mate-ai-observability`) to determine the root cause:
   - **Retriever Failure:** Relevant chunk was missing from `retrieval_context`.
   - **Prompt/Generator Hallucination:** Chunk was present, but LLM ignored it or extrapolated.
   - **Tool Schema Ambiguity:** Agent called the wrong tool or passed malformed arguments.
3. Generate a forensic bug report via `npx mate-sdt bug <module>` (`tests/bugs/BUG-*.md`) documenting the exact prompt, retrieved chunks, tool trajectory, and metric score.
