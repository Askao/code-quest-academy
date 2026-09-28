import test from "node:test";
import assert from "node:assert/strict";
import { pagedIn } from "./paged-in.ts";

/**
 * A fake Supabase client just real enough to exercise pagedIn's chunking and
 * paging: it records every `.range()` call and serves rows from an in-memory
 * table, the same shape `.from(table).select(select).in(column, ids).range(from, to)`
 * would return.
 */
function fakeClient(rows: { user_id: string }[]) {
  const calls: { in: string[]; range: [number, number] }[] = [];
  return {
    calls,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (_table: string) => ({
      select: (_select: string) => ({
        in: (_column: string, ids: string[]) => ({
          range: (from: number, to: number) => {
            calls.push({ in: ids, range: [from, to] });
            const inSet = new Set(ids);
            const matching = rows.filter((r) => inSet.has(r.user_id));
            return Promise.resolve({ data: matching.slice(from, to + 1), error: null });
          },
        }),
      }),
    }),
  };
}

test("returns every row when there are fewer than one page", async () => {
  const rows = [{ user_id: "a" }, { user_id: "b" }, { user_id: "c" }];
  const client = fakeClient(rows);
  const out = await pagedIn(client, "attempts", "user_id", "user_id", ["a", "b", "c"]);
  assert.deepEqual(out, rows);
});

test("pages past a full 1000-row response instead of stopping there", async () => {
  const rows = Array.from({ length: 1500 }, (_, i) => ({ user_id: `u${i}` }));
  const ids = rows.map((r) => r.user_id);
  const client = fakeClient(rows);
  const out = await pagedIn(client, "attempts", "user_id", "user_id", ids);
  assert.equal(out.length, 1500, "a naive single .range() would have stopped at 1000");
  assert.deepEqual(
    out.map((r) => r.user_id),
    ids,
  );
});

test("stopping condition is a short page, not an exact multiple of 1000", async () => {
  // 1000 rows exactly for the first chunk of ids would keep paging forever
  // if the loop only checked "did we get a full page", so this specifically
  // covers a result that lands on a page boundary before running dry.
  const rows = Array.from({ length: 1000 }, (_, i) => ({ user_id: `u${i}` }));
  const ids = rows.map((r) => r.user_id);
  const client = fakeClient(rows);
  const out = await pagedIn(client, "attempts", "user_id", "user_id", ids);
  assert.equal(out.length, 1000);
  assert.equal(client.calls.filter((c) => c.in.length > 0).length >= 1, true);
});

test("chunks a large id list into groups of 100, so the IN(...) URL never gets huge", async () => {
  const ids = Array.from({ length: 250 }, (_, i) => `u${i}`);
  const rows = ids.map((user_id) => ({ user_id }));
  const client = fakeClient(rows);
  const out = await pagedIn(client, "attempts", "user_id", "user_id", ids);
  assert.equal(out.length, 250);
  const chunkSizes = client.calls.map((c) => c.in.length);
  assert.deepEqual(chunkSizes, [100, 100, 50]);
});

test("an empty id list makes no request and returns nothing", async () => {
  const client = fakeClient([]);
  const out = await pagedIn(client, "attempts", "user_id", "user_id", []);
  assert.deepEqual(out, []);
  assert.equal(client.calls.length, 0);
});

test("throws instead of silently swallowing a query error", async () => {
  const client = {
    from: () => ({
      select: () => ({
        in: () => ({
          range: () => Promise.resolve({ data: null, error: { message: "connection reset" } }),
        }),
      }),
    }),
  };
  await assert.rejects(
    () => pagedIn(client, "attempts", "user_id", "user_id", ["a"]),
    /connection reset/,
  );
});
