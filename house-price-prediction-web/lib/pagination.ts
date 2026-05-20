export type PaginationItem = number | "ellipsis";

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];

  if (currentPage > 3) {
    items.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
}

export function getPageRange(currentPage: number, pageSize: number, totalItems: number): {
  start: number;
  end: number;
} {
  if (totalItems === 0) {
    return { start: 0, end: 0 };
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return { start, end };
}
