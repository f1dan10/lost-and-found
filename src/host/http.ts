import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";
import { accountsHttp } from "../compositions/reusable/accounts.ts";
import { passwordsHttp } from "../compositions/reusable/passwords.ts";

/**
 * The HTTP settings: the API under /api, each refusal returned as an HTTP category, and the session
 * in an HttpOnly cookie that signing in sets and sign-out clears. A refusal that the compositions
 * declare but that is missing from `publicErrors` reaches the browser as INTERNAL_ERROR (500).
 */
export function lostFoundPolicy(publicOrigin: string): HttpPolicy {
  return httpPolicy({
    publicOrigin,
    basePath: "/api",
    publicErrors: {
      ...accountsHttp.publicErrors,
      ...passwordsHttp.publicErrors,
    },
    cookies: {
      session: accountsHttp.sessionCookie("lostfound-session", passwordsHttp.startingSessions),
    },
  });
}
