import { badRequest, conflict, notFound, ok, forbidden, serverError } from '@/app/api/_lib/response';
import { getAuthUser, requireAdmin } from '@/app/api/_lib/auth';
import { eventUpdateSchema } from '@/app/api/_lib/schemas';
import { updateEvent } from '@/services/events';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(request);
    try {
      requireAdmin(user);
    } catch {
      return forbidden('Only admins can update events');
    }
    const id = params.id;
    if (!id) return badRequest('Missing event id');
    const json = await request.json().catch(() => ({}));
    const parsed = eventUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest('Invalid request body', parsed.error.flatten());
    }
    const { sessions, metadata, expectedUpdatedAt, ...rest } = parsed.data as any;
    const patch: any = { ...rest };
    if (sessions || metadata) {
      patch.metadata = { ...(metadata ?? {}), ...(sessions ? { sessions } : {}) };
    }
    try {
      const updated = await updateEvent({ id, expectedUpdatedAt, patch });
      return ok(updated);
    } catch (err: any) {
      if (err?.code === 'not_found') return notFound('Event not found');
      if (err?.code === 'conflict') return conflict('Optimistic update conflict', { currentUpdatedAt: err.currentUpdatedAt });
      if (err?.code === 'bad_request') return badRequest(err.message);
      throw err;
    }
  } catch (err: any) {
    return serverError('Failed to update event', err?.message);
  }
}
