const DEFAULT_PAGE_SIZE = 12;

export function normalizeSearchTerm(value?: string) {
  return value?.trim() ?? "";
}

export function parsePageParam(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function getPagination(totalCount: number, requestedPage: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

  return {
    pageSize,
    totalCount,
    totalPages,
    currentPage,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  };
}

export function buildAdminListHref(
  pathname: string,
  params: Record<string, string | undefined>,
  updates: Record<string, string | number | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      searchParams.delete(key);
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
