# AFE Web App

Adamos Fresh Eggs combines a public storefront with a responsive inventory and
sales workspace. Open `/dashboard` to monitor sales, stock quantities, low-stock
items, returns, and recent inventory activity.

## Inventory workspace

- Record sales, returns, and incoming stock from desktop or mobile.
- See dashboard totals and item quantities update immediately.
- Search inventory by product name, SKU, or category.
- Install the dashboard as a standalone mobile Progressive Web App.
- Continue using previously loaded screens offline.

The current MVP stores transactions in the browser under `afe-inventory-v1` and
synchronizes changes between open tabs on the same device. Clearing site data
resets the workspace to the starter inventory in `frontend/lib/inventory.ts`.
Multi-user and cross-device synchronization require a shared database before
production rollout.

## Local development

```bash
cd frontend
npm ci
npm run dev
```

Visit `http://localhost:3000` for the storefront or
`http://localhost:3000/dashboard` for inventory operations. Run `npm run lint`
and `npm run build` before submitting changes.
