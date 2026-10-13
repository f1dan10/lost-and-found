import type { OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { LostFoundWire } from "../../generated/wire.ts";
import { assembleLostFound } from "../../src/application.ts";
import { MemoryMailer } from "../../src/concepts/Notifying/mailer.ts";
import { testDatabase } from "./reusable/mongo.ts";
import { ok } from "./reusable/results.ts";
import { printTrace } from "./trace.ts";

/** Lost&Found on a fresh database, with an in-memory mailer, called through its typed client. With TRACE set, it prints each action. */
export async function startLostFound(observers: OperationalObserver[] = []) {
  const database = await testDatabase();
  const mailer = new MemoryMailer();
  const logSink = process.env.TRACE ? printTrace() : undefined;
  const application = assembleLostFound({ database, mailer }, { observers, logSink });
  const api = createLocalClient<LostFoundWire>({ invoker: createGateway<LostFoundWire>({ application }) });

  async function register(username: string) {
    return ok(await api.auth.register({ username, password: "correct horse" }));
  }

  /** Adds a place to choose from, such as "Building 2", and returns its id. */
  async function addPlace(name: string) {
    return ok(await application.concepts.Locating.addPlace({ name, latitude: 42.36, longitude: -71.09 })).place;
  }

  return { database, mailer, application, api, register, addPlace };
}
