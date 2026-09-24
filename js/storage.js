let contacts = [];

let users = [];

let tasks = [];

/** Loads and normalizes all tasks from Firebase.
 * @param {string} path Firebase database path.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function loadDataTask(path = "/task") {
    let response = await firebaseRequest(path);
    let responseToJson = await response.json();
    tasks = [];
    if (!responseToJson) {
        console.warn("No tasks found, or Firebase returned null.");
        return;
    }
    tasks = Object.entries(responseToJson).map(([id, data]) => normalizeTask(id, data));
}

/** Converts a Firebase task record into the format used by the UI.
 * @param {string} id Database or DOM identifier.
 * @param {Object} data data.
 * @returns {Task} Resulting data.
 */
function normalizeTask(id, data) {
    return { id, title: data.title, description: data.description,
        assignedTo: data.assignedTo || [], date: data.date, prio: data.prio,
        category: data.category, subcategory: data.subcategory || [],
        completedSubtasks: data.completedSubtasks || [], status: data.status || "triage",
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        creator: data.creator || null, source: data.source || 'manual',
        aiGenerated: data.aiGenerated === true, createdAt: data.createdAt || null };
}

/** Returns creator metadata for a manually created task.
 * @returns {Object} Resulting data.
 */
function getCurrentTaskCreator() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return {
        type: 'internal',
        role: currentUser?.role || 'member',
        uid: currentUser?.uid || null,
        name: currentUser?.name || 'Guest',
        email: currentUser?.email || null,
    };
}

/**
 * Checks whether the current session may mutate a task. The original Join
 * requirements explicitly give authenticated demo guests access to every
 * board feature so employers can test the complete application.
 * @param {Task} taskToCheck task To Check.
 * @returns {boolean}
 */
function canCurrentUserModifyTask(taskToCheck) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return Boolean(currentUser?.uid && taskToCheck);
}

/** Loads all contacts from Firebase.
 * @param {string} path Firebase database path.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function loadDataContacts(path = '/contacts') {
    const response = await firebaseRequest(path);
    const data = await response.json();
    contacts = Object.entries(data || {}).map(([id, contact]) => normalizeContact(id, contact));
    if (typeof showInitials === 'function') showInitials();
}

/** Normalizes a stored contact while retaining its photo and database identifier.
 * @param {string} id Database or DOM identifier.
 * @param {Contact} contact Contact record.
 * @returns {Contact} Resulting data.
 */
function normalizeContact(id, contact) {
    return { id, mail: contact.mail, name: contact.name, initials: contact.initials,
        phone: contact.phone, profileColor: contact.profileColor, photo: contact.photo || '' };
}

/** Fetches user data from Firebase.
 * @param {string} path Firebase database path.
 * @returns {Promise<*>} fetch user data result.
 */
async function fetchUserData(path) {
    let response = await firebaseRequest(path);
    return response.json();
}

/** Loads all registered member profiles.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function loadUserData() {
    const data = await fetchUserData('users');
    users = Object.entries(data || {}).map(([id, user]) => ({ id, name: user.name, email: user.email }));
}
