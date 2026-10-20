# Thanking

## Purpose

Let a person who got something back thank whoever made it possible.

*Prevents:* someone is thanked twice for the same thing; a thank-you note is blank or too long to show.

## Principle

Tamar gets her bottle back and thanks Tom for it with the note "You saved my week!". When anyone asks about the bottle, they are told Tamar thanked for it, when she did, and what she wrote. When Tamar tries to thank for the bottle again, she is refused with "This has already been thanked for." Sam gets his keys back and thanks with no note; his thanks is recorded with no note.

## Types

```types
external Thanker
  The person who says thank you.

external Item
  The thing they are thankful for.
```

## State

```state
a set of Thanks with
  a thanker Thanker
  a unique item Item
  an optional note String
  a thankedAt DateTime

Rule: a note has 1 to 140 characters once trimmed, and is stored trimmed.
```

## Actions

```actions
thank(thanker: Thanker, item: Item, note?: String) : returns (item: Item)
  where note is given and is blank or longer than 140 characters once trimmed
  then
    refuses INVALID_NOTE "A thank-you note must have 1 to 140 characters."
  where some thanks has item
  then
    refuses ALREADY_THANKED "This has already been thanked for."
  where the note is acceptable and no thanks has item
  then
    add a new thanks with thanker, item, the trimmed note if one is given, and thankedAt now
    returns item
```

## Queries

```queries
_getThanks(item: Item) : optional (thanker: Thanker, thankedAt: DateTime)
  Returns who thanked for the item and when, or no row when nobody has.

_getNote(item: Item) : optional (note: String)
  Returns the note sent with the thanks for the item, or no row when nobody has thanked for it or the thanks has no note.
```
