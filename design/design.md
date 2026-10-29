# Design

Lost&Found helps MIT people get lost things back. A finder reports an item with a photo and leaves it where it is. An owner searches the found items, or posts what they lost and is told when a match turns up.

Live app: https://lostandfound.mit-sdg.dev/

## The final design

- **Eight concepts**, each in [`concepts/`](concepts/) with its code in `src/concepts/`:
  - *Registering*, *Authenticating*, *Sessioning*: accounts and sign-in, from ConceptBox.
  - *Reporting*: found and lost reports that expire after 14 days and can be renewed.
  - *Locating*: which buildings a report is in, and the spot.
  - *Notifying*: notices in the app and by email.
  - *Claiming*: one person claims a found item, later picks it up.
  - *Thanking*: a claimer thanks the finder.
- **Seven compositions** in [`compositions/`](compositions/) connect them. Endpoints carry the access checks. Reactions do the follow-on work: a new found report notifies matching owners, a claim notifies the finder, and a claim closes the claimer's own matching lost report.
- **One journey** ([full text](user-journey.md)): Tamar posts a lost bottle, Jack reports one found, Tamar is told, claims it, picks it up and thanks Jack. [`tests/compositions/journey.test.ts`](../tests/compositions/journey.test.ts) runs it.

## What changed since P1

Specifications at P1: [`p1/concepts.md`](p1/concepts.md), commit [01f83ea](https://github.com/f1dan10/lost-and-found/commit/01f83ea).

- **Sign-in split in three.** One `Authenticating` concept did accounts, passwords and sessions. ConceptBox separates them, so I copied its three.
- **Notifying holds a subject, not a link.** The concept no longer knows the app's pages.
- **Notices have fixed text.** "Claimed by tamar" is added when the list is built, from Claiming and Registering, not joined inside a reaction.
- **Expiry is a rule, not an action.** Reports carry `expiresAt`, and `renew` extends it. P1's `expire`, `confirm`, `forget` and `retract` are gone.
- **Matching works in both orders.** A lost report posted after a found item is matched too ([1146820](https://github.com/f1dan10/lost-and-found/commit/1146820)).
- **Claiming closes the claimer's matching lost report** ([cfa6045](https://github.com/f1dan10/lost-and-found/commit/cfa6045)). Matching is a guess, so the other owners' notices stay.
- **Thanking is new** ([630c090](https://github.com/f1dan10/lost-and-found/commit/630c090)). Claiming ended at the claim, and the finder never heard back.
- **Nobody can claim their own report.**

## What changed since P3

P3 design: [043b93c](https://github.com/f1dan10/lost-and-found/commit/043b93c).

- **Sidebar, list and detail panel replace five tabs** ([fd32f0d](https://github.com/f1dan10/lost-and-found/commit/fd32f0d), [9ec3cae](https://github.com/f1dan10/lost-and-found/commit/9ec3cae)). The tabs mixed kinds, views, statuses and people, so your own reports sank under 100 claims. Sections are now Found, Lost, Map, Returned, Waiting on you, Your reports, Your claims and History.
- **List or grid.** A toggle above the items switches between compact rows and cards with large photos, like the list and icon views in macOS Finder. The choice is remembered in the browser. Both views show the same facts.
- **The logo goes home.** It returns to Found with the search and filters cleared.
- **Fixed the empty notification menu.** Its content was wider than the menu, so "No new notices" sat off-centre.
- **Colour:** found is blue, lost is orange and returned is green ([visual study](visual-study/visual-study.pdf)). Every state also has a word and an icon, so colour is never the only cue.
- **Category shows in each row.** Before, only screen readers got it.

## Decisions and challenges

- **Refused actions are not undone.** If a request fails at its second action, the first has already happened. So endpoints check everything first, before `Reporting.file` runs.
- **Two claims at once.** A reaction cannot decide this safely. Claiming has a unique index on the item, and a test sends two claims together.
- **Photos live in the report** as a small data URL, resized in the browser. Simple, but lists send every photo.
- **Email is printed to the console.** Every notice is also in the app.
- **Access control is in the back end.** Owner-only actions answer `NOT_FOUND` for everyone else, so a stranger cannot tell whether a report exists.

## Code review for P4

I reviewed the back end for access control and error handling. Each fix started with a failing test ([`review.test.ts`](../tests/compositions/review.test.ts)).

- **Orphan report:** a spot of only spaces passed validation and then failed in Locating, after the report was filed. It is now refused up front.
- **Claimant leak:** an owner with a match notice could see who claimed the found item. Only the person who filed the report is told now.
- **Photos:** only image data URLs under 700 KB are accepted. A link would have made every viewer's browser fetch it.
- **Report cards** no longer carry the reporter's internal id.
- **Production:** with `NODE_ENV=production`, the server refuses to start without `MONGODB_URI`, so data is never silently kept in memory. Unexpected errors return a plain 500.

## Not built

- **MIT-only sign-in.** Anyone can register.
- **Real email.** Notices go to the console.
- **Approving or undoing a claim.** Anyone can claim any found item, and a finder cannot release it. This is the biggest gap.
- **Rate limits** on sign-in and posting.
- **Photos in file storage.** The lists send them inline, and the page re-reads them every 8 seconds.
- **Screens narrower than 1024 px.** The app is for laptops.

## Testing

- **Automated:** `bun run test` runs the concept tests (each principle, each refusal, two requests at once) and composition tests through the same client the page uses, including who is refused. The last run is in [`tests/output.txt`](../tests/output.txt).
- **Manual:** two browsers signed in as different people, walking the journey, in both list and grid views, with the keyboard.
