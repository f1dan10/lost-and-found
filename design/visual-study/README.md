# Visual design study

The two slides are in [visual-study.pdf](visual-study.pdf): one on typography and one on colour. Each slide shows the examples I looked at and notes, in the margin, what I took from them. This page repeats those notes and says where each choice shows up in Lost&Found.

I compared the options on the real screens before choosing: three palettes and five type options, each drawn on a found card, a lost card, and a claimed card, with colour-blind simulations and contrast ratios.

## What I looked at

**For type:** MBTA station signs, MIT building numbers, newspaper headlines and bylines, lost-item posters around campus, and the US Web Design System.

**For colour:** the MBTA line colours, the Okabe–Ito colour-blind-safe palette, newsprint, and road signs.

## Typography

| What I noticed | What I chose | Where it shows up |
|---|---|---|
| Transit signs use a bold sans with a tall x-height, so you can read them while walking. | **Public Sans** for everything except item titles. It is neutral like campus signs and stays readable at 13–15 px. | Labels, buildings, times, buttons, forms. |
| Newspapers set the story in a serif and the facts (byline, time) in a sans. | **Source Serif 4 at weight 600** for the item description, which is the card's title. | Every report card and the detail dialog. A card reads like a small posted notice. |
| Lost posters lead with one huge word, then what and where. | One clear order on every card: what (title), where (building and spot), who and when (small, muted). | Card layout. |
| The US Web Design System pairs Public Sans with Source Serif. | That pairing, which mixes a serif and a sans as the course suggests. | The whole app. |
| Building codes mix the shapes I, l, 1, O and 0 (W20, Building 1, Building 10). | I compared Atkinson Hyperlegible, which tells these shapes apart best, but did **not** choose it: it is wide, so cards fit fewer words per line. Public Sans keeps these shapes distinct enough at our sizes. | Building chips. |
| Figtree, the Alpha's font, is round and friendly. | **Dropped.** It was also never loaded: `tokens.css` asked for it, but `index.html` had no font link, so every visitor saw their own system font. | |

**Type scale:** 26 / 18 / 15 / 13 px, for the page title, card title, body and labels. Emphasis comes from weight, never from a new size.

## Colour

| What I noticed | What I chose | Where it shows up |
|---|---|---|
| Newsprint has no colour until something needs it. | **Ink `#191A1E` on paper `#F4F4F1`** for everything that isn't a state. Primary buttons are ink, not a brand colour. | Page, cards, buttons, top bar. |
| Road signs: orange asks for attention, blue informs. | **Found `#0369A1` blue**: good news, someone has your thing. **Lost `#C2410C` orange**: someone needs help. | Tabs, chips, card edges, map pins. |
| The Okabe–Ito palette keeps blue and orange apart for every common kind of colour blindness. | Blue and orange are the only two hues that separate found from lost. | Same. |
| The T names every line on every sign, so its colours are never the only cue. | Colour is never the only cue. Found has a pin and the word "Found", lost has a magnifier and "Lost", claimed has a check and "Claimed". | Every chip, tab and map pin. |
| A protanopia simulation turned the Alpha's indigo accent (`#4338CA` → `#0057CE`) into almost the same blue as found (`#0369A1` → `#4E6BA3`). | **Dropped the indigo accent.** | Buttons are ink now. |
| Most apps colour "done" green. | **Claimed `#475467`, a graphite grey with a check.** A claimed item is finished, so it goes quiet instead of competing with found and lost. Green would also be confused with orange under deuteranopia. | The Claimed tab and claimed cards. |

**Contrast (WCAG 2.2):**

| Pair | Ratio |
|---|---|
| Text on page | 15.8:1 |
| White on found | 5.9:1 |
| White on lost | 5.2:1 |
| White on claimed | 7.7:1 |
| Muted text `#5D5F66` on card | 6.4:1 |
| Lost on its tint | 4.6:1 |

Every text pair passes AA (4.5:1).

## Layout choices from the same study

- **Fitts's law.** Every tap target is at least 44 px tall, the claim button spans the card's width, and the add button is 64 px in the bottom-right corner. The actions people take most are the biggest and closest.
- **Gestalt grouping.**
  - **Proximity:** each card has zones in a fixed order: photo, what, where, who and when, then actions.
  - **Common region:** an owner's actions (renew, close, remove) sit in their own tinted footer.
  - **Similarity:** found, lost and claimed keep one colour and one icon everywhere.
