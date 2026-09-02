# AFE Backend

FastAPI service for Adamos Fresh Eggs inventory operations. It uses an
asynchronous SQLAlchemy connection to PostgreSQL.

## Setup

Create the local database once:

```bash
createdb -h localhost -p 5432 -O "$(whoami)" afe_db
```

Create an isolated Python environment and install the pinned dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with local PostgreSQL credentials. The file is ignored by Git.

## Run

From this directory, start the development server:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation. Check
service and database availability with `GET http://127.0.0.1:8000/health`.
