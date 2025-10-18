import { NextResponse } from 'next/server';

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: Record<string, unknown>;
};

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  const body: ApiEnvelope<T> = { data, error: null, meta };
  return NextResponse.json(body, { status: 200 });
}

export function created<T>(data: T, meta?: Record<string, unknown>) {
  const body: ApiEnvelope<T> = { data, error: null, meta };
  return NextResponse.json(body, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  const body: ApiEnvelope<null> = { data: null, error: { code: 'bad_request', message, details } };
  return NextResponse.json(body, { status: 400 });
}

export function forbidden(message = 'Forbidden') {
  const body: ApiEnvelope<null> = { data: null, error: { code: 'forbidden', message } };
  return NextResponse.json(body, { status: 403 });
}

export function notFound(message = 'Not found') {
  const body: ApiEnvelope<null> = { data: null, error: { code: 'not_found', message } };
  return NextResponse.json(body, { status: 404 });
}

export function conflict(message = 'Conflict', details?: unknown) {
  const body: ApiEnvelope<null> = { data: null, error: { code: 'conflict', message, details } };
  return NextResponse.json(body, { status: 409 });
}

export function serverError(message = 'Internal server error', details?: unknown) {
  const body: ApiEnvelope<null> = { data: null, error: { code: 'server_error', message, details } };
  return NextResponse.json(body, { status: 500 });
}
