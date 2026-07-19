# Draft PR notes

## What changed

- Added a complete browser and headless World Laboratory v0.3.
- Added deterministic seeds and three logical map sizes.
- Added a spatial hash to reduce unnecessary all-to-all searches.
- Added experimental factions, territories, generals, packs, retreats, duels, carcasses and rebirth.
- Added browser quick checks, Node system tests and long scenario runs.
- Added reports and documentation separating observations, experiments and AI proposals.

## Validation

- 19/19 system tests passed.
- 8/8 scenario checks passed.
- 15 one-hour worlds completed.

## Important review notes

- Do not treat current faction names or coefficients as final design decisions.
- CI is manual-only during this milestone to avoid notification spam from partial commits.
- GitHub Pages deploys from `main` after the PR is accepted.
