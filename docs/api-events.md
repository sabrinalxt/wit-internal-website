# Events API

All routes need `Authorization: Bearer <token>`. Anyone logged in can read events. Only users holding the **Admin** role (a user may hold several roles) can create, update or delete them.

## The event object

Every endpoint that returns an event uses this shape (it matches `CalendarEvent` in `frontend/src/types.ts`):

```json
{
  "event_id": 2,
  "event_name": "Kickoff",
  "start_at": "2026-11-01T10:00:00.000Z",
  "end_at": "2026-11-01T12:00:00.000Z",
  "pillar": "Learning",
  "proposal_id": 3,
  "admin_id": 1,
  "proposal": { "proposal_id": 3, "proposal_name": "Spring IPA", "proposal_type": "IPA" },
  "admin": { "first_name": "Alex", "last_name": "Admin" }
}
```

`end_at`, `pillar`, `proposal_id` and `proposal` can be `null`. `admin` is the user who created the event; no other user fields are returned.

## GET /events

- **Who:** any authenticated user.
- **Query (optional):** `from` and `to`, ISO 8601 dates. Returns events overlapping the range: starting before `to` and ending (or, with no `end_at`, starting) at or after `from`.
- **Success `200`:** array of events, ordered by `start_at` ascending.
- **Errors:** `400` invalid `from` or `to`; `401`/`403` token problems.

## GET /events/:id

- **Who:** any authenticated user.
- **Success `200`:** one event.
- **Errors:** `400` id is not a positive integer; `404` event not found.

## POST /events

- **Who:** Admin only.
- **Body:**

```json
{
  "event_name": "Kickoff",
  "start_at": "2026-11-01T10:00:00Z",
  "end_at": "2026-11-01T12:00:00Z",
  "pillar": "Learning",
  "proposal_id": 3
}
```

  - `event_name`: required, trimmed, up to 255 characters.
  - `start_at`: required, ISO 8601.
  - `end_at`: optional, ISO 8601, not before `start_at`.
  - `pillar`: optional string, up to 100 characters.
  - `proposal_id`: optional positive integer of an existing proposal.
  - `admin_id` in the body is ignored; it is always the caller's id from the token.
- **Success `201`:** the created event.
- **Errors:** `400` any failed check above (e.g. `{ "error": { "message": "event_name is required" } }`); `403` caller is not an Admin.

## PUT /events/:id

- **Who:** Admin only.
- **Body:** any subset of `event_name`, `start_at`, `end_at`, `pillar`, `proposal_id`, with the same checks as POST. `end_at`, `pillar` and `proposal_id` may be `null` to clear them. Unknown fields (including `admin_id`, which cannot be changed) are ignored. The `end_at` vs `start_at` check also uses the stored value of whichever field is not sent.
- **Success `200`:** the updated event.
- **Errors:** `400` invalid id, failed check, or no updatable fields in the body; `403` not an Admin; `404` event not found.

## DELETE /events/:id

- **Who:** Admin only.
- **Success `204`:** no body.
- **Errors:** `400` invalid id; `403` not an Admin; `404` event not found.

## Notes for frontend

- **Auth is required on every route**, including `GET /events` and `GET /events/:id`. Send `Authorization: Bearer <token>`, as `authFetch` already does.
- **Two error shapes.** The events routes return `{ "error": { "message": "..." } }`. The auth middleware (missing/invalid token → `401`/`403`, non-Admin on a write route → `403`) returns `{ "error": "string" }`. Handle both.
- **Roles can lag.** Roles come from the token, which lasts 10 minutes, so a role change can take up to 10 minutes to apply.
- **Events can exist without a proposal.** `proposal_id` and `proposal` are `null` in that case.
- **Date range.** Pass FullCalendar's visible range through `datesSet` / `events` function arguments:

```ts
// FullCalendar passes { startStr, endStr } to an events function
const events = await authFetch(
  `/events?from=${encodeURIComponent(info.startStr)}&to=${encodeURIComponent(info.endStr)}`,
);
```
