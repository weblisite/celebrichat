import { badRequest, forbidden, ok, serverError } from '@/app/api/_lib/response';
import { getAuthUser } from '@/app/api/_lib/auth';
import { z } from 'zod';
import { setPhotoPublic } from '@/services/photos';

const bodySchema = z.object({ isPublic: z.boolean() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(request);
    if (!(user.role === 'admin' || user.role === 'vendor')) {
      return forbidden('Only admins and vendors can modify photo visibility');
    }
    const id = params.id;
    if (!id) return badRequest('Missing photo id');
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return badRequest('Invalid request body', parsed.error.flatten());
    const updated = await setPhotoPublic(id, parsed.data.isPublic);
    if (!updated) return badRequest('Photo not found');
    return ok(updated);
  } catch (err: any) {
    return serverError('Failed to update photo visibility', err?.message);
  }
}
