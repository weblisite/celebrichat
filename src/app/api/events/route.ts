import { badRequest, created, ok, forbidden, serverError } from '@/app/api/_lib/response';
import { getAuthUser, requireAdmin } from '@/app/api/_lib/auth';
import { eventsQuerySchema, eventCreateSchema } from '@/app/api/_lib/schemas';
import { parsePagination } from '@/app/api/_lib/pagination';
import { createEvent, listEvents } from '@/services/events';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = eventsQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!q.success) {
      return badRequest('Invalid query parameters', q.error.flatten());
    }
    const { page = 1, pageSize = 20, search, status, celebrityId, from, to } = q.data;
    const { offset } = parsePagination(url.searchParams);
    const { rows, total } = await listEvents({
      search: search ?? null,
      status: status ?? null,
      celebrityId: celebrityId ?? null,
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
      offset,
      limit: pageSize,
    });
    return ok(rows, { page, pageSize, total });
  } catch (err: any) {
    return serverError('Failed to list events', err?.message);
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request);
    try {
      requireAdmin(user);
    } catch {
      return forbidden('Only admins can create events');
    }
    const body = await request.json().catch(() => ({}));
    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid request body', parsed.error.flatten());
    }
    const { sessions, metadata, ...rest } = parsed.data as any;
    const finalMetadata = { ...(metadata ?? {}), ...(sessions ? { sessions } : {}) };
    const createdEvent = await createEvent({ ...rest, metadata: finalMetadata });
    return created(createdEvent);
  } catch (err: any) {
    return serverError('Failed to create event', err?.message);
  }
}
