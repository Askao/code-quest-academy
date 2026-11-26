import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE = 1000;

/**
 * Fetches every row matching `column IN ids`, paging past PostgREST's
 * 1000-row default response cap (and chunking `ids` itself, so the URL for
 * a big class's IN(...) list never gets unreasonably long).
 *
 * A plain `.select().in(column, ids)` with no `.range()` looks like it
 * returns everything, and does - right up until an active class's full
 * history (every lesson/practice/homework attempt, ever) passes 1000 rows,
 * at which point PostgREST silently hands back only the first page in
 * whatever order the database happens to return them, with no error. That
 * produces exactly the kind of "some students show progress, most don't,
 * nothing looks broken" bug this exists to prevent - see teacher.$classId.tsx
 * and ClassReport.tsx for two places that fetch a whole class's attempt
 * history and must never be silently truncated like that.
 */
export async function pagedIn<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, any, any>,
  table: string,
  select: string,
  column: string,
  ids: string[],
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client
        .from(table)
        .select(select)
        .in(column, chunk)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      out.push(...((data ?? []) as T[]));
      if ((data ?? []).length < PAGE) break;
    }
  }
  return out;
}

/**
 * Every row a query returns, a page at a time, for queries with no IN list
 * (a whole table, or a function returning rows). `page(from, to)` runs the
 * query with `.range(from, to)`.
 */
export async function pagedAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < PAGE) return out;
  }
}
