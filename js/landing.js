const DAILY_REQUEST_LIMIT = 10;
const DAILY_COUNTER_URL =
"https://julsino.app.n8n.cloud/webhook/join-daily-request-count";

/**
 * Reads an optional request count supplied by the landing-page integration.
 * The query parameter makes the limit state easy to demonstrate without
 * exposing n8n credentials in the frontend.
 * @returns {number}
 */
function getDemoRequestCount() {
    const parameter = new URLSearchParams(window.location.search).get("used");
    if (parameter === null) return null;
    const value = Number(parameter);
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.min(DAILY_REQUEST_LIMIT, Math.floor(value)));
}

/**
 * Loads today's request count from the public n8n counter workflow.
 * @returns {Promise<{used: number, limit: number, limitReached: boolean}>}
 */
async function loadDailyRequestCount() {
    const response = await fetch(DAILY_COUNTER_URL, {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
        });
    if (!response.ok) {
        throw new Error(`Daily counter returned HTTP ${response.status}.`);
    }
    return normalizeCounterData(await response.json());
}

/** Normalizes the public counter response for the landing page.
 * @param {Object} data data.
 * @returns {*} normalize counter data result.
 */
function normalizeCounterData(data) {
    const limit = DAILY_REQUEST_LIMIT;
    const used = Math.max(0, Math.min(limit, Math.floor(Number(data.used) || 0)));
    return { used, limit, limitReached: data.limitReached === true || used >= limit };
}

/** Displays either the regular stakeholder information or the limit state.
 * @param {Object} options Request options or display state.
 * @returns {void}
 */
function renderStakeholderState({ used, limit, limitReached }) {
    const counters = document.querySelectorAll(".requestCounter");
    if (!counters.length) return;
    counters.forEach((counter) => {
            counter.innerHTML = renderHtmlTemplate('renderStakeholderStateTemplate', [used, limit]);
            counter.classList.toggle("requestCounterLimit", limitReached);
            counter.removeAttribute("aria-busy");
        });
    const hiddenStates = { limitNotice: !limitReached, normalCopy: limitReached,
        limitCopy: !limitReached, stakeholderLead: limitReached,
        normalIllustration: limitReached, limitIllustration: !limitReached };
    Object.entries(hiddenStates).forEach(([id, hidden]) => { document.getElementById(id).hidden = hidden; });
    updateRequestLink(limitReached);
}

/** Enables the form link or blocks it after the daily limit is reached.
 * @param {boolean} limitReached Whether the daily request limit has been reached.
 * @returns {void}
 */
function updateRequestLink(limitReached) {
    const link = document.getElementById("emailRequestButton");
    if (!link) return;
    link.textContent = limitReached ? "Daily limit reached" : "Create request";
    link.classList.toggle("disabledButton", limitReached);
    link.setAttribute("aria-disabled", String(limitReached));
    link.href = limitReached ? "#limitNotice" : "./request.html";
}

/** Initializes the live counter while retaining a query-based demo mode.
 * @returns {Promise<*>} initialize stakeholder page result.
 */
async function initializeStakeholderPage() {
    if (!document.getElementById("requestCounter")) return;
    const demoCount = getDemoRequestCount();
    if (demoCount !== null) return renderDemoCounter(demoCount);
    try {
        renderStakeholderState(await loadDailyRequestCount());
    } catch (error) {
        renderCounterFallback(error);
    }
}

/** Renders a counter value supplied through the demo query parameter.
 * @param {*} used used.
 * @returns {void}
 */
function renderDemoCounter(used) {
    renderStakeholderState({ used, limit: DAILY_REQUEST_LIMIT,
            limitReached: used >= DAILY_REQUEST_LIMIT });
}

/** Keeps the stakeholder page usable when the counter endpoint is offline.
 * @param {Error} error Failure to display or propagate.
 * @returns {void}
 */
function renderCounterFallback(error) {
    console.warn("The daily request counter is currently unavailable.", error);
    renderStakeholderState({ used: 0, limit: DAILY_REQUEST_LIMIT,
            limitReached: false });
}

document.addEventListener("DOMContentLoaded", initializeStakeholderPage);
