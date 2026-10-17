# Proposals API

Base URL (dev): `http://localhost:4000`. Every `/proposals` endpoint requires a signed-in user.

```
Authorization: Bearer <token>        # token from POST /auth/login
Content-Type: application/json       # for requests with a body
```

The current user (id and roles) always comes from the token. Never send a user id to say "who I am".

## Status flow

```
                         submit                    pillar-approve                approve
   (create) ──▶ DRAFT ──────────▶ SUBMITTED ───────────────────▶ PILLAR_APPROVED ──────────▶ APPROVED
                  ▲                  │                                  │
                  │            reject (pillar lead)               reject (approver)
                  │                  ▼                                  ▼
                  └──── submit ─── REJECTED ◀───────────────────────────┘
                      (resubmit, no limit)
```

| Action           | From                | To                | Who (must also hold the role)             |
| ---------------- | ------------------- | ----------------- | ----------------------------------------- |
| `submit`         | `DRAFT`, `REJECTED` | `SUBMITTED`       | the proposal's requestor (`Requestor`)    |
| `pillar-approve` | `SUBMITTED`         | `PILLAR_APPROVED` | the assigned `pillar_lead` (`PillarLead`) |
| `approve`        | `PILLAR_APPROVED`   | `APPROVED`        | the assigned `approver` (`Approver`)      |
| `reject`         | `SUBMITTED`         | `REJECTED`        | the assigned `pillar_lead` (`PillarLead`) |
| `reject`         | `PILLAR_APPROVED`   | `REJECTED`        | the assigned `approver` (`Approver`)      |

- Reject needs a non-empty `comment`. It is stored in `rejection_reason` and in the history.
- Nobody can review their own proposal.
- Submit needs `drive_link`, `pillar_lead` and `approver` to be set.
- Proposal types: `IPA`, `FA`. An FA must have an `APPROVED` IPA (same requestor) as its parent.
- Statuses: `DRAFT`, `SUBMITTED`, `PILLAR_APPROVED`, `APPROVED`, `REJECTED`. Roles: `Requestor`, `PillarLead`, `Approver`, `Admin`, `Viewer`.

## Response shapes

### Proposal (list item)

```json
{
  "proposal_id": 5,
  "proposal_name": "Draft for tests",
  "proposal_type": "IPA",
  "proposal_status": "SUBMITTED",
  "drive_link": "https://drive.google.com/d",
  "rejection_reason": null,
  "date_submitted": "2026-10-17T14:56:47.000Z",
  "date_reviewed": null,
  "parent_proposal_id": null,
  "requestor": { "id": 2, "name": "Riley Requestor" },
  "pillar_lead": { "id": 3, "name": "Parker PillarLead" },
  "approver": { "id": 4, "name": "Avery Approver" }
}
```

`pillar_lead` and `approver` are `null` until assigned. People are only ever `{ id, name }`.
Dates are ISO strings or `null`.

### Proposal detail

The list item plus `parent` and `status_history`. Returned by `GET /proposals/:id`, and by every endpoint that creates or changes a proposal (POST, PUT, and the four transitions).

```json
{
  "proposal_id": 4,
  "proposal_name": "Spring FA",
  "proposal_type": "FA",
  "proposal_status": "SUBMITTED",
  "drive_link": "https://drive.google.com/fa",
  "rejection_reason": null,
  "date_submitted": "2026-10-17T15:10:02.000Z",
  "date_reviewed": null,
  "parent_proposal_id": 3,
  "requestor": { "id": 2, "name": "Riley Requestor" },
  "pillar_lead": { "id": 3, "name": "Parker PillarLead" },
  "approver": { "id": 4, "name": "Avery Approver" },
  "parent": { "id": 3, "name": "Spring IPA", "status": "APPROVED" },
  "status_history": [
    {
      "id": 8,
      "from_status": "DRAFT",
      "to_status": "SUBMITTED",
      "comment": null,
      "created_at": "2026-10-17T15:10:02.121Z",
      "changed_by": { "id": 2, "name": "Riley Requestor" }
    }
  ]
}
```

- `parent` is `null` for an IPA.
- `status_history` is oldest first. It is `[]` for a new draft.
- A rejection's `comment` holds the reviewer's reason.

### Error shape (new routes)

```json
{ "error": { "message": "Cannot approve a proposal in status DRAFT" } }
```

See [Notes for frontend](#notes-for-frontend) for the other error shape.

---

## Endpoints

### GET /proposals

List the proposals the caller may see, newest first (`proposal_id` descending).

- **Who:** any signed-in user. What they see depends on their roles. Several roles give the union with no duplicates.
  - `Requestor`: their own proposals (including drafts).
  - `PillarLead`: proposals where they are the pillar lead, excluding `DRAFT`.
  - `Approver`, `Admin`: all non-`DRAFT` proposals.
  - A user with none of these roles (e.g. `Viewer` only) gets `[]`.
- **Query (optional):** `?status=SUBMITTED` and/or `?type=IPA`
- **Request body:** none

```
GET /proposals?status=SUBMITTED&type=IPA
```

**200**

```json
[
  {
    "proposal_id": 5,
    "proposal_name": "Draft for tests",
    "proposal_type": "IPA",
    "proposal_status": "SUBMITTED",
    "drive_link": "https://drive.google.com/d",
    "rejection_reason": null,
    "date_submitted": "2026-10-17T14:56:47.000Z",
    "date_reviewed": null,
    "parent_proposal_id": null,
    "requestor": { "id": 2, "name": "Riley Requestor" },
    "pillar_lead": { "id": 3, "name": "Parker PillarLead" },
    "approver": { "id": 4, "name": "Avery Approver" }
  }
]
```

**Errors**

| Status  | When                   | Message                                                                        |
| ------- | ---------------------- | ------------------------------------------------------------------------------ |
| 400     | bad `status` or `type` | `status must be one of: DRAFT, SUBMITTED, PILLAR_APPROVED, APPROVED, REJECTED` |
| 401/403 | missing or bad token   | auth middleware shape, see Notes                                               |

---

### GET /proposals/reviewers

Fill the pillar lead and approver dropdowns. Users who hold more than one role appear in both lists.

- **Who:** `Requestor`, `Admin`
- **Request body:** none

**200**

```json
{
  "pillarLeads": [
    { "id": 6, "name": "Morgan Multi" },
    { "id": 3, "name": "Parker PillarLead" }
  ],
  "approvers": [
    { "id": 4, "name": "Avery Approver" },
    { "id": 6, "name": "Morgan Multi" }
  ]
}
```

**Errors**

| Status | When                             | Message                                         |
| ------ | -------------------------------- | ----------------------------------------------- |
| 403    | caller is not Requestor or Admin | `Only requestors and admins can list reviewers` |

Note: the API rejects a reviewer who is the requestor, so hide the signed-in user from the dropdowns.

---

### GET /proposals/:id

One proposal with its history and (for an FA) the parent IPA summary.

- **Who:** same visibility rules as the list.
  - the requestor can read their own proposal in any status;
  - the assigned pillar lead can read it once it is not `DRAFT`;
  - `Approver` and `Admin` can read any non-`DRAFT` proposal.
- **Request body:** none

**200:** [Proposal detail](#proposal-detail)

**Errors**

| Status | When                             | Message                                     |
| ------ | -------------------------------- | ------------------------------------------- |
| 400    | `:id` is not a positive integer  | `Invalid id`                                |
| 403    | caller may not see this proposal | `You are not allowed to view this proposal` |
| 404    | no proposal with this id         | `Proposal not found`                        |

---

### POST /proposals

Create a `DRAFT`. `requestor_id` is taken from the token.

- **Who:** `Requestor`
- **Request body**

```json
{
  "proposal_name": "Spring FA",
  "proposal_type": "FA",
  "drive_link": "https://drive.google.com/fa",
  "pillar_lead_id": 3,
  "approver_id": 4,
  "parent_proposal_id": 3
}
```

| Field                | Required | Notes                                                                            |
| -------------------- | -------- | -------------------------------------------------------------------------------- |
| `proposal_name`      | yes      | non-empty string, max 255                                                        |
| `proposal_type`      | yes      | `"IPA"` or `"FA"`                                                                |
| `drive_link`         | no       | valid `https://` URL, max 512. Needed before submit.                             |
| `pillar_lead_id`     | no       | number. Must belong to a `PillarLead` user and not be you. Needed before submit. |
| `approver_id`        | no       | number. Must belong to an `Approver` user and not be you. Needed before submit.  |
| `parent_proposal_id` | FA only  | number. Must be one of your own `APPROVED` IPAs. An IPA must not send it.        |

Ids must be JSON numbers, not strings.

**201:** [Proposal detail](#proposal-detail) with `proposal_status: "DRAFT"` and an empty `status_history`.

```json
{
  "proposal_id": 6,
  "proposal_name": "To delete",
  "proposal_type": "IPA",
  "proposal_status": "DRAFT",
  "drive_link": null,
  "rejection_reason": null,
  "date_submitted": null,
  "date_reviewed": null,
  "parent_proposal_id": null,
  "requestor": { "id": 2, "name": "Riley Requestor" },
  "pillar_lead": null,
  "approver": null,
  "parent": null,
  "status_history": []
}
```

**Errors**

| Status | When                                           | Message                                                                                                                     |
| ------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 400    | missing or blank name                          | `proposal_name is required`                                                                                                 |
| 400    | name over 255 characters                       | `proposal_name must be at most 255 characters`                                                                              |
| 400    | missing or unknown type                        | `proposal_type is required (IPA or FA)` or `proposal_type must be one of: IPA, FA`                                          |
| 400    | link is not a valid https URL                  | `drive_link must be a valid https URL`                                                                                      |
| 400    | an id is not a positive integer                | `pillar_lead_id must be a positive integer` (same for the other ids)                                                        |
| 400    | reviewer is the requestor                      | `pillar_lead_id cannot be the requestor of the proposal`                                                                    |
| 400    | reviewer lacks the role                        | `pillar_lead_id must belong to a user with the PillarLead role`                                                             |
| 400    | IPA with a parent                              | `An IPA cannot have a parent_proposal_id`                                                                                   |
| 400    | FA without a parent                            | `An FA requires parent_proposal_id (an approved IPA)`                                                                       |
| 400    | parent does not exist / not an IPA / not yours | `parent_proposal_id does not point to an existing proposal` / `must point to an IPA` / `must point to one of your own IPAs` |
| 400    | parent not approved                            | `The parent IPA must be APPROVED before an FA can be created from it`                                                       |
| 403    | caller is not a Requestor                      | `Only requestors can create proposals`                                                                                      |

The same applies to `approver_id` with the `Approver` role.

---

### PUT /proposals/:id

Edit a proposal. Send only the fields to change.

- **Who:** the proposal's requestor (`Requestor` role)
- **Only while:** `DRAFT` or `REJECTED`. Editing a rejected proposal does not change its status. Call `submit` to resubmit.
- **Request body** (all optional)

```json
{
  "proposal_name": "Spring FA v2",
  "drive_link": "https://drive.google.com/new",
  "pillar_lead_id": 3,
  "approver_id": 4
}
```

- `drive_link`, `pillar_lead_id` and `approver_id` accept `null` to clear them. `proposal_name` cannot be null.
- `proposal_type` and `parent_proposal_id` cannot change. Sending the current value back is accepted. Any other value returns 400.
- The same field rules and reviewer checks as POST apply.

**200:** [Proposal detail](#proposal-detail)

**Errors**

| Status | When                                    | Message                                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------------------------- |
| 400    | `:id` invalid                           | `Invalid id`                                                               |
| 400    | status is not `DRAFT` or `REJECTED`     | `Cannot edit a proposal in status APPROVED`                                |
| 400    | tries to change type or parent          | `proposal_type cannot be changed` / `parent_proposal_id cannot be changed` |
| 400    | field validation                        | same messages as POST                                                      |
| 403    | caller is not this proposal's requestor | `Only the requestor of this proposal can do that`                          |
| 404    | unknown id                              | `Proposal not found`                                                       |

---

### DELETE /proposals/:id

- **Who:** the proposal's requestor
- **Only while:** `DRAFT`
- **Request body:** none

**204** with an empty body.

**Errors**

| Status | When                                    | Message                                           |
| ------ | --------------------------------------- | ------------------------------------------------- |
| 400    | `:id` invalid                           | `Invalid id`                                      |
| 400    | status is not `DRAFT`                   | `Cannot delete a proposal in status SUBMITTED`    |
| 403    | caller is not this proposal's requestor | `Only the requestor of this proposal can do that` |
| 404    | unknown id                              | `Proposal not found`                              |

---

## Transitions

All four transitions share one error table. Checks run in this order, so a caller who may not act never learns the proposal's status: **404, then 403, then 400**. Each transition updates the proposal and writes a `status_history` row in a single database transaction.

| Status | When                                                          | Message                                                              |
| ------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| 400    | `:id` is not a positive integer                               | `Invalid id`                                                         |
| 400    | proposal is not in a valid status for this action             | `Cannot approve a proposal in status DRAFT` (action and status vary) |
| 400    | precondition failed (submit, reject)                          | see each endpoint                                                    |
| 403    | caller is not the right actor, or lacks the role              | `You are not allowed to approve this proposal` (action varies)       |
| 403    | caller is the proposal's requestor and is trying to review it | `You cannot review your own proposal`                                |
| 404    | unknown id                                                    | `Proposal not found`                                                 |
| 409    | someone else changed the status at the same moment            | `The proposal status changed while processing; please reload`        |

Every transition returns **200** with the updated [Proposal detail](#proposal-detail), including the new history row.

### POST /proposals/:id/submit

- **Who:** the proposal's requestor
- **From:** `DRAFT` or `REJECTED` (a resubmit), **to** `SUBMITTED`
- **Request body:** none
- **Effects:** sets `date_submitted` to now. On a resubmit it also clears `rejection_reason` and `date_reviewed`. The earlier reason stays in `status_history`.
- **Extra 400:** `Cannot submit: drive_link, pillar_lead_id, approver_id must be set first` (lists whichever are missing)

### POST /proposals/:id/pillar-approve

- **Who:** the assigned pillar lead
- **From:** `SUBMITTED`, **to** `PILLAR_APPROVED`
- **Request body:** none

### POST /proposals/:id/approve

- **Who:** the assigned approver
- **From:** `PILLAR_APPROVED`, **to** `APPROVED`
- **Request body:** none
- **Effects:** sets `date_reviewed` to now.

### POST /proposals/:id/reject

- **Who:** the assigned pillar lead (when `SUBMITTED`) or the assigned approver (when `PILLAR_APPROVED`)
- **To:** `REJECTED`
- **Request body**

```json
{ "comment": "Needs budget detail" }
```

- **Effects:** stores the comment in `rejection_reason` and in the history row, and sets `date_reviewed`.
- **Extra 400:** `A comment is required when rejecting a proposal` (missing, not a string, or only whitespace).

**200 example (after a pillar lead rejects)**

```json
{
  "proposal_id": 5,
  "proposal_name": "Draft for tests",
  "proposal_type": "IPA",
  "proposal_status": "REJECTED",
  "drive_link": "https://drive.google.com/d",
  "rejection_reason": "Needs budget detail",
  "date_submitted": "2026-10-17T14:56:47.000Z",
  "date_reviewed": "2026-10-17T14:56:47.000Z",
  "parent_proposal_id": null,
  "requestor": { "id": 2, "name": "Riley Requestor" },
  "pillar_lead": { "id": 3, "name": "Parker PillarLead" },
  "approver": { "id": 4, "name": "Avery Approver" },
  "parent": null,
  "status_history": [
    {
      "id": 5,
      "from_status": "DRAFT",
      "to_status": "SUBMITTED",
      "comment": null,
      "created_at": "2026-10-17T14:56:46.753Z",
      "changed_by": { "id": 2, "name": "Riley Requestor" }
    },
    {
      "id": 6,
      "from_status": "SUBMITTED",
      "to_status": "REJECTED",
      "comment": "Needs budget detail",
      "created_at": "2026-10-17T14:56:46.959Z",
      "changed_by": { "id": 3, "name": "Parker PillarLead" }
    }
  ]
}
```

---

## Try it with curl

Dev seed users (all share the dev password from `backend/prisma/seed.ts`): `requestor@wit.local`, `pillarlead@wit.local`, `approver@wit.local`, `admin@wit.local`, `viewer@wit.local`, `multi@wit.local`.

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"requestor@wit.local","password":"<dev password>"}' \
  | sed -E 's/.*"token":"([^"]*)".*/\1/')

curl -s http://localhost:4000/proposals -H "Authorization: Bearer $TOKEN"
```

---

## Notes for frontend

- **Two error shapes.** The proposals routes return `{ "error": { "message": "..." } }`. The auth middleware (missing, invalid or expired token, and the login route) returns `{ "error": "..." }` with a plain string. Handle both until the team unifies them:

  ```ts
  const message = typeof body.error === "string" ? body.error : body.error?.message;
  ```

- **Expired or invalid tokens currently return 403, not 401.** Only a missing token returns 401. Tokens last 10 minutes. Treat a 403 with `Invalid or expired token` as "log in again". A 403 from a proposal action (for example `You are not allowed to approve this proposal`) is a permission problem and is not a reason to log out.
- **Roles in the token go stale for up to 10 minutes.** Roles are read at login. If an admin changes someone's roles, the new roles only apply after that user logs in again (or their token expires). The same goes for the roles returned by `/auth/login`.
- **A multi-role user can hold several roles at once.** `multi@wit.local` is a Requestor, PillarLead and Approver. Do not assume a user has exactly one role. Check `roles.includes(...)` for each button or page. The same user can be the requestor of one proposal and a reviewer of another, but never a reviewer of their own.
- **Ids are numbers.** Send `pillar_lead_id`, `approver_id` and `parent_proposal_id` as JSON numbers, not strings. The `id` values from `/proposals/reviewers` already are numbers.
- **Show or hide actions by status and who the user is**, but the server enforces everything, so a hidden button is a convenience, not security.
- **After any transition, replace your copy of the proposal with the response.** It already contains the new status and history.
- **Drafts are private.** Only the requestor sees a `DRAFT`. Reviewers and admins first see a proposal once it is `SUBMITTED`.
- **Status 409 on a transition** means someone else moved the proposal first. Reload it and show the new state.
- **Not built yet:** email notifications (Task 13). Transitions currently send nothing.
