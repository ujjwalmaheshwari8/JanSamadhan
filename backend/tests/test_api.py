import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_civic_intel.db")
os.environ.setdefault("JWT_SECRET", "test-secret")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login(email="admin.demo@example.test"):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "demo123"},
    )
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()["access_token"]}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dashboard():
    assert client.get("/api/v1/dashboard/overview", headers=login()).status_code == 200


def test_complaint_fusion():
    response = client.post(
        "/api/v1/complaints",
        headers=login("citizen.demo@example.test"),
        json={
            "description": "Brown water and strange smell in Sector 4",
            "category": "Water & Sanitation",
            "lat": 19.12,
            "lon": 72.88,
        },
    )
    assert response.status_code == 200
    assert response.json()["incident_id"].startswith("MI-")
