# Spatial study 01

This preview-only revision is based on `633140b1ec142a489de8bfe72bfc1575a2dc1a31`. It changes the hall, workbench and Scribble Engine presentation. The remaining ten rooms, seven other games, root homepage, save formats and Pages Functions are unchanged.

`rooms/spatial-models.js` contains real mesh geometry: segmented wall openings, door leaves, floor, ceiling, window/skylight, furniture, instrument, and retained rain/parcel effects. `spatial-renderer.js` uses native WebGL with perspective cameras, depth testing, directional light, a single 1024px shadow-map pass, and bounded pixel ratio (1.5). It has no dependency or continuous idle animation. Camera moves last 550ms; pause or reduced motion settles immediately. CPU draw timings are diagnostic submission/layout measurements, not GPU timings or FPS.

HTML hotspots are projected from the mesh positions. Keyboard links and the room index provide direct navigation. Small-screen pointer activation identifies a doorway first; a second tap enters. Keyboard activation remains one step. A labeled SVG illustration remains available if WebGL cannot initialize or loses context.

The workbench approaches the selected instrument, then opens the actual Scribble Engine in a persistent dialog iframe. Step back pauses the active workspace and preserves the same iframe session, including across room navigation and rewind. A separate-window link remains available. Reloading retains the original game's existing behavior: session-only artwork requires export; named setups can be downloaded. The sheet/museum state remains in the original preview namespace and is not cleared by this revision.

`games/scribble-engine/instrument.css` is local to that game on this preview branch. Its inline changes concern labels and the non-exported hardware overlay. Existing draw state, palette defaults, geometry algorithms, recipe/replay logic, and export serialization remain unchanged. `?instrument=1` hides the redundant inner return link only.

## Validation

- `node --test tests/*.test.mjs`: 99 tests, including real aperture/window occupancy checks and existing geometry, replay and state invariants.
- `tests/rooms-browser.mjs`: 117 checks across all rooms at desktop/390px/320px, navigation, cross-room state, reset preservation, pointer drawing, touch stamps, WebGL scene pixels, paused cameras, instrument session retention, reduced motion, and storage denial.
- Bounded Scribble smoke: actual 600x600 PNG and SVG downloads, nonempty artwork, Recipe/Replay playback and pause.
- Connected Chrome inspected at 1440x1000 and 390x844; before/after screenshots are in `/rooms/comparison/`.

The local connected-browser connector showed blank iframe content and did not report download completion; isolated Edge reproduced neither issue and passed both workflows. Public-preview verification is recorded separately in the task evidence. Mobile testing is emulation, not physical-device certification. The scene is a deliberately simple low-poly study with baked authored compositions; there are no physics claims or photorealistic materials.

Deploy only a clean archive of the exact pushed `preview/interactive-playground` commit to the existing `ernest-turner` Cloudflare Pages preview. Preserve Functions and project settings. Production remains outside this change.
