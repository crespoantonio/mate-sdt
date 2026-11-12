# Multi-Source Requirement Ingestion Guide (MCPs, Spreadsheets & Docs)

How M.A.T.E. ingests User Stories and Acceptance Criteria across different QA environments and syncs Test Cases back.

---

## 1. Atlassian MCP (Jira & Confluence)

### Reading a User Story
If an Atlassian/Jira MCP server is available in the environment:
1. Fetch the issue by key (e.g., `get_jira_issue` / `search_jira_issues` for `ORDER-104`).
2. Extract:
   - **Summary & Description** (User Story narrative: *As a... I want... So that...*)
   - **Acceptance Criteria** (Gherkin blocks, bullet lists, or custom AC fields)
   - **Linked Confluence PRD pages** (if linked in the ticket, read the Confluence page via MCP for architectural/API context)
   - **Priority & Labels** (map to `@p0`, `@p1`, `@p2`)

### Syncing Back to Jira / Xray / Zephyr
- **Option A (MCP Comment / Sub-task):** Post the M.A.T.E. Test Case Matrix summary and any discovered bugs (`BUG-XXX`) directly as a structured comment or linked Bug issue on the Jira story (only when requested by the tester).
- **Option B (CSV Import):** Use the generated `docs/test-cases/TC-<module>.csv` file, which includes standard columns (`TC_ID, Story_Key, Title, Category, Priority, Preconditions, Steps, Expected_Result, Invariant_ID, Execution_Status, Bug_ID`) compatible with Jira Xray, Zephyr Scale, and TestRail importers.

---

## 2. Notion MCP

If the team manages PRDs, User Stories, or QA Test Plans in Notion:
1. Search or fetch the Notion page/database item using the Notion MCP tools.
2. Parse acceptance criteria callouts, toggle lists, and state tables.
3. Generate `specs/[module].mate-spec.md` and `docs/test-cases/TC-[module].md` / `.csv`.
4. Optionally append the Test Case coverage table and execution verdict back to the Notion page if requested.

---

## 3. GitHub Issues / Linear / Azure DevOps MCP

1. Read the issue/work item description and comments via MCP.
2. Map each checklist item or acceptance criterion to `AC-01`, `AC-02`, etc.
3. Link generated Pull Requests and visual evidence (`mate-pw-forensics`) back to the issue key.

---

## 4. Local Files (Excel `.xlsx`, `.csv`, Markdown, PDF)

Many QA teams receive requirements or existing manual test suites in Excel or CSV files:
1. **CSV / Markdown / JSON:** Read directly using file reading tools.
2. **Excel (`.xlsx`):** If a `.xlsx` file is provided in the workspace, inspect it using a lightweight Node.js or Python script in a scratch/command execution, extracting all rows and sheets without modifying the source file.
3. **Output:** Always write the updated/expanded Test Case Matrix to `docs/test-cases/TC-[module].csv` and `docs/test-cases/TC-[module].md` so the tester can open `.csv` directly in Excel with 100% formatting preservation.
