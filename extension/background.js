// Relay popup ↔ content-script messages. Some mobile Chromium shells
// (e.g. Quetta on Android) are flaky with tabs.sendMessage from popups.

const FB_URL_RE = /^https?:\/\/([^/]+\.)?facebook\.com\//i;

async function findFacebookTab(preferredTabId) {
    if (preferredTabId != null) {
        try {
            const tab = await chrome.tabs.get(preferredTabId);
            if (tab && FB_URL_RE.test(tab.url || '')) {
                return tab;
            }
        } catch (_) {
            /* fall through */
        }
    }

    const tabs = await chrome.tabs.query({});
    const fbTabs = tabs.filter((t) => t.url && FB_URL_RE.test(t.url));
    const active = fbTabs.find((t) => t.active);
    return active || fbTabs[0] || null;
}

async function sendToContent(tabId, message) {
    try {
        return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
        // Content script may not be injected yet — inject and retry once.
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
            });
            return await chrome.tabs.sendMessage(tabId, message);
        } catch (err2) {
            throw err2;
        }
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('suicidebooth extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
        return;
    }

    // Content script pushing stats — already handled via storage; ack only.
    if (message.type === 'statsUpdated') {
        sendResponse({ ok: true });
        return;
    }

    if (message.type === 'relay') {
        const inner = message.message;
        const tabIdHint = message.tabId;
        (async () => {
            try {
                const tab = await findFacebookTab(tabIdHint);
                if (!tab) {
                    sendResponse({
                        ok: false,
                        error: 'No Facebook tab found. Open your profile timeline first.',
                    });
                    return;
                }
                const result = await sendToContent(tab.id, inner);
                sendResponse({ ok: true, tabId: tab.id, tabUrl: tab.url, result });
            } catch (err) {
                sendResponse({
                    ok: false,
                    error:
                        (err && err.message) ||
                        String(err) ||
                        'Could not reach the Facebook page. Reload the tab and try again.',
                });
            }
        })();
        return true; // async sendResponse
    }
});
