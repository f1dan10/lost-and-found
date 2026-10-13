import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { authenticating } from "./concepts/Authenticating/registry.ts";
import { claiming } from "./concepts/Claiming/registry.ts";
import { locating } from "./concepts/Locating/registry.ts";
import { notifying } from "./concepts/Notifying/registry.ts";
import { registering } from "./concepts/Registering/registry.ts";
import { reporting } from "./concepts/Reporting/registry.ts";
import { sessioning } from "./concepts/Sessioning/registry.ts";

export const applicationConceptSet = conceptSet({
  Registering: registering,
  Authenticating: authenticating,
  Sessioning: sessioning,
  Reporting: reporting,
  Locating: locating,
  Notifying: notifying,
  Claiming: claiming,
});

export const { concepts } = applicationConceptSet;
