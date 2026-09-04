# AFE Frontend

Next.js App Router frontend for the Adamos Fresh Eggs storefront and inventory
workspace.

## Development

Start the FastAPI backend on `http://127.0.0.1:8000`, then run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` for the storefront or
`http://localhost:3000/dashboard` for the inventory workspace.

Useful commands:

```bash
npm run lint
npm run build
npm run start
```

The application uses `next/font` with Google fonts. A production build needs
network access when the font files are not already cached.

## Inventory API

Browser components use the typed functions in `services/inventory-api.ts`.
Those functions currently call the FastAPI inventory endpoints directly. The
configured backend CORS origins must include the frontend origin.

API responses use `cache: "no-store"`, so inventory rows and activity requests
reflect the latest database response.

## Frontend organization

- `app/` contains routes, layouts, global styles, and the API proxy.
- `components/inventory/` contains the inventory feature UI.
- `components/inventory/hooks/` contains inventory-specific React hooks.
- `lib/local-inventory.ts` defines the browser-local transaction state.
- `services/` owns inventory and sales API requests, response validation, and
  API types.

The database inventory table is intentionally separate from the browser-local
overview and transaction activity. See the root README for the current MVP data
behavior and production limitations.

The New Sale form stores sales through `POST /api/v1/sales/add-sales` using
database inventory records. Transaction Activity loads those records from
`GET /api/v1/sales/get-sales`. Sales are not duplicated in browser storage; the
Overview metrics and Recent Activity card remain local-only.
