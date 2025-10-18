# Storage: Event Photos and Public Galleries

This app integrates a simple signed-upload flow for event photos using a Neon Storage–compatible interface.

Overview:
- Clients request a signed upload token from POST /api/photos/upload-url (admin/vendor only)
- Clients upload directly to your object storage provider (S3, R2, etc.)
- The storage provider calls back to POST /api/photos/storage-callback with the token and object metadata
- The callback verifies the token and creates a row in the photos table
- Public galleries fetch photos via GET /api/events/:eventId/photos
- Admin/vendor can manage visibility via PATCH /api/photos/:id/public

Environment variables:
- NEON_STORAGE_BUCKET: bucket name (e.g., app-photos)
- NEON_STORAGE_REGION: provider region (informational)
- NEON_STORAGE_PUBLIC_BASE_URL: base public CDN URL for generating public image URLs
- NEON_STORAGE_SECRET: HMAC secret used to sign and verify upload tokens (required)
- NEON_STORAGE_MAX_BYTES: max upload size in bytes (default 10MB)
- NEON_STORAGE_ALLOWED_TYPES: comma-separated list of allowed MIME types (default: image/jpeg,image/png,image/webp,image/avif)

Required buckets and object layout:
- Bucket: ${NEON_STORAGE_BUCKET}
- Keys: events/{eventId}/{timestamp}-{filename}

API routes:
- POST /api/photos/upload-url
  - Body: { eventId, filename, contentType, bytes }
  - Role: admin or vendor
  - Response: { token, key, expiresAt, maxBytes, contentType, uploadUrl }
- POST /api/photos/storage-callback
  - Body: { token, key, size, contentType, url? }
  - Verifies token and size/type; inserts into photos
- PATCH /api/photos/:id/public
  - Body: { isPublic }
  - Role: admin or vendor
- GET /api/events/:eventId/photos
  - Public, returns only photos where is_public = true
- GET /api/events/:eventId/photos/manage
  - Role: admin or vendor, returns all photos for management

Database schema:
- photos table gains a boolean column is_public default false
  - Migration: drizzle/0003_photos_public.sql

Access control:
- Upload URL generation and visibility toggles require role admin or vendor
- Public gallery only exposes is_public = true items

Size/type constraints:
- Enforced at token generation and in storage callback via NEON_STORAGE_MAX_BYTES and NEON_STORAGE_ALLOWED_TYPES

React components:
- src/components/Gallery.tsx: simple public gallery grid with lazy-loading and optional blur placeholder
- src/components/AdminPhotoManager.tsx: list with toggle buttons for is_public

Cleanup strategy:
- When deleting events, photos rows cascade via FK and you should configure your storage provider to delete the corresponding objects (e.g., lifecycle rules, event-driven lambda/worker)
- Consider periodic jobs to reconcile DB rows with missing objects and vice versa

Notes:
- The provided storage.ts signs tokens using HMAC; in production, replace uploadUrl and callback wiring with your provider's presigned upload mechanism and webhooks/callbacks.
