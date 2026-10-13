import { describe, expect, test } from "bun:test";
import { assemble, conceptSet } from "@mit-sdg/sync-engine/assembly";
import { createGateway, type Gateway } from "@mit-sdg/sync-engine/boundary";
import type { ContractShape } from "@mit-sdg/sync-engine/client";
import { authenticating } from "../../src/concepts/Authenticating/registry.ts";
import { registering } from "../../src/concepts/Registering/registry.ts";
import { sessioning } from "../../src/concepts/Sessioning/registry.ts";
import { composition as accounts } from "../../src/compositions/reusable/accounts.ts";
import { composition as passwords } from "../../src/compositions/reusable/passwords.ts";
import { testDatabase } from "../support/reusable/mongo.ts";

/** The endpoint's answer, or a test failure naming its error. */
async function call(gateway: Gateway<ContractShape>, path: string, input: object): Promise<Record<string, string>> {
  const result = await gateway.invoke(path, input);
  if (!result.ok) throw new Error(`${path} answered ${JSON.stringify(result)}`);
  return result.value as Record<string, string>;
}

/** Another app's sign-in, assembled from the reusable compositions it copies and only the concepts they need. */
describe("An app copies accounts with one way of signing in", () => {
  test("accounts and passwords", async () => {
    const concepts = conceptSet({ Registering: registering, Authenticating: authenticating, Sessioning: sessioning });
    const application = assemble({
      conceptSet: concepts,
      instances: concepts.implementations("mongo", { database: await testDatabase() }),
      composition: { reusable: { accounts, passwords } },
    });
    const gateway = createGateway({ application });

    await call(gateway, "/auth/register", { username: "ben", password: "correct horse" });
    const { session } = await call(gateway, "/auth/login", { username: "ben", password: "correct horse" });
    expect(await call(gateway, "/auth/me", { session })).toEqual({ username: "ben" });
    expect(await gateway.invoke("/auth/commons/start", {})).toMatchObject({ ok: false });
  });
});
