# Simulator

`index.html` is the visual World Laboratory v0.3.

Files:

- `core.js` and `core.payload*.js` — deterministic world simulation, spatial hash, factions, packs, combat, carcasses and rebirth;
- `app.js` and `app.payload.js` — canvas rendering and interface;
- `worker.js` — quick browser checks without freezing the visible world;
- `test.js` — 19 system tests for Node.js;
- `scenarios.js` — 15 one-hour runs and aggregate report generation;
- `headless.js` — one configurable non-visual simulation run.

Run locally from repository root:

```bash
npm run serve
npm test
npm run test:scenarios
node simulator/headless.js 7200
```
