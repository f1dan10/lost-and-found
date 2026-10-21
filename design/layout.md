# Layout

Lost&Found is a website for laptop and desktop browsers. Every screen has the same three columns under one header. The sidebar says where you are, the middle lists that place, and the right side shows the item you chose. One search box in the header searches everything.

## Why not tabs

The Beta first had five tabs (Found, Lost, Map, Claimed, Yours), and the screen design broke down:

- **The tabs mixed different kinds of thing.** Found and Lost are kinds of report, Map is a way of looking, Claimed is a status, and Yours is a person.
- **Yours did not scale.** Claims came first, so someone with 100 claims had to scroll past all of them to reach their own reports.
- **Nothing said what needed you.** A pickup waiting, a possible match, and a report about to expire looked like any other card.
- **Finished things never left.** An item picked up a month ago looked like one waiting today.

I compared six layouts as mockups: browse and mine, map first, a home that says what needs you, sidebar and detail, one list with filters, and a status board. Since this is a website, the sidebar and detail layout fits best.

## The sections

| Group | Section | What it lists |
|---|---|---|
| Campus | Found | Open found items, newest first, with category chips and a sort by building |
| | Lost | Open lost items, the same way |
| | Map | The same open items on a campus map, by building |
| | Returned | Found items claimed in the last 30 days. It never says who claimed them |
| Yours | Waiting on you | Items to pick up, possible matches for my lost items, and my reports with 3 days or fewer left |
| | Your reports | My open reports, then the expired ones I can renew |
| | Your claims | Items I claimed and haven't picked up |
| | History | Items I picked up, and my reports that are closed or removed, newest first, 20 at a time |

The rows of every section are computed in one place, `frontend/src/lostfound/sections.ts`, so the sidebar counts, the list, the search and the notices always agree. `tests/frontend/sections.test.ts` checks each section, including the case of 100 claims with 98 picked up: Your claims shows 2 and History holds 98.

## "I picked it up"

A claim used to be the end of the story, so a claim from last month looked like one waiting today. Picking an item up is now its own step. `Claiming.collect` records when, the finder is told, and the item moves from Waiting on you to History. This is the one backend change the layout needed.

## Search

The search box filters the section on screen as you type. The sidebar counts change to show how many matches each section has, and a section with no matches says where else there are some, so a search never hides what it found somewhere else.

A row matches when every word typed matches the start of a word in one of these:
- its description
- its category
- its buildings, by number or nickname, so "32" and "stata" both work
- its spot
- the person named on it

So "pink bott" finds "Pink Hydro Flask… Bottle", but "pen" doesn't find "open". A plural finds the singular. Matched words are highlighted. Press / to jump to the box and Esc to clear it. The rules are in `frontend/src/lostfound/search.ts` and tested in `tests/frontend/search.test.ts`.

## The detail panel

Every action happens in the panel, not in a dialog, so the list stays in view:

| Item | What the panel offers |
|---|---|
| Someone else's found item | "This is mine". It asks "Is this yours?" in place, because the finder sees who claimed, then moves to the claim |
| My claim | Where to pick it up, "I picked it up", and "Say thanks". Right after claiming, it also offers to close my matching lost report |
| Someone else's lost item | "Report it as found" |
| My open report | Still there or still looking (renew), I got it back, Remove (which asks first) |
| Finished items | What happened, and the thank-you note if there was one |

The two forms, reporting an item and saying thanks, are still dialogs, because they are short tasks that end where they started.

## Design principles

- **Fitts's law.** Sidebar entries are full-width 44 px targets along the screen's edge. "Report an item" is in the top-right corner of the header. The main action always sits in the same place in the panel.
- **Gestalt grouping.** The three columns are three regions: where, what, and this one. Rows keep the same zones (picture, title, where and who, state). The Yours sections group their rows under headings such as "To pick up".
- **Recognition over recall.** Counts are always visible, so nobody has to remember where something went. The search accepts what people remember: a building's nickname, a colour, a person.
- **Informative.** A toast confirms each action and says what happens next, for example "Marked as picked up. tom will be told."
