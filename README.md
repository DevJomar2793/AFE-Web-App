# AFE Web App

Adamos Fresh Eggs combines a public Next.js storefront, a responsive inventory
workspace, and a FastAPI inventory service backed by PostgreSQL.

## Project structure

```text
backend/
  app/routes/       FastAPI endpoints and their database operations
  app/config.py     Environment settings
  app/database.py   Database engine and sessions
  app/models.py     SQLAlchemy database models
  app/schemas.py    Pydantic request and response schemas
  alembic/          Database migrations
  tests/            API integration tests
frontend/
  app/              Next.js pages, layout, metadata, and global styles
  components/       Storefront and inventory components
  lib/api.ts        All typed FastAPI requests and response parsing
  lib/local-inventory.ts  Browser-local overview demo data
  public/           Storefront images and icons
mobile/
  App.tsx           Minimal Expo and React Native entry component
  app.json          Expo application configuration
```

## Data behavior

The inventory table and the Add Item form read and write PostgreSQL through
`GET /api/v1/inventory/get-item` and `POST /api/v1/inventory/add-stock`.
Inventory quantity and price edits use `PATCH /api/v1/inventory/{inventory_id}`
and leave item names, return counts, and historical sales unchanged.

The backend stores one sale transaction per customer purchase. A sale can have
multiple item lines, and each line keeps its own unit-price snapshot. Creating
or editing a sale adjusts every linked inventory quantity atomically through
the sales API. Removing a sale returns every sold quantity to inventory before
deleting the transaction.

Returns are available through `GET /api/v1/returns/get-returns` and
`POST /api/v1/returns/add-returns`. Recording a return stores its customer and
reason while incrementing the related inventory `returns_count` atomically;
the inventory quantity is unchanged.

The Overview, Inventory, Activity, and Returns views use database records.

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
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_BACKEND_API_URL` in `.env.local` tells browser components where
FastAPI is running. Because requests go directly from the browser to FastAPI,
the frontend origin must also be listed in the backend's
`CORS_ALLOWED_ORIGINS` setting.

Visit `http://localhost:3000` for the storefront and
`http://localhost:3000/dashboard` for the inventory workspace.

### Mobile development

The React Native app uses Expo and requires Node.js 24 LTS. Install its
dependencies, create its environment file, and start the Expo development
server:

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

`EXPO_PUBLIC_BACKEND_API_URL` connects the Inventory screen to FastAPI. Use the
address that matches where the app runs:

```text
Physical phone:   http://YOUR_COMPUTER_LAN_IP:8000
iOS simulator:    http://127.0.0.1:8000
Android emulator: http://10.0.2.2:8000
```

For a physical phone, run FastAPI with `uvicorn app.main:app --reload --host
0.0.0.0`, and keep the phone and computer on the same network. Local HTTP is
for development; use HTTPS for a deployed mobile application.

Install Expo Go on an Android or iOS phone, connect the phone and development
machine to the same network, then scan the QR code shown in the terminal.

### Standalone Android APK

The production APK is built with EAS Build and does not require Expo Go. Its
production profile embeds the live HTTPS backend URL:

```text
https://atbackend-web-app-afe.onrender.com
```

Before building, confirm the live backend and database are available. The APK
uses this live backend only; it does not use values from local mobile `.env`
files.

Build the APK on EAS:

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile production
```

When the build finishes, open the EAS build URL printed in the terminal and
download the APK. Transfer it to an Android device, open it from the Files app,
allow installs from that source when Android asks, then install it directly.

To install over USB with Android Platform Tools:

```bash
adb install -r path/to/afe-mobile.apk
```

After installation, open the app without Expo Go and verify that inventory,
sales, and returns load from the live database. Test a non-production-critical
record first, then confirm the change appears in the live backend.

## Environment variable security

Real `.env` files are local configuration and must never be committed. Only
the `.env.example` templates belong in Git. Keep production values in the
environment-variable settings provided by your hosting platform instead of in
repository files.

- `DATABASE_PASSWORD` is private and belongs only in FastAPI's server
  environment.
- `NEXT_PUBLIC_BACKEND_API_URL` is public because Next.js includes
  `NEXT_PUBLIC_` values in browser JavaScript.
- `EXPO_PUBLIC_BACKEND_API_URL` is public because Expo includes
  `EXPO_PUBLIC_` values in the installed application.
- Never put passwords, private API keys, access tokens, or signing keys in a
  `NEXT_PUBLIC_` or `EXPO_PUBLIC_` variable.
- Use separate development, preview, and production values in Vercel, the
  backend hosting platform, and EAS.

If a credential is committed accidentally, rotate or revoke it immediately.
Adding the file to `.gitignore` does not remove it from existing Git history.
After rotation, remove it from history with `git-filter-repo` and force-push
the rewritten branches.

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

cd ../mobile
npx tsc --noEmit
npx expo-doctor
```

The Google fonts used by the frontend are downloaded during a production build,
so `npm run build` needs network access when those fonts are not already cached.
