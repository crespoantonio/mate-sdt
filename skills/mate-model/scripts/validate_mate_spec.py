#!/usr/bin/env python3
"""
M.A.T.E. Method - Specification Validator (validate_mate_spec.py)
Validates that a *.mate-spec.md specification complies with the M.A.T.E. Standard:
1. Frontmatter metadata (module, version, status, author).
2. Four mandatory XML semantic blocks:
   - <intent_model> (including explicit forbidden transitions)
   - <invariants> (deterministic rules)
   - <threat_scenarios> (concurrency, idempotency, data trash)
   - <exploratory_charters> (human charters)

Usage:
    python validate_mate_spec.py path/to/spec.mate-spec.md
"""

import sys
import re
from pathlib import Path

REQUIRED_BLOCKS = [
    "intent_model",
    "invariants",
    "threat_scenarios",
    "exploratory_charters",
]

ALLOWED_STATUSES = ["DRAFT", "REVIEW", "APPROVED", "DEPRECATED"]


def validate_spec(file_path: Path) -> bool:
    if not file_path.exists():
        print(f"❌ Error: File not found: {file_path}")
        return False

    content = file_path.read_text(encoding="utf-8")
    errors = []
    warnings = []

    print(f"🧉 Validating M.A.T.E. Spec: {file_path.name}\n")

    # 1. Validate frontmatter
    fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not fm_match:
        errors.append("Missing YAML frontmatter block (--- ... ---) at the top of the file.")
    else:
        fm_text = fm_match.group(1)
        for field in ["module", "version", "status"]:
            if not re.search(rf"^{field}\s*:\s*\S+", fm_text, re.MULTILINE):
                errors.append(f"Frontmatter is missing required field: '{field}'")
        
        status_match = re.search(r"^status\s*:\s*(\w+)", fm_text, re.MULTILINE)
        if status_match:
            status = status_match.group(1).upper()
            if status not in ALLOWED_STATUSES:
                errors.append(f"Invalid status '{status}'. Must be one of: {', '.join(ALLOWED_STATUSES)}")

    # 2. Validate mandatory XML blocks
    for block in REQUIRED_BLOCKS:
        open_tag = f"<{block}>"
        close_tag = f"</{block}>"
        if open_tag not in content or close_tag not in content:
            errors.append(f"Missing required XML semantic block: {open_tag}...{close_tag}")
        else:
            block_content = content.split(open_tag)[1].split(close_tag)[0].strip()
            if len(block_content) < 30:
                warnings.append(f"Block '{block}' seems unusually short or empty.")

    # 3. Check for explicit forbidden transitions inside <intent_model>
    if "<intent_model>" in content:
        intent_text = content.split("<intent_model>")[1].split("</intent_model>")[0]
        forbidden_patterns = [r"forbidden", r"prohibid", r"illegal", r"never allow"]
        has_forbidden = any(re.search(pat, intent_text, re.IGNORECASE) for pat in forbidden_patterns)
        if not has_forbidden:
            errors.append(
                "Pillar M violation: <intent_model> must explicitly declare 'Forbidden Transitions' "
                "to prevent security and business logic exploits."
            )

    # 4. Check invariant IDs
    if "<invariants>" in content:
        inv_text = content.split("<invariants>")[1].split("</invariants>")[0]
        if not re.search(r"INV-\d+", inv_text):
            warnings.append("No standard invariant IDs (e.g., INV-01, INV-02) detected in <invariants> block.")

    # Report results
    if warnings:
        print("⚠️ Warnings:")
        for w in warnings:
            print(f"  - {w}")
        print()

    if errors:
        print("❌ Spec validation FAILED with the following errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("✅ Spec validation PASSED! The specification adheres to the M.A.T.E. standard.")
        return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_mate_spec.py <path-to-spec.mate-spec.md>")
        sys.exit(1)

    spec_file = Path(sys.argv[1])
    is_valid = validate_spec(spec_file)
    sys.exit(0 if is_valid else 1)
