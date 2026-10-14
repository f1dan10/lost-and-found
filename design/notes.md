# Design notes

Notes for the Alpha (P2). The journey is in [alpha-journey.md](alpha-journey.md), and the screen recording is [demo.mp4](demo.mp4). The app runs locally: the server serves the Vue app and the API, and the data is in MongoDB.

## Plan

I built the Alpha in six steps, each small enough to test before the next one started, and I committed after each one.

1. **Set up and sign in.** Copy the project layout and password sign-in from ConceptBox. *Evaluated by:* the sign-in tests, and registering and logging in with `curl`.
2. **Four concepts, one at a time.** Reporting, Locating, Notifying, and Claiming, each with a specification, a class, and a test. *Evaluated by:* a test for each concept that follows its principle, plus a test for each refusal.
3. **Compositions.** The endpoints and the reactions that connect the concepts. *Evaluated by:* a test for each composition, including who is refused.
4. **The whole journey in one test.** Tamar and Tom, from an empty database to the claim. *Evaluated by:* that test passing, and its trace showing the actions in the order I expect.
5. **The Vue frontend.** *Evaluated by:* walking the journey in two browser windows, one signed in as each person.
6. **Recording and notes.** *Evaluated by:* a recording of at most two minutes that shows the journey working.

The recording follows the journey from Tamar's lost report to the notice Tom receives when she claims his item. It ends there, so Tamar's walk to Building 2 is not shown, and the app has nothing to show her at that point (see "What the claimer sees after a claim" under P3).

## Where things are

| | Design | Code | Tests |
|---|---|---|---|
| Concepts | `design/concepts/` | `src/concepts/` | `tests/concepts/` |
| Reactions, views, formers, endpoints | `design/compositions/` | `src/compositions/` | `tests/compositions/` |
| Which types each concept is instantiated with | `design/types.md` | `src/concepts.ts` | |
| The Vue frontend | | `frontend/src/` | |

There are seven concepts: Registering, Authenticating, and Sessioning (copied from ConceptBox), and my four: Reporting, Locating, Notifying, and Claiming. `bun test` runs 79 tests in 17 files, and all of them pass.

## How the plan changed

I planned to start by rewriting my P1 concepts into the engine's format. Instead I set up the project first, because the engine checks each specification against its code and I could not check a specification without a project to check it in. After that I did one concept at a time: specification, class, test.

The frontend came later, after the journey test passed, so every endpoint the screen calls was already tested before I built the screen.

Things I planned and did not build: withdrawing a report, a report expiring after 14 days, and renewing it when the owner confirms the item is still there. They are listed under P3 below.

## Significant decisions

**Copy sign-in from ConceptBox.** My P1 `Authenticating` concept did three jobs: accounts, passwords, and sessions. ConceptBox splits them into Registering, Authenticating, and Sessioning, and it is the better design, so I copied those three and their sign-in composition and changed only the names.

**Photos live in the report.** A photo is a small JPEG, shrunk to 400 pixels on the longest side in the browser, and stored as text inside the report. This avoids setting up file storage for the Alpha. The list endpoint sends photos inline for now.

**Email is printed.** `Notifying` sends through a `Mailer` that the app passes in. The server uses one that prints "would email tamar@mit.edu: ..." to the console, and the tests use one that remembers what was sent. Nothing real is sent, but every notice is also in the app, so nobody depends on the email.

**The buildings are fixed.** The server adds 18 buildings, such as "Building 2" and "W20 (Student Center)", when it starts, and skips the ones that exist. Their coordinates are approximate, because the Alpha has no real map.

**The Board is a grid of building tiles.** Each tile counts the open found and lost reports at that building, and clicking one lists them. It is built from the lists the page already loads, so it needed no endpoint of its own.

**The page checks for news every 8 seconds,** and again when the window gets focus. That is how Tamar's bell fills up after Tom's report without a refresh. The reactions run after the request is answered, so after a claim the page also asks again a moment later.

## Design changes from P1

- **No `Requesting.request`.** The engine has endpoints instead. My P1 reactions R1, R2, R5, and R6 became endpoints: one that files a report and puts it in its places, and one that claims. R3, R7, R8, and R9 stayed reactions.
- **Notifying has a subject, not a link.** A notice is about a report, so `Notifying` is `[Recipient, Subject]` and holds the report instead of a link string. The frontend builds the page address, so the concept knows nothing about the app's pages.
- **A fixed message when an item is claimed.** The P1 notice said who claimed the item, which needed joining strings inside a reaction. The notice now says "Your found item was claimed." and the notice list adds "Claimed by tamar" from Claiming and Registering.
- **People register with a username,** such as `tamar`, not an email. The mailer adds `@mit.edu`. The app does not yet check that someone is at MIT.
- **Locating dropped `confirm` and `forget`, Reporting dropped `renew` and `expire`, and Claiming dropped `retract`.** The engine checks that every action in a specification has code, so I removed them from the Alpha specifications instead of leaving them half-built.
- **Locating gained `_unknown`,** which lists the place ids that don't exist. The file endpoint uses it to refuse a bad place before anything is filed.
- **Nobody can claim their own report.** P1 only said a claim needs an open found report, so a finder could have claimed their own item.

## Challenges

**Refused actions are not undone.** When a request refuses at its second action, the first one has already happened. Filing a report and then failing to locate it would leave a report with no place. So the file endpoint checks everything first: the input check requires 1 to 12 places, and the view refuses an unknown place, both before `Reporting.file` runs. The same reason put the password length check ahead of registering in ConceptBox.

**Every endpoint needs a branch for every case.** A request that matches no branch is never answered and times out after 30 seconds. Each endpoint has a refused branch, such as `NOT_FOUND` for a claim on a report that isn't an open found report.

**Optional photo and spot.** A report may leave out the photo and the spot. A `null` photo from the browser was refused as invalid, so I fixed `Reporting.file` to treat `null` like no photo.

**Two people claiming at once.** A reaction cannot decide this safely, because by the time it looks, the other claim may already be in. So Claiming has a unique index on the item, and a test sends two claims together and expects exactly one to win.

**Reactions run after the answer.** After Tom files his report, the match notice is created a moment later. The tests wait for the engine to go idle before looking, and the page asks again after a claim.

## Interesting moments

Reading ConceptBox showed me that most of my P1 "essential reactions" were really endpoints. The reactions were the part that connected concepts after an action, such as telling the owner of a match and telling the finder of a claim. That made the split between "what a request does" and "what happens because of it" much clearer to me than it was in P1.

The journey test is where the pieces come togethers. Tamar's lost report, Tom's found report, her notice, her claim, and his notice all happen through concepts that never call each other. `TRACE=1 bun test tests/compositions/journey.test.ts` prints each action and the endpoint or reaction that made it, in order.

After the lecture on colour blindness I changed found and lost from green and red to blue and orange. Checking my own work showed me that the Board counts and the cards separated found from lost by colour alone, so I added the words and the icons too.

## Found and lost colours: green/red to blue/orange

Found and lost moved from green and red to blue (`#0369a1`) and orange (`#c2410c`) so people with red-green colour blindness can tell them apart. The tokens are in `frontend/src/reusable/styles/tokens.css`.

Rule: colour is never the only cue. Every place that separates found from lost also says so in words and uses a distinct icon: a pin for found and a magnifier for lost. Report cards have a "Found" or "Lost" chip, and Board tiles read "2 found" and "1 lost".

Contrast (WCAG): white on found 5.9:1, white on lost 5.2:1, found on its soft tint 5.2:1, lost on its soft tint 4.7:1. All are at least 4.5:1.

The unread badge on the notification bell uses the danger colour, not the lost colour, so it doesn't read as a lost-item cue.

The P1 sketches and journey (`design/p1/ui-sketches.md`, `design/p1/user-journey.md`, and the sketch images) predate this change and still show green and red pins. They are left as the submitted P1 record.

## What remains for P3

- **Reports that expire.** Add `expire` and `renew` to Reporting, and `confirm` to Locating, so a report drops off after 14 days unless the person says the item is still there (P1's R4).
- **Withdrawing a report.** `Reporting.withdraw` exists, but no endpoint or button uses it yet.
- **A lost report filed after a found item.** Only a new found report notifies owners. If Tamar posts after Tom, she sees his card in the list but gets no notice.
- **What the claimer sees after a claim.** Right now a claimed item just disappears. Claiming resolves the report, the lists show only open reports, and the dialog closes, so Tamar is left with no building and no spot to pick the bottle up from. P1's outcome said the report closes and its pin leaves the map, but I did not think about the person who claimed it. The fix is a confirmation in the claim dialog that says where to pick it up, using the card the page already has. After that, a "My claims" list with the building and spot, so the details survive a reload.
- **Undoing a claim,** for someone who claimed by mistake.
- **MIT only.** Check that the person is at MIT when they register.
- **Real email.** Replace the console mailer.
- **A real map,** with the building coordinates, instead of the tile board.
- **Photos in their own endpoint,** or in file storage, so the lists stay small.
- **Tests for the frontend.** Right now I check it by walking the journey in two browsers.
