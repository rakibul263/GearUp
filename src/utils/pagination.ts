export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  skip?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (query: PaginationQuery): PaginationOptions => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = typeof query.skip === "number" ? query.skip : (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};
