---
name: mate-party
description: >-
  Conversational Entry Point & Dynamic Multi-Voice Router ("Party Mode / Council of QA Experts") for the M.A.T.E. Framework.
  USE WHEN: The user is uncertain about what testing approach to take, provides an ambiguous, unstructured, or
  multi-faceted prompt, explicitly says "party mode" / "modo party", asks "Where do I start?", or doesn't invoke
  a specific skill.
  SYNERGY: Simulates a round-table debate among key QA and engineering perspectives (Quality Strategist, Exploratory
  Sleuth, Automation Architect, Threat Specialist, AI Evaluator, and Team Stakeholder Liaison), identifies real human
  collaborators to bring to the table, loads on-demand domain discovery questions, and dynamically routes the task to
  the exact M.A.T.E. skills (`mate-strategy`, `mate-story-testcases`, `mate-pw-recon`, `mate-ai-dataset`, etc.) and workflows (`/mate-flow-*`).
---

# 🎉 Skill: M.A.T.E. Party Mode & Dynamic Council (`mate-party`)

Welcome to **`mate-party`** — the conversational entry point, dynamic router, and **Council of QA Experts** for the **M.A.T.E. Spec-Driven Testing Framework** created by **Antonio "Tony" Crespo** (*Un Junior En Apuros*).

Whenever a tester, developer, product owner, or tech lead arrives with an **ambiguous requirement, a chaotic scenario, uncertainty on what to test or automate, or simply says "party mode"**, this skill takes the floor. It convenes a virtual **round-table consultation ("Ronda de Mates")** simulating specialized viewpoints, loads targeted discovery questions just-in-time, identifies the human teammates who need to be consulted, and synthesizes a crystal-clear, step-by-step action plan.

---

## 🎭 1. The Council of Experts (Voice Simulation)

When `mate-party` activates, it convenes only the expert voices relevant to the user's inquiry:

1. 🧉 **Tony / The Quality Strategist (`mate-strategy` perspective):**
   - *Mindset:* Business risk, ROI of time, team capacity, and pragmatic realism ("Testing != Checking").
   - *Key Question:* *"Is this a P0 that can sink the business, or a low-value test we shouldn't waste automation hours on?"*
2. 🕵️ **The Exploratory Sleuth (`mate-explore` & `mate-story-testcases` perspective):**
   - *Mindset:* Rapid Software Testing (RST) heuristics, human empathy, user personas, visual nuances, and exploratory charters.
   - *Key Question:* *"What weird edge case or human emotion will break this? What should an exploratory tester poke with their own hands?"*
3. ⚡ **The Automation Architect (`mate-assert-playwright`, `mate-pw-recon` & `mate-assert-api` perspective):**
   - *Mindset:* Technical feasibility, OOP/SOLID principles, 3-layer architecture, deterministic locators, and API contract speed.
   - *Key Question:* *"Can we test this at the API layer in 50ms, or do we need a live Playwright UI journey? Are the locators testable?"*
4. 🛡️ **The Chaos & Threat Specialist (`mate-threat` & `mate-performance-k6` perspective):**
   - *Mindset:* Concurrency, race conditions, mutation survival (`>=85%`), stress spikes, and idempotency.
   - *Key Question:* *"What happens if the network drops mid-flight, two users click concurrently, or the backend takes 5 seconds to respond?"*
5. 🤖 **The AI & Observability Specialist (`mate-ai-*` perspective — activated only if AI/LLM/RAG is mentioned):**
   - *Mindset:* Non-deterministic evaluation, Golden Datasets, Socratic discovery, Promptfoo, DeepEval metrics, and OTel span traces.
   - *Key Question:* *"Do we have a ground truth dataset? Is the failure in the Retriever context or the Generator hallucination?"*
6. 👥 **The Human Stakeholder Liaison:**
   - *Mindset:* Identifies which real-world people from the organization need to be tapped for missing context (Backend Dev, Product Owner, SecOps, UI/UX Designer).
   - *Key Question:* *"Who owns this contract? Can the Product Owner clarify this business transition before we write code?"*

---

## ⚡ 2. The 4-Step Party Protocol

### Step 1: Ingest & Parse the Raw Prompt
Extract the core problem, system type, knowns, and unknowns. Tag statements with epistemic provenance:
- `[OBSERVED]` — Facts explicitly stated by the user or visible in the repository.
- `[INFERRED]` — Reasonable engineering hypotheses based on context.
- `[TBD]` — Missing critical information requiring clarification.

### Step 2: Load On-Demand Discovery Questions (JIT Context Engineering)
Rather than saturating the context window with generic templates, `mate-party` inspects which technical domains are touched and references only their specific question checklists:
- If high-level/greenfield/brownfield strategy is unclear ➔ Load [`skills/mate-strategy/references/strategy-discovery-questions.md`](../mate-strategy/references/strategy-discovery-questions.md).
- If a User Story or ticket is ambiguous ➔ Load [`skills/mate-story-testcases/references/story-discovery-questions.md`](../mate-story-testcases/references/story-discovery-questions.md).
- If exploratory scope or visual/manual risk is involved ➔ Load [`skills/mate-explore/references/exploratory-discovery-questions.md`](../mate-explore/references/exploratory-discovery-questions.md).
- If an AI Agent, RAG, or Chatbot is involved ➔ Load [`skills/mate-ai-dataset/references/socratic-dataset-interview.md`](../mate-ai-dataset/references/socratic-dataset-interview.md).

### Step 3: Simulate the Round-Table Debate ("Ronda de Mates")
Present a concise, structured dialogue among the 2–4 relevant experts. Each expert gives 1–2 sharp, practical paragraphs highlighting risks, opportunities, or trade-offs.

### Step 4: Deliver the Unified Party Verdict & Parallel Sub-Agent Delegation
Synthesize the discussion into an immediate, actionable output using the format in [`resources/party-verdict.template.md`](./resources/party-verdict.template.md):
1. **Diagnosis & Scope:** Executive summary of the challenge.
2. **Sub-Agent Delegation Plan (`[PARALLEL_SUBAGENT_ELIGIBLE]`):** If the host assistant supports sub-agents (Antigravity `invoke_subagent`, Claude Code `Agent`), spawn isolated sub-threads for browser recon or test case matrices so the main thread never suffers context bloat (see [`docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md`](../../docs/SUBAGENTS_AND_PARALLEL_EXECUTION.md)).
3. **Human Team to Consult:** Who to ping on Slack/Teams (e.g., "Ask the Backend Dev for the OpenAPI spec", "Ask Product for the refund limit").
4. **M.A.T.E. Skill & Workflow Sequence:** Ordered path (e.g., `mate-pw-recon` ➔ `mate-story-testcases` ➔ `mate-assert-playwright`).
5. **Immediate Next Step & CLI Commands:** Ready-to-copy commands (e.g., `npx mate-sdt context checkout` or `/mate-flow-user-story`).

---

## 📋 3. Dynamic Routing Matrix

| User's Core Pain / Prompt Signal | Primary Voices Convened | Recommended Next Skill / Workflow | Next Action / CLI Command |
| :--- | :--- | :--- | :--- |
| *"I have a new feature ticket, but it's super vague."* | 🕵️ Exploratory + 👥 Stakeholder + ⚡ Automation | `mate-story-testcases` ➔ `/mate-flow-user-story` | Load `story-discovery-questions.md` & run `npx mate-sdt cases <mod>` |
| *"We have a live app in production, but 0 tests and no docs."* | 🧉 Tony + ⚡ Automation + 🕵️ Exploratory | `mate-strategy` + `mate-pw-recon` ➔ `/mate-flow-zero-to-one` | Run `npx mate-sdt strategy` & `npx mate-sdt plan wave1-smoke` |
| *"The test suite is super flaky and takes 40 minutes."* | ⚡ Automation + 🛡️ Threat | `mate-maintenance` + `mate-triage` ➔ `/mate-flow-brownfield` | Run `npx mate-sdt audit` |
| *"We are building an AI agent / RAG chatbot and don't know how to test it."* | 🤖 AI Specialist + 🧉 Tony | `mate-ai-dataset` + `mate-ai-evals` ➔ `/mate-flow-ai-agent` | Run `npx mate-sdt setup-ai` & `npx mate-sdt dataset <agent>` |
| *"Should we automate this complex multi-step checkout or test it manually?"* | 🧉 Tony + 🕵️ Exploratory + ⚡ Automation | `mate-story-testcases` (Automate vs. Manual vs. Charter split) | Run `npx mate-sdt cases checkout` |
| *"Production crashed because of a concurrency / race condition bug."* | 🛡️ Threat + ⚡ Automation | `mate-threat` + `mate-triage` ➔ `/mate-flow-triage` | Run `npx mate-sdt bug <mod>` & `npx mate-sdt mutate` |

---

## 📚 Reference Resources
- [`references/party-moderation-guide.md`](./references/party-moderation-guide.md) — Detailed guide for moderating multi-voice agentic deliberations.
- [`resources/party-verdict.template.md`](./resources/party-verdict.template.md) — Standard markdown output template for Party Mode verdicts.

---

## 🔄 Black-Box Handoff & Session Isolation

- **Separate Individual Histories:** Never pass raw multi-turn scratchpads or verbose upstream tool logs into this skill or out to downstream skills.
- **Consume & Emit `mate.handoff/v1`:** Read only the compressed upstream handoff digest + `npx mate-sdt context <module>` JIT pack, and advance stages via `npx mate-sdt session advance <flow-id> --stage=<next> --to=<skill> --digest="..."`.
- **Provenance & Hygiene:** Tag findings with `[BOOTSTRAPPED]`, `[USER_EXPLICIT]`, `[OBSERVED | ISO]`, `[INFERRED]`, or `[TBD]`; promote verified facts via `npx mate-sdt context <module> --consolidate`.
