import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";

function permissionFor(id: string) {
  const sql = `WITH identity AS MATERIALIZED (SELECT set_config('request.jwt.claim.sub', '${id}', true)) SELECT public.can_manage_friend_group() AS allowed FROM identity`;
  const result = JSON.parse(execFileSync("lovable", ["supabase", "query", sql, "--json"], { encoding: "utf8" }));
  return result.rows[0].allowed;
}

describe("Group removal permissions", () => {
  test("sangapudesushant@gmail.com is the sole manager", () => {
    const result = JSON.parse(execFileSync("lovable", ["supabase", "query", "SELECT m.user_id, u.email FROM public.friend_group_managers m JOIN auth.users u ON u.id=m.user_id", "--json"], { encoding: "utf8" }));
    expect(result.rows).toEqual([{ user_id: "0758c393-9605-4d7e-b7cf-522bb720f5f4", email: "sangapudesushant@gmail.com" }]);
    expect(permissionFor("0758c393-9605-4d7e-b7cf-522bb720f5f4")).toBe(true);
  });
  test("other friends cannot manage the group", () => {
    expect(permissionFor("b9ebf6ce-6d26-4989-a1a1-c6a8710e931a")).toBe(false);
  });
  test("signed-out visitors cannot manage the group", () => {
    expect(permissionFor("")).toBe(false);
  });
});