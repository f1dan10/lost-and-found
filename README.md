# Lost&Found

A lost-and-found web app for MIT. A finder reports an item with one photo and leaves it where it is. An owner searches the found items, or posts what they lost and is told when a match turns up.

6.1040 Software Design, Fall 2026.

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
2. [Design notes](design/notes.md), including the [plan](design/notes.md#plan)
3. [Screen recording](design/demo.mp4)
4. [Concepts](design/concepts), [compositions](design/compositions) and [types](design/types.md)

## P3: Beta

**Live app:** https://lostandfound.mit-sdg.dev/

New since the Alpha:
- **Features:** reports expire and can be renewed, owners can close or remove reports, matching works in both orders, a claimer marks an item picked up and can thank the finder, all MIT buildings, and a real campus map.
- **Interface:** a sidebar, a list and a detail panel, with one search box.

1. [Beta user journey](design/beta-journey.md)
2. [Visual design study](design/visual-study/README.md)
3. [Layout](design/layout.md)
4. [Testing](design/testing.md), with the last run in [tests/output.txt](tests/output.txt)

### Run it

You need [Bun](https://bun.sh) and MongoDB.

```
bun install && bun install --cwd frontend
MONGODB_URI=mongodb://localhost:27017/lostfound bun run build && MONGODB_URI=mongodb://localhost:27017/lostfound bun run start
```

Open http://localhost:3000. Without `MONGODB_URI`, data is kept in memory. Email notices print to the server console. `bun run check` checks the specs against the code.

### Run the tests

```
bun install
bun run test
```

The tests use an in-memory MongoDB, so no setup is needed. The first run downloads it. The suite takes about two minutes.
- `bun run test:save` saves the output to `tests/output.txt`.
- `bun test tests/concepts/Claiming.test.ts` runs one file.
- `bun run trace` prints each action in the journey test and what caused it.
