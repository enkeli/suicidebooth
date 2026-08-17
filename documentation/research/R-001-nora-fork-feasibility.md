# R-001 — Nora fork feasibility for mobile delivery

Status: Research complete · Branch: `research/nora-android-fork-base` · Date: 2026-08-17  
Owner: enkeli · Method: OpenCode/OMO kickoff + source survey of shallow clone `nonbili/Nora` @ `/tmp/opencode/nora`

## Executive summary

**Forking [Nora](https://github.com/nonbili/Nora) (`jp.nonbili.nora`) as a full product base is technically plausible but strategically optional right now.**

Nora is already an **SNS-focused WebView shell** that:

- Loads real `m.facebook.com` / `www.facebook.com` in a custom Android `WebView`
- **Injects first-party page JS** (ad block, CSS, hooks) via bundled `content/*` scripts
- Ships a **custom userscript system** (host globs + arbitrary JS + optional header pin)
- Supports multi-account cookie profiles

That is a strong match for suicidebooth’s P-001 rule: *runner touches real Facebook DOM; login stays on Facebook’s origin*.

However:

1. **We already have a working Android path** — MV3 extension on **Quetta** (validated in the field).
2. A **full fork** means owning an Expo/React Native + native WebView stack under **AGPL-3.0**, new application id, F-Droid metadata, and continuous upstream merge cost.
3. A **much cheaper experiment** exists first: package the runner as a **Nora custom userscript** (or a tiny builtin script PR/fork) without rebranding the whole browser.

**Recommendation:** **Hybrid — do not make Nora-fork the MVP.**

| Priority | Path | Why |
|----------|------|-----|
| **P0 (now)** | Keep **extension + Quetta** (+ desktop Chromium) | Proven; shared `extension/content.js`; low ops |
| **P1 (1-week spike)** | **Nora userscript** install (stock Nora, no fork) | Reuses Nora injection; validates WebView DOM parity |
| **P2 (only if P1 wins and we want a branded app)** | **Thin fork** or F-Droid app: Nora + builtin suicidebooth script + rename | Controlled UX, single APK |
| **Avoid as MVP** | Greenfield native FB automation / AccessibilityService | Fragile, policy-hostile, high effort |

---

## Nora facts

| Item | Detail |
|------|--------|
| Upstream | https://github.com/nonbili/Nora |
| F-Droid | https://f-droid.org/packages/jp.nonbili.nora/ (also `/en/packages/…`) |
| Play / App Store | Listed in upstream README |
| License | **GNU Affero General Public License v3.0** (`AGPL-3.0`, LICENSE file AGPLv3) |
| App id | `jp.nonbili.nora` (`app.config.ts` Android `package` / iOS `bundleIdentifier`) |
| Version surveyed | `0.8.6` (`package.json`), F-Droid listed same line around 2026-08-16 |
| Primary language | **TypeScript** + **React Native / Expo 56** |
| Native WebView | Custom Expo module `modules/nora-view` → Android `NouWebView` extends `android.webkit.WebView` |
| Stated model (README / F-Droid) | “Wrap the SNS websites in Android webview” + “Inject code to block ads” |
| SNS list | Facebook, Instagram, Reddit, Threads, X, … |
| Clone used for this report | Shallow clone to `/tmp/opencode/nora` (not vendored into suicidebooth) |

### Stack sketch

```
Expo Router UI (app/, components/)
        │
        ▼
NoraTab + NoraView (RN)
        │
        ▼
modules/nora-view (Android WebView / iOS WKWebView)
        │  document-start + on-load script injection
        ▼
Bundled page scripts: assets/scripts/main.bjs  ← built from content/main.ts
        │
        ├── ad hide (content/ad.ts) — FB-aware
        ├── CSS tweaks (content/css.ts)
        ├── window.Nora bridge (content/nora.ts)
        └── user styles/scripts applied from host app state
```

Build tooling: **Bun** (`bun bundle` → `content/main.ts` / `webrtc.ts`), Expo (`bun run android`).

---

## How Nora loads Facebook (injection surface)

### Navigation / hosts

`app.config.ts` allows associated hosts including **`m.facebook.com`** and **`www.facebook.com`**. Facebook is a first-class SNS target, not a generic browser afterthought.

### Injected page pipeline

`content/main.ts` on load:

1. `blockAds()` / mutation observer `hideAds()` — includes **`m.facebook.com`** and **`www.facebook.com`** branches in `content/ad.ts`
2. `window.Nora = initNora()` — bridge object for native ↔ page messaging
3. `injectCSS()` / `injectScript()` — additional page behavior
4. Gesture / viewport tweaks

Scripts are bundled to `assets/scripts/*.bjs` (`package.json` `bundle` script).

### Programmatic JS execution

`lib/webview.ts` exposes:

- `executeWebviewJavaScript`
- `executeWebviewJavaScriptQuietly`

Header / tools UI call these to run **user scripts on demand** (`buildUserScriptExecutionSource`).

### Userscript / userstyle system (high leverage)

`lib/user-styles.ts` defines:

- **Builtin CSS** e.g. `hide-facebook-feed` for `m.facebook.com` + `www.facebook.com`
- **Builtin JS** e.g. `enter-as-shift-enter`
- **CustomUserScript**: `{ name, enabled, hostGlobs[], pinToHeader, js }`
- Host glob matching, Tampermonkey-like metadata parse helpers (`// ==UserScript==`)
- `buildUserScriptExecutionSource(script)` to wrap JS for `executeWebviewJavaScript`

This is effectively a **built-in userscript host** scoped to SNS WebViews — closer to Tampermonkey-in-app than to Chrome MV3.

### Native notes (Android)

`NoraView.kt` / `NouWebView`:

- Real `android.webkit.WebView` (system Chromium WebView, not a full Chrome extension runtime)
- Cookie / multi-profile support (`NoraCookies.kt`, `WebViewFeature.MULTI_PROFILE` when available)
- Document-start script APIs used for some shims (`WebViewCompat.addDocumentStartJavaScript`)
- **No Chrome Web Store / MV3 extension loading** observed — different delivery model than Quetta

### Desktop

Separate desktop workspace / [Nora-Desktop](https://github.com/nonbili/Nora-Desktop); same product family, not required for Android feasibility.

---

## Fit for the suicidebooth runner

### What our runner needs

From `extension/content.js` / `src/index.js` / P-001:

| Need | Nora fit |
|------|----------|
| Real facebook.com origin + user session | **Yes** — WebView loads FB; multi-account cookies |
| DOM click automation (menu → archive/hide) | **Yes** — same class of JS as page scripts / userscripts |
| Start/Stop + stats UX | **Yes with work** — custom script + `pinToHeader`, or native UI button calling `executeWebviewJavaScript`; or fork UI |
| Persist stats | App storage (MMKV/AsyncStorage) or `window.Nora` bridge |
| Mobile FB DOM | **Likely good** — Nora targets mobile SNS; still must verify selectors vs Quetta/Chrome WebView version |
| MV3 `chrome.runtime` messaging | **N/A** — must strip extension APIs; pure DOM + optional `window.Nora` |
| Long-running loop while backgrounded | **Risk** — WebView/tab pause behavior; Nora has tab pause/discard concepts |

### Mapping options (increasing commitment)

1. **Custom userscript only (stock Nora)**  
   - Ship `suicidebooth.user.js` (host globs `*.facebook.com`)  
   - User pastes/imports in Nora settings; optional pin-to-header for Start  
   - **Best first spike**

2. **Builtin script in a thin fork**  
   - Add `builtinUserScriptDefinitions` entry + toggle in settings  
   - Still AGPL distribution of the whole app if you ship the APK  

3. **Branded fork**  
   - Rename app/id, strip unused SNS, hard-wire archive UI, F-Droid package  
   - Highest UX control, highest maintenance  

4. **Port MV3 extension into Nora**  
   - **Not natural** — Nora is not an extension browser; would be a wrong abstraction  

### DOM parity caveat

Quetta ≈ Chromium with extensions. Nora ≈ **Android System WebView** (version tied to the device).  
Selectors that work in Quetta **usually** work in WebView mobile FB, but:

- WebView major version skew can change FB’s served JS bundles
- Desktop `www.facebook.com` inside a phone WebView may still differ from Quetta’s mobile UA path  
- Spike must run **Diagnose-equivalent** inside Nora WebView before trusting archive rates

---

## Legal / compliance

### Nora: AGPL-3.0

Distributing a modified Nora APK (or a SaaS that users interact with over a network, if applicable) triggers **AGPL obligations**: offer corresponding source, preserve notices, same license for the combined work as required by AGPL.

### suicidebooth repo license

This repository’s root `LICENSE` is **GPL-2.0** (header: GNU GPL version 2).  

**Important:** **GPL-2.0-only and AGPL-3.0 are generally treated as incompatible** for combining into one distributed program, unless copyright holders relicense.

Practical implications:

- If we **embed** suicidebooth runner **into** a Nora-based APK we distribute, we should **relicense our runner (and any combined app code we own) to AGPL-3.0-or-later / AGPL-3.0** (we can; we hold copyright on our code), and comply fully with Nora’s AGPL.
- Keeping the **MV3 extension** as a separate GPL-2 (or dual-licensed) artifact that users load into Quetta avoids combining with Nora’s codebase.
- A **userscript file** the user pastes into stock Nora is a gray area of “combination”; still prefer AGPL-3.0 for any script we ship specifically “for Nora” if we want clean compliance storytelling, and keep LICENSE clarity in-repo (e.g. `extension/` vs `mobile/nora-userscript/`).

**This is not legal advice** — confirm before F-Droid or Play publication.

### F-Droid / naming / id

Forks must:

- Use a **new application id** (not `jp.nonbili.nora`)
- Use a **distinct name/icon** (no Nora trademark confusion)
- Provide build metadata, reproducible build if aiming for F-Droid main
- Expect **NonFreeNet** anti-feature (depends on Facebook et al.), same class as Nora
- Track Nora’s `full` vs `foss` flavor split if relevant (`modules/nora-view/.../full|foss`)

Play policy: automation of third-party services can attract scrutiny; WebView “helper” framing is softer than accessibility-based bots but not risk-free.

### Product ethics / ToS

Unchanged from extension: automating Facebook may violate FB ToS; user risk; no credential phishing (login remains on FB) — consistent with P-001.

---

## Engineering effort (order-of-magnitude)

| Track | Effort | Notes |
|-------|--------|-------|
| Nora custom userscript spike | **1–3 days** | Port `content.js` minus `chrome.*`; manual install steps; verify archive on 1–2 devices |
| Polished userscript + docs | **~1 week** | Header pin Start/Stop, stats via DOM overlay or Nora bridge, howto section |
| Thin fork + builtin + rename | **2–4 weeks** | Expo env, signing, strip/brand, settings toggle, CI APK |
| Full branded multi-SNS “suicidebooth app” | **1–3+ months** | Productize shell, updates, iOS optional, store review, upstream merges |
| Maintain full fork long-term | **Ongoing** | Expo/RN/WebView churn; security patches; FB DOM breakage (same as extension) |

Upstream Nora is actively developed (features like hide Facebook feed, desktop mode, etc.) — fork drift is real.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| WebView DOM ≠ Quetta DOM | Medium | Spike diagnose script before committing to fork |
| AGPL + current GPL-2 repo confusion | Medium | Dual-license / relicense policy before shipping combined APK |
| Fork maintenance vs Quetta path | High if full fork early | Prefer userscript; fork only for distribution/UX |
| Background tab killing long runs | Medium | Keep WebView active; foreground service patterns (policy-sensitive) |
| Play/App Store rejection | Medium–High for aggressive automation branding | F-Droid / sideload first; honest “archive helper” copy |
| User confusion (another browser) | Medium | Docs; or thin branded fork later |
| Upstream breaking userscript API | Low–Med | Pin Nora version for docs; vendor only script not whole app |
| Security: injecting JS into logged-in FB | Inherent | Open source review; no remote code fetch |

---

## Alternatives comparison

| Option | Ease for user | Feasibility | Trust | Multi-network later | Effort | Notes |
|--------|---------------|-------------|-------|---------------------|--------|-------|
| **A. Quetta + MV3 extension (current)** | Medium | **High (proven)** | High | Via more content scripts | Low | Best default now |
| **B. Desktop Chromium + extension** | Medium | High | High | Good | Low | Needs mobile layout |
| **C. Nora custom userscript (stock app)** | Medium | **High** | High | Nora already multi-SNS | Low–Med | Best Nora-shaped spike |
| **D. Thin Nora fork + builtin script** | Higher | High | High if open source | Excellent shell | Med–High | AGPL app |
| **E. Full branded Nora fork** | Highest | High | Depends on messaging | Excellent | High | Only if shell is the product |
| **F. Other extension browsers (Kiwi, etc.)** | Medium | Medium | Varies | Via MV3 | Low | Diversify install docs |
| **G. Greenfield RN WebView app** | High | High | High if minimal | DIY | High | Reimplements Nora poorly |
| **H. AccessibilityService bot** | High in theory | Low ethically/policy | Low | Hard | High | Discourage |
| **I. Official Graph APIs** | Medium | Low for wipe | Highest | Per-API | High | P-001 already weak for wipe |

---

## Recommended path

### Decision

**Do not block on a Nora fork.** Treat Nora as an **optional second mobile runtime** validated by a userscript spike.

### Concrete next experiments (≈1 week)

1. **Day 1–2 — Port spike**  
   - Produce `mobile/nora/suicidebooth.user.js` (or under `documentation/research/fixtures/`) from `extension/content.js`  
   - Remove `chrome.storage` / `chrome.runtime`; use in-page UI (floating Start/Stop) or Nora header pin  
   - Install in stock Nora from F-Droid; run on profile timeline  

2. **Day 2–3 — DOM parity**  
   - Log `aria-label` sample + archive success rate vs Quetta on same account  
   - Note WebView package version (`WebView` app) on test devices  

3. **Day 3–4 — UX decision gate**  
   - If success ≈ Quetta: write howto section “Android via Nora userscript”  
   - If weak: invest in Quetta docs/polish only; park Nora  

4. **Day 5+ — Only if gate passes and we want one-tap APK**  
   - Spike thin fork: rename id `dev.enkeli.suicidebooth` (example), builtin script, FOSS flavor build  
   - Draft AGPL license alignment for distributed app tree  

### What not to do yet

- Vendor entire Nora tree into `suicidebooth` monorepo  
- Promise F-Droid listing dates  
- Build Accessibility-based automation  
- Assume MV3 extension loads inside Nora (it does not)

---

## Sources

- https://f-droid.org/packages/jp.nonbili.nora/ / https://f-droid.org/en/packages/jp.nonbili.nora/  
- https://github.com/nonbili/Nora (README, LICENSE AGPLv3, `package.json` 0.8.6)  
- Local shallow clone paths used in research: `/tmp/opencode/nora`  
  - `content/main.ts`, `content/ad.ts`, `lib/user-styles.ts`, `lib/webview.ts`  
  - `modules/nora-view/android/.../NoraView.kt`, `NoraCookies.kt`  
  - `app.config.ts` (hosts, `jp.nonbili.nora`)  
- suicidebooth: `documentation/plans/P-001.md`, `extension/content.js`, `documentation/howto-extension.md`, root `LICENSE` (GPL-2.0)  
- P-001 architecture reminder: shell vs runner; no iframe login  

---

## Appendix — OpenCode / OMO session note

An OpenCode (`opencode-go/kimi-k3`) session was started on branch `research/nora-android-fork-base` to drive this research. It successfully cloned Nora and began policy/source gathering but **timed out before writing the report**. Findings above were completed from the same clone and repo context so the branch still delivers a reviewable artifact.
