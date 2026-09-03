# AFE Backend

FastAPI service for Adamos Fresh Eggs inventory records. It uses Pydantic for
request validation and asynchronous SQLAlchemy sessions with PostgreSQL.

## Setup

Create the local database once:

```bash
createdb -h localhost -p 5432 -O "$(whoami)" afe_db
```

Create an isolated Python environment and install the pinned dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
```

Replace the placeholder values in `.env` with local PostgreSQL credentials.
The file is ignored by Git. If credentials from an earlier example file were
real, rotate them because removing them from the current file does not remove
them from Git history.

`CORS_ALLOWED_ORIGINS` is a comma-separated list of frontend origins that may
call FastAPI directly from a browser. The example permits the local Next.js
development URLs. Add the exact deployed frontend origin for deployment; do not
use `*` for a private inventory API.

Apply migrations and start the service:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation.

## API routes

The canonical routes are:

```text
GET  /api/v1/health
GET  /api/v1/inventory/get-item
POST /api/v1/inventory/add-stock
GET  /api/v1/sales/get-sales
POST /api/v1/sales/add-sales
```

Create an item without putting an ID in the URL or request body. PostgreSQL
generates the ID:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/inventory/add-stock \
  -H "Content-Type: application/json" \
  -d '{"item": "Large eggs", "quantity": 5, "price": "250.00"}'
```

`status` is optional. It defaults to `in_stock` when quantity is positive and
`out_of_stock` when quantity is zero.

Create a sale with the related inventory ID, a positive whole quantity, and a
customer name:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/add-sales \
  -H "Content-Type: application/json" \
  -d '{"inventory_id": 1, "quantity": 2, "customer_name": "Maria Santos"}'
```

Creating a sale and deducting inventory happen in one database transaction.
The API returns `404` when the item does not exist and `409` when there is not
enough stock. The inventory row is locked during the operation to prevent two
simultaneous sales from overselling it.

List sales, newest first, with:

```bash
curl http://127.0.0.1:8000/api/v1/sales/get-sales
```

## Code organization

- Routes validate HTTP input, call a service, and translate database failures
  into safe API errors.
- Services contain readable database queries and transaction handling.
- Schemas define API request and response shapes.
- Models define the PostgreSQL tables and database constraints.
- Database modules create the engine and one async session per request.

The `Inventory` model uses `Numeric(12, 2)` so prices keep exact decimal cents.
Database constraints prevent blank names, negative values, and status/quantity
mismatches even when data is written outside the API. `server_default` values
also make direct database inserts consistent, while `expire_on_commit=False`
keeps committed ORM objects readable without an unexpected extra query.

## Migrations

Apply pending migrations:

```bash
alembic upgrade head
```

After changing a model, generate and review a migration:

```bash
alembic revision --autogenerate -m "describe the schema change"
alembic check
```

## Tests

Run integration tests while the configured PostgreSQL database is available:

```bash
pytest
```

This MVP has no authentication or authorization. Keep it on a trusted internal
network until access control is added.
