// Port of src/index.js — console paste remains source of truth.
// Extension wrapper: start/stop/status, timeout tracking, storage sync, diagnose.
// Does NOT auto-start.
(() => {
    if (window.__suicideboothLoaded) {
        // Re-injection: keep the existing controller, just ensure listener is there.
        return;
    }
    window.__suicideboothLoaded = true;

    const stats = {
        archived: 0,
        hidden: 0,
        errors: 0,
        running: false,
        lastError: null,
        lastEvent: 'loaded',
        emptyPasses: 0,
        url: location.href,
    };

    let timeoutIds = [];
    const MAX_EMPTY_PASSES = 8;

    const schedule = (fn, delay) => {
        const id = setTimeout(() => {
            timeoutIds = timeoutIds.filter((t) => t !== id);
            if (!stats.running && fn !== persist) {
                return;
            }
            try {
                fn();
            } catch (err) {
                recordError(err);
            }
        }, delay);
        timeoutIds.push(id);
        return id;
    };

    const clearAllTimeouts = () => {
        timeoutIds.forEach((id) => clearTimeout(id));
        timeoutIds = [];
    };

    const persist = () => {
        stats.url = location.href;
        try {
            chrome.storage.local.set({ suicideboothStats: { ...stats, ts: Date.now() } });
        } catch (_) {
            /* storage may be unavailable in odd contexts */
        }
        try {
            chrome.runtime.sendMessage({ type: 'statsUpdated', stats: { ...stats } });
        } catch (_) {
            /* popup may be closed */
        }
    };

    const recordError = (err) => {
        stats.errors += 1;
        stats.lastError = err && err.message ? err.message : String(err);
        stats.lastEvent = 'error';
        console.debug('suicidebooth error:', err);
        persist();
    };

    const setEvent = (name) => {
        stats.lastEvent = name;
        persist();
    };

    /** Find a post "more" menu control — mobile FB labels vary by locale/build. */
    const findMenuButton = () => {
        const exactLabels = [
            'More options for post',
            'Actions for this post',
            'More',
            'More options',
        ];
        for (const label of exactLabels) {
            const el = document.querySelector(`[aria-label="${label}"]`);
            if (el) {
                return el;
            }
        }

        // Partial aria-label matches (English + common variants)
        const partials = [
            'more options for post',
            'actions for this post',
            'more options',
            'opciones',
            'acciones',
            'weitere optionen',
            'plus d’options',
            "plus d'options",
        ];
        const withLabel = document.querySelectorAll('[aria-label]');
        for (const el of withLabel) {
            const label = (el.getAttribute('aria-label') || '').toLowerCase();
            if (!label) {
                continue;
            }
            if (partials.some((p) => label.includes(p))) {
                // Prefer post-scoped controls over generic nav "More"
                if (label.includes('post') || label.includes('publicación') || label.includes('publication')) {
                    return el;
                }
            }
        }
        // Second pass: any "more options" without requiring "post"
        for (const el of withLabel) {
            const label = (el.getAttribute('aria-label') || '').toLowerCase();
            if (label.includes('more options') || label.includes('actions for this')) {
                return el;
            }
        }

        // Role-based fallback: buttons whose accessible name looks like a kebab menu
        const buttons = document.querySelectorAll('[role="button"], button');
        for (const el of buttons) {
            const label = (
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                ''
            ).toLowerCase();
            if (label.includes('more') && (label.includes('post') || label.includes('option'))) {
                return el;
            }
        }
        return null;
    };

    const findArchiveOrHide = () => {
        const archiveLabels = ['Move to archive', 'Archive', 'Move to Archive'];
        const hideLabels = [
            "I don't want to see this",
            'I don’t want to see this',
            'Hide post',
            'Hide',
        ];
        for (const label of archiveLabels) {
            const el = document.querySelector(`[aria-label="${label}"]`);
            if (el) {
                return { kind: 'archive', el };
            }
        }
        for (const label of hideLabels) {
            const el = document.querySelector(`[aria-label="${label}"]`);
            if (el) {
                return { kind: 'hide', el };
            }
        }
        // Partial
        for (const el of document.querySelectorAll('[aria-label], [role="menuitem"], [role="button"]')) {
            const t = (
                el.getAttribute('aria-label') ||
                el.textContent ||
                ''
            ).toLowerCase().trim();
            if (!t) {
                continue;
            }
            if (t.includes('archive') || t.includes('archiv')) {
                return { kind: 'archive', el };
            }
            if (
                t.includes("don't want to see") ||
                t.includes('don’t want to see') ||
                t.includes('hide post') ||
                t.includes('ocultar')
            ) {
                return { kind: 'hide', el };
            }
        }
        return null;
    };

    const diagnose = () => {
        const labels = [];
        document.querySelectorAll('[aria-label]').forEach((el, i) => {
            if (i < 40) {
                labels.push(el.getAttribute('aria-label'));
            }
        });
        const menu = findMenuButton();
        return {
            ...stats,
            href: location.href,
            readyState: document.readyState,
            menuFound: !!menu,
            menuLabel: menu ? menu.getAttribute('aria-label') : null,
            ariaLabelSample: labels,
            userAgent: navigator.userAgent.slice(0, 180),
        };
    };

    const scrollForMore = () => {
        try {
            window.scrollBy(0, Math.max(400, Math.floor(window.innerHeight * 0.8)));
        } catch (_) {
            /* ignore */
        }
    };

    const archiveOrHide = () => {
        if (!stats.running) {
            return;
        }

        let menuButton = findMenuButton();
        if (!menuButton) {
            stats.emptyPasses += 1;
            setEvent(`no-menu-pass-${stats.emptyPasses}`);
            console.debug('suicidebooth: no menu button found, pass', stats.emptyPasses);

            if (stats.emptyPasses >= MAX_EMPTY_PASSES) {
                stats.running = false;
                recordError(
                    new Error(
                        'No post menu found after several tries. Open your profile timeline, scroll to posts, use Facebook mobile layout, then Start again. Use Diagnose for aria-label sample.'
                    )
                );
                return;
            }

            scrollForMore();
            schedule(archiveOrHide, 2500);
            return;
        }

        stats.emptyPasses = 0;
        setEvent('menu-click');
        try {
            menuButton.scrollIntoView({ block: 'center', inline: 'nearest' });
        } catch (_) {
            menuButton.scrollIntoView();
        }
        menuButton.click();

        // Waiting for menu to open
        schedule(() => {
            if (!stats.running) {
                return;
            }

            const action = findArchiveOrHide();
            const archiveButton =
                action && action.kind === 'archive' ? action.el : document.querySelector('[aria-label="Move to archive"]');
            const hideButton =
                action && action.kind === 'hide'
                    ? action.el
                    : document.querySelector('[aria-label="I don\'t want to see this"]');

            if (archiveButton || (action && action.kind === 'archive')) {
                const btn = archiveButton || action.el;
                console.debug('Archiving...');
                setEvent('archive');
                btn.click();
                stats.archived += 1;
                persist();
                schedule(archiveOrHide, 5000);
            } else if (hideButton || (action && action.kind === 'hide')) {
                const btn = hideButton || action.el;
                console.debug('Hiding...');
                setEvent('hide');
                btn.click();

                schedule(() => {
                    try {
                        console.debug('hide from profile...');
                        let hideBtnId = 32762;
                        let hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);

                        if (!hideActionBtn) {
                            hideBtnId = 32763;
                            hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);
                        }

                        // Text fallback when data-action-id drifts
                        if (!hideActionBtn) {
                            for (const el of document.querySelectorAll('[role="button"], button, [role="menuitem"]')) {
                                const t = (el.textContent || '').toLowerCase();
                                if (t.includes('hide') || t.includes('ocultar') || t.includes("don't want")) {
                                    hideActionBtn = el;
                                    break;
                                }
                            }
                        }

                        if (!hideActionBtn) {
                            throw new Error(`hide action button not found (data-action-id ${hideBtnId})`);
                        }
                        hideActionBtn.click();

                        schedule(() => {
                            try {
                                console.debug('hide confirmation...');
                                let confirmBtn = document.querySelector(`[data-action-id="${hideBtnId - 1}"]`);
                                if (!confirmBtn) {
                                    for (const el of document.querySelectorAll('[role="button"], button')) {
                                        const t = (el.textContent || '').toLowerCase();
                                        if (t.includes('hide') || t.includes('confirm') || t.includes('done')) {
                                            confirmBtn = el;
                                            break;
                                        }
                                    }
                                }
                                if (!confirmBtn) {
                                    throw new Error(`hide confirmation button not found (data-action-id ${hideBtnId - 1})`);
                                }
                                confirmBtn.click();

                                schedule(() => {
                                    try {
                                        console.debug('return...');
                                        let returnBtn = document.querySelector('[data-action-id="99"]');
                                        if (!returnBtn) {
                                            // best-effort: go back / close sheets
                                            for (const el of document.querySelectorAll('[aria-label], [role="button"]')) {
                                                const a = (el.getAttribute('aria-label') || '').toLowerCase();
                                                if (a === 'back' || a === 'close' || a.includes('back')) {
                                                    returnBtn = el;
                                                    break;
                                                }
                                            }
                                        }
                                        if (returnBtn) {
                                            returnBtn.click();
                                        }

                                        console.debug('removing processed button...');
                                        try {
                                            menuButton.remove();
                                        } catch (_) {
                                            /* node may already be gone */
                                        }
                                        stats.hidden += 1;
                                        persist();
                                        schedule(archiveOrHide, 3000);
                                    } catch (err) {
                                        recordError(err);
                                        schedule(archiveOrHide, 3000);
                                    }
                                }, 3000);
                            } catch (err) {
                                recordError(err);
                                schedule(archiveOrHide, 3000);
                            }
                        }, 3000);
                    } catch (err) {
                        recordError(err);
                        schedule(archiveOrHide, 3000);
                    }
                }, 3000);
            } else {
                console.debug('no action buttons...');
                stats.emptyPasses += 1;
                setEvent('no-action-buttons');
                // Close menu if possible and retry
                try {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                } catch (_) {
                    /* ignore */
                }
                if (stats.emptyPasses >= MAX_EMPTY_PASSES) {
                    stats.running = false;
                    recordError(
                        new Error(
                            'Opened a menu but found neither Archive nor Hide. Facebook UI may have changed, or this is not a post menu. Use Diagnose.'
                        )
                    );
                    return;
                }
                scrollForMore();
                schedule(archiveOrHide, 3000);
            }
        }, 3000);
    };

    const start = () => {
        if (stats.running) {
            return { ...stats };
        }
        stats.running = true;
        stats.emptyPasses = 0;
        stats.lastError = null;
        setEvent('start');
        console.debug('suicidebooth: start', location.href);
        archiveOrHide();
        return { ...stats };
    };

    const stop = () => {
        stats.running = false;
        clearAllTimeouts();
        setEvent('stop');
        console.debug('suicidebooth: stop');
        return { ...stats };
    };

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!message || !message.type) {
            return;
        }

        try {
            if (message.type === 'start') {
                sendResponse(start());
            } else if (message.type === 'stop') {
                sendResponse(stop());
            } else if (message.type === 'getStatus') {
                stats.url = location.href;
                sendResponse({ ...stats });
            } else if (message.type === 'diagnose') {
                sendResponse(diagnose());
            } else if (message.type === 'ping') {
                sendResponse({ ok: true, href: location.href, loaded: true });
            }
        } catch (err) {
            recordError(err);
            sendResponse({ ...stats, error: String(err) });
        }
        // sync response
        return false;
    });

    persist();
    console.debug('suicidebooth content script ready on', location.href);
})();
