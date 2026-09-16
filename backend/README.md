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

Set `JWT_SECRET_KEY` to a long, random value. The backend will not start without
it. `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` create the first staff
account after the users migration has been applied. Set both values together;
after the account exists, changing those variables does not change its password,
but that email is promoted to administrator when the backend starts.
There is no public registration endpoint. The configured initial admin can use
the protected registration API to create staff accounts.

Keep `DATABASE_SSL=false` for local PostgreSQL. Set it to `true` when using a
hosted database such as Supabase so database traffic is encrypted.

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
PATCH /api/v1/inventory/{inventory_id}
GET  /api/v1/sales/get-sales
POST /api/v1/sales/add-sales
POST /api/v1/sales/add-sales-batch
PATCH /api/v1/sales/{sale_id}
GET  /api/v1/returns/get-returns
POST /api/v1/returns/add-returns
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/register
```

## Login API

Log in with the initial admin email and password:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

The response contains an 8-hour bearer token. Verify it with:

```bash
curl http://127.0.0.1:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

An administrator can create a regular staff account with the same bearer token:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"at-least-8-characters"}'
```

Only an administrator can call this endpoint. It creates staff accounts only;
it cannot create another administrator.

Inventory, sales, and returns routes require a valid bearer token. Send the
`Authorization: Bearer YOUR_ACCESS_TOKEN` header with each request after login.

Create an item without putting an ID in the URL or request body. PostgreSQL
generates the ID:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/inventory/add-stock \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item": "Large eggs", "quantity": 5, "price": "250.00"}'
```

`status` is optional. It defaults to `in_stock` when quantity is positive and
`out_of_stock` when quantity is zero.

Update an inventory item's current quantity and price:

```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/inventory/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 12, "price": "275.00"}'
```

The update marks zero quantity as `out_of_stock` and restores an out-of-stock
item to `in_stock` when its quantity becomes positive. Existing `low_stock`
status is preserved while quantity remains positive.

Create a sale with the related inventory ID, a positive whole quantity, and a
customer name:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/add-sales \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inventory_id": 1, "quantity": 2, "customer_name": "Maria Santos"}'
```

Creating a sale and deducting inventory happen in one database transaction.
The API returns `404` when the item does not exist and `409` when there is not
enough stock. The inventory row is locked during the operation to prevent two
simultaneous sales from overselling it.

Create one sale containing multiple inventory items:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/add-sales-batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Maria Santos","items":[{"inventory_id":1,"quantity":2},{"inventory_id":2,"quantity":3}]}'
```

The batch endpoint creates one sale transaction with multiple item rows. If any
item is missing or does not have enough stock, neither the sale nor any
inventory deductions are saved. Each inventory item may appear only once.

List sales, newest first, with:

```bash
curl http://127.0.0.1:8000/api/v1/sales/get-sales \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Update every item in a sale using the item-line IDs returned by the API:

```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/sales/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":11,"price":"275.00","quantity":3},{"id":12,"price":"180.00","quantity":2}]}'
```

Products cannot be added, removed, or replaced while editing. Quantity changes
adjust each linked inventory item by the difference, and price changes update
that inventory item's current regular price. The API returns `409` if an
additional quantity is unavailable and rolls back every change.

Create a return with the related inventory ID, a positive whole quantity, a
customer name, and a reason:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/returns/add-returns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inventory_id": 1, "quantity": 1, "customer_name": "Maria Santos", "reason": "Damaged tray"}'
```

Creating a return and incrementing `returns_count` happen in one database
transaction. The API returns `404` when the item does not exist. Inventory rows
are locked so simultaneous returns cannot overwrite each other's return counts.

List returns, newest first, with:

```bash
curl http://127.0.0.1:8000/api/v1/returns/get-returns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Code organization

- `app/main.py` creates FastAPI and registers the feature routes.
- `app/routes/` keeps each endpoint beside its database operation and error
  handling, grouped into health, inventory, sales, and returns files.
- `app/schemas.py` defines all API request and response shapes.
- `app/models.py` defines all PostgreSQL tables and constraints.
- `app/database.py` creates the engine and one async session per request.
- `app/config.py` loads database and CORS settings from the environment.

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

The web dashboard stores its access token only for the current browser session.
Users must sign in again after closing the browser, logging out, or when the
8-hour token expires.
