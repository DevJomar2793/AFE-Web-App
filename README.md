# AFE Web App

Adamos Fresh Eggs combines a public Next.js storefront, a responsive inventory
workspace, and a FastAPI inventory service backed by PostgreSQL.

## Project structure

```text
backend/
  app/api/          FastAPI route registration and route handlers
  app/models/       SQLAlchemy database models
  app/schemas/      Pydantic request and response schemas
  app/services/     Inventory queries and business operations
  alembic/          Database migrations
  tests/            API integration tests
frontend/
  app/              Next.js pages and server-side API proxy
  components/       UI components and feature components
  lib/              Browser-local inventory state and shared utilities
  services/         Typed frontend API functions
  public/           Images, manifest, and service worker
```

## Data behavior

The inventory table and the Add Item form read and write PostgreSQL through
`GET /api/v1/inventory/get-item` and `POST /api/v1/inventory/add-stock`.

The backend also stores sales through `GET /api/v1/sales/get-sales` and
`POST /api/v1/sales/add-sales`. Each sale references an inventory item and
deducts its quantity atomically.

Returns are available through `GET /api/v1/returns/get-returns` and
`POST /api/v1/returns/add-return`. Recording a return stores its customer and
reason while restoring the related inventory quantity atomically.

The Transaction Activity page merges database sales with the existing local
activity. The sale form, returns, restocks, and Overview activity remain part of
the browser-local MVP. They are stored under `afe-inventory-v1` in
`localStorage` and synchronize only between tabs on the same device.

This split preserves the current application behavior, but it is not suitable
for multi-user production use. Authentication and database-backed transaction
records should be added before exposing the workspace publicly.

## Local development

Set up and run the backend first:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Then run the frontend in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Visit `http://localhost:3000` for the storefront and
`http://localhost:3000/dashboard` for the inventory workspace.

## Validation

Run these commands before submitting changes:

```bash
cd backend
source .venv/bin/activate
pytest
alembic check

cd ../frontend
npm run lint
npm run build
```

The Google fonts used by the frontend are downloaded during a production build,
so `npm run build` needs network access when those fonts are not already cached.
