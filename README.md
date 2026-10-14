# Lost&Found

A campus-only lost-and-found web app for the MIT community. A finder reports an item with one photo and leaves it where it is; an owner searches one map of found items, or posts what they lost and is notified when a match is found.

Personal project for 6.1040 Software Design, Fall 2026.

## P1: Design

1. [Problem framing and stakeholders](design/p1/problem-framing.md)
2. [Application pitch](design/p1/pitch.md)
3. [Concept design](design/p1/concepts.md)
   - [Concept specifications](design/p1/concepts.md#concept-specifications)
   - [Essential reactions](design/p1/concepts.md#essential-reactions)
   - [Note on the roles of the concepts](design/p1/concepts.md#roles-of-the-concepts)
4. [UI sketches](design/p1/ui-sketches.md)
5. [User journey](design/p1/user-journey.md)

## P2: Alpha

1. [Alpha user journey](design/alpha-journey.md)
2. [Design notes](design/notes.md), which include the [plan](design/notes.md#plan)
3. [Screen recording of the journey](design/demo.mp4), about two minutes
4. Concept specifications are in [design/concepts](design/concepts), compositions in [design/compositions](design/compositions), and the types each concept is instantiated with in [design/types.md](design/types.md).

### Run it

You need [Bun](https://bun.sh) and a MongoDB server.

```
bun install && bun install --cwd frontend
MONGODB_URI=mongodb://localhost:27017/lostfound bun run build && MONGODB_URI=mongodb://localhost:27017/lostfound bun run start
```

Open http://localhost:3000. To try the journey, sign up as one person in a normal window and as another in a private window. Without `MONGODB_URI`, the server keeps its data in memory and loses it when it stops. Email notices are printed to the server's console.

`bun run test` runs the tests, and `bun run check` checks the specifications against the code and runs TypeScript.