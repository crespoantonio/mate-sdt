#!/usr/bin/env python3
"""
M.A.T.E. Method - Project Initializer Script (init_mate_project.py)
Scaffolds an AI-friendly, SOLID-compliant directory structure and generates
the root MATE-PROJECT-MAP.md living documentation index.

Usage:
    python init_mate_project.py [TARGET_DIR]
"""

import sys
import shutil
import argparse
from pathlib import Path

STANDARD_DIRECTORIES = [
    "specs",
    "tests/e2e",
    "tests/api",
    "tests/threats",
    "tests/charters",
    "tests/nfr",
    "src/pages",
    "src/components",
    "src/fixtures",
    "src/models",
]


def init_mate_project(target_path: Path) -> None:
    target_path = target_path.resolve()
    print(f"🧉 Initializing M.A.T.E. architecture in: {target_path}\n")

    # 1. Create standard folders
    for relative_dir in STANDARD_DIRECTORIES:
        folder = target_path / relative_dir
        folder.mkdir(parents=True, exist_ok=True)
        gitkeep = folder / ".gitkeep"
        if not gitkeep.exists() and not any(folder.iterdir()):
            gitkeep.touch()
        print(f"  [+] Created directory: {relative_dir}/")

    # 2. Copy or generate MATE-PROJECT-MAP.md in target root
    project_map_target = target_path / "MATE-PROJECT-MAP.md"
    template_source = Path(__file__).resolve().parent.parent / "resources" / "MATE-PROJECT-MAP.template.md"

    if project_map_target.exists():
        print(f"\n  [!] MATE-PROJECT-MAP.md already exists at {project_map_target}. Skipping overwrite.")
    else:
        if template_source.exists():
            shutil.copyfile(template_source, project_map_target)
            print(f"\n  [+] Created living architecture index: MATE-PROJECT-MAP.md (from template)")
        else:
            project_map_target.write_text(
                "# 🗺️ MATE-PROJECT-MAP (Living Architecture Index)\n\n"
                "## 1. System Modules and Specifications\n\n"
                "## 2. Invariants (Sacred Rules)\n\n"
                "## 3. Injectable Fixtures and Services\n\n"
                "## 4. Current Quality Status\n",
                encoding="utf-8",
            )
            print(f"\n  [+] Created default MATE-PROJECT-MAP.md")

    print("\n✨ M.A.T.E. project initialization complete!")
    print("👉 Next step: Run mate-model to draft your first specification in specs/.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize standard M.A.T.E. project directory structure and living index.")
    parser.add_argument("target_dir", nargs="?", default=".", help="Target root directory to initialize (default: current directory)")
    args = parser.parse_args()

    init_mate_project(Path(args.target_dir))
