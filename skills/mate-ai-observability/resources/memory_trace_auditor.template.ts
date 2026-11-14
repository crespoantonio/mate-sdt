#!/usr/bin/env node
'use strict';

/**
 * M.A.T.E. AI Quality Pack — 3-Layer Memory OTel Trace Auditor
 * Enforces:
 *   - Layer 2 ORA-MEM-LATENCY: memory.retrieve P95 <= 200ms
 *   - Layer 1 ORA-MEM-GEN-ASYNC: memory.generate executes asynchronously (wait_for_completion: false)
 *   - Span-Level Fault Isolation Tags:
 *       [RETRIEVER_DEFECT] | [MEMORY_ETL_DEFECT] | [COMPACTION_DEFECT] | [GENERATOR_DEFECT]
 */

const fs = require('node:fs');
const path = require('node:path');

const PII_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /\bsk-[A-Za-z0-9]{16,}\b/,
];

function percentile95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx];
}

function auditMemoryTrace(tracePayload) {
  const spans = Array.isArray(tracePayload.spans) ? tracePayload.spans : [];
  const findings = [];
  const faultTags = new Set();

  const retrievalLatencies = [];
  let hasAsyncGen = false;

  for (const span of spans) {
    const name = String(span.name || '').toLowerCase();
    const attrs = span.attributes || {};
    const duration = Number(span.duration_ms ?? attrs['memory.latency_ms'] ?? 0);

    if (name.includes('memory.retrieve') || span.kind === 'MEMORY_RETRIEVAL') {
      if (duration > 0) retrievalLatencies.push(duration);
      const expected = attrs['memory.expected_keys'] || [];
      const returned = attrs['memory.returned_keys'] || [];
      for (const key of expected) {
        if (!returned.includes(key)) {
          faultTags.add('[RETRIEVER_DEFECT]');
          findings.push(`[RETRIEVER_DEFECT] Expected memory key '${key}' missing from top-K retrieval.`);
        }
      }
    }

    if (name.includes('memory.generate') || span.kind === 'MEMORY_CONSOLIDATION') {
      if (attrs['memory.wait_for_completion'] === false) {
        hasAsyncGen = true;
      } else if (attrs['memory.wait_for_completion'] === true) {
        faultTags.add('[MEMORY_ETL_DEFECT]');
        findings.push('[MEMORY_ETL_DEFECT] ORA-MEM-GEN-ASYNC violated: wait_for_completion must be false.');
      }
      const persisted = JSON.stringify(attrs['memory.persisted_payload'] || '');
      if (PII_PATTERNS.some((re) => re.test(persisted))) {
        faultTags.add('[MEMORY_ETL_DEFECT]');
        findings.push('[MEMORY_ETL_DEFECT] Unredacted PII/secret detected in memory.generate payload.');
      }
    }

    if (name.includes('session.compact') || span.kind === 'SESSION_COMPACTION') {
      if (attrs['compaction.dropped_required_fact'] === true) {
        faultTags.add('[COMPACTION_DEFECT]');
        findings.push('[COMPACTION_DEFECT] Session compaction dropped required context fact.');
      }
    }

    if (span.kind === 'LLM' && attrs['memory.context_used'] === false && attrs['memory.returned_keys']?.length > 0) {
      faultTags.add('[GENERATOR_DEFECT]');
      findings.push('[GENERATOR_DEFECT] Relevant memories were retrieved cleanly, but the LLM ignored them.');
    }
  }

  const p95LatencyMs = percentile95(retrievalLatencies);
  if (p95LatencyMs > 200) {
    faultTags.add('[RETRIEVER_DEFECT]');
    findings.push(`[RETRIEVER_DEFECT] ORA-MEM-LATENCY violated: P95=${p95LatencyMs}ms > 200ms.`);
  }

  return {
    passed: findings.length === 0,
    p95RetrievalLatencyMs: p95LatencyMs,
    asyncGenerationObserved: hasAsyncGen,
    faultIsolationTags: [...faultTags],
    findings,
  };
}

if (require.main === module) {
  const traceArg = process.argv[2] || path.join(__dirname, 'sample-trace.json');
  if (!fs.existsSync(traceArg)) {
    console.error(`Trace file not found: ${traceArg}`);
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(traceArg, 'utf8'));
  const report = auditMemoryTrace(payload);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

module.exports = { auditMemoryTrace, percentile95 };
