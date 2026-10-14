import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { LostFoundWireHttp } from "../../../generated/wire.ts";

/** A typed client for every endpoint, built from `generated/wire.ts`. The session travels in an HttpOnly cookie, so no call sends it. */
export const api = createHttpClient<LostFoundWireHttp>({ baseUrl: "/api" });
