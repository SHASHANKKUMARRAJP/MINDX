"""
MINDX Nexus — FastAPI Automated Test Suite
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test API root status response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MINDX Nexus API is running"
    assert "version" in data


def test_health_endpoint():
    """Test system health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_security_headers():
    """Test presence of HTTP security headers."""
    response = client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-xss-protection") == "1; mode=block"


def test_builder_suggestions_endpoint():
    """Test App Builder suggestions endpoint."""
    response = client.get("/api/builder-suggestions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_verify_endpoint_missing_payload():
    """Test verify endpoint validation with fallback / handle."""
    response = client.post("/api/verify", data={})
    # Should return valid status or 200 fallback response
    assert response.status_code in (200, 400)


def test_notebook_action_validation():
    """Test Notebook action validation."""
    response = client.post("/api/notebook/action", data={"action": "", "node_title": ""})
    assert response.status_code in (400, 422, 500)
