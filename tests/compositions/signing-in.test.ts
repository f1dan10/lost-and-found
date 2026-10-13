import { describe, expect, test } from "bun:test";
import { startLostFound } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

describe("Signing in with a password", () => {
  test("Ben signs up, signs out, and signs in again as the same user", async () => {
    const { api, register } = await startLostFound();
    const ben = await register("ben");
    expect(await api.auth.me({ session: ben.session })).toEqual({ username: "ben" });

    expect(await api.auth.logout({ session: ben.session })).toEqual({});
    expect(await api.auth.me({ session: ben.session })).toEqual({ error: "NOT_SIGNED_IN" });

    const again = await api.auth.login({ username: "ben", password: "correct horse" });
    expect(again).toMatchObject({ user: ben.user });
  });

  test("a 5-character password is refused before `ben` is registered, so Ben can sign up again", async () => {
    const { api } = await startLostFound();
    expect(await api.auth.register({ username: "ben", password: "short" })).toEqual({ error: "INVALID_PASSWORD" });
    const ben = await api.auth.register({ username: "ben", password: "correct horse" }).then(ok);
    expect(await api.auth.me({ session: ben.session })).toEqual({ username: "ben" });
  });

  test("nobody signs up as a username someone already has", async () => {
    const { api, register } = await startLostFound();
    await register("sam");
    expect(await api.auth.register({ username: "sam", password: "leos-password" })).toEqual({ error: "USERNAME_TAKEN" });
    expect(await api.auth.login({ username: "sam", password: "leos-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
  });

  test("a username nobody has gets the same refusal as a wrong password", async () => {
    const { api, register } = await startLostFound();
    await register("ben");
    expect(await api.auth.login({ username: "ben", password: "guessed-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
    expect(await api.auth.login({ username: "nobody", password: "guessed-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
  });
});
