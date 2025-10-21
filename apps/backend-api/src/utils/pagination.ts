export function parsePaging(q: any) {
  const page = Math.max(1, Number(q.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(q.pageSize ?? 10)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, limit: pageSize };
}
