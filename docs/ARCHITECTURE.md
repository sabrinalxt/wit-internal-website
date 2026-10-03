# Architecture

## Big picture

```
Browser (React, :5173)  --HTTP/JSON-->  Express API (:4000)  --Prisma-->  MySQL
```

- The **frontend** is a single-page React app. All requests to the API go through
  `frontend/src/api/client.ts`. The API base URL comes from `VITE_API_BASE_URL`.
- The **backend** is an Express app. A request goes through: CORS and JSON parsing, a router,
  optional auth middleware, a route handler, a service (database access via Prisma), and finally the
  central error handler, which always replies `{ "error": { "message": "..." } }`.
- The **database** is MySQL. The schema lives in `backend/prisma/schema.prisma`, and changes are
  recorded as migrations in `backend/prisma/migrations/`.

## Folder map

| Path                              | What lives there                                        |
| --------------------------------- | ------------------------------------------------------- |
| `backend/src/index.ts`            | Creates the app, mounts routers, installs error handler |
| `backend/src/config/env.ts`       | Loads `.env` once; fails fast if a required value is missing |
| `backend/src/routes/*.routes.ts`  | URL definitions and request handling                    |
| `backend/src/services/*.service.ts` | Database logic called by routes                       |
| `backend/src/middleware/`         | `authenticateToken`, `authorizeRoles`, error handler    |
| `backend/prisma/`                 | Schema, migrations, seed script                         |
| `frontend/src/pages/`             | One component per page                                  |
| `frontend/src/components/`        | Layout, NavBar, ProtectedRoute, shared UI               |
| `frontend/src/main.tsx`           | Route table                                             |

## API routes

| Mount        | State                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| `/health`    | Returns `OK`                                                                 |
| `/auth`      | `POST /auth/login` works with seeded users                                   |
| `/users`     | CRUD; POST/PUT/DELETE need an Admin token; responses never include `password_hash` |
| `/events`    | CRUD; POST/PUT/DELETE need an Admin token; GET is public                     |
| `/proposals` | Returns 501 (`TODO(proposals-api)`); old handlers sit behind that guard      |
| `/templates` | Returns 501 (`TODO(templates-api)`)                                          |

## Authentication

`POST /auth/login` checks the password with bcrypt and returns a JWT (valid for 10 minutes)
containing `userId` and `roles`. Protected routes send it as `Authorization: Bearer <token>`.
`authenticateToken` verifies it, and `authorizeRoles([...])` checks the user has at least one allowed role.

## Data model

| Table                   | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `User`                  | A member. `password_hash` is null until they sign up. Has `created_at`.  |
| `Role`, `UserRole`      | Roles, and which users hold them. A user can hold several roles.         |
| `Proposal`              | An IPA or FA proposal with a status, reviewers and optional parent.      |
| `ProposalStatusHistory` | One row per status change: who, from, to, optional comment, when.        |
| `Event`                 | A calendar event with `start_at`, optional `end_at`, optional proposal.  |
| `Template`              | A document template managed by an admin.                                 |
| `NetworkContact`, `EventContact` | External contacts and which events they are linked to.           |

Details worth knowing:

- IDs are integers.
- `Proposal.parent_proposal_id` links an FA to its IPA (deleting an IPA that has FAs is blocked).
  The rule "an FA must link to an approved IPA" is meant to be enforced in the app
  (`TODO(proposals-api)`), not by the database.
- Deleting a proposal sets `Event.proposal_id` to null and deletes that proposal's history.
- `Event.admin_id` is the admin who created the event. Event clash detection is app-level
  (`TODO(clash-detection)`).

## Roles

| Role       | Intended use                                                  |
| ---------- | ------------------------------------------------------------- |
| Requestor  | Creates and submits proposals                                 |
| PillarLead | First reviewer, chosen per proposal (`pillar_lead_id`)        |
| Approver   | Final reviewer, chosen per proposal (`approver_id`)           |
| Admin      | Manages members, roles, templates and events                  |
| Viewer     | Read-only access                                              |

## Proposal workflow (design, not yet implemented)

`ProposalStatus` values: `DRAFT` -> `SUBMITTED` -> `PILLAR_APPROVED` -> `APPROVED`, or `REJECTED`
(with `rejection_reason`). Each change should add a `ProposalStatusHistory` row. The transitions
and who may perform them are not built yet: see `TODO(proposals-api)`.

## Open work

The code marks unfinished work with `TODO(task-name)`. Run `grep -rn "TODO(" backend/src frontend/src`
to list it.
