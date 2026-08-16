// Port of src/index.js — console paste remains source of truth.
// Wraps the same archive/hide flow with start/stop/status messaging for the
// extension popup. Does NOT auto-start; control it from the popup.
(() => {
    if (window.__suicideboothLoaded) {
        return;
    }
    window.__suicideboothLoaded = true;

    const stats = {
        archived: 0,
        hidden: 0,
        errors: 0,
        running: false,
        lastError: null,
    };

    let timeoutIds = [];

    const schedule = (fn, delay) => {
        const id = setTimeout(() => {
            timeoutIds = timeoutIds.filter((t) => t !== id);
            fn();
        }, delay);
        timeoutIds.push(id);
        return id;
    };

    const clearAllTimeouts = () => {
        timeoutIds.forEach((id) => clearTimeout(id));
        timeoutIds = [];
    };

    const recordError = (err) => {
        stats.errors += 1;
        stats.lastError = err && err.message ? err.message : String(err);
        console.debug('suicidebooth error:', err);
    };

    const archiveOrHide = () => {
        if (!stats.running) {
            return;
        }

        let menuButton = document.querySelector('[aria-label="More options for post"]');
        if (!menuButton) {
            menuButton = document.querySelector('[aria-label="Actions for this post"]');

            if (!menuButton) {
                console.debug('no menu, exiting...');
                stats.running = false;
                return;
            }
        }
        menuButton?.scrollIntoView();
        menuButton?.click();

        // Waiting for menu to open
        schedule(() => {
            const archiveButton = document.querySelector('[aria-label="Move to archive"]');
            const hideButton = document.querySelector('[aria-label="I don\'t want to see this"]');

            if (archiveButton) {
                console.debug('Archiving...');
                archiveButton.click();
                stats.archived += 1;

                schedule(archiveOrHide, 5000);
            } else if (hideButton) {
                console.debug('Hiding...');
                hideButton.click();

                schedule(() => {
                    try {
                        console.debug('hide from profile...');
                        let hideBtnId = 32762;
                        let hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);

                        if (!hideActionBtn) {
                            hideBtnId = 32763;
                            hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);
                        }

                        if (!hideActionBtn) {
                            throw new Error(`hide action button not found (data-action-id ${hideBtnId})`);
                        }
                        hideActionBtn.click();

                        schedule(() => {
                            try {
                                console.debug('hide confirmation...');
                                const confirmBtn = document.querySelector(`[data-action-id="${hideBtnId - 1}"]`);
                                if (!confirmBtn) {
                                    throw new Error(`hide confirmation button not found (data-action-id ${hideBtnId - 1})`);
                                }
                                confirmBtn.click();

                                schedule(() => {
                                    try {
                                        console.debug('return...');
                                        const returnBtn = document.querySelector('[data-action-id="99"]');
                                        if (!returnBtn) {
                                            throw new Error('return button not found (data-action-id 99)');
                                        }
                                        returnBtn.click();

                                        console.debug('removing processed button...');
                                        menuButton.remove();
                                        stats.hidden += 1;
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
                stats.running = false;
                return;
            }
        }, 3000);
    };

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!message || !message.type) {
            return;
        }

        if (message.type === 'start') {
            if (!stats.running) {
                stats.running = true;
                archiveOrHide();
            }
            sendResponse({ ...stats });
        } else if (message.type === 'stop') {
            stats.running = false;
            clearAllTimeouts();
            sendResponse({ ...stats });
        } else if (message.type === 'getStatus') {
            sendResponse({ ...stats });
        }
    });
})();
