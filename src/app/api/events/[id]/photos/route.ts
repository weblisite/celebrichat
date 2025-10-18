import { badRequest, ok, serverError } from '@/app/api/_lib/response';
import { listPublicPhotosByEvent } from '@/services/photos';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    if (!eventId) return badRequest('Missing event id');
    const rows = await listPublicPhotosByEvent(eventId);
    return ok(rows);
  } catch (err: any) {
    return serverError('Failed to list photos', err?.message);
  }
}
