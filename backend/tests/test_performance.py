"""
Performance & Endpoint Latency Benchmark Tests
"""

import time
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_latency():
    start_time = time.time()
    response = client.get("/health")
    latency = time.time() - start_time
    assert response.status_code == 200
    assert latency < 0.5  # Sub-500ms execution requirement

def test_builder_suggestions_latency():
    start_time = time.time()
    response = client.get("/api/builder-suggestions")
    latency = time.time() - start_time
    assert response.status_code == 200
    assert latency < 1.0  # Sub-1s requirement
