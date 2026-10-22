# Embedded Scribble repair

Scope: fix the workbench instrument opening/lifecycle defect only. The spatial model, camera compositions, materials and other rooms are unchanged. The initial study remains available at https://ad692dc4.ernest-turner.pages.dev/rooms/#/workbench (commit a1d8debb8bd3fe288decf136734d33ce8ace2348).

## Evidence and change

In connected Chrome, the original camera-completion callback created the iframe and assigned its source 560 ms after the click. The dialog appeared, but the child stayed at about:blank without a load/error event. Clean Chrome and Edge did not reproduce this behavior. A local controlled comparison using the same canonical game URL still failed with delayed assignment and loaded successfully when assignment moved into the activating click. The underlying reason for the connected-profile sensitivity is unconfirmed; browser settings/extensions/security controls were not changed.

`rooms/instrument-view.js` now starts navigation before the camera timer, while the authored approach still completes before showing the dialog. The canonical directory URL avoids the Pages index.html redirect. The game sets a single readiness marker after its existing initialization; drawing algorithms, state, serialization and exports are unchanged.

The persistent viewer shows a loading state until that marker and the working controls exist. After eight seconds without readiness it offers direct access and an explicit retry only for an empty, never-ready about:blank document. A loaded session is never replaced automatically. A late successful load is paused if the visitor has stepped back or left the workbench. Route cleanup cancels the approach and closes/pauses the viewer without unloading it.

## Verification

Use `node --test tests/*.test.mjs`, `tests/rooms-instrument-browser.mjs` and `tests/rooms-browser.mjs` with the existing Playwright workflow. The focused browser harness tests failure, retry, delayed loading, close/reopen, route changes and responsive/reduced-motion behavior. Connected Chrome inspection and deployed results are recorded in the task's `evidence/embed-repair` directory.
