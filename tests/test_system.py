"""
MINDX Nexus — Root Integration & Security Tests
"""
import pytest
import os
import json


def test_repository_structure():
    """Verify essential project structure and security configuration."""
    assert os.path.exists(".gitignore"), "Missing .gitignore file"
    assert os.path.exists("README.md"), "Missing README.md"
    assert os.path.exists("SECURITY.md"), "Missing SECURITY.md"
    assert os.path.exists("backend/main.py"), "Missing backend entrypoint"
    assert os.path.exists("frontend/src/App.jsx"), "Missing frontend entrypoint"


def test_no_hardcoded_secrets():
    """Scan source files to ensure no live API keys are committed."""
    secret_patterns = ["AIzaSy"]
    for root, _, files in os.walk("."):
        if ".git" in root or "node_modules" in root or ".venv" in root:
            continue
        for file in files:
            if file.endswith((".py", ".jsx", ".js", ".json", ".html")) and file != "test_system.py":
                filepath = os.path.join(root, file)
                if not os.path.isfile(filepath):
                    continue
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    for pattern in secret_patterns:
                        assert pattern not in content, f"Potential secret {pattern} found in {filepath}"
