# Lost&Found

A lost-and-found web app for MIT. A finder reports an item with one photo and leaves it where it is. An owner searches the found items, or posts what they lost and is told when a match turns up.

**Live app:** https://lostandfound.mit-sdg.dev/ · **Demo video:** [watch](https://drive.google.com/file/d/1WH2_m3oVceDW14GxP5PWHLp9bM6UBRcD/view?usp=sharing)

6.1040 Software Design, Fall 2026.

## Read more

- **[User journey](design/user-journey.md):** Tamar loses a bottle, Jack finds it, and she gets it back.
- **[Design document](design/design.md):** the final design, what changed since P1 and P3, the code review, and what is not built.
- **Specifications:** [concepts](design/concepts), [compositions](design/compositions), and [types](design/types.md).
- **Tests:** [what runs and the last results](tests/output.txt).
- **P1 design:** [problem framing](design/p1/problem-framing.md), [pitch](design/p1/pitch.md), [concepts](design/p1/concepts.md), [sketches](design/p1/ui-sketches.md), [journey](design/p1/user-journey.md).
- **Visual design:** [study (PDF)](design/visual-study/visual-study.pdf).

## Inspiration

- **List and grid views** come from macOS Finder, where a folder can be shown as a list or as icons.
- **The layout** (sidebar, list, detail panel) borrows from Gmail's single main action, Linear's grouped sidebar and Notion's always-visible navigation.
- **Sign-in** is copied from ConceptBox: the Registering, Authenticating and Sessioning concepts.
- **Colour and type** come from the MBTA map and painted signposts, and from the type in Gmail, Linear and Notion. See the visual study.

## Run it locally

You need [Bun](https://bun.sh). MongoDB is optional.

```
bun install && bun install --cwd frontend
bun run build
bun run start
```

Open http://localhost:3000. Without `MONGODB_URI`, data is kept in memory and lost when the server stops. Notices are printed to the server console instead of emailed.

| Variable | Meaning | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string. Required when `NODE_ENV=production`. | in memory |
| `PORT` | Port to listen on. | `3000` |
| `HOST` | Interface to listen on, such as `0.0.0.0`. | the system default |
| `PUBLIC_ORIGIN` | The address browsers use. Set it to the site's URL when deployed. | `http://localhost:$PORT` |

For development with a hot-reloading page, run `bun run dev` and `bun run dev` inside `frontend/`, then open http://localhost:5173.

## Deploy

Build with `bun run build`, start with `bun run start`, and set the variables above. `GET /health` answers `ok`.

## Test it

```
bun run test
```

The tests use an in-memory MongoDB, so there is nothing to set up. The first run downloads it, and the suite takes about two minutes.

- `bun run check` checks the specifications against the code and types.
- `bun run test:save` saves the output to `tests/output.txt`.
- `bun test tests/concepts/Claiming.test.ts` runs one file.
- `bun run trace` prints each action of the journey test and what caused it.
