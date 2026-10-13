import { describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { lostFoundPolicy } from "../../src/host/http.ts";
import { startLostFound } from "../support/app.ts";

const ORIGIN = "http://localhost:3000";

/** Lost&Found behind its HTTP server, and browsers that each keep their own cookies, so a test can see each cookie set and cleared. */
async function serve() {
  const app = await startLostFound();
  const handle = createHttpHandler({
    application: app.application,
    gateway: createGateway({ application: app.application }),
    policy: lostFoundPolicy(ORIGIN),
  });

  function browser() {
    const jar = new Map<string, string>();

    async function post(path: string, body: object = {}) {
      const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
      const response = await handle(
        new Request(`${ORIGIN}/api${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
          body: JSON.stringify(body),
        }),
      );
      const cookies = response.headers.getSetCookie();
      const set = cookies.map((line) => line.split(";")[0]?.split("=") ?? []);
      for (const [name = "", value = ""] of set) {
        if (value === "") jar.delete(name);
        else jar.set(name, value);
      }
      const cleared = set.filter(([, value]) => value === "").map(([name]) => name);
      return { status: response.status, body: await response.json(), cookies, cleared };
    }

    return { jar, post };
  }

  return { ...app, browser };
}

const SESSION = "__Host-lostfound-session";

describe("Signing in with a password over HTTP", () => {
  test("registering sets the session cookie, and signing out clears it", async () => {
    const { browser } = await serve();
    const ben = browser();
    const registered = await ben.post("/auth/register", { username: "ben", password: "correct horse" });
    expect(registered.status).toBe(200);
    expect(registered.cookies[0]).toMatch(/^__Host-lostfound-session=[^;]+; .*Expires=/);
    expect(registered.cookies[0]).toContain("HttpOnly");
    expect(registered.cookies[0]).toContain("Secure");
    expect(ben.jar.has(SESSION)).toBe(true);
    expect((await ben.post("/auth/me")).body).toEqual({ username: "ben" });

    expect((await ben.post("/auth/logout")).cleared).toEqual([SESSION]);
    expect(ben.jar.has(SESSION)).toBe(false);
    expect((await ben.post("/auth/me")).status).toBe(401);
  });

  test("a wrong password answers 401 and sets no cookie, and the right one signs in", async () => {
    const { browser, register } = await serve();
    await register("ben");
    const ben = browser();
    expect(await ben.post("/auth/login", { username: "ben", password: "guessed-password" })).toMatchObject({
      status: 401,
      cookies: [],
    });
    expect((await ben.post("/auth/login", { username: "ben", password: "correct horse" })).status).toBe(200);
    expect(ben.jar.has(SESSION)).toBe(true);
  });
});
