# Visual design study

My study is in [visual-study.pdf](visual-study.pdf), on two pages:
- **Layout Design**, with a section on typography.
- **Color Inspiration.**

Each page collects the examples I looked at and notes what I took from them. This page repeats those notes and says where each choice shows up in Lost&Found.

## Layout

A left sidebar with grouped menu items, inspired by Gmail, Linear and Notion. The full layout is described in [layout.md](../layout.md).

| Example | What I took from it | Where it shows up |
|---|---|---|
| **Gmail's Compose button** | One clear primary action at the top. | "+ Report an item", the one filled button in the header. It opens the two choices: I lost something, I found something. |
| **Linear's sidebar sections** | Menu items grouped under headings. | The sidebar's two groups, **Campus** (Found, Lost, Map, Returned) and **Yours** (Waiting on you, Your reports, Your claims, History). |
| **Notion's persistent sidebar** | A left sidebar that is always there. | The sidebar stays in place while the list and the detail panel change, and each entry shows its count. |

## Typography: clear and familiar

A classic serif for headings gives a welcoming, familiar feel. A clean sans-serif for navigation, buttons and item details keeps information readable and easy to scan.

| Role | Font | Where it shows up |
|---|---|---|
| Headings and item titles | **Source Serif 4**: 700 for page and section headings, 600 for item titles | "Found around campus", "Lost around campus", each item's description, the Lost&Found wordmark |
| Interface | **Libre Franklin**: 400 for body, 600 to 700 for labels and buttons | The sidebar, buttons, buildings, times, forms, e.g. "Report an item · Building 4 · 21 min ago" |

Both fonts load from Google Fonts in `frontend/index.html`, and the tokens are in `frontend/src/reusable/styles/tokens.css`.

**Type scale:** 28 / 19 / 16 / 14 px, for headings, item titles, body and labels. Body text is 16 px, the browser's default. Emphasis comes from weight, not from new sizes.

## Colour: distinct, not similar

Examples: the MBTA transit map, the Olympic pictograms, Google's logo, and painted signposts. Each uses a few bold hues that look very different from each other, so they are easy to tell apart. Similar shades, like red and burgundy, are not. In Lost&Found, each item state gets its own distinct colour.

| State | Colour | Where it shows up |
|---|---|---|
| Lost | **Orange `#C2410C`** | Lost tags, the Lost marker in the sidebar, lost pins on the map |
| Found | **Blue `#1D5FD1`** | Found tags, the Found marker, found pins on the map |
| Returned (claimed or picked up) | **Green `#15803D`** | Claimed and Picked up tags, the Returned marker, the pickup box |
| Everything else | **Ink `#191A1E` on paper `#F4F4F1`** | Page, cards and buttons. The primary button is ink, so the only colours on screen mean something. |

Each state colour also has a pale tint for backgrounds: blue `#E8EFFC`, orange `#FCEFE6`, green `#EEF8F1`.

**Colour is never the only cue.** Every tag pairs its colour with a word and an icon:
- Found: a pin
- Lost: a magnifier
- Claimed: a check

**Contrast (WCAG 2.2).** Every text pair passes AA (4.5:1).

| Pair | Ratio |
|---|---|
| Ink text on paper | 15.8:1 |
| White on blue (found) | 5.8:1 |
| White on orange (lost) | 5.2:1 |
| White on green (returned) | 5.0:1 |
| Muted text `#5D5F66` on white | 6.4:1 |
| Blue on its tint | 5.0:1 |
| Orange on its tint | 4.6:1 |
| Green on its tint | 4.6:1 |

The green tint was made paler until green text on it passed.

**Colour-blind check.** In a deuteranopia simulation, orange and green come out as similar olive tones, while blue stays clearly apart from both. This is why the word and the icon are on every tag: someone who can't tell orange from green still reads "Lost" with a magnifier or "Claimed" with a check.

## Layout principles

- **Fitts's law.**
  - Every target is at least 44 px tall.
  - Sidebar entries span the sidebar's full width along the screen's edge.
  - "Report an item" sits in the header's top-right corner.
  - The main action ("This is mine", "I picked it up") spans the detail panel's width, always in the same place.
- **Gestalt grouping.**
  - **Common region:** the three columns are three regions: where you are, what's there, and the one you chose.
  - **Proximity:** every row has the same zones in the same order: picture, title, where and who, then the state tag.
  - **Similarity:** each state keeps one colour and one icon everywhere: rows, tags, sidebar markers and map pins.
