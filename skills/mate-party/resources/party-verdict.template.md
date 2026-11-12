# 🧉 M.A.T.E. Party Mode Verdict & Action Plan

**Date:** {{DATE}}  
**Facilitator:** `mate-party` (Council of QA Experts)  
**Scope / Topic:** {{TOPIC_SUMMARY}}  

---

## 🎭 1. The Council Deliberation ("Ronda de Mates")

### 🧉 Tony / The Quality Strategist
> *"{{TONY_PERSPECTIVE_ON_ROI_AND_PRIORITY}}"*

### 🕵️ The Exploratory Sleuth
> *"{{EXPLORATORY_PERSPECTIVE_ON_HUMAN_HEURISTICS_AND_EDGE_CASES}}"*

### ⚡ The Automation Architect
> *"{{AUTOMATION_PERSPECTIVE_ON_SOLID_API_VS_UI_AND_PLAYWRIGHT_CLI}}"*

### 🛡️ The Chaos & Threat Specialist *(Optional / If applicable)*
> *"{{THREAT_PERSPECTIVE_ON_CONCURRENCY_MUTATION_OR_PERFORMANCE}}"*

### 🤖 The AI Quality Specialist *(Optional / If AI/LLM/RAG is involved)*
> *"{{AI_PERSPECTIVE_ON_DATASETS_PROMPTFOO_DEEPEVAL_AND_OTEL}}"*

---

## 👥 2. Human Team Collaboration (Who to Consult)

| Role / Stakeholder | Question / Context Needed | Action Item |
| :--- | :--- | :--- |
| **Product Owner / PM** | {{PO_QUESTION}} | Clarify acceptance criteria & business edge limits. |
| **Backend Engineer** | {{BACKEND_QUESTION}} | Request OpenAPI contract, schema, or error status codes. |
| **Frontend / Design** | {{FRONTEND_QUESTION}} | Validate state transitions & loading/error visual states. |
| **DevOps / Infra** | {{DEVOPS_QUESTION}} | Verify staging environment, test data seed, or Podman runner. |

---

## 🧭 3. M.A.T.E. Execution Path (Skills & Workflows)

1. **Step 1:** Activate `{{SKILL_1}}` ➔ Workflow `{{WORKFLOW_1}}`
2. **Step 2:** Activate `{{SKILL_2}}` ➔ Workflow `{{WORKFLOW_2}}`
3. **Step 3:** Activate `{{SKILL_3}}` ➔ Enforce `npx mate-sdt gate` (5-Gate Harness Loop)

---

## ⚡ 4. Immediate Next Step & CLI Commands

Copy and execute these commands in sequence:

```bash
# 1. {{COMMAND_1_DESCRIPTION}}
{{COMMAND_1}}

# 2. {{COMMAND_2_DESCRIPTION}}
{{COMMAND_2}}

# 3. Verify quality gates
npx mate-sdt gate
```
