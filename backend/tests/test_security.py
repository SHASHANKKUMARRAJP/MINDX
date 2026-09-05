"""
Security Audit & Header Verification Tests
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers():
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"

def test_invalid_json_payload_protection():
    response = client.post("/api/analyze", content="invalid json text", headers={"Content-Type": "application/json"})
    assert response.status_code == 422
