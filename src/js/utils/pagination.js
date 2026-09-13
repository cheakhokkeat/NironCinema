export function paginate(items, requestedPage = 1, pageSize = 12) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number(requestedPage) || 1));
  return {
    page,
    pages,
    items: items.slice((page - 1) * pageSize, page * pageSize),
  };
}
