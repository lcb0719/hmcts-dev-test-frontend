import { paginateItems, parsePageParam } from '../../main/utils/pagination';

describe('parsePageParam', () => {
  test('returns 1 for invalid values', () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam(0)).toBe(1);
  });

  test('returns valid page numbers', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam(2)).toBe(2);
  });
});

describe('paginateItems', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  test('returns first page of items', () => {
    const result = paginateItems(items, 1, 10, '/tasks');
    expect(result.items).toHaveLength(10);
    expect(result.items[0].id).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.from).toBe(1);
    expect(result.to).toBe(10);
  });

  test('returns second page of items', () => {
    const result = paginateItems(items, 2, 10, '/tasks');
    expect(result.items[0].id).toBe(11);
    expect(result.pagination?.previous?.href).toBe('/tasks');
    expect(result.pagination?.next?.href).toBe('/tasks?page=3');
  });

  test('clamps page when beyond total pages', () => {
    const result = paginateItems(items, 99, 10, '/tasks');
    expect(result.page).toBe(3);
    expect(result.items[0].id).toBe(21);
  });

  test('preserves extra query params in links', () => {
    const result = paginateItems(items, 2, 10, '/tasks', { deleted: 'true' });
    expect(result.pagination?.next?.href).toBe('/tasks?deleted=true&page=3');
  });

  test('returns null pagination for single page', () => {
    const result = paginateItems(items.slice(0, 5), 1, 10, '/tasks');
    expect(result.pagination).toBeNull();
  });

  test('includes ellipsis for large page ranges', () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
    const result = paginateItems(manyItems, 5, 10, '/tasks');
    expect(result.pagination?.items?.some(item => item.ellipsis)).toBe(true);
    expect(result.pagination?.next?.href).toBe('/tasks?page=6');
  });

  test('returns empty page items when there are no tasks', () => {
    const result = paginateItems([], 1, 10, '/tasks');
    expect(result.items).toHaveLength(0);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
    expect(result.pagination).toBeNull();
  });
});
