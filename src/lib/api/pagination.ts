import { z } from 'zod/v4';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const result = PaginationSchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });

  return result.success ? result.data : { page: 1, pageSize: 20 };
}

export function paginationMeta(total: number, params: PaginationParams) {
  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}
