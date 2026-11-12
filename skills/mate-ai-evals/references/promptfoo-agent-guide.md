# ⚡ Promptfoo Agent & RAG Evaluation Reference (`mate-ai-evals`)

Promptfoo (`npx promptfoo@latest`) provides a zero-boilerplate, declarative YAML/JavaScript harness ideal for evaluating Prompts, RAG APIs, and Tool-Calling Agents directly from Node.js/TypeScript projects.

---

## 1. Running Promptfoo in M.A.T.E.

```bash
# Run functional, trajectory, and RAG evaluations
npx promptfoo@latest eval -c tests/ai-evals/promptfoo/promptfooconfig.yaml

# Open the interactive matrix dashboard
npx promptfoo@latest view
```

---

## 2. Asserting Tool Calls & Agent Trajectories in Promptfoo

Always combine **deterministic tool assertions** with **LLM-as-a-Judge rubrics**:

```yaml
tests:
  - description: "[AI-TC-001] Order status check invokes get_order_status and never calls issue_refund"
    vars:
      user_query: "Can you check the delivery status of my order ORD-1042?"
      expected_order_id: "ORD-1042"
    assert:
      # 1. Deterministic Trajectory Assertion
      - type: javascript
        value: |
          const data = typeof output === 'string' ? JSON.parse(output) : output;
          const calls = data.tool_calls || [];
          const calledGetOrder = calls.some(
            c => c.name === 'get_order_status' && c.args?.order_id === context.vars.expected_order_id
          );
          const calledForbidden = calls.some(
            c => ['issue_refund', 'cancel_order'].includes(c.name)
          );
          if (!calledGetOrder) return { pass: false, score: 0, reason: 'Missing get_order_status(ORD-1042)' };
          if (calledForbidden) return { pass: false, score: 0, reason: 'INV-AI VIOLATION: Called forbidden mutating tool!' };
          return { pass: true, score: 1.0, reason: 'Exact tool trajectory verified' };

      # 2. Groundedness / Faithfulness Rubric
      - type: llm-rubric
        value: "The response accurately reports that order ORD-1042 is IN_TRANSIT via FedEx arriving Friday, without inventing tracking numbers."
      
      # 3. Latency SLA Assertion
      - type: latency
        threshold: 8000
```

---

## 3. Custom HTTP / Script Providers for Real Agents

Instead of only testing raw OpenAI/Anthropic prompts, point Promptfoo `providers` to your **actual running Agent API or local script**:

```yaml
providers:
  - id: http://localhost:3000/api/agent/chat
    label: "Staging Support Agent API"
    config:
      method: POST
      headers:
        Content-Type: application/json
      body:
        message: "{{user_query}}"
        sessionId: "{{session_id}}"
      transformResponse: "json"
```
