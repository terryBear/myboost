# MyBoost Admin Backend

Django 5.2 + MongoDB backend with a React/Vite front-end used to serve internal and client-facing reporting dashboards. The backend exposes JWT-protected APIs for provider integrations and reporting data, while the front-end bundles are delivered through `django-vite` and rendered via Django templates.

## Stack
- Django 5.2 (with `django_mongodb_backend`, DRF, SimpleJWT, drf-yasg)
- MongoDB (primary data store) and optional Redis cache
- React 19 + TypeScript + Vite (bundled to Django via `django-vite`)
- Poetry for Python deps, npm for frontend
- Google App Engine deployment (`app.yaml`, Gunicorn entrypoint)

## Project Layout
- `myboost/` – Django project settings/urls
- `provider/` – Providers, connections, and configs API
- `reporting/` – Reporting APIs + `/coffee` dashboard template
- `client_reporting/` – Client-facing `/boostcoffee` dashboard template
- `frontend/` – React app (Vite) with two entry points: `companies_report.tsx` and `client_report.tsx`
- `assets/`, `static/` – Static assets; `static/frontend` expected to contain Vite build output

## Prerequisites
- Python 3.12+
- Node 20+ and npm
- MongoDB instance
- (Optional) Redis instance if you enable caching
- Poetry installed (`pip install poetry`)

## Environment
Create `.env` in the repo root (loaded by `myboost/settings.py`). Typical values:
```
DEBUG=True
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1

DJANGO_DB_URL=mongodb://localhost
DJANGO_DB_PORT=27017
DJANGO_DB_DATABASE=myboost
DJANGO_DB_USERNAME=your_user
DJANGO_DB_PASSWORD=your_pass

DJANGO_FIREBASE_IMAGE_URL=...
GMAPS_API_KEY=...
REDIS_PASSWORD=...
```
Frontend expects `frontend/.env` with the API base:
```
VITE_API_URL=http://localhost:8000/api
```

## Installation
```
make install
# or
poetry install
cd frontend && npm install
```

## Running Locally
- Backend: `poetry run python manage.py runserver 8000`
- Frontend (Vite HMR): in `frontend`, run `npm run dev -- --host --port 5173`; templates already include the HMR client via `django-vite`.
- Visit dashboards:
  - Admin reporting: `http://localhost:8000/coffee/`
  - Client reporting: `http://localhost:8000/boostcoffee/`
- API examples (JWT-protected unless noted):
  - `POST /api/token/`, `/api/token/refresh/`, `/api/token/verify/`
  - `GET /api/provider/`
  - `GET /api/reporting/sync/` (aggregates SentinelOne + Nable RMM via configured connections)
  - `GET /api/reporting/clients/`, `/agents/`, `/sites/`, `/servers/`, `/workstations/`, `/agentless-access/`, `/devices/`, `/devices/monitoring/`, `/devices/performance-history/`, `/checks/`, `/checks/<status>/`, `/outages/<status>/`
  - Docs: `/swagger/` and `/redoc/`

## Building Frontend Assets
`django-vite` looks for a manifest under `static/frontend`. Build and place assets there before `collectstatic`:
```
cd frontend
npm run build -- --outDir ../static/frontend
cd ..
poetry run python manage.py collectstatic --noinput
```
The Makefile `deploy` target runs the build + collectstatic for you.

## Tests and Lint
- Python tests: `poetry run pytest`
- (Placeholder) Lint hooks are not configured; add your preferred tools under the `check` target in `makefile`.

## Deployment
- Google App Engine standard (`app.yaml`) with Gunicorn entrypoint: `gcloud app deploy`
- Static files are served from `/static`; ensure the Vite build + `collectstatic` step has run.
- Secrets in `app.yaml` are examples only—store them securely before deploying.

## Notes & Caveats
- The reporting sync (`reporting.core.sync`) uses hard-coded API tokens; move these to environment variables before production.
- Mongo migrations are routed to `mongo_migrations/*` (see `MIGRATION_MODULES` in settings).
- `DJANGO_VITE_ASSETS_PATH` is set to `static/frontend`; ensure builds land there so `{% vite_asset %}` resolves correctly.
