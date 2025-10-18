import { badRequest, created, forbidden, serverError } from '@/app/api/_lib/response';
import { getAuthUser } from '@/app/api/_lib/auth';
import { z } from 'zod';
import { generateSignedUploadURL } from '@/lib/storage';

const bodySchema = z.object({
  eventId: z.string().uuid(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  bytes: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request);
    if (!(user.role === 'admin' || user.role === 'vendor')) {
      return forbidden('Only admins and vendors can upload event photos');
    }
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid request body', parsed.error.flatten());
    const input = parsed.data;
    const signed = generateSignedUploadURL({
      eventId: input.eventId,
      filename: input.filename,
      contentType: input.contentType,
      contentLength: input.bytes,
      userId: user.id,
    });
    return created(signed);
  } catch (err: any) {
    return serverError('Failed to create signed upload URL', err?.message);
  }
}
