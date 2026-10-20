# Locating

## Purpose

Let things be found by where they are.

*Prevents:* an item is in a place that doesn't exist, or in no place; an item has two locations; someone misses an item that is there, or is shown one that isn't.

## Principle

Tom locates a found bottle in Building 2, with the spot "by the lobby bench". Tamar doesn't know where she lost her bottle, so she locates it in Building 2, Stata, Building 34, and W20. When Sam looks at Building 2, he sees both bottles, and each bottle is a neighbor of the other, once, because they share Building 2. When Tom locates his bottle again, he is refused with "This item already has a location." When Tom names a place nobody added, he is refused with "That place doesn't exist."

## Types

```types
external Item
  The thing that is somewhere.

opaque PlaceList
  A set of places, written as a list; its order and repeats don't matter.
```

## State

```state
a set of Places with
  a unique name String
  a latitude Number
  a longitude Number

a set of Items with
  a places set of Place
  an optional spot String

Rule: a place's name has 1 to 60 characters once trimmed, and Locating compares names exactly as stored, so "Building 2" and "building 2" are different places.
Rule: a latitude is between -90 and 90, and a longitude is between -180 and 180.
Rule: an item has 1 to 12 places.
Rule: a spot has 1 to 100 characters once trimmed.
```

## Actions

```actions
addPlace(name: String, latitude: Number, longitude: Number) : returns (place: Place)
  where name is blank or longer than 60 characters once trimmed, or latitude or longitude is not a number on Earth
  then
    refuses INVALID_PLACE "A place needs a name of 1 to 60 characters and a latitude and longitude on Earth."
  where some place has the trimmed name
  then
    refuses PLACE_EXISTS "There is already a place with that name."
  where the place is acceptable and no place has the trimmed name
  then
    add a new place with the trimmed name, latitude, and longitude
    returns place

locate(item: Item, places: PlaceList, spot?: String) : returns (item: Item)
  where places has no place
  then
    refuses NO_PLACES "An item needs at least one place."
  where places has more than 12 different places
  then
    refuses TOO_MANY_PLACES "An item can be in at most 12 places."
  where spot is given and is blank or longer than 100 characters once trimmed
  then
    refuses INVALID_SPOT "A spot must have 1 to 100 characters."
  where some place in places is not in Places
  then
    refuses UNKNOWN_PLACE "That place doesn't exist."
  where item is in Items
  then
    refuses ALREADY_LOCATED "This item already has a location."
  where the places and the spot are acceptable, every place exists, and item is not in Items
  then
    add item to Items with the different places in places, and the trimmed spot if one is given
    returns item
```

## Queries

```queries
_getItemsAt(place: Place) : many (item: Item)
  Returns each item that has this place, ordered by item identifier ascending. Returns no rows when nothing is there or the place is unknown.

_getNeighbors(item: Item) : many (other: Item)
  Returns each other item that has at least one of this item's places, once however many places they share, ordered by item identifier ascending. Returns no rows for an unlocated item or one that shares no place.

_getPlacesOf(item: Item) : many (place: Place, name: String)
  Returns each place the item has, with its name, ordered by name and then place identifier. Returns no rows for an unlocated item.

_getSpot(item: Item) : optional (spot: String)
  Returns the item's spot, or no row when the item is unknown or has no spot.

_getPlaces() : many (place: Place, name: String, latitude: Number, longitude: Number)
  Returns every place with its coordinates, ordered by name and then place identifier. Returns no rows when no place was added.

_unknown(places: PlaceList) : many (place: Place)
  Returns each listed place that does not exist, in the order listed and without repeats. Returns no rows when every listed place exists.
```
