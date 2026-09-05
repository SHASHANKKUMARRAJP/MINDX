"""
Unit tests for Verification router (/api/verify)
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_verify_code():
    payload = {
        "code": "def add(a, b):\n    return a + b\n",
        "language": "python"
    }
    response = client.post("/api/verify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
