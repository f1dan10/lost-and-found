/**
 * The HTTP server: the API under /api, a health check, and the built Vue app.
 *
 * Settings come from the environment: PORT, PUBLIC_ORIGIN (the origin browsers use), and MONGODB_URI.
 */
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { type Db, MongoClient } from "mongodb";
import type { LostFoundWire } from "../../generated/wire.ts";
import { assembleLostFound } from "../application.ts";
import { ConsoleMailer } from "../concepts/Notifying/mailer.ts";
import { lostFoundPolicy } from "./http.ts";
import { seedPlaces } from "./seed.ts";

const port = Number(process.env.PORT ?? 3000);
const publicOrigin = process.env.PUBLIC_ORIGIN ?? `http://localhost:${port}`;
const site = `${import.meta.dir}/../../frontend/dist`;

console.log("Connecting to MongoDB...");
const database = await connect(process.env.MONGODB_URI);
console.log("Connected. Adding any missing buildings...");
await seedPlaces(database);
const application = assembleLostFound({ database, mailer: new ConsoleMailer() });
const gateway = createGateway<LostFoundWire>({ application });
const handleApi = createHttpHandler({ application, gateway, policy: lostFoundPolicy(publicOrigin) });

const NO_REFERRER = { "Referrer-Policy": "no-referrer" };

const server = Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/")) return handleApi(request);
    if (pathname === "/health") return new Response("ok");
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });

    // A path such as /assets/index.js names a file in the built app; every other path is served index.html.
    const asset = Bun.file(site + pathname);
    if (pathname !== "/" && (await asset.exists())) return new Response(asset, { headers: NO_REFERRER });
    const page = Bun.file(`${site}/index.html`);
    if (await page.exists()) return new Response(page, { headers: NO_REFERRER });
    return new Response("The frontend isn't built yet: run `bun run build`.", { status: 404 });
  },
});
console.log(`Lost&Found is listening on ${server.url} for ${publicOrigin}.`);

async function connect(uri: string | undefined): Promise<Db> {
  if (uri === undefined) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memory = await MongoMemoryServer.create();
    console.warn("MONGODB_URI is not set, so the server stores data in memory and loses it when it stops.");
    return (await new MongoClient(memory.getUri()).connect()).db("lostfound");
  }
  // Give up after 10 seconds, so an unreachable database is reported in the log before the platform's health check stops the app.
  return (await new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 }).connect()).db();
}
