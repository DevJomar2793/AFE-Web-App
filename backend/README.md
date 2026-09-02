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
service and database availability with
`GET http://127.0.0.1:8000/api/v1/health`.

Create an inventory item with:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/inventory/add-stock \
  -H "Content-Type: application/json" \
  -d '{"item": "Large eggs", "quantity": 5, "price": "250.00"}'
```

The database generates the item ID. The optional `status` defaults to
`in_stock` when quantity is available and `out_of_stock` when quantity is zero.

Get all inventory items with:

```bash
curl http://127.0.0.1:8000/api/v1/inventory
```

## Database migrations

Apply all pending schema changes from the `backend/` directory:

```bash
alembic upgrade head
```

Create future migrations after importing new models into `app/models/__init__.py`:

```bash
alembic revision --autogenerate -m "describe the schema change"
```

## Tests

Install development dependencies and run the integration tests while `afe_db`
is available:

```bash
python -m pip install -r requirements-dev.txt
pytest
```
