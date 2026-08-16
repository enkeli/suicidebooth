# suicidebooth browser extension (POC)

Chrome MV3 port of `src/index.js`. Archive or hide posts on your Facebook profile timeline from a toolbar popup (Start / Stop / Diagnose).

Full end-user guide (desktop + Android/Quetta):

→ **[../documentation/howto-extension.md](../documentation/howto-extension.md)**

## Download

[../dist/suicidebooth-extension-v0.1.1.zip](../dist/suicidebooth-extension-v0.1.1.zip)

Unzip so `manifest.json` is at the folder root, then load unpacked (desktop) or install via Quetta’s extension UI (Android).

## Developer quick load (desktop)

1. `chrome://extensions` → Developer mode → **Load unpacked** → this `extension/` directory (or the unzipped zip).
2. Facebook profile timeline + **mobile** layout (DevTools device mode on desktop).
3. Reload the tab → open popup → **Start**.

## Layout

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest |
| `content.js` | Archive/hide runner (port of `src/index.js`) |
| `background.js` | Popup ↔ tab message relay |
| `popup.html` / `popup.js` / `popup.css` | UI |
| `icons/` | Toolbar icons |

`src/index.js` remains the console-paste source of truth. When Facebook selectors break, fix there first, then port into `content.js`.
