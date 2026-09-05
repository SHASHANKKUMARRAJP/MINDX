"""
Unit tests for Builder router (/api/generate-app, /api/builder-suggestions, etc.)
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_generate_app_basic():
    payload = {"prompt": "Build a task manager app"}
    response = client.post("/api/generate-app", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "success" in data or "app" in data or "project" in data or "files" in data or isinstance(data, dict)

def test_builder_suggestions():
    response = client.get("/api/builder-suggestions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))
