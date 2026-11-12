# 🐍 DeepEval RAG Triad & Agent Trajectory Reference (`mate-ai-evals`)

DeepEval (`deepeval test run`) acts as `"Pytest for LLMs and AI Agents"`, providing research-backed metrics for the **RAG Triad**, **Agent Tool Correctness**, **End-to-End Task Completion**, and **G-Eval custom rubrics**.

---

## 1. Running DeepEval in M.A.T.E.

```bash
# Install DeepEval in your Python virtual environment
pip install -U deepeval

# Execute the M.A.T.E. DeepEval suite
deepeval test run tests/ai-evals/deepeval/test_agent_deepeval.py
```

---

## 2. Core Metrics Matrix

| Metric Class | Target Layer | Recommended Threshold | What It Detects |
| :--- | :--- | :--- | :--- |
| `FaithfulnessMetric` | RAG Generator | `>= 0.90` | Hallucinations and claims contradicting `retrieval_context`. |
| `AnswerRelevancyMetric` | RAG / Chatbot | `>= 0.85` | Rambling, evasive, or off-topic responses. |
| `ContextualPrecisionMetric` | RAG Retriever | `>= 0.80` | Irrelevant document chunks ranked higher than relevant chunks. |
| `ContextualRecallMetric` | RAG Retriever | `>= 0.80` | Missing ground-truth chunks in top-$K$ vector retrieval. |
| `ToolCorrectnessMetric` | Agent Action Layer | `1.00` (Strict) | Wrong tool called, missing tool call, or mismatched arguments. |
| `TaskCompletionMetric` | Agent Full Loop | `>= 0.85` | Agent getting stuck in loops or failing the end-to-end objective. |
| `GEval` | Domain Policy / Tone | `>= 0.85` | Custom business rules, compliance disclaimers, and brand voice. |

---

## 3. Consuming M.A.T.E. Golden Datasets (`DS-<module>.json`) in DeepEval

The template in `resources/test_agent_deepeval.template.py` automatically loads `tests/ai-evals/datasets/DS-<module>.json`, converts each entry into an `LLMTestCase` with `ToolCall` objects, asserts deterministic forbidden-tool guardrails first, and then runs `assert_test(test_case, metrics)`.
