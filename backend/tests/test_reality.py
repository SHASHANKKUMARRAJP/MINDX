"""
Reality Scanner Router Test Suite
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)


def test_reality_scan_missing_file():
    """Test reality scanner validation when image file is missing."""
    response = client.post("/api/reality-scan")
    assert response.status_code in (400, 422)


def test_reality_scan_valid_dummy_file():
    """Test reality scanner endpoint with valid dummy image bytes."""
    dummy_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    response = client.post(
        "/api/reality-scan",
        files={"file": ("test.png", dummy_image, "image/png")},
        data={"prompt": "Detect objects", "mode": "general"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data or "objects" in data
