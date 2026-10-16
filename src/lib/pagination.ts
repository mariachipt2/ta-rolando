// Supabase returns at most 1,000 rows by default. Read explicit ordered ranges
// so counts and personal agendas are never silently truncated at that limit.
export async function readAll<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const result: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await fetchPage(from, from + size - 1);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < size) return result;
  }
}
