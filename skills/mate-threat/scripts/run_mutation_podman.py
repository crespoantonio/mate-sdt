#!/usr/bin/env python3
"""
M.A.T.E. Method - Mutation Testing Runner via Podman (run_mutation_podman.py)
Executes Stryker Mutator in an isolated, rootless Podman container.
Enforces the M.A.T.E. threshold: Mutation Score >= 85%.

Usage:
    python run_mutation_podman.py [PROJECT_DIR] [--config CONFIG_PATH]
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_mutation_in_podman(project_dir: Path, config_file: str) -> int:
    project_dir = project_dir.resolve()
    print("💣 [M.A.T.E. Pillar T] Launching Mutation Testing Suite via Podman...")
    print(f"📁 Target Project: {project_dir}")
    print(f"⚙️ Config File: {config_file}\n")

    # Verify podman availability
    try:
        version_check = subprocess.run(
            ["podman", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"🐳 Container Engine: {version_check.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: 'podman' is not installed or not in PATH. Rootless Podman is required.")
        return 1

    # Podman run command mounting current project root to /app
    podman_cmd = [
        "podman", "run", "--rm",
        "-v", f"{project_dir}:/app:Z",
        "-w", "/app",
        "node:20-alpine",
        "sh", "-c", f"npm install --legacy-peer-deps && npx stryker run {config_file}"
    ]

    print("🚀 Executing in isolated container:")
    print(f"   {' '.join(podman_cmd)}\n")

    try:
        result = subprocess.run(podman_cmd)
        if result.returncode == 0:
            print("\n✅ [Pillar T Passed] Mutation Score meets the >= 85% M.A.T.E. threshold!")
        else:
            print(f"\n❌ [Pillar T Failed] Mutation testing failed or score fell below 85% threshold.")
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️ Mutation test interrupted by user.")
        return 130


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Stryker Mutation Testing inside Podman.")
    parser.add_argument("project_dir", nargs="?", default=".", help="Root directory of the project")
    parser.add_argument("--config", default="stryker.config.json", help="Path to stryker.config.json")
    args = parser.parse_args()

    exit_code = run_mutation_in_podman(Path(args.project_dir), args.config)
    sys.exit(exit_code)
