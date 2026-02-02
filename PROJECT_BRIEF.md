# MyBoost Admin — Project Brief

## Executive Summary

**MyBoost Admin** is an internal and client-facing **MSP (Managed Service Provider) reporting platform**. It aggregates IT and security data from third-party tools (SentinelOne, N-able RMM), exposes them via JWT-protected REST APIs, and serves two React dashboards: one for internal staff (“Coffee”) and one for end clients (“Boost Coffee”). The backend is Django 5.2 with MongoDB; the frontend is React 19 + TypeScript + Vite, bundled and served through Django templates via `django-vite`. The application is deployable to **Google App Engine** (standard environment).

---

## 1. What the Project Does

### 1.1 Core Purpose

- **Unified reporting**: Pull data from **SentinelOne** (EDR/agents, threats) and **N-able RMM** (clients, sites, servers, workstations, devices, checks, outages, performance, etc.) into one place.
- **Two audiences**:
  - **Internal** (`/coffee/`): Admin/staff view of all clients and reporting data.
  - **Client-facing** (`/boostcoffee/`): Per-client view so end customers can see their own MSP report (backup, security, network, devices, tickets, patching).
- **Provider management**: Store and expose **providers**, **connections**, and **connection configs** (URLs, API keys, config name/value) so integrations can be driven from configuration rather than hard-coded endpoints only.

### 1.2 Main User Flows

1. **Staff**: Log in (JWT) → open Coffee dashboard → see customer summaries, drill into Security, Backup, Network, Devices, Ticketing, Patching.
2. **Client**: Log in (JWT) → open Boost Coffee dashboard → see the same report structure scoped to their organisation.
3. **API consumers**: Obtain JWT via `/api/token/`, then call reporting and provider APIs to build custom tools or sync data elsewhere.

---

## 2. Architecture Overview

### 2.1 High-Level Stack

| Layer        | Technology |
|-------------|------------|
| Backend     | Django 5.2, Django REST Framework, SimpleJWT, drf-yasg |
| Database    | MongoDB (primary; `django_mongodb_backend`) |
| Migrations  | Custom Mongo migrations under `mongo_migrations/` |
| Frontend    | React 19, TypeScript, Vite, TanStack Query, React Router |
| UI          | shadcn/ui–style components (e.g. Card, Chart, Table, Dialog) |
| Build       | Vite builds → `static/frontend`; Django serves via `django-vite` |
| Deployment  | Google App Engine (Python 3.13, Gunicorn), static files from `/static` |

### 2.2 Repository Layout (Concise)

- **`myboost/`** — Django project: settings, root URLs, WSGI. Uses `django-environ` for `.env` (DB, Redis, Firebase, GMaps, etc.).
- **`provider/`** — Provider/connection/config models (SQL-style via Django ORM); REST API to list providers and their connections/configs.
- **`reporting/`** — Reporting APIs + **Coffee** dashboard:
  - **`reporting/core/`** — Sync and data modules: `sync.py` (SentinelOne + N-able RMM), `clients.py`, `agents.py`, `sites.py`, `servers.py`, `workstations.py`, `access.py`, `devices.py`, `checks.py`, `outages.py`.
  - Templates: `reporting_dashboard.html` (mounts `companies_report.tsx` → Coffee app).
- **`client_reporting/`** — Client-facing **Boost Coffee** dashboard:
  - Single template `client_report.html` (mounts `client_report.tsx` → Client app).
  - No dedicated client_reporting models in codebase; intended for per-client or tokenised access (e.g. UUID/ref code from `reporting.models.Reporting`).
- **`frontend/`** — Vite app with two entry points:
  - **`companies_report.tsx`** → `CoffeeApp` (routes under `/coffee/`).
  - **`client_report.tsx`** → `ClientApp` (routes under `/boostcoffee/`).
- **`mongo_migrations/`** — Mongo migration packages for `admin`, `auth`, `contenttypes`.

---

## 3. Backend in Detail

### 3.1 Authentication & API Security

- **JWT**: Access/refresh tokens via `POST /api/token/`, `/api/token/refresh/`, `/api/token/verify/`.
- **DRF**: Default authentication is `JWTAuthentication`; APIs (except token and docs) expect `Authorization: Bearer <access_token>`.
- **CORS**: Allowed origins include `http://localhost:5173` and the App Engine URL for the Vite dev server and production frontend.

### 3.2 Provider App

- **Models**: `Provider` (name, slug), `ProviderConnection` (provider, name, url, api_key), `ProviderConnectionConfig` (connection, name, config_name, config_value).
- **API**: `GET /api/provider/` returns providers with nested connections and configs (for use by sync or other services). Stored in Django’s DB (provider migrations are under `provider/migrations/`).

### 3.3 Reporting App

- **Sync** (`reporting/core/sync.py`):
  - **SentinelOne**: Hard-coded base URL and API key; fetches threats and agents (limit 1000, sorted by createdAt).
  - **N-able RMM**: Hard-coded URL and API key; fetches clients, sites per client, devices (servers/workstations/mobile) per client, failing checks per client, servers/workstations/agentless assets per site, plus helpers for checks, outages, performance history, Exchange storage, AV products, hardware/software by asset.
  - **`GET /api/reporting/sync/`**: Calls both integrations and returns a single JSON payload `{ "sentinelone": {...}, "nablermm": {...} }`. No persistence of this response in the codebase; it’s on-demand aggregation.
- **Other reporting endpoints**:  
  `clients`, `agents`, `sites`, `servers`, `workstations`, `agentless-access`, `devices`, `devices/monitoring`, `devices/performance-history`, `checks`, `checks/<status>/`, `outages/<status>/` are wired in `myboost/urls.py` to views in `reporting.core`. In the current codebase, several of these (e.g. `list_clients`, `list_agents`) return placeholder responses (e.g. `"Done"`) rather than data from sync or DB. The **sync** endpoint is the one that actually pulls from SentinelOne and N-able.
- **Reporting models** (`reporting/models.py`): Rich domain models stored in MongoDB (e.g. `Customer`, `BackupDevice`, `Device`, `Patch`, `NetworkDevice`, `NetworkEvent`, `PatchData`, `DevicePatchStatus`, `AntivirusData`, `SentinelOneData`, `SecuritySummary`, `TicketData`, `BranchTicketStats`, `Reporting`). These support the data shapes the frontend and future APIs can use; the `Reporting` model (customer, `uuid_field`, `ref_code`) is intended for client-facing report sharing (e.g. link by ref or UUID).

### 3.4 Client Reporting App

- Serves the **Boost Coffee** UI only: Django renders `client_report.html`, which loads the Vite bundle for `client_report.tsx` (ClientApp).
- Routes under `/boostcoffee/` are handled by the React app; Django uses a catch-all so that client-side routes work without extra URL config.
- No server-side logic in client_reporting beyond template rendering and CSRF/static context.

### 3.5 API Documentation

- **Swagger**: `/swagger/`
- **ReDoc**: `/redoc/`
- Schema is built with drf-yasg; public (no auth required for docs).

---

## 4. Frontend in Detail

### 4.1 Build & Delivery

- **Vite** config has two entry points: `companies_report.tsx`, `client_report.tsx`; `base: "/static/"` and `manifest: true` for `django-vite`.
- **Django**: In production, assets are built into `static/frontend` and served at `/static/`; templates use `{% vite_asset 'src/companies_report.tsx' %}` or `client_report.tsx` and optional HMR client in debug.
- **Makefile**: `deploy` runs `collectstatic` and `gcloud app deploy`; README describes building the frontend with `npm run build -- --outDir ../static/frontend` before collectstatic.

### 4.2 Coffee App (Internal)

- **Entry**: `companies_report.tsx` → `CoffeeApp`; root DOM node `#coffee-root` in `reporting_dashboard.html`.
- **Routes**: `/coffee` (Index), `/coffee/login`, `/coffee/dashboard`, `/coffee/security`, `/coffee/backup`, `/coffee/network`, `/coffee/devices`, `/coffee/tickets`, `/coffee/patching`, plus catch-all to NotFound.
- **Auth**: Token in `localStorage`; Index redirects to login or dashboard; dashboard and detail pages guard on token and redirect to `/coffee/login` if missing.
- **Data**: Dashboard and all detail pages load data from the **Django API** (e.g. `reporting/dashboard/customers/`, `reporting/devices/`, `reporting/agents/`, `reporting/checks/`, `reporting/backups/`). Base URL from `VITE_API_URL`; `services/api.ts` uses axios with JWT interceptors and token refresh.

### 4.3 Client App (Boost Coffee)

- **Entry**: `client_report.tsx` → `ClientApp`; root DOM node `#client-root` in `client_report.html`.
- **Routes**: Same structure under `/boostcoffee/` (Index, Login, Dashboard, Security, Backup, Network, Devices, Tickets, Patching, NotFound).
- **Auth**: Same pattern (localStorage token; Index redirects to `/boostcoffee/login` or `/boostcoffee/dashboard`).
- **Scope**: Intended to show a single client’s data; differentiation from Coffee is by route and (in future) by API scoping or token (e.g. UUID/ref from `Reporting`).

### 4.4 Shared Frontend Pieces

- **UI**: `components/ui/` (shadcn-style: cards, charts, tables, forms, dialogs, etc.).
- **State/API**: TanStack Query, axios instance with JWT and refresh in `services/api.ts`.
- **Auth**: `authenticate.service.ts` and token handling in api.ts; login pages post to backend token endpoint and store tokens.

---

## 5. Data Flow Summary

1. **Config**: Providers and connections are stored in Django (provider app) and exposed at `GET /api/provider/`.
2. **Sync**: A call to `GET /api/reporting/sync/` triggers live fetch from SentinelOne and N-able RMM (hard-coded credentials in `sync.py`); response is returned as JSON. No DB write of this aggregate in the current sync implementation.
3. **Reporting APIs**: Endpoints like `/api/reporting/clients/`, `/api/reporting/agents/`, etc., are stubbed in the codebase (e.g. return `"Done"`). Full integration would either call sync internally, cache sync results, or read from MongoDB reporting models.
4. **Frontend**: Coffee and Client apps authenticate via JWT, then load dashboard data from Django reporting APIs (dashboard/customers, devices, agents, checks, backups, sync).

---

## 6. Deployment & Environment

- **Platform**: Google App Engine standard (`app.yaml`), Python 3.13, Gunicorn (timeout 1200), port 8080.
- **Static**: All `/static` requests served by App Engine from the `static` directory; Vite output must be in `static/frontend` and then `collectstatic` run before deploy.
- **Secrets**: `app.yaml` contains example env vars (DB, Firebase, GMaps, Redis); README and app comments warn to move secrets to a secure store (e.g. Secret Manager) for production.
- **Env**: Backend uses `.env` (DB URL, port, database, user, password, optional Redis, Firebase, GMAPS_API_KEY). Frontend uses `frontend/.env` (e.g. `VITE_API_URL=http://localhost:8000/api` for local).

---

## 7. Notable Conventions & Caveats

- **Mongo migrations**: Custom `MIGRATION_MODULES` point Django to `mongo_migrations.admin`, `auth`, `contenttypes`; provider app uses standard `provider/migrations/`.
- **Sync credentials**: SentinelOne and N-able API keys/URLs are hard-coded in `reporting/core/sync.py`; README states they should be moved to environment or provider config for production.
- **Single data source**: Frontend dashboards use only Django reporting APIs; sync is the main source of live RMM/SentinelOne data, exposed via cached endpoints (dashboard/customers, devices, agents, checks, etc.).
- **Client vs internal**: Same React app structure for Coffee and Boost Coffee; distinction is base path (`/coffee` vs `/boostcoffee`) and intended API/data scoping for clients (e.g. via `Reporting.uuid_field` / `ref_code` or future token-per-client).

---

## 8. Summary Table

| Aspect            | Description |
|-------------------|------------|
| **Project name**  | MyBoost Admin (backend for MyBoost MSP reporting) |
| **Role**          | Aggregate MSP data (SentinelOne, N-able RMM), expose APIs, serve internal and client dashboards |
| **Backend**       | Django 5.2, DRF, JWT, MongoDB, optional Redis |
| **Frontend**      | React 19, TypeScript, Vite, two apps: Coffee (internal), Boost Coffee (client) |
| **Integrations**  | SentinelOne (agents, threats), N-able RMM (clients, sites, devices, checks, outages, etc.) |
| **Hosting**       | Google App Engine (Python 3.13, Gunicorn) |
| **Key URLs**      | `/coffee/` — internal dashboard; `/boostcoffee/` — client dashboard; `/api/` — REST + Swagger/ReDoc |

This brief reflects the codebase at the time of analysis; implementation details (e.g. full wiring of `list_clients`/agents to sync or DB) may be completed or extended in other branches or environments.
