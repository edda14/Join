/**
 * Searches for tasks based on the input and filters them in the UI.
 * Select the containers for each category
 * Clear any existing "no results" messages
 * Track if matches are found for each section
 * Find the parent section of the card
 * Check each section and add "no results" message if needed
 * @returns {*} search tasks result.
 */
function searchTasks() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    removeExistingNoResultsMessages();
    toggleEmptyTaskFields(Boolean(searchInput));
    if (!searchInput) return resetTaskSearch();
    const matches = { triage: false, toDo: false, progress: false,
        feedback: false, done: false };
    document.querySelectorAll('.card').forEach(card => filterTaskCard(card, searchInput, matches));
    addSearchEmptyMessages(matches);
}

/** Hides regular empty-column fields while a task search is active.
 * @param {boolean} isSearching is Searching.
 * @returns {void}
 */
function toggleEmptyTaskFields(isSearching) {
    document.querySelectorAll('.noTasks').forEach(field => {
            field.style.display = isSearching ? 'none' : 'flex';
        });
}

/** Restores every task card after the search input has been cleared.
 * @returns {void}
 */
function resetTaskSearch() {
    document.querySelectorAll('.card').forEach(card => card.style.display = 'flex');
}

/** Shows a task card when title or description contains the search term.
 * @param {HTMLElement} card card.
 * @param {HTMLElement} searchInput search Input.
 * @param {*} matches matches.
 * @returns {void}
 */
function filterTaskCard(card, searchInput, matches) {
    const title = card.querySelector('.cardTitle').textContent.toLowerCase();
    const description = card.querySelector('.cardContext').textContent.toLowerCase();
    const section = card.closest('#triage, #toDo, #progress, #feedback, #done');
    const isMatch = title.includes(searchInput) || description.includes(searchInput);
    card.style.display = isMatch ? 'block' : 'none';
    if (isMatch && section) matches[section.id] = true;
}

/** Adds a no-results message to every board column without a search match.
 * @param {*} matches matches.
 * @returns {void}
 */
function addSearchEmptyMessages(matches) {
    Object.entries(matches).forEach(([id, found]) => {
            if (!found) addNoResultsMessage(document.getElementById(id));
        });
}

/**
 * Removes any existing "no results" messages from the task containers.
 * @returns {void}
 */
function removeExistingNoResultsMessages() {
    document.querySelectorAll('.no-results-message').forEach(message => message.remove());
}

/**
 * Adds a "no results" message to a specific container if no matching tasks are found.
 * @param {HTMLElement} container container.
 * @returns {void}
 */
function addNoResultsMessage(container) {
    if (container) {
        let noResultsMessage = document.createElement('div');
        noResultsMessage.classList.add('no-results-message');
        noResultsMessage.textContent = 'No matching tasks found';
        container.appendChild(noResultsMessage);
    }
}
