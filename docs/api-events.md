API: Events and Celebrities

Overview
- All responses use the envelope: { data, error, meta? }
- Errors follow: { error: { code, message, details? }, data: null }
- Pagination via query params page (1-based) and pageSize (max 100). Meta includes { page, pageSize, total }.
- Admin-only endpoints require a Neon Auth role with admin privileges. In this reference implementation, supply either header x-neon-auth-role: admin or Authorization: Bearer role:admin.

Celebrities
GET /api/celebrities
- Query params:
  - page, pageSize
  - search: string (matches stageName)
  - category: one of actor|athlete|musician|influencer|comedian|creator|other
  - available: true|false
- Response: { data: Celebrity[], error: null, meta: { page, pageSize, total } }

POST /api/celebrities (admin only)
- Body (JSON):
  {
    userId: uuid,
    stageName: string,
    bio?: string,
    category: actor|athlete|musician|influencer|comedian|creator|other,
    priceCents: number,
    available?: boolean
  }
- Response: 201 { data: Celebrity, error: null }
- Validations: Zod-enforced; missing or invalid fields return 400 with details

Events
GET /api/events (public)
- Query params:
  - page, pageSize
  - search: string (matches title)
  - status: draft|published|cancelled|completed
  - celebrityId: uuid
  - from: ISO date-time (filters event_date >= from)
  - to: ISO date-time (filters event_date <= to)
- Response: { data: Event[], error: null, meta: { page, pageSize, total } }

POST /api/events (admin only)
- Body (JSON):
  {
    celebrityId: uuid,
    vendorId?: uuid,
    title: string,
    description?: string,
    eventDate: ISO date-time,
    location?: string,
    priceCents: number,
    metadata?: object,
    sessions?: Array<{ id, title, startTime, endTime, speakerId? }>[5]
  }
- Behavior:
  - A fixed five-session template is used by default. If sessions is provided, it must be exactly 5 items and will be persisted in metadata.sessions.
  - Status defaults to draft.
- Response: 201 { data: Event, error: null }

PUT /api/events/:id (admin only)
- Body (JSON):
  {
    expectedUpdatedAt: ISO date-time,   // required for optimistic concurrency
    vendorId?: uuid | null,
    title?: string,
    description?: string | null,
    eventDate?: ISO date-time,
    location?: string | null,
    priceCents?: number,
    status?: draft|published|cancelled|completed,
    metadata?: object,
    sessions?: Array<{ id, title, startTime, endTime, speakerId? }>[5]
  }
- Behavior:
  - Optimistic updates: If expectedUpdatedAt does not match current updated_at, returns 409 conflict.
  - Status transitions allowed: draft -> published|cancelled; published -> completed|cancelled; completed/cancelled -> none.
  - If sessions is provided, it must have exactly five items and is stored at metadata.sessions.
- Responses:
  - 200 { data: Event, error: null }
  - 404 if event not found
  - 409 on optimistic lock conflict
  - 400 on invalid transition or payload

Error format examples
- 400 Bad Request:
  { data: null, error: { code: "bad_request", message: "Invalid request body", details: { ...zodIssues } } }
- 403 Forbidden:
  { data: null, error: { code: "forbidden", message: "Only admins can create events" } }
- 409 Conflict:
  { data: null, error: { code: "conflict", message: "Optimistic update conflict", details: { currentUpdatedAt: "..." } } }

Notes
- Database access is implemented with Drizzle ORM over Neon Postgres.
- Authentication/RBAC references Neon Auth; this project uses a header-based simulation for tests and local dev.
- Timestamps are ISO 8601 strings when serialized.
