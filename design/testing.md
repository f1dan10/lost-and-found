# Testing

157 automated tests in 24 files all pass. The last run is in [tests/output.txt](../tests/output.txt). The tests run against a real MongoDB.

## Concepts (`tests/concepts/`)

Each test follows the concept's principle, then checks every refusal, repeated actions, and two requests at once where something must be unique.

| Concept | Refusals tested |
|---|---|
| Registering | INVALID_USERNAME, USERNAME_TAKEN |
| Authenticating | INVALID_PASSWORD, PASSWORD_SET, INVALID_CREDENTIALS |
| Sessioning | NOT_SIGNED_IN |
| Reporting | INVALID_REPORT, REPORT_NOT_FOUND, NOT_OPEN |
| Locating | INVALID_PLACE, PLACE_EXISTS, NO_PLACES, TOO_MANY_PLACES, INVALID_SPOT, UNKNOWN_PLACE, ALREADY_LOCATED |
| Notifying | INVALID_ADDRESS, UNKNOWN_RECIPIENT, NOTIFICATION_NOT_FOUND |
| Claiming | ALREADY_CLAIMED, NOT_CLAIMED, ALREADY_COLLECTED |
| Thanking | INVALID_NOTE, ALREADY_THANKED |

A test clock checks that reports expire after 14 days and that claims leave the recent list after 30.

## Compositions (`tests/compositions/`)

These call the endpoints through the frontend's client. They cover:
- the whole journey
- matching in both orders
- claims, including two at once
- pickup, thanks, expiry and renewal
- notices, and signing in

**Access control:** when another user tries to remove, close, renew, thank for or pick up someone else's report, the answer is `NOT_FOUND` and nothing changes.

## Frontend (`tests/frontend/`)

- `sections.test.ts`: what each sidebar section lists, including 100 claims with 98 picked up.
- `search.test.ts`: the search rules.

## Manual checks

On Oct 21 I walked through the production build at 1024, 1280 and 1440 px wide, with three users. I checked:
- searching
- claiming and picking up
- thanks
- renewing
- the map
- the status codes over HTTP

**Problems found and fixed:**
- Claiming closed the detail panel.
- The pickup box stayed after pickup.
- "1 matches" was ungrammatical.
- The report form needed scrolling.
- Only 24 buildings could be chosen.
- The map tiles needed an API key.
- The map refresh stole keyboard focus.

**Not checked:** screens narrower than 1024 px (the app is for laptops), and a real screen reader.
