import crypto from 'crypto';

export type AllowedRole = 'admin' | 'vendor';

export type SignedUploadInput = {
  eventId: string;
  filename: string;
  contentType: string;
  contentLength: number; // in bytes
  userId: string | null;
};

export type SignedUpload = {
  token: string;
  key: string;
  expiresAt: string; // ISO string
  maxBytes: number;
  contentType: string;
  uploadUrl: string; // opaque, client may ignore (depends on storage provider)
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function baseUrl() {
  return process.env.NEON_STORAGE_PUBLIC_BASE_URL || 'https://storage.example.com';
}

function bucket() {
  return process.env.NEON_STORAGE_BUCKET || 'app-photos';
}

function secret() {
  const s = process.env.NEON_STORAGE_SECRET || process.env.NEON_AUTH_SECRET;
  if (!s) throw new Error('Missing NEON_STORAGE_SECRET');
  return s;
}

export function getPublicUrlForKey(key: string) {
  const clean = key.replace(/^\/+/, '');
  return `${baseUrl().replace(/\/$/, '')}/${bucket()}/${clean}`;
}

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
}

export function generateSignedUploadURL(input: SignedUploadInput, opts?: { maxBytes?: number; allowedTypes?: string[]; expiresInSec?: number }) {
  const maxBytes = opts?.maxBytes ?? Number(process.env.NEON_STORAGE_MAX_BYTES || DEFAULT_MAX_BYTES);
  const allowedTypes = opts?.allowedTypes ?? (process.env.NEON_STORAGE_ALLOWED_TYPES ? process.env.NEON_STORAGE_ALLOWED_TYPES.split(',') : DEFAULT_ALLOWED_TYPES);
  const expiresInSec = opts?.expiresInSec ?? Number(process.env.NEON_STORAGE_EXPIRES_SEC || 60 * 5);

  if (!allowedTypes.includes(input.contentType)) {
    const err: any = new Error('Unsupported content type');
    err.code = 'unsupported_type';
    throw err;
  }
  if (input.contentLength > maxBytes) {
    const err: any = new Error('File too large');
    err.code = 'file_too_large';
    throw err;
  }

  const filename = sanitizeFilename(input.filename);
  const ts = Date.now();
  const key = `events/${input.eventId}/${ts}-${filename}`;
  const exp = new Date(Date.now() + expiresInSec * 1000);

  const payload = {
    v: 1,
    bucket: bucket(),
    key,
    ct: input.contentType,
    max: maxBytes,
    exp: exp.toISOString(),
    eid: input.eventId,
    uid: input.userId,
  } as const;

  const token = signPayload(payload);
  const uploadUrl = `${baseUrl().replace(/\/$/, '')}/upload`; // placeholder; real provider URL in production

  return {
    token,
    key,
    expiresAt: payload.exp,
    maxBytes,
    contentType: input.contentType,
    uploadUrl,
  } satisfies SignedUpload;
}

export function signPayload(payload: Record<string, unknown>) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const h = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${h}`;
}

export function verifyToken<T = any>(token: string): T {
  const [data, sig] = token.split('.');
  if (!data || !sig) throw new Error('Invalid token');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Bad signature');
  const json = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  // expiry check
  const exp = new Date(json.exp);
  if (Number.isNaN(exp.getTime()) || exp.getTime() < Date.now()) throw new Error('Expired token');
  return json as T;
}

export type StorageCallbackInput = {
  token: string;
  key: string;
  size: number;
  contentType: string;
  url?: string; // if provider gives the public URL directly
};

export type StorageCallbackResult =
  | { ok: true; photo: { eventId: string; url: string; key: string; id?: string; isPublic?: boolean } }
  | { ok: false; reason: string };

export async function handleStorageCallback(input: StorageCallbackInput, createPhoto: (args: { eventId: string; url: string; caption?: string | null }) => Promise<{ id: string; eventId: string; url: string }>): Promise<StorageCallbackResult> {
  try {
    const payload = verifyToken<any>(input.token);
    if (payload.key !== input.key) return { ok: false, reason: 'key_mismatch' };
    if (payload.ct !== input.contentType) return { ok: false, reason: 'type_mismatch' };
    if (input.size > payload.max) return { ok: false, reason: 'file_too_large' };
    const url = input.url || getPublicUrlForKey(input.key);
    const created = await createPhoto({ eventId: payload.eid, url });
    return { ok: true, photo: { ...created, key: input.key } };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown_error' };
  }
}
