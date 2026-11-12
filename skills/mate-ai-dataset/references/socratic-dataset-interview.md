# 🎙️ Socratic Dataset Discovery Interview Guide (`mate-ai-dataset`)

When a QA Engineer or Developer asks M.A.T.E. to test an AI Agent, Chatbot, or RAG system and no dataset exists yet, **never guess the business rules**. Conduct a structured, conversational interview using the templates below.

---

## 1. Why Asking Questions First Is Critical in AI Testing

Unlike traditional CRUD web forms where valid inputs are obvious from HTML attributes (`type="email"`, `maxlength="50"`), an AI Agent operates over an **infinite natural-language input space** and non-deterministic reasoning loops.
Without interviewing the user first:
- You cannot know whether an unanswered question should trigger a web search tool, query a vector database, or politely decline to answer.
- You cannot know which tool calls are safe to run against staging vs. which tools require mocking or human confirmation.
- You risk **Context Poisoning**: synthesizing 50 "Golden" test cases whose `expected_output` actually contradicts the company's real business policy!

---

## 2. Ready-to-Ask Questionnaire Templates (By System Type)

### Template A: Autonomous / Tool-Calling Agent (MCP, LangGraph, CrewAI, OpenAI Agents SDK)
Ask the user:
1. **Goal & Persona:** *"What is the primary job of this agent, and who is the end user interacting with it?"*
2. **Tool Inventory & Mutating Actions:** *"Which tools/MCP servers can this agent call? Which ones only read data, and which ones modify state (DB writes, emails, payments)?"*
3. **Missing Arguments Behavior:** *"If the user asks the agent to perform an action (e.g., 'Book a flight to Madrid') without providing required arguments (like the date), should the agent ask a clarifying question, or call a default search tool first?"*
4. **Forbidden Trajectories & Escalation (`INV-AI`):** *"Under what conditions MUST the agent refuse to call a tool or escalate to a human? (e.g., refund limits, unauthorized `user_id`, destructive actions)?"*
5. **Loop & Token Budgets:** *"What is the maximum number of tool-calling steps (`max_steps`) and latency (`max_latency_ms`) acceptable for a single request?"*

---

### Template B: RAG Knowledge System (Vector DB, Document Q&A, Customer Support Bot)
Ask the user:
1. **Knowledge Source Location:** *"Can you point me to the folder, PDF/Markdown files, or Notion/Confluence pages that feed the RAG knowledge base so I can synthesize grounded questions from real chunks?"*
2. **Closed-Book vs. Open-Book Policy:** *"Must the assistant answer STRICTLY using only retrieved context (`Faithfulness >= 0.90`), or is it allowed to use general LLM knowledge when the docs don't cover a topic?"*
3. **Citation & Grounding Format:** *"Should every response include inline citations, document titles, or URLs pointing to the source chunk?"*
4. **Conflict Resolution:** *"If two retrieved chunks contain outdated vs. newer information, how should the assistant resolve the conflict?"*
5. **Out-of-Scope Abstention:** *"What exact phrase or escalation flow should happen when the retrieved chunks have low relevance (`ContextualRelevancy < 0.5`)?"*

---

### Template C: Multi-Turn Conversational Chatbot
Ask the user:
1. **Conversation Horizon:** *"How many turns does a typical user session last, and what state must the bot remember across turns (e.g., user preferences, selected cart items, authentication state)?"*
2. **Topic Switching & Off-Topic Guardrails:** *"If a user suddenly switches topics mid-flow or asks about competitors/politics/unrelated coding tasks, how should the bot steer them back?"*
3. **Persona & Brand Voice Constraints:** *"Are there forbidden words, mandatory disclaimers, or formatting limits (e.g., WhatsApp-friendly short messages vs. detailed Markdown)?"*

---

## 3. The 5-Seed Approval Checklist

Before generating the full dataset, always show the user a markdown table with the **5 Seed Cases** (`SEED-01` through `SEED-05`) showing:
- **User Input / Multi-Turn Script**
- **Expected Tool Calls & Arguments** (and **Forbidden Tools**)
- **Expected Ground-Truth Answer / Rubric Criteria**
- **Why This Seed Matters**

Once the user replies *"Approved"* (or adjusts a rule), proceed to synthesize the full dataset in `tests/ai-evals/datasets/DS-<module>.json`.
