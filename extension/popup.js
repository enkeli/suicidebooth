const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const archivedEl = document.getElementById('archived');
const hiddenEl = document.getElementById('hidden');
const errorsEl = document.getElementById('errors');
const lastErrorEl = document.getElementById('lastError');
const errorEl = document.getElementById('error');

let pollTimer = null;

const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
};

const isFacebookTab = (url) => {
    return !!url && /^https?:\/\/([^/]+\.)?facebook\.com\//.test(url);
};

const render = (stats) => {
    if (!stats) {
        return;
    }
    statusEl.textContent = stats.running ? 'running' : 'stopped';
    statusEl.className = stats.running ? 'running' : '';
    archivedEl.textContent = String(stats.archived);
    hiddenEl.textContent = String(stats.hidden);
    errorsEl.textContent = String(stats.errors);
    startBtn.disabled = !!stats.running;
    stopBtn.disabled = !stats.running;

    if (stats.lastError) {
        lastErrorEl.textContent = `Last error: ${stats.lastError}`;
        lastErrorEl.hidden = false;
    } else {
        lastErrorEl.hidden = true;
    }
};

const getActiveFacebookTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isFacebookTab(tab.url)) {
        showError('Open your Facebook profile timeline (mobile layout) in the active tab first.');
        return null;
    }
    showError('');
    return tab;
};

const sendToActiveTab = async (message) => {
    const tab = await getActiveFacebookTab();
    if (!tab) {
        return null;
    }
    try {
        return await chrome.tabs.sendMessage(tab.id, message);
    } catch (err) {
        showError('Could not reach the page. Reload the Facebook tab and try again.');
        return null;
    }
};

const pollStatus = async () => {
    const stats = await sendToActiveTab({ type: 'getStatus' });
    render(stats);
};

startBtn.addEventListener('click', async () => {
    const stats = await sendToActiveTab({ type: 'start' });
    render(stats);
});

stopBtn.addEventListener('click', async () => {
    const stats = await sendToActiveTab({ type: 'stop' });
    render(stats);
});

pollStatus();
pollTimer = setInterval(pollStatus, 1000);

window.addEventListener('unload', () => {
    if (pollTimer) {
        clearInterval(pollTimer);
    }
});
