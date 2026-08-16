# suicidebooth
Erase your social media profiles

![Suicidebooth](Suicidebooth.webp)

## Description
Quick script i wrote to either hide or archive all the post under your timeline in facebook.

## How to use:
- On a desktop browser (tested on Brave) open developer tools
- On the devices options, select Iphone SE (any other phone size should work aswell)
- Go to your facebook profile timeline
- Open the console and copy the index.js contents on it
- Sit and relax (only supporting "slow and horrible" mode for now, if the script stops, just write archiveOrHide() in your console to resume)

## Browser extension POC
There is also a Chrome MV3 extension proof of concept in `extension/` — same archive/hide flow, controlled from a toolbar popup with Start/Stop and live counters. The console paste above remains the source of truth. See [extension/README.md](extension/README.md) for load-unpacked and usage instructions.

**Download (zip):** [dist/suicidebooth-extension-v0.1.0.zip](dist/suicidebooth-extension-v0.1.0.zip) — unzip, then Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select the unzipped folder (`manifest.json` is at the root of the zip).
