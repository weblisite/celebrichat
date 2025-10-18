import { badRequest, created, serverError } from '@/app/api/_lib/response';
import { z } from 'zod';
import { handleStorageCallback } from '@/lib/storage';
import { createPhoto } from '@/services/photos';

const schema = z.object({
  token: z.string().min(10),
  key: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentType: z.string().min(1),
  url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest('Invalid request body', parsed.error.flatten());
    const result = await handleStorageCallback(parsed.data, createPhoto);
    if (!result.ok) return badRequest('Upload verification failed', { reason: result.reason });
    return created(result.photo);
  } catch (err: any) {
    return serverError('Failed to process storage callback', err?.message);
  }
}
