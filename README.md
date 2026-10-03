# WIT Internal Website

Internal web app for Women in Tech (WIT). Members submit event and finance proposals, reviewers
approve or reject them, and approved events appear on a shared calendar. Admins manage members,
roles and templates.

> **Status:** foundation only. The database schema, auth middleware, routes and page skeletons are
> in place. Most feature logic (login wiring, proposal workflow, calendar data, admin pages) is
> still a `TODO(...)` stub. Search the code for `TODO(` to see what is open.

## Stack

| Part     | Tech                                                         |
| -------- | ------------------------------------------------------------ |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, FullCalendar |
| Backend  | Node.js, Express 5, TypeScript, JWT auth, bcrypt             |
| Database | MySQL, accessed through Prisma 6                             |
| Tooling  | ESLint 9, Prettier                                           |

## Prerequisites

- Node.js 22 (`.nvmrc` pins it; `nvm use` picks it up)
- npm
- A local MySQL server on port 3306, with an empty database for development

## Local setup

1. Clone the repo and enter it.
2. Create an empty MySQL database (for example `wit_dev`) in your MySQL client:
   `CREATE DATABASE wit_dev;`
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
   cp .env.example .env
   npm run dev              # http://localhost:5173
   ```
5. Check it works: `http://localhost:4000/health` should show `OK`, and the frontend should load.

The backend refuses to start if `JWT_SECRET` or `DATABASE_URL` is missing.

## Environment variables

Backend (`backend/.env`, see `backend/.env.example`):

| Variable          | Required | Default                 | Purpose                               |
| ----------------- | -------- | ----------------------- | ------------------------------------- |
| `DATABASE_URL`    | yes      |                         | MySQL connection string               |
| `JWT_SECRET`      | yes      |                         | Signs login tokens                    |
| `PORT`            | no       | `4000`                  | API port                              |
| `CORS_ORIGIN`     | no       | `http://localhost:5173` | Frontend origin allowed by CORS       |
| `SEED_DEV_PASSWORD` | no     | built-in dev value      | Password given to seeded users        |

Frontend (`frontend/.env`): `VITE_API_BASE_URL` (default `http://localhost:4000`).

Never commit `.env` files. Only `.env.example` files are tracked.

## Seed data (development only)

`npm run db:seed` is idempotent (safe to run again) and refuses to run when `NODE_ENV=production`.
It creates the 5 roles and these users, all with the same dev-only password
(`DevOnly-ChangeMe-123` unless `SEED_DEV_PASSWORD` is set):

| Email                  | Roles                            |
| ---------------------- | -------------------------------- |
| `admin@wit.local`      | Admin                            |
| `requestor@wit.local`  | Requestor                        |
| `pillarlead@wit.local` | PillarLead                       |
| `approver@wit.local`   | Approver                         |
| `viewer@wit.local`     | Viewer                           |
| `multi@wit.local`      | Requestor, PillarLead, Approver  |

Never seed a shared or production database.

## Scripts

Run from `backend/` or `frontend/`.

| Script                | Backend | Frontend | What it does                                   |
| --------------------- | :-----: | :------: | ---------------------------------------------- |
| `npm run dev`         |   yes   |   yes    | Start the dev server                           |
| `npm run build`       |   yes   |   yes    | Production build                               |
| `npm run typecheck`   |   yes   |   yes    | TypeScript check, no output                    |
| `npm run lint`        |   yes   |   yes    | ESLint                                         |
| `npm run lint:fix`    |   yes   |   yes    | ESLint with auto-fix                           |
| `npm run format`      |   yes   |   yes    | Prettier, writes changes                       |
| `npm run format:check`|   yes   |   yes    | Prettier, check only                           |
| `npm run db:migrate`  |   yes   |          | `prisma migrate dev`                           |
| `npm run db:seed`     |   yes   |          | `prisma db seed`                               |
| `npm run db:reset`    |   yes   |          | `prisma migrate reset` (see below)             |

Before opening a PR, run `npm run typecheck && npm run lint && npm run build` in each package you changed.

## Resetting your database

`npx prisma migrate reset` (also `npm run db:reset`) **drops all tables and all data** in the
database named in `DATABASE_URL`, re-applies every migration, and re-runs the seed.
Use it only on your own local development database, never on a shared or production one.
Do this after pulling a PR that changes the schema.

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
