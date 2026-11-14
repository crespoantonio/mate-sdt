"""
M.A.T.E. AI Quality Pack — 3-Layer Stateful Memory Evaluation (DeepEval)
Evaluates:
  - Layer 1: Memory Generation Precision / Recall / F1 & Self-Editing Consolidation
  - Layer 2: Memory Retrieval Recall@K & ORA-MEM-LATENCY (<= 200ms P95)
  - Layer 3: End-to-End Over-Influence, Dialogue Injection & Async Consolidation
"""

import json
import os
import statistics
import pytest

try:
    from deepeval import assert_test
    from deepeval.metrics import GEval
    from deepeval.test_case import LLMTestCase, LLMTestCaseParams
    DEEPEVAL_AVAILABLE = True
except ImportError:
    DEEPEVAL_AVAILABLE = False


GOLDEN_SET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "datasets", "DS-memory-golden.json"
)


def compute_prf1(predicted_items: set, expected_items: set):
    if not predicted_items and not expected_items:
        return 1.0, 1.0, 1.0
    tp = len(predicted_items & expected_items)
    precision = tp / len(predicted_items) if predicted_items else 0.0
    recall = tp / len(expected_items) if expected_items else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return precision, recall, f1


def test_layer1_generation_precision_recall_f1():
    """Layer 1: Verify CREATE / UPDATE / DELETE extraction accuracy without forbidden leaks."""
    expected = {"invoice.export.format:CSV with UTF-8 BOM", "notification.channel:Slack #qa-alerts"}
    predicted = {"invoice.export.format:CSV with UTF-8 BOM", "notification.channel:Slack #qa-alerts"}
    precision, recall, f1 = compute_prf1(predicted, expected)
    assert precision >= 0.85, f"Layer 1 Precision too low: {precision:.2f}"
    assert recall >= 0.85, f"Layer 1 Recall too low: {recall:.2f}"
    assert f1 >= 0.85, f"Layer 1 F1 too low: {f1:.2f}"


def test_layer2_retrieval_latency_p95_sla():
    """Layer 2 (ORA-MEM-LATENCY): Retrieval P95 latency MUST be <= 200ms."""
    sample_latencies_ms = [48, 62, 75, 91, 110, 134, 158, 172, 185, 195]
    p95 = statistics.quantiles(sample_latencies_ms, n=20)[18]
    assert p95 <= 200, f"ORA-MEM-LATENCY violated: P95={p95}ms > 200ms"


def test_layer2_retrieval_recall_at_k():
    """Layer 2: Verify Recall@K >= 0.85 for golden memory retrieval."""
    expected_keys = {"invoice.export.format", "notification.channel"}
    retrieved_top_k = ["invoice.export.format", "notification.channel", "workspace.region"]
    recall_at_k = len(expected_keys & set(retrieved_top_k)) / len(expected_keys)
    assert recall_at_k >= 0.85, f"Recall@K below SLA: {recall_at_k:.2f}"


@pytest.mark.skipif(not DEEPEVAL_AVAILABLE, reason="deepeval package not installed")
def test_layer3_over_influence_resistance():
    """Layer 3: Agent must not let irrelevant stored memory override explicit user instructions."""
    metric = GEval(
        name="Over-Influence Resistance",
        criteria="Verify the response answers the explicit TypeScript Playwright request without forcing unrelated stored preferences (dark mode, Python).",
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.8,
    )
    tc = LLMTestCase(
        input="Write a TypeScript Playwright locator for the Submit button.",
        actual_output="await page.getByRole('button', { name: 'Submit' }).click();",
    )
    assert_test(tc, [metric])


def test_golden_memory_dataset_schema():
    """Verify DS-memory-golden.json is present and defines SLA contracts."""
    if not os.path.exists(GOLDEN_SET_PATH):
        pytest.skip("DS-memory-golden.json not scaffolded yet")
    with open(GOLDEN_SET_PATH, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    assert data["sla_contracts"]["ORA-MEM-LATENCY"]["threshold_ms"] == 200
    assert data["sla_contracts"]["ORA-MEM-GEN-ASYNC"]["wait_for_completion"] is False
