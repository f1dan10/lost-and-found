import { reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Reporting, Locating, Notifying } = concepts;

/**
 * When a found item is given a place, the reporter of each open lost report of the same category that shares one
 * of its places is told. An expired lost report is not open, so its reporter is not told. The lost reports come from
 * `_getNeighbors`, which gives each one once, so sharing two places gives one notice, not two.
 * Repeating `category` below means the two reports' categories must be equal.
 */
const NotifyOwnerOfMatch = reaction(({ found, lost, category, reporter }) =>
  when(Locating.locate({ item: found }).responds({ item: found }))
    .where(
      Reporting._getReport({ report: found }).is({ kind: "FOUND", category }),
      Locating._getNeighbors({ item: found }).is({ other: lost }),
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

/**
 * The mirror of NotifyOwnerOfMatch: when a lost item is given its places, its reporter is told of each open found
 * report of the same category that is already at one of them, once per found report.
 */
const NotifyOwnerOfEarlierFind = reaction(({ lost, found, category, reporter }) =>
  when(Locating.locate({ item: lost }).responds({ item: lost }))
    .where(
      Reporting._getReport({ report: lost }).is({ kind: "LOST", category, reporter }),
      Locating._getNeighbors({ item: lost }).is({ other: found }),
      Reporting._getOpen({ kind: "FOUND", category }).is({ report: found }),
    )
    .then(
      Notifying.notify({
        recipient: reporter,
        message: "An item that may be yours was already found.",
        subject: found,
      }),
    ),
);

export const composition = {
  notifying: { NotifyOwnerOfMatch, NotifyOwnerOfEarlierFind },
};
