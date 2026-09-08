# Dungeon Reset

**The heroes get the adventure. You clean up afterward.**

A single-room browser game by Ernest Turner. Return three defeated monsters, reset three trap types, mend the door, refill the treasure, clean the floor, and handle complaints before five increasingly strong hero parties arrive. Normal shifts take about 11–12 minutes; opening the doors early shortens a run.

## Play locally

Double-click **Start Dungeon Reset.cmd**, then open **http://127.0.0.1:4173**. Node.js 22 or newer must be installed (it is installed on the development machine). No npm installation is needed just to play or develop the vendored game. Leave the server window open while playing. Close it to stop the server.

From a terminal:

```powershell
npm run dev
```

The browser release is `dist/index.html` plus its sibling files. Serve the entire `dist` directory with any static HTTP host. For a production-build local preview, run `npm run preview`. Use an HTTP server, rather than double-clicking HTML, because browsers restrict local-file texture loading.

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Return a monster | Drag to its named station | Drag, or use clipboard Return |
| Repair / refill / reset / sweep | Hold the object; or select a clipboard job and hold Space / gold button | Hold object / gold button |
| Resolve a complaint | Hold a stationed monster | Same |
| Pause / resume | Esc or P; Pause button | Pause button |
| Mute all audio | M or Sound button | Sound button |
| Restart | Pause → Restart → confirm | Same |
| Expand play view | Expand button | When browser fullscreen is supported |

The pause menu also has separate music and reduced-motion settings. Partial work persists when released. Switching away pauses active play. The clipboard provides keyboard-accessible alternatives to dragging.

## Rules and score

- A returned monster fights at 65% morale effectiveness; resolve its complaint for full strength. Grub is a brawler, Mr. Bones hits harder, and happy Pudding slows heroes and gains extra damage.
- Spikes, bolts, and fire each deal different damage, scaled by repair progress. A sound door grants up to 20% extra defense damage. Clean floors improve damage and earn a preparation bonus.
- A stocked chest earns up to 150 bonus points. Survivors finding it empty throw a tantrum and smash the door; this extra damage persists into the next repair phase.
- Raids visibly wear down defenses. Unvisited fixtures and unengaged monsters retain their restoration. Hero parties increase from 3 to 7 members with varied durability.
- Return staff: +40 each. Complete maintenance/morale: +60. Finish cleaning: +35. Raid preparation: up to +200 readiness, +150 treasure, +90 cleanliness. Defeated heroes: +150 / +180 / +210 / +240 / +270 across the five raids.
- The top five completed scores and audio/motion settings are stored in this browser’s local storage. Runs in progress are not saved. Different browser origins have separate records.

## Build and test

```powershell
npm run build                 # Self-contained static files and SHA-256 manifest in dist/
npm test                      # Deterministic gameplay and persistence tests
npm ci                        # Only needed for browser tests / Sites scaffold development
npm run test:browser           # Installed Chrome; real inputs plus accelerated full runs
node tests/realtime-play.mjs  # About 12 minutes; real-clock complete run, no acceleration
```

`TEST_URL` overrides the browser-test URL. The normal server binds only to 127.0.0.1. `PORT` overrides port 4173. The release archives and checksums are in `release/`; `TEST-REPORT.md` records the exact tested build, methods, and limits. `dist/build-manifest.json` identifies every shipped file by SHA-256.

Main implementation: `public/game/core.js` (gameplay model), `game.js` (Phaser, input, UI, Web Audio), `style.css` / `index.html`, and `assets/`. `scripts/serve.mjs` and `scripts/build.mjs` need only Node built-ins. `npm run dev:site` and `build:site` retain the generated Sites wrapper for future hosting work; the verified release path uses the static build.

## Credits and limitations

Concept and creative direction: Ernest Turner. Implementation, design collaboration, art direction, and testing: Codex. Original ImageGen artwork and synthesized audio; complete provenance and prompts in `public/game/CREDITS.md`. Phaser 3.90.0 is [MIT licensed](https://phaser.io/download/license); its full notice is bundled.

Desktop keyboard/mouse is the primary experience. Touch controls are supported and tested in mobile emulation; a real iOS/Android device has not been tested. Small screens are easiest in landscape or with the clipboard. Fullscreen depends on browser support. Scores cannot persist when browser storage is blocked or cleared, and the results screen reports a save failure. No mid-run resume, remapping, gamepad support, or screen-reader description of the animated battle is provided.

Public publishing requires Ernest’s approval. This project does not create accounts, contact anyone, or use network services while playing.
