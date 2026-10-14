# Alpha plan

I built the Alpha in six steps, each small enough to test before the next one started. Each step ends with `bun run check` and `bun test` passing, and I committed after each one.

1. **Set up and sign in.** Copy the project layout and password sign-in from ConceptBox. Evaluated by the sign-in tests, and registering and logging in with `curl`.
2. **Four concepts, one at a time.** Reporting, Locating, Notifying, and Claiming, each with a specification, a class, and a test. Evaluated by a test for each concept that follows its principle, plus a test for each refusal.
3. **Compositions.** The endpoints that file a report, list reports and places, claim a report, and list notices, and the reactions that tell an owner about a match and a finder about a claim. Evaluated by a test for each composition, including who is refused.
4. **The whole journey in one test.** Tamar and Tom, from an empty database to the claim. Evaluated by that test passing, and its trace showing the actions in the order I expect.
5. **The Vue frontend.** Sign-in, the Found and Lost lists, the add form, the Board, the claim dialog, and the notification bell. Evaluated by walking the journey in two browser windows, one signed in as each person.
6. **Recording and notes.** *Evaluated by:* a recording of at most two minutes that shows the journey working.

How the plan changed is in [the design notes](notes.md#how-the-plan-changed).
