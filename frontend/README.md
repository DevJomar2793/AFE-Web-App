# AFE Frontend

Next.js App Router frontend for the Adamos Fresh Eggs storefront and inventory
workspace.

## Development

Start the FastAPI backend on `http://127.0.0.1:8000`, then run:

```bash
npm ci
cp .env.example .env.local
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

## API connection

All browser requests are defined in `lib/api.ts` and call FastAPI directly.
Set the backend address in `.env.local`:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8000
```

The backend's configured CORS origins must include the frontend origin.

API responses use `cache: "no-store"`, so inventory rows and activity requests
reflect the latest database response.

## Frontend organization

- `app/` contains only Next.js routes, layout, metadata, and global styles.
- `components/storefront/` contains the public website and its small hooks.
- `components/inventory/` contains dashboard screens, modals, and data hooks.
- `lib/api.ts` contains every FastAPI URL, request function, API type, and
  response parser.
- `lib/local-inventory.ts` contains the browser-local Overview demo state.

The database inventory table is intentionally separate from the browser-local
Overview metrics, recent activity, and Restock form. The Inventory, Activity,
and Returns views use the database. See the root README for the current MVP data
behavior and production limitations.

The Inventory view updates an item's current quantity and price through
`PATCH /api/v1/inventory/{inventory_id}`. The edit form does not change item
names, return counts, or historical sale records.

The New Sale form stores sales through `POST /api/v1/sales/add-sales` using
database inventory records. Transaction Activity loads those records from
`GET /api/v1/sales/get-sales` and updates existing records through
`PATCH /api/v1/sales/{sale_id}`. Sales are not duplicated in browser storage;
the Overview metrics and Recent Activity card remain local-only.

The Returns page loads database return history from
`GET /api/v1/returns/get-returns` and submits new returns directly to
`POST /api/v1/returns/add-returns`.
