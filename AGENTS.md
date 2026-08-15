# AGENTS.md

## What this is
Browser console userscript: archive or hide all posts on a Facebook profile timeline.
Single source file: `src/index.js`. No build, package manager, tests, or lint.

## How it runs
- Paste `src/index.js` into the browser console on the user's Facebook **profile timeline**.
- Mobile layout required: DevTools device mode (README: iPhone SE / any phone size). Desktop FB DOM will not match.
- Auto-starts via trailing `archiveOrHide()`. Resume after stop: `archiveOrHide()` in console.

## Implementation gotchas
- DOM is Facebook mobile web only. Selectors:
  - Menu: `[aria-label="More options for post"]` then fallback `"Actions for this post"`
  - Actions: `"Move to archive"` / `"I don't want to see this"`
  - Hide confirm flow uses hard-coded `data-action-id` values (`32762`/`32763`, then `id-1`, then `99`) — FB can break these anytime
- Flow is nested `setTimeout` only ("slow and horrible"): ~3s steps on hide path, 5s recurse after archive. No async/await or observers.
- After hide confirm, the processed menu button node is `remove()`'d so the next query finds a new post.
- Prefer archive when both could apply; code branches archive first.

## Working here
- Do not add npm/node tooling unless asked.
- Keep the script self-contained and console-pasteable (no imports/bundler).
- When FB UI drifts, fix selectors/timings in `src/index.js` and update README usage if the run/resume story changes.
- Verify only in a real browser against live FB mobile layout; there is no automated test path.