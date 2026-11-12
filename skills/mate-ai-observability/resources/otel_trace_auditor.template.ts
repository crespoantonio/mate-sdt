/**
 * 🧉 M.A.T.E. Method — OpenTelemetry / OpenInference AI Agent Trace Auditor
 * Deterministic Harness Guardrail for Agent Traces:
 *   1. Detects Infinite / Redundant Tool Loops (ORA-AI-LOOP / ORA-AI-STEPS)
 *   2. Enforces Token & Latency Budgets (ORA-AI-TOKENS / ORA-AI-LATENCY)
 *   3. Isolates Retriever vs. Generator Failures in RAG spans (ORA-AI-RAG-EMPTY)
 *   4. Blocks Forbidden Tool Executions across nested sub-agents (INV-AI-TOOLS)
 *
 * Usage: node tests/ai-evals/traces/otel_trace_auditor.js [path-to-trace.json]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function auditAgentTrace(traceData, sla = {}) {
  const maxSteps = sla.max_steps ?? 5;
  const maxTokens = sla.max_tokens ?? 3500;
  const maxLatencyMs = sla.max_latency_ms ?? 8000;
  const forbiddenTools = new Set(sla.forbidden_tools ?? ['issue_refund', 'delete_user']);

  const spans = traceData.spans || [];
  const findings = [];
  let totalTokens = 0;
  let toolSteps = 0;
  const toolCallSignatures = new Map();

  for (const span of spans) {
    const kind = span.kind || span.attributes?.['openinference.span.kind'] || 'UNKNOWN';
    const attrs = span.attributes || {};

    // 1. Token accumulation
    const inTokens = Number(attrs['gen_ai.usage.input_tokens'] || attrs['llm.token_count.prompt'] || 0);
    const outTokens = Number(attrs['gen_ai.usage.output_tokens'] || attrs['llm.token_count.completion'] || 0);
    totalTokens += inTokens + outTokens;

    // 2. Tool call checks
    if (kind === 'TOOL') {
      toolSteps += 1;
      const toolName = attrs['tool.name'] || span.name || 'unknown_tool';
      const toolArgs = JSON.stringify(attrs['tool.parameters'] || {});
      const signature = `${toolName}:${toolArgs}`;

      if (forbiddenTools.has(toolName)) {
        findings.push({
          severity: 'CRITICAL',
          code: 'INV-AI-TOOLS',
          message: `Forbidden tool '${toolName}' was executed in span '${span.span_id || span.name}'!`,
        });
      }

      const prevCount = toolCallSignatures.get(signature) || 0;
      toolCallSignatures.set(signature, prevCount + 1);
      if (prevCount + 1 >= 2) {
        findings.push({
          severity: 'HIGH',
          code: 'ORA-AI-LOOP',
          message: `Redundant tool loop detected: '${toolName}' called ${prevCount + 1} times with identical arguments ${toolArgs}.`,
        });
      }
    }

    // 3. Retrieval quality check
    if (kind === 'RETRIEVAL') {
      const docs = attrs['retrieval.documents'] || [];
      if (Array.isArray(docs) && docs.length === 0) {
        findings.push({
          severity: 'MEDIUM',
          code: 'ORA-AI-RAG-EMPTY',
          message: `RETRIEVAL span '${span.name}' returned 0 document chunks ([RETRIEVER_DEFECT] risk).`,
        });
      }
    }
  }

  if (toolSteps > maxSteps) {
    findings.push({
      severity: 'HIGH',
      code: 'ORA-AI-STEPS',
      message: `Agent executed ${toolSteps} tool steps, exceeding SLA budget of ${maxSteps}.`,
    });
  }

  if (totalTokens > maxTokens) {
    findings.push({
      severity: 'MEDIUM',
      code: 'ORA-AI-TOKENS',
      message: `Trace consumed ${totalTokens} tokens, exceeding SLA budget of ${maxTokens}.`,
    });
  }

  if (traceData.duration_ms && traceData.duration_ms > maxLatencyMs) {
    findings.push({
      severity: 'MEDIUM',
      code: 'ORA-AI-LATENCY',
      message: `Trace duration (${traceData.duration_ms}ms) exceeded P95 SLA (${maxLatencyMs}ms).`,
    });
  }

  return {
    passed: findings.length === 0,
    summary: {
      trace_id: traceData.trace_id || 'sample-trace-001',
      total_spans: spans.length,
      tool_steps: toolSteps,
      total_tokens: totalTokens,
      duration_ms: traceData.duration_ms || 0,
    },
    findings,
  };
}

if (require.main === module) {
  const targetFile =
    process.argv[2] || path.join(process.cwd(), 'tests', 'ai-evals', 'traces', 'sample-trace.json');
  if (fs.existsSync(targetFile)) {
    const raw = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    const report = auditAgentTrace(raw, raw.sla || {});
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.passed ? 0 : 1);
  } else {
    console.log('ℹ️  No trace file found at', targetFile);
  }
}

module.exports = { auditAgentTrace };
