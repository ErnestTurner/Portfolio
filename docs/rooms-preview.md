# Twelve-room preview

The separate `/rooms/` wing adds twelve illustrated interactions to the existing preview. The original homepage, its real gameplay screenshots and surprise selector, all game files, and the existing Pages Functions remain unchanged.

This work is based on `preview/interactive-playground` at `f37b0d8abb47ff14374771be0c2f0185c48e0c0d`. That preview contains toy improvements beyond production; starting from it preserves those improvements. Deploy only to the existing `ernest-turner` Pages project with branch `preview/interactive-playground`. Production branch `main` is outside this change.

| Room | Action and visible result |
| --- | --- |
| Concerned Hall | Opening new doors gradually bends the architecture; visited doors stay marked. All rooms remain available. |
| Workbench | Draw with pointer or touch, or use three keyboard-accessible stamps; send a copy to the museum. |
| Museum | Swap cup, key, and spoon to discover botanical, whale, and moon shadows; move the lamp. |
| Library | Three books unfold into a paper ocean, mountains, or a night garden. |
| Observatory | Turn a constellation; drop a marble which returns from above. |
| Specimen Room | Light, warmth, and taps produce different responses in three specimens. |
| Soft Materials | One press deforms gel, a spring, and a ribbon; release produces a bounded spring response. |
| Mirror Room | An object moves and turns while three reflections reverse, stretch, or lag. |
| Traffic Control | A switch routes a visible exhibit signal. The existing Traffic game can be loaded on demand or opened separately. |
| Indoor Weather | Arrange clouds, rain, and plants; drain collected water into the hall. |
| Behind the Walls | Raise a real linked pulley illustration and route blue or amber light to change the museum shadow. |
| Somewhere Else | A freestanding portal shows three landscapes and sends a parcel to the hall; one view reveals Dungeon Reset. |

## State and navigation

Hash routes such as `/rooms/#/museum` support reload, history, previous/next, a select control, and a directory. The directory always links directly to all eight unchanged games, which open in a separate tab. Existing game returns still lead to the original bench. Traffic's optional iframe has its own game pause and a close control that unloads it.

Only `trikzik-twelve-rooms-preview-v1` is stored. Stored data is bounded and validated. Storage failure keeps the visit functional in memory. Rewind visibly resets room effects and preserves both the draft and the museum copy; it never clears or reads game save keys. The drawing sheet is bounded to 30 strokes, with explicit feedback when full, and offers undo and clear-strokes controls.

The illustrated rooms use no backend, accounts, audio, camera, external fonts, live AI, or third-party JavaScript. Existing site services are unchanged. The room pause and reduced-motion preference cover room animations; existing games retain their own controls.

## Verification

Run the repository tests with `node --test tests/*.test.mjs`. The new state tests cover malformed values, bounded artwork, deep copies, safe rewind, unavailable storage, and namespace isolation.

`node tests/rooms-browser.mjs` runs the browser checks. It requires Playwright and an installed Edge channel by default. Set `PLAYWRIGHT_MODULE` to an existing Playwright module entry when it is not installed locally; set `ROOMS_BROWSER` to another supported channel if needed. `ROOMS_URL` targets a deployed `/rooms/` URL; omission starts an isolated local static server. `ROOMS_EVIDENCE` selects the screenshot/report directory, otherwise `.rooms-evidence/` is used and ignored by Git.

The browser matrix covers all twelve rooms at 1440px, 390px, and 320px; desktop and phone screenshots; pointer drawing and touch stamps; keyboard controls; all cross-room consequences; history and reload; rewind preservation; pause and reduced motion; storage denial; game route bodies; Traffic iframe load/unload; errors and failed requests. This is desktop browser automation with mobile emulation, not physical-device or screen-reader certification. Existing games were not replayed end to end.

Build the curated public artifact with `node scripts/build-pages-artifact.mjs`. It now includes `rooms/`; tests, docs, scripts, and evidence stay out of the asset upload. A release must use a clean archive of the exact pushed preview commit and retain the unchanged `functions/` alongside the artifact for Pages compilation. No Pages settings or bindings are changed.
