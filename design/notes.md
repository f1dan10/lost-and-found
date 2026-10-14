# Design notes

## Found and lost colours: green/red to blue/orange

Found and lost moved from green and red to blue (`#0369a1`) and orange (`#c2410c`) so people with red-green colour blindness can tell them apart. The tokens are in `frontend/src/reusable/styles/tokens.css`.

Rule: colour is never the only cue. Every place that separates found from lost also says so in words and uses a distinct icon: a pin for found and a magnifier for lost. Report cards have a "Found" or "Lost" chip, and Board tiles read "2 found" and "1 lost".

Contrast (WCAG): white on found 5.9:1, white on lost 5.2:1, found on its soft tint 5.2:1, lost on its soft tint 4.7:1. All are at least 4.5:1.

The unread badge on the notification bell uses the danger colour, not the lost colour, so it doesn't read as a lost-item cue.

The P1 sketches and journey (`design/p1/ui-sketches.md`, `design/p1/user-journey.md`, and the sketch images) predate this change and still show green and red pins. They are left as the submitted P1 record.
