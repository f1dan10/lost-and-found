# Testing

There are two kinds of checks. Automated tests run every concept and every endpoint against a real MongoDB. A manual walk through the app in the browser checks what the tests can't: that the screens update, that mistakes are explained, and that the layout works on a phone.

The latest test run is saved in [tests/output.txt](../tests/output.txt): 125 tests in 22 files, all passing. The README says how to run them.

## Automated tests

### Concepts (`tests/concepts/`)

Each concept test follows the concept's principle first, then checks the other cases:
- every refusal
- what a refusal leaves unchanged
- repeated actions
- ordering
- for anything that must be unique, two requests at the same instant

Every action, query and refusal in every specification runs in at least one test.

| Concept | Actions | Refusals tested |
|---|---|---|
| Registering | register | INVALID_USERNAME, USERNAME_TAKEN |
| Authenticating | set, authenticate | INVALID_PASSWORD, PASSWORD_SET, INVALID_CREDENTIALS |
| Sessioning | start, use, end | NOT_SIGNED_IN |
| Reporting | file, resolve, renew, withdraw | INVALID_REPORT, REPORT_NOT_FOUND, NOT_OPEN |
| Locating | addPlace, reposition, locate | INVALID_PLACE, PLACE_EXISTS, NO_PLACES, TOO_MANY_PLACES, INVALID_SPOT, UNKNOWN_PLACE, ALREADY_LOCATED |
| Notifying | setAddress, notify, markRead | INVALID_ADDRESS, UNKNOWN_RECIPIENT, NOTIFICATION_NOT_FOUND |
| Claiming | claim | ALREADY_CLAIMED, including two claims at once |
| Thanking | thank | INVALID_NOTE, ALREADY_THANKED, including two at once |

Time-based behaviour uses a clock the test controls:
- **Reporting:** a report expires after 14 days, and renewing moves its expiry forward.
- **Claiming:** a claim leaves the recent list after 30 days, but its record stays.

### Compositions (`tests/compositions/`)

These call the endpoints through the same typed client the frontend uses. They wait for the reactions to finish before checking what changed.

| File | What it checks |
|---|---|
| `journey.test.ts` | The whole user journey, from an empty database to the claim |
| `listing.test.ts` | The Found and Lost lists and the places |
| `matching.test.ts` | Match notices in both orders (found first or lost first), one notice per pair even when two buildings overlap, none for closed or expired reports |
| `claims.test.ts` | Claiming, claiming your own report, stale claims, two claims at once, the HTTP status codes |
| `claimed.test.ts` | The Claimed list never names the claimant; your own claims show the pickup details |
| `owning.test.ts` | Removing and closing your own report, and your own list |
| `expiry.test.ts` | Expired reports leave the lists and can't be claimed; renewing brings them back; old claims leave the Claimed list |
| `thanks.test.ts` | Only the claimant can thank, once; the finder is told |
| `notifications.test.ts` | Reading notices, and nobody marking another person's |
| `addressing.test.ts`, `signing-in*.test.ts` | Sign-up, sign-in, sessions, and the cookie over HTTP |

**Access control.** For every endpoint that changes a report or a notice, a test has another user try it and checks that nothing changed:
- Sam removing, closing or renewing Tom's report
- Tom thanking himself
- anyone claiming their own item
- someone marking another person's notice

Each gets `NOT_FOUND` (or `CLAIMING_OWN_REPORT` for your own item). `NOT_FOUND` is the same answer as for a report that doesn't exist, so nobody learns which ids belong to someone else.

## Walking through the app

On Oct 20 I ran the production build locally (`bun run build`, then `bun run start`). I walked through the app in the browser pane at phone width (334 px). At desktop width I only read the page text, without looking at the layout. Three people were signed up: Tamar in the browser, and Tom and Sam through the API.

| What I checked | Result |
|---|---|
| Posting the lost-item form with nothing filled in | Refused with "Pick a category." The form keeps what was typed. |
| Tamar posts a lost bottle in Buildings 2 and 34 | Toast: "Posted. You'll be told when someone finds a bottle in one of your buildings." The new card is outlined. |
| Tom finds a bottle in Building 2 | Tamar's bell showed 1 unread within 8 seconds, with no reload. Opening the notice showed the Found tab and outlined Tom's card. |
| Tamar claims it | "Is this yours?", then "It's yours: pick it up at Building 2, By the lobby bench". It offered to close her lost bottle report, and closing it worked. |
| Yours tab | Both claims with pickup details. The closed report shows as "You got it back". |
| Thanks with a preset note | "Thanks sent." The card now says "You thanked tom: 'You saved my day!'". |
| Tamar removes, closes, renews or thanks for Tom's report, from her signed-in browser's console | All four answered 404 `NOT_FOUND`, and Tom's report stayed in the list. |
| Sam claims an item while it is still on Tamar's screen, then Tamar claims it | The banner explains, and the item leaves her list. |
| Map tab | Real campus map with grey streets; each building's pin is where OpenStreetMap puts it. Choosing Building 34 lists its reports below the map. |
| Remove on my own report | Asks first ("You can't undo this"). "Keep it" cancels. |
| A session from a server that restarted | Back to the sign-in screen, not an error. |

### Problems the walk-through found, all fixed

- **The pickup sentence broke into three lines** in the claim dialog and on claimed cards.
- **Text areas used a monospace font.** The base styles didn't pass the page font to `textarea` and `select`.
- **The map's tile provider, CARTO, now needs an API key.** It answered every tile with "API key required". I switched to Esri's Light Gray Canvas, which needs no key and keeps the map quiet.
- **Every 8-second refresh redrew all the map markers.** That took a keyboard user's focus away. Markers now redraw only when a count, the selection or the zoom changes.
- **Building names overlapped on a phone.** Zoomed out, pins show only their counts; names appear from zoom 17, and every pin keeps its name as its label.
- **The building list sorted as text** (1, 10, 13, 2). It now sorts as numbers.
- **The tab buttons had no accessible names**, and the building checkboxes were named by their ids. Both now have proper labels.
- **The report form had to be scrolled, and its text was small.** I replaced the long list of building checkboxes with a search box: type "32" or "stata", pick the suggestion, and it becomes a chip. The form is now two columns on a laptop and fits without scrolling (531 px tall on a 900 px screen). Categories became icon chips. Body text went from 15 to 16 px.
- **Only 24 buildings were listed.** The seed now has all 112 MIT buildings with a number in OpenStreetMap. Utility structures such as the power plant and cooling towers are left out. On the map, empty buildings appear only when you zoom in.
- **The toast squeezed into half the width** on a phone.
- **The lost form's subtitle said the wrong people would be told.**
- **The claim refusals didn't say what happened next.** They now say where the item went.

### Not checked yet

- The same walk-through on the deployed app, and a proper look at the desktop layout.
- A photo taken with a real phone's camera.
- A screen reader beyond the accessibility tree.
