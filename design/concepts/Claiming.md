# Claiming

## Purpose

Make taking a thing accountable by recording who took it.

*Prevents:* two people both take the same item; a claim has no account behind it; nobody can tell a claimed item still waiting to be picked up from one already taken away.

## Principle

Tamar claims the bottle Tom found. When anyone asks who claimed it, they are told Tamar, with the time she claimed it. When a second person tries to claim the same bottle, they are refused with "This item has already been claimed." Tamar finds the bottle among the claims she made, and anyone looking at what was claimed in the last 30 days finds it there; after 30 days it is no longer among the recent claims, but who claimed it is still recorded. When Tamar picks the bottle up, she marks it collected, and anyone who asks is told when; marking it collected again is refused with "This item was already picked up."

## Types

```types
external Claimant
  The person who takes the item.

external Item
  The thing that is taken.
```

## State

```state
a set of Claims with
  a claimant Claimant
  a unique item Item
  a claimedAt DateTime
  an optional collectedAt DateTime

Rule: a claim is collected at most once, and only after it was made.
```

## Actions

```actions
claim(claimant: Claimant, item: Item) : returns (item: Item)
  where some claim has item
  then
    refuses ALREADY_CLAIMED "This item has already been claimed."
  where no claim has item
  then
    add a new claim with claimant, item, and claimedAt now
    returns item

collect(item: Item) : returns (item: Item)
  where no claim has item
  then
    refuses NOT_CLAIMED "Nobody has claimed this item."
  where the claim of item has a collectedAt
  then
    refuses ALREADY_COLLECTED "This item was already picked up."
  where the claim of item has no collectedAt
  then
    set the collectedAt of the claim of item to now
    returns item
```

## Queries

```queries
_getClaimant(item: Item) : optional (claimant: Claimant, claimedAt: DateTime)
  Returns who claimed the item and when, or no row when the item is unclaimed or unknown.

_getCollected(item: Item) : optional (collectedAt: DateTime)
  Returns when the item was picked up, or no row when it is unclaimed, unknown, or not picked up yet.

_recent(days: Number) : many (item: Item, claimant: Claimant, claimedAt: DateTime)
  Returns each claim made in the last days days, counted back from now, newest claimedAt first and then by item identifier descending. Returns no rows when days is not a positive number or nothing was claimed in that time.

_byClaimant(claimant: Claimant) : many (item: Item, claimedAt: DateTime)
  Returns each item this claimant claimed, however long ago, newest claimedAt first and then by item identifier descending. Returns no rows when they claimed nothing.
```
