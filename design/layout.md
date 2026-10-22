# Layout

A website for laptops. Under one header there are three columns: the sidebar (where you are), the list (what's there), and the detail panel (the item you chose). One search box searches everything.

## Why not tabs

The first Beta had five tabs: Found, Lost, Map, Claimed, Yours.
- The tabs mixed kinds, views, statuses and people.
- With 100 claims, your own reports were 100 cards down.
- Nothing showed what needed you.
- Finished items never left.

I tried six layouts as mockups. The sidebar with a detail panel fit a website best. It was inspired by:
- **Gmail:** one primary action at the top, "Report an item".
- **Linear:** sidebar sections grouped into Campus and Yours.
- **Notion:** a sidebar that is always there.

## Sections

| Group | Section | Lists |
|---|---|---|
| Campus | Found, Lost | Open items, newest first |
| | Map | The same items by building |
| | Returned | Items claimed in the last 30 days, without the claimer's name |
| Yours | Waiting on you | Pickups, possible matches, reports about to expire |
| | Your reports | Open reports, then expired ones to renew |
| | Your claims | Claimed, not picked up yet |
| | History | Picked up, closed or removed |

All sections come from `frontend/src/lostfound/sections.ts`, so the counts, the list and the search always agree.

## Search

Typing filters the current section. The sidebar counts show the matches in every section. Every word you type has to match the start of a word in an item's description, category, building (number or nickname), spot or person. Press / to search and Esc to clear.

## Detail panel

Every action happens in the panel, so the list stays in view.
- **Someone else's found item:** "This is mine", with a confirmation first.
- **My claim:** where to pick it up, "I picked it up", and "Say thanks".
- **Someone else's lost item:** "Report it as found".
- **My open report:** renew, "I got it back", or Remove.

## Principles

- **Fitts's law:** 44 px targets. "Report an item" is in the corner, and the main action is always in the same place.
- **Gestalt:** the three columns are three regions, and each state keeps one colour and one icon.
- **Recognition over recall:** counts are always visible, and search accepts building nicknames.
