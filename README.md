# WIT Internal Website

Internal web app for Women in Tech (WIT). Members submit event and finance proposals, reviewers
approve or reject them, and approved events appear on a shared calendar. Admins manage members,
roles and templates.

> **Status:** foundation only. The database schema, auth middleware, routes and page skeletons are
> in place. Most feature logic (login wiring, proposal workflow, calendar data, admin pages) is
> still a `TODO(...)` stub. Search the code for `TODO(` to see what is open.

## Stack

| Part     | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, FullCalendar |
| Backend  | Node.js, Express 5, TypeScript, JWT auth, bcrypt                     |
| Database | MySQL, accessed through Prisma 6                                     |
| Tooling  | ESLint 9, Prettier                                                   |

## Prerequisites

- Node.js 22 (`.nvmrc` pins it; `nvm use` picks it up)
- npm
- A local MySQL 8 server running on port 3306 and a MySQL user that can create databases (the examples use `root`). Install and start it however you prefer.

## Local setup

1. Clone the repo and enter it:
   ```bash
   git clone https://github.com/sabrinalxt/wit-internal-website
   cd wit-internal-website
   nvm use        # optional, picks Node 22 from .nvmrc
   ```
2. Choose a database name, for example `wit_dev`. You don't need to create it:
   `npm run db:migrate` creates it if it's missing. (If you'd rather create it yourself, run
   `CREATE DATABASE wit_dev;` in any MySQL client, such as MySQL Workbench or TablePlus.)
3. Backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env     # then edit .env: DATABASE_URL and JWT_SECRET
   npx prisma generate
   npm run db:migrate       # applies the migrations to your database
   npm run db:seed          # adds roles and sample users
   npm run dev              # http://localhost:4000
   ```
4. Frontend (in a second terminal):

   ```bash
   cd frontend
   npm install
   cp .env.example .env     # then edit .env (see below)
   npm run db:migrate       # creates the database if needed, applies migrations and seeds it
   npm run dev              # http://localhost:5173
   ```

   Edit `backend/.env` before running `db:migrate`:
   - `DATABASE_URL`: replace `USER`, `PASSWORD` and `DATABASE_NAME` with your own values. If the password has special characters (`@`, `/`, `:`, `#`, `?`, `%`), URL-encode them (for example `@` becomes `%40`).
   - `JWT_SECRET`: replace the placeholder with a random string. Generate one with `openssl rand -hex 32`. Don't keep the placeholder.

5. Check it works: `http://localhost:4000/health` should show `OK`, and the frontend should load.

The backend refuses to start if `JWT_SECRET` or `DATABASE_URL` is missing.

## Troubleshooting

| Symptom                                                             | Likely cause                                                                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Missing required environment variable JWT_SECRET`                  | `backend/.env` is missing, or `JWT_SECRET` isn't set. Run `cp .env.example .env` in `backend/`.             |
| ``Unknown authentication plugin `sha256_password` ``                | `DATABASE_URL` still has the `USER`/`PASSWORD` placeholders, or the user doesn't exist.                     |
| ``Can't reach database server at `...` `` with an odd host          | The password in `DATABASE_URL` has special characters that need URL-encoding.                               |
| Port 4000 or 5173 already in use                                    | Stop the other process, or set `PORT` in `backend/.env` (and `CORS_ORIGIN` / `VITE_API_BASE_URL` to match). |
| `git status` shows modified `package-lock.json` after `npm install` | Use Node 22 (`nvm use`) and pull the latest `main`.                                                         |

## Environment variables

Backend (`backend/.env`, see `backend/.env.example`):

| Variable            | Required | Default                 | Purpose                         |
| ------------------- | -------- | ----------------------- | ------------------------------- |
| `DATABASE_URL`      | yes      |                         | MySQL connection string         |
| `JWT_SECRET`        | yes      |                         | Signs login tokens              |
| `PORT`              | no       | `4000`                  | API port                        |
| `CORS_ORIGIN`       | no       | `http://localhost:5173` | Frontend origin allowed by CORS |
| `SEED_DEV_PASSWORD` | no       | built-in dev value      | Password given to seeded users  |

Frontend (`frontend/.env`): `VITE_API_BASE_URL` (default `http://localhost:4000`).

Never commit `.env` files. Only `.env.example` files are tracked.

## Seed data (development only)

`npm run db:seed` is idempotent (safe to run again) and refuses to run when `NODE_ENV=production`.
It creates the 5 roles and these users, all with the same dev-only password
(`DevOnly-ChangeMe-123` unless `SEED_DEV_PASSWORD` is set):

| Email                  | Roles                           |
| ---------------------- | ------------------------------- |
| `admin@wit.local`      | Admin                           |
| `requestor@wit.local`  | Requestor                       |
| `pillarlead@wit.local` | PillarLead                      |
| `approver@wit.local`   | Approver                        |
| `viewer@wit.local`     | Viewer                          |
| `multi@wit.local`      | Requestor, PillarLead, Approver |

Never seed a shared or production database.

## Scripts

Run from `backend/` or `frontend/`.

| Script                 | Backend | Frontend | What it does                                  |
| ---------------------- | :-----: | :------: | --------------------------------------------- |
| `npm run dev`          |   yes   |   yes    | Start the dev server                          |
| `npm run build`        |   yes   |   yes    | Production build                              |
| `npm run typecheck`    |   yes   |   yes    | TypeScript check, no output                   |
| `npm run lint`         |   yes   |   yes    | ESLint                                        |
| `npm run lint:fix`     |   yes   |   yes    | ESLint with auto-fix                          |
| `npm run format`       |   yes   |   yes    | Prettier, writes changes                      |
| `npm run format:check` |   yes   |   yes    | Prettier, check only                          |
| `npm run db:migrate`   |   yes   |          | `prisma migrate dev`                          |
| `npm run db:seed`      |   yes   |          | `prisma db seed`                              |
| `npm run db:reset`     |   yes   |          | `prisma migrate reset` (see below)            |
| `npm start`            |   yes   |          | Run the built backend (`npm run build` first) |

Before opening a PR, run `npm run typecheck && npm run lint && npm run build` in each package you changed.

## Resetting your database

`npx prisma migrate reset` (also `npm run db:reset`) **drops all tables and all data** in the
database named in `DATABASE_URL`, re-applies every migration, and re-runs the seed.
Use it only on your own local development database, never on a shared or production one.
After pulling a PR that changes the schema, try `npm run db:migrate` first. Reset only if it fails or the PR says the migration history was replaced.

## Folder layout

```
backend/
  prisma/            schema.prisma, migrations/, seed.ts
  src/
    index.ts         app setup and route mounting
    config/env.ts    loads and validates environment variables
    middleware/      auth, role checks, central error handler
    routes/          *.routes.ts   (HTTP layer)
    services/        *.service.ts  (database logic)
    prisma/client.ts shared Prisma client
frontend/
  src/
    main.tsx         router
    pages/           one file per page
    components/      Layout, NavBar, ProtectedRoute, ui/
    api/client.ts    all calls to the backend
docs/                ARCHITECTURE.md, ONBOARDING.md
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). New here? Start with
[docs/ONBOARDING.md](docs/ONBOARDING.md).

## Branching and pull requests

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: never push to `main`, branch as
`type/short-description`, use conventional commits, open a PR with the template, get a review.
