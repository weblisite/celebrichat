import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  pageSize: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export const celebrityCreateSchema = z.object({
  userId: z.string().uuid(),
  stageName: z.string().min(1),
  bio: z.string().max(5000).optional(),
  category: z.enum(['actor', 'athlete', 'musician', 'influencer', 'comedian', 'creator', 'other']),
  priceCents: z.number().int().nonnegative(),
  available: z.boolean().optional(),
});

export const celebritiesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  category: z.enum(['actor', 'athlete', 'musician', 'influencer', 'comedian', 'creator', 'other']).optional(),
  available: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
});

export const eventCreateSchema = z.object({
  celebrityId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? new Date(v) : v)),
  location: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  metadata: z.record(z.any()).optional(),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        speakerId: z.string().uuid().nullable().optional(),
      }),
    )
    .length(5)
    .optional(),
});

export const eventsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  celebrityId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const eventUpdateSchema = z.object({
  expectedUpdatedAt: z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? new Date(v) : v)),
  vendorId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  eventDate: z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? new Date(v) : v)).optional(),
  location: z.string().nullable().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  metadata: z.record(z.any()).optional(),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        speakerId: z.string().uuid().nullable().optional(),
      }),
    )
    .length(5)
    .optional(),
});
