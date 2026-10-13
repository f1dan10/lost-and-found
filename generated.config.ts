import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { MongoClient } from "mongodb";
import { assembleLostFound } from "./src/application.ts";
import { MemoryMailer } from "./src/concepts/Notifying/mailer.ts";
import { lostFoundPolicy } from "./src/host/http.ts";

// `sync-engine check` reads only the assembly's shape and calls no concept, so this client never connects.
const database = new MongoClient("mongodb://localhost").db("lostfound");

export default {
  assemble: () => assembleLostFound({ database, mailer: new MemoryMailer() }),
  title: "Lost&Found",
  wireName: "LostFoundWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/reusable/accounts.md", import.meta.url),
      new URL("./design/compositions/reusable/passwords.md", import.meta.url),
      new URL("./design/compositions/access.md", import.meta.url),
      new URL("./design/compositions/addressing.md", import.meta.url),
      new URL("./design/compositions/reports.md", import.meta.url),
      new URL("./design/compositions/matching.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy: lostFoundPolicy("http://localhost:3000"), name: "LostFoundWireHttp" })],
};
