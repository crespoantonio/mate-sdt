"""
M.A.T.E. Method — DeepEval RAG Triad & Agent Trajectory Suite
Run with: deepeval test run tests/ai-evals/deepeval/test_agent_deepeval.py
"""

import json
from pathlib import Path
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, ToolCall
from deepeval.metrics import (
    FaithfulnessMetric,
    AnswerRelevancyMetric,
    ToolCorrectnessMetric,
)

DATASET_PATH = Path(__file__).parent.parent / "datasets" / "DS-agent.json"


def load_mate_golden_dataset():
    if not DATASET_PATH.exists():
        return []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("cases", [])


def invoke_system_under_test(case_data: dict) -> dict:
    """
    Replace this stub with your real Agent / RAG invocation (HTTP call, LangGraph, CrewAI, or SDK).
    Must return actual_output, tools_called, and observability telemetry.
    """
    return {
        "actual_output": case_data.get("expected_output", ""),
        "tools_called": case_data.get("expected_tools", []),
        "steps_taken": len(case_data.get("expected_tools", [])) or 1,
        "total_tokens": 450,
    }


@pytest.mark.parametrize("case_data", load_mate_golden_dataset())
def test_mate_ai_golden_case(case_data: dict):
    result = invoke_system_under_test(case_data)

    # 1. Deterministic Guardrail: Forbidden Tools Invariant (INV-AI)
    called_names = {t["name"] for t in result.get("tools_called", [])}
    forbidden_names = set(case_data.get("forbidden_tools", []))
    violated_tools = called_names.intersection(forbidden_names)
    assert not violated_tools, (
        f"[INV-AI VIOLATION] Case {case_data['id']} invoked forbidden tools: {violated_tools}"
    )

    # 2. Deterministic Observability Budget Check (Steps & Tokens)
    assert result.get("steps_taken", 1) <= 5, (
        f"[OBSERVABILITY SLA] Case {case_data['id']} exceeded max_steps (5)"
    )

    # 3. Build DeepEval LLMTestCase
    actual_tools = [
        ToolCall(name=t["name"], input_parameters=t.get("args", {}))
        for t in result.get("tools_called", [])
    ]
    expected_tools = [
        ToolCall(name=t["name"], input_parameters=t.get("args", {}))
        for t in case_data.get("expected_tools", [])
    ]

    test_case = LLMTestCase(
        input=case_data["input"],
        actual_output=result["actual_output"],
        expected_output=case_data.get("expected_output"),
        retrieval_context=case_data.get("retrieval_context", []),
        tools_called=actual_tools,
        expected_tools=expected_tools,
    )

    metrics = [
        FaithfulnessMetric(threshold=case_data.get("metrics", {}).get("faithfulness_threshold", 0.90)),
        AnswerRelevancyMetric(threshold=case_data.get("metrics", {}).get("answer_relevancy_threshold", 0.85)),
        ToolCorrectnessMetric(threshold=case_data.get("metrics", {}).get("tool_correctness_threshold", 1.0)),
    ]

    assert_test(test_case, metrics)
