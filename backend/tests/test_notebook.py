"""
Notebook Router Test Suite
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)


def test_notebook_build_empty():
    """Test building notebook without files raises validation error."""
    response = client.post("/api/notebook/build")
    assert response.status_code == 422


def test_notebook_action_missing_params():
    """Test action endpoint validation."""
    response = client.post("/api/notebook/action", data={})
    assert response.status_code in (400, 422)


def test_notebook_chat_valid():
    """Test notebook chat endpoint with sample context."""
    response = client.post(
        "/api/notebook/chat",
        data={
            "message": "What are the core concepts?",
            "source_context": "Unit 1 covers AI architecture and neural vision principles."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
