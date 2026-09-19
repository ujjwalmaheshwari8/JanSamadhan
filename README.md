# JanSamadhan

Civic intelligence / command-center baseline: citizen complaints → deterministic local AI classification → department routing → geographic incident matching → master incident → dashboard/work orders.

## Run with Docker Desktop

From this folder:

```powershell
docker compose up --build
```

Open:
- http://localhost:3000 — command center
- http://localhost:8000/docs — FastAPI Swagger UI
- http://localhost:8000/health — API health check

Demo accounts all use password `demo123`:
- admin.demo@example.test
- citizen.demo@example.test
- field.demo@example.test
- department.demo@example.test

## Local development

Backend:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set `DATABASE_URL` to a reachable PostgreSQL database, then:

```powershell
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Baseline limitations

`AI_PROVIDER=local` uses deterministic keyword-based classification. This baseline does not enable external LLMs, embeddings/pgvector, PostGIS, object storage, background workers, or real map tiles.
