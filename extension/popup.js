const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const diagBtn = document.getElementById('diagBtn');
const statusEl = document.getElementById('status');
const archivedEl = document.getElementById('archived');
const hiddenEl = document.getElementById('hidden');
const errorsEl = document.getElementById('errors');
const lastErrorEl = document.getElementById('lastError');
const lastEventEl = document.getElementById('lastEvent');
const errorEl = document.getElementById('error');
const diagOut = document.getElementById('diagOut');

let pollTimer = null;

const showError = (msg) => {
    errorEl.textContent = msg || '';
    errorEl.hidden = !msg;
};

const render = (stats) => {
    if (!stats) {
        return;
    }
    statusEl.textContent = stats.running ? 'running' : 'stopped';
    statusEl.className = stats.running ? 'running' : '';
    archivedEl.textContent = String(stats.archived ?? 0);
    hiddenEl.textContent = String(stats.hidden ?? 0);
    errorsEl.textContent = String(stats.errors ?? 0);
    startBtn.disabled = !!stats.running;
    stopBtn.disabled = !stats.running;

    if (stats.lastError) {
        lastErrorEl.textContent = `Last error: ${stats.lastError}`;
        lastErrorEl.hidden = false;
    } else {
        lastErrorEl.hidden = true;
    }

    if (lastEventEl) {
        lastEventEl.textContent = stats.lastEvent ? `Last event: ${stats.lastEvent}` : '';
        lastEventEl.hidden = !stats.lastEvent;
    }
};

/** Talk to content script via background relay (more reliable on mobile shells). */
const relay = async (message) => {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'relay',
            message,
        });
        if (!response) {
            showError('No response from extension background. Try reloading the extension.');
            return null;
        }
        if (!response.ok) {
            showError(response.error || 'Relay failed');
            return null;
        }
        showError('');
        return response.result;
    } catch (err) {
        showError((err && err.message) || String(err));
        return null;
    }
};

const refreshFromStorage = async () => {
    try {
        const data = await chrome.storage.local.get('suicideboothStats');
        if (data && data.suicideboothStats) {
            render(data.suicideboothStats);
        }
    } catch (_) {
        /* ignore */
    }
};

const pollStatus = async () => {
    await refreshFromStorage();
    const stats = await relay({ type: 'getStatus' });
    if (stats) {
        render(stats);
    }
};

startBtn.addEventListener('click', async () => {
    showError('');
    diagOut.hidden = true;
    startBtn.disabled = true;
    const stats = await relay({ type: 'start' });
    if (stats) {
        render(stats);
    } else {
        startBtn.disabled = false;
    }
    // Re-poll shortly so storage-backed updates show even if start response was thin
    setTimeout(pollStatus, 500);
    setTimeout(pollStatus, 2000);
});

stopBtn.addEventListener('click', async () => {
    const stats = await relay({ type: 'stop' });
    if (stats) {
        render(stats);
    }
    setTimeout(pollStatus, 300);
});

diagBtn.addEventListener('click', async () => {
    diagOut.hidden = false;
    diagOut.textContent = 'Running diagnose…';
    const result = await relay({ type: 'diagnose' });
    if (!result) {
        diagOut.textContent =
            'Diagnose failed — content script not reachable. Open facebook.com profile timeline, reload that tab, then try again.';
        return;
    }
    const summary = {
        href: result.href,
        menuFound: result.menuFound,
        menuLabel: result.menuLabel,
        running: result.running,
        lastError: result.lastError,
        lastEvent: result.lastEvent,
        archived: result.archived,
        hidden: result.hidden,
        errors: result.errors,
        readyState: result.readyState,
        userAgent: result.userAgent,
        ariaLabelSample: result.ariaLabelSample,
    };
    diagOut.textContent = JSON.stringify(summary, null, 2);
    render(result);
});

// Initial paint from storage, then live poll
refreshFromStorage();
pollStatus();
pollTimer = setInterval(pollStatus, 1000);

// Live updates while popup is open
try {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.suicideboothStats) {
            render(changes.suicideboothStats.newValue);
        }
    });
} catch (_) {
    /* ignore */
}

window.addEventListener('unload', () => {
    if (pollTimer) {
        clearInterval(pollTimer);
    }
});
