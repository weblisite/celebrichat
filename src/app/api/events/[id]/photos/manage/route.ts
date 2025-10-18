import { badRequest, forbidden, ok, serverError } from '@/app/api/_lib/response';
import { getAuthUser } from '@/app/api/_lib/auth';
import { listAllPhotosByEvent } from '@/services/photos';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(request);
    if (!(user.role === 'admin' || user.role === 'vendor')) {
      return forbidden('Only admins and vendors can list all photos');
    }
    const eventId = params.id;
    if (!eventId) return badRequest('Missing event id');
    const rows = await listAllPhotosByEvent(eventId);
    return ok(rows);
  } catch (err: any) {
    return serverError('Failed to list photos', err?.message);
  }
}
