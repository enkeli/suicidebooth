# How to use the suicidebooth browser extension

Archive or hide posts on your **Facebook profile timeline** using a small Chrome-compatible extension. Same idea as the console script, but with a **Start / Stop** popup and counters.

**Current package:** [dist/suicidebooth-extension-v0.1.1.zip](../dist/suicidebooth-extension-v0.1.1.zip)

| | |
|---|---|
| Works on | Desktop Chromium (Chrome, Brave, Edge, …) · Android via [Quetta Browser](https://www.quetta.net/) (Chrome-extension support) |
| Must use | Facebook **mobile web** layout (phone UI), not desktop Facebook |
| Where to run | Your **profile timeline** (your posts) — not Home, not someone else’s profile |
| Login | Always on real `facebook.com` — the extension never asks for your password |

---

## Before you start (both platforms)

1. **Log into Facebook** in the browser you will use.
2. Open **your own profile** → timeline where your posts appear.
3. Stay on the **mobile** Facebook UI:
   - **Android / Quetta:** normal phone Facebook site is already mobile.
   - **Desktop:** turn on DevTools device mode (phone size) *or* use a narrow window / mobile user-agent so Facebook serves the mobile layout. Desktop Facebook menus do not match what the extension clicks.
4. After installing or updating the extension, **reload** the Facebook tab so the script attaches.

**What “success” looks like:** popup status goes to `running`, **Archived** and/or **Hidden** counts go up slowly (several seconds per post). Use **Stop** anytime.

---

## Install

### Option A — Download the zip (easiest)

1. Download: [suicidebooth-extension-v0.1.1.zip](../dist/suicidebooth-extension-v0.1.1.zip)
2. Unzip it. You should see `manifest.json` **directly inside** the folder (not nested in another random folder).
3. Follow the platform steps below and choose that folder when loading the extension.

### Option B — From a git clone

Use the `extension/` folder in this repo (same files as the zip).

---

## Desktop browser (Chrome, Brave, Edge, …)

### 1. Load the extension

1. Open the extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
2. Enable **Developer mode** (usually top-right).
3. Click **Load unpacked**.
4. Select the unzipped folder (or repo `extension/`) that contains `manifest.json`.
5. Confirm **suicidebooth** appears and is enabled.

Pin it to the toolbar if you want one-click access to the popup.

### 2. Prepare Facebook (mobile layout)

1. Go to [facebook.com](https://www.facebook.com) and open **your profile timeline**.
2. Open **Developer Tools** (F12 or right-click → Inspect).
3. Turn on **device toolbar** / responsive mode.
4. Pick a phone preset (e.g. **iPhone SE**) or any phone width.
5. Reload the page so Facebook redraws the **mobile** UI.
6. Scroll until you can see your posts.

> If you skip device mode, Start may run but find no post menus (`menuFound: false` in Diagnose).

### 3. Run

1. Click the **suicidebooth** extension icon (popup opens).
2. Optional: tap **Diagnose** — you want `"menuFound": true`.
3. Press **Start**.
4. Leave the tab open; do not switch back to desktop layout mid-run.
5. Press **Stop** to halt (pending timers are cleared).

### 4. Update later

1. Download the new zip and replace the folder contents, **or** pull git and refresh the folder.
2. On `chrome://extensions`, click **Reload** on suicidebooth.
3. Reload the Facebook tab.

---

## Android with Quetta Browser

Chrome for Android does **not** install desktop Chrome extensions. Use a Chromium browser that does — **Quetta** is what this project has been tested with.

### 1. Install Quetta

1. Install [Quetta Browser](https://play.google.com/store/apps/details?id=net.quetta.browser) from Google Play (or your usual source).
2. Open Quetta and complete any first-run setup.

### 2. Install suicidebooth in Quetta

Quetta’s menus move between versions; the idea is always: **install a Chrome-style extension from a local package or store-like flow**.

**Typical path (local / unpacked-style install):**

1. On the phone, download [suicidebooth-extension-v0.1.1.zip](../dist/suicidebooth-extension-v0.1.1.zip) (GitHub → save the file).
2. Unzip with a files app so you have a folder containing `manifest.json`.
3. In Quetta, open **Extensions** / **Add-ons** (often under menu ⋮ or settings).
4. Enable developer / sideload if asked.
5. Choose **Load unpacked** / **Install from folder** / **Install extension** and point at that folder  
   — **or** follow Quetta’s “install from Chrome Web Store” only if you later publish there; this POC is zip/folder based.
6. Allow permissions for **facebook.com** when prompted.
7. Confirm suicidebooth shows as **enabled**.

If Quetta only accepts a zip in some builds, pick the `.zip` when the file picker allows it; otherwise always install from the **unzipped** folder.

### 3. Open Facebook in Quetta

1. In Quetta, go to **https://m.facebook.com** or **https://www.facebook.com** (mobile site is fine).
2. Log in if needed.
3. Open **your profile** → timeline with **your posts**.
4. **Pull to refresh** or reload the tab once after enabling the extension.

### 4. Run

1. Open Quetta’s extension list and open **suicidebooth** (popup UI).
2. Optional: **Diagnose** → check `"menuFound": true` and that `href` is your timeline.
3. Tap **Start**.
4. Keep Quetta in the foreground on that tab; locking the phone or killing the tab may pause work.
5. Tap **Stop** when you want to finish.

Counters (**Archived** / **Hidden** / **Errors**) and **Last event** should update. Slow pacing is normal (several seconds per post).

### 5. Update on Android

1. Download the new zip, replace the old folder (or unzip fresh).
2. In Quetta extensions, remove the old suicidebooth **or** reload/update it if the UI offers that.
3. Reload the Facebook tab before Start again.

---

## Popup controls

| Control | Meaning |
|---------|---------|
| **Start** | Begin archive-or-hide loop on the current Facebook tab |
| **Stop** | Stop immediately; clear pending waits |
| **Diagnose** | Snapshot: URL, whether a post menu was found, sample `aria-label`s, stats |
| **Status** | `running` / `stopped` |
| **Archived / Hidden / Errors** | Counters for this page session |
| **Last event** | Short breadcrumb (`start`, `menu-click`, `archive`, `no-menu-pass-N`, …) |
| **Last error** | Why the runner gave up, if it did |

Prefer **Archive** when Facebook offers it; otherwise **Hide**.

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Start does nothing | Reload Facebook tab; confirm extension enabled; run **Diagnose** |
| Diagnose: can’t reach page / no Facebook tab | Facebook must be open in this browser; grant site permission; reload |
| `menuFound: false` | Wrong page (use **your profile timeline**); on desktop enable **phone device mode** and reload; scroll until posts are visible |
| Menu found but no archive/hide | Facebook changed labels — run Diagnose and share the JSON |
| Works then stops | Normal when posts run out, or UI shifted — Start again after scroll; check **Last error** |
| Counts stuck at 0 while `running` | Wait 10–15s (slow mode); watch **Last event**; if stuck on `no-menu-pass-*`, scroll the timeline yourself |
| Desktop only fails | Almost always missing mobile layout — device mode + reload |
| Quetta only fails | Confirm extension is on and allowed for facebook.com; try `m.facebook.com`; keep app in foreground |

### Diagnose checklist

You want something like:

```json
{
  "href": "https://...facebook.com/...",
  "menuFound": true,
  "running": false
}
```

If `menuFound` is `false`, fix the page/layout before expecting Start to archive anything.

---

## Privacy & safety notes

- The extension runs **only** in your browser on Facebook pages you open. It does not send your password or posts to a suicidebooth server.
- Automating Facebook may break Facebook’s terms; use on **your** account at your own risk.
- Facebook changes mobile HTML often — selectors can break without notice.
- Prefer archive over delete when you care about recovery; this tool follows Facebook’s **Archive** / **Hide** UI, not full account deletion.

---

## Console script (optional fallback)

If the extension is unavailable, you can still paste `src/index.js` into the desktop DevTools console on the mobile-layout profile timeline (see root [README](../README.md)). The extension does **not** auto-start; the console script does.

---

## Related files

| Path | Role |
|------|------|
| [dist/suicidebooth-extension-v0.1.1.zip](../dist/suicidebooth-extension-v0.1.1.zip) | Downloadable build |
| [extension/](../extension/) | Unpacked source |
| [extension/README.md](../extension/README.md) | Short extension-oriented notes |
| [src/index.js](../src/index.js) | Original console script |
| [documentation/plans/P-001.md](plans/P-001.md) | Product direction |
| [documentation/research/R-001-nora-fork-feasibility.md](research/R-001-nora-fork-feasibility.md) | Research: Nora (F-Droid) as optional Android shell |

