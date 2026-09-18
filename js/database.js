const BASE_URL =
"https://join-323f5-default-rtdb.europe-west1.firebasedatabase.app/";

/** Appends a task to Firebase and returns its generated key.
 * @param {string} path Firebase database path.
 * @param {Task} task Task record.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function postTask(path, task) {
    return writeDatabaseJson(path, 'POST', task);
}

/** Replaces task data at a Firebase path.
 * @param {string} path Firebase database path.
 * @param {Task} task Task record.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function changeTask(path, task) {
    return writeDatabaseJson(path, 'PUT', task);
}

/** Replaces contact data at a Firebase path.
 * @param {string} path Firebase database path.
 * @param {Object} data data.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function changeContact(path = '', data = {}) {
    return writeDatabaseJson(path, 'PUT', data);
}

/** Appends a contact to Firebase.
 * @param {string} path Firebase database path.
 * @param {Object} newContact new Contact.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function postContact(path, newContact) {
    return writeDatabaseJson(path, 'POST', newContact);
}

/** Deletes contact data at a Firebase path.
 * @param {string} path Firebase database path.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function deleteDataContact(path = '') {
    return writeDatabaseJson(path, 'DELETE');
}

/** Deletes a contact and refreshes the contact page.
 * @param {string} contact Firebase contact path to delete.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function deleteContact(contact) {
    await deleteDataContact(contact);
    await loadDataContacts();
    renderContacts();
    document.getElementById('viewContact').innerHTML = '';
}

/** Stores a member profile at its Firebase UID path.
 * @param {string} path Firebase database path.
 * @param {Object} userProfile user Profile.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function putUserData(path, userProfile) {
    return writeDatabaseJson(path, 'PUT', userProfile);
}

/**
 * Sends an authenticated request to Firebase Realtime Database.
 * Firebase web configuration is public by design; access is protected by the
 * signed-in user's short-lived ID token and the database security rules.
 * @param {string} path Firebase database path.
 * @param {RequestInit} options Request options or display state.
 * @returns {Promise<Response>}
 */
async function firebaseRequest(path = '', options = {}) {
    if (!window.firebaseAuth?.getIdToken) throw new Error('Firebase Authentication has not been initialized.');
    const token = await window.firebaseAuth.getIdToken();
    const url = `${BASE_URL}${path}.json?auth=${encodeURIComponent(token)}`;
    const response = await fetch(url, options);
    if (!response.ok) await rejectDatabaseResponse(response, path, options);
    return response;
}

/** Converts an unsuccessful database response into a retryable save error.
 * @param {Response} response HTTP response from Firebase.
 * @param {string} path Firebase database path.
 * @param {Object} options Request options or display state.
 * @returns {Promise<never>} Rejects with the HTTP status and Firebase error.
 * @throws {Error} Details of the rejected database request.
 */
async function rejectDatabaseResponse(response, path, options) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(`Firebase ${options.method || 'GET'} ${path} — HTTP ${response.status}: ${details.error || response.statusText}`);
    error.status = response.status;
    throw error;
}

/** Writes JSON data through the authenticated database transport.
 * @param {string} path Database path without a .json suffix.
 * @param {string} method POST, PUT or DELETE.
 * @param {Object} [data] Record to save; omitted when deleting.
 * @returns {Promise<Object|null>} Firebase's JSON result.
 */
async function writeDatabaseJson(path, method, data) {
    const options = { method };
    if (data !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    const response = await firebaseRequest(path, options);
    return response.json();
}
