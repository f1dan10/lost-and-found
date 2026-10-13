import type { OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { LostFoundWire } from "../../generated/wire.ts";
import { assembleLostFound } from "../../src/application.ts";
import { testDatabase } from "./reusable/mongo.ts";
import { ok } from "./reusable/results.ts";
import { printTrace } from "./trace.ts";

/** Lost&Found on a fresh database, called through its typed client. With TRACE set, it prints each action. */
export async function startLostFound(observers: OperationalObserver[] = []) {
  const database = await testDatabase();
  const logSink = process.env.TRACE ? printTrace() : undefined;
  const application = assembleLostFound({ database }, { observers, logSink });
  const api = createLocalClient<LostFoundWire>({ invoker: createGateway<LostFoundWire>({ application }) });

  async function register(username: string) {
    return ok(await api.auth.register({ username, password: "correct horse" }));
  }

  return { database, application, api, register };
}
