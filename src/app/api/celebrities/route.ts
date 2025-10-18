import { badRequest, created, ok, forbidden, serverError } from '@/app/api/_lib/response';
import { getAuthUser, requireAdmin } from '@/app/api/_lib/auth';
import { celebritiesQuerySchema, celebrityCreateSchema } from '@/app/api/_lib/schemas';
import { parsePagination } from '@/app/api/_lib/pagination';
import { createCelebrity, listCelebrities } from '@/services/celebrities';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = celebritiesQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!q.success) {
      return badRequest('Invalid query parameters', q.error.flatten());
    }
    const { page = 1, pageSize = 20, search, category, available } = q.data;
    const { offset } = parsePagination(url.searchParams);
    const { rows, total } = await listCelebrities({
      search: search ?? null,
      category: category ?? null,
      available: typeof available === 'boolean' ? available : null,
      offset,
      limit: pageSize,
    });
    return ok(rows, { page, pageSize, total });
  } catch (err: any) {
    return serverError('Failed to list celebrities', err?.message);
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthUser(request);
    try {
      requireAdmin(user);
    } catch {
      return forbidden('Only admins can create celebrities');
    }
    const body = await request.json().catch(() => ({}));
    const parsed = celebrityCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid request body', parsed.error.flatten());
    }
    const createdCelebrity = await createCelebrity(parsed.data);
    return created(createdCelebrity);
  } catch (err: any) {
    return serverError('Failed to create celebrity', err?.message);
  }
}
