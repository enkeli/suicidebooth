# suicidebooth browser extension (POC)

Chrome MV3 port of the `src/index.js` console script. Archive or hide all posts on your Facebook profile timeline, controlled from a toolbar popup instead of the devtools console.

The console paste of `src/index.js` remains the source of truth — this extension is a proof of concept that wraps the same selectors and delays.

## Download

Prebuilt zip (same files as this folder): [`../dist/suicidebooth-extension-v0.1.1.zip`](../dist/suicidebooth-extension-v0.1.1.zip)

1. Download and unzip — `manifest.json` is at the root of the archive.
2. Follow **Load unpacked** below and select the unzipped folder.

## Load unpacked

1. Open `chrome://extensions` in Chrome (or a Chromium browser like Brave/Edge).
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select this `extension/` directory.
4. The suicidebooth icon appears in the toolbar.

## Usage

1. On a desktop browser, open developer tools and enable device mode — pick a phone size (e.g. iPhone SE). The Facebook **mobile web layout** is required; the desktop DOM will not match the selectors.
2. Go to your Facebook profile timeline.
3. Click the suicidebooth toolbar icon.
4. Press **Start**. The popup shows status and counts (archived / hidden / errors).
5. Press **Stop** to halt — all pending timeouts are cleared immediately.

Notes:

- The popup only works when the active tab is on `facebook.com`; otherwise it shows an error.
- If the tab was open before the extension was loaded, reload the tab so the content script is injected.
- Same "slow and horrible" pacing as the console script: ~3s steps, 5s between archives. Facebook can break the selectors at any time — when that happens, fix `src/index.js` first, then re-port here.

## Troubleshooting (mobile / Quetta)

1. Open your **profile timeline** (not Home feed), then **reload** the tab after (re)loading the extension.
2. Tap the extension → **Diagnose**. You want `menuFound: true`. If false, Facebook's labels differ — paste the JSON when filing an issue.
3. Start should set status to `running` and `lastEvent` should change (`menu-click`, `archive`, `no-menu-pass-N`, …). Errors now increment when the runner gives up.
4. Grant any permission prompts for Facebook when the extension asks.
