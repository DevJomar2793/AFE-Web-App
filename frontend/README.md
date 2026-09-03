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
Those functions call the same-origin Next.js route at `/api/v1/inventory`, which
proxies both `GET` and `POST` requests to FastAPI. Keeping the backend URL in the
server-side proxy avoids exposing backend configuration to browser code.

The proxy defaults to `http://127.0.0.1:8000`. Set a different backend with the
server-only environment variable:

```bash
BACKEND_API_URL=https://api.example.com npm run dev
```

API responses are not cached by the proxy or service worker, so inventory rows
reflect the latest database response.

## Frontend organization

- `app/` contains routes, layouts, global styles, and the API proxy.
- `components/inventory/` contains the inventory feature UI.
- `components/inventory/hooks/` contains inventory-specific React hooks.
- `lib/local-inventory.ts` defines the browser-local transaction state.
- `services/inventory-api.ts` owns API requests, response validation, and API
  types.

The database inventory table is intentionally separate from the browser-local
overview and transaction activity. See the root README for the current MVP data
behavior and production limitations.
