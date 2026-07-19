# Validation summary

World Laboratory v0.3 was validated from the packaged source set intended for the GitHub branch.

## Automated results

- System tests: **19/19 passed**.
- Scenario checks: **8/8 passed**.
- Scenario runs: **15 one-hour worlds** across areas `1×`, `2×`, and `4×`.

## Integrity checks

The uploaded GitHub blobs for the critical packaged files match the locally tested files:

- `core.payload1.js`;
- `core.payload2.js`;
- `core.js`;
- `app.payload.js`;
- `test.payload.js`;
- `scenarios.payload.js`;
- `index.html`;
- `worker.js`.

The unpacked world core and browser app both pass JavaScript syntax checking.

## Environment note

A graphical Chromium screenshot could not be produced inside the development container because its GPU/EGL process could not initialize. This is an environment limitation, not a detected JavaScript failure. Browser-facing code is additionally covered by payload integrity checks, syntax validation, and the worker test logic. A final visual check remains part of the manual test after deployment.
