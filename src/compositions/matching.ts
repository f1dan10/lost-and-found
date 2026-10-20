import { reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Reporting, Locating, Notifying } = concepts;

/**
 * When a found item is given a place, each open lost report of the same category that includes that place
 * tells its reporter. An expired lost report is not open, so its reporter is not told. Repeating `category` and `place` below means the values must be equal.
 */
const NotifyOwnerOfMatch = reaction(({ found, lost, category, place, reporter }) =>
  when(Locating.locate({ item: found }).responds({ item: found }))
    .where(
      Reporting._getReport({ report: found }).is({ kind: "FOUND", category }),
      Locating._getPlacesOf({ item: found }).is({ place }),
      Locating._getItemsAt({ place }).is({ item: lost }),
      Reporting._getOpen({ kind: "LOST", category }).is({ report: lost }),
      Reporting._getReport({ report: lost }).is({ reporter }),
    )
    .then(
      Notifying.notify({
        recipient: reporter,
        message: "An item matching your lost report was found.",
        subject: found,
      }),
    ),
);

export const composition = {
  notifying: { NotifyOwnerOfMatch },
};
