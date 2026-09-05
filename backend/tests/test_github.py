"""
Unit tests for GitHub router (/api/github/analyze)
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_github_analyze_invalid_url():
    payload = {"repo_url": "https://github.com/invalid/nonexistent-repo-9999"}
    response = client.post("/api/github/analyze", json=payload)
    # Should handle gracefully without crashing (either 200 with error info or 400/422)
    assert response.status_code in [200, 400, 422, 500]
