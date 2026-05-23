export interface GovUkPaginationLink {
  href: string;
  text?: string;
}

export interface GovUkPaginationItem {
  number?: number;
  href?: string;
  current?: boolean;
  ellipsis?: boolean;
  visuallyHiddenText?: string;
}

export interface GovUkPagination {
  previous?: GovUkPaginationLink;
  next?: GovUkPaginationLink;
  items?: GovUkPaginationItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
  pagination: GovUkPagination | null;
}

export function parsePageParam(value: unknown): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }
  return page;
}

function buildPageUrl(basePath: string, page: number, extraQuery: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extraQuery)) {
    if (value) {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function buildPageItemList(currentPage: number, totalPages: number, basePath: string, extraQuery: Record<string, string>): GovUkPaginationItem[] {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: GovUkPaginationItem[] = [];
  let previous = 0;

  for (const page of sorted) {
    if (page - previous > 1) {
      items.push({ ellipsis: true });
    }
    items.push({
      number: page,
      href: buildPageUrl(basePath, page, extraQuery),
      current: page === currentPage,
    });
    previous = page;
  }

  return items;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
  basePath: string,
  extraQuery: Record<string, string> = {}
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  const from = totalItems === 0 ? 0 : startIndex + 1;
  const to = startIndex + pageItems.length;

  let pagination: GovUkPagination | null = null;

  if (totalPages > 1) {
    pagination = {
      items: buildPageItemList(safePage, totalPages, basePath, extraQuery),
    };

    if (safePage > 1) {
      pagination.previous = {
        href: buildPageUrl(basePath, safePage - 1, extraQuery),
        text: 'Previous',
      };
    }

    if (safePage < totalPages) {
      pagination.next = {
        href: buildPageUrl(basePath, safePage + 1, extraQuery),
        text: 'Next',
      };
    }
  }

  return {
    items: pageItems,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    from,
    to,
    pagination,
  };
}
