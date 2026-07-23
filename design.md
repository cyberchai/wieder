# Design guidelines

Conventions for visual/UI work in this app. Keep additions short and rule-shaped.

## Accent color on cards / rows

- **Never use a left-side-only (single-edge) accent color on a card or list row.**
  No left "spine" bars, no single colored edge hugging one side.
- If a card or row should carry an accent color, **color the whole border
  (all four sides)**, not one edge.
- Prefer revealing the accent **on hover** rather than at rest, so the resting
  state stays calm.

_Example: the `neilson` theme's set rows use a 2px border on all sides that
lights up in a rotating muted "library" hue on hover — see the `.neilson`
rules in `src/app/globals.css`._
