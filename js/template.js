const navigationPages = {
    'summary.html': 'summaryMenu',
    'addTask.html': 'addTaskMenu',
    'board.html': ['boardMenu', 'boardMenuResposive'],
    'contacts.html': 'contactsMenu',
    'legalNotice.html': 'legalNoticeMenu',
    'privacyPolicy.html': 'privacyPolicyMenu',
    'legalNoticeNoLogin.html': 'legalNoticeNoLoginMenu',
    'privacyPolicyNoLogin.html': 'privacyPolicyNoLoginMenu'
};

/**
 * Escapes text for insertion into HTML text nodes or quoted attributes.
 * @param {*} value value.
 * @returns {string} Rendered markup or text.
 */
function escapeTaskText(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

/**
 * Restricts stored avatar colors to hexadecimal CSS colors.
 * @param {string} value value.
 * @returns {string} Rendered markup or text.
 */
function safeTaskColor(value) {
    return /^#[0-9a-f]{3,8}$/i.test(value) ? value : '#2A3647';
}

let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

let includeHTMLPromise = null;

/** Initializes shared includes, contacts, and the signed-in user avatar.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function initTemplate() {
    await includeHTML();
    await loadDataContacts();
    showInitials();
}

/** Loads shared HTML once and reuses the in-flight request.
 * @returns {string} Rendered markup or text.
 */
async function includeHTML() {
    if (includeHTMLPromise) return includeHTMLPromise;
    includeHTMLPromise = loadIncludes();
    try {
        await includeHTMLPromise;
    } finally {
        includeHTMLPromise = null;
    }
}

/** Fetches and inserts every element marked with w3-include-html.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function loadIncludes() {
    const elements = Array.from(document.querySelectorAll('[w3-include-html]'));
    await Promise.all(elements.map(loadHtmlInclude));
    currentPage();
}

/** Fetches and inserts one reusable HTML section.
 * @param {HTMLElement} element DOM element to update.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function loadHtmlInclude(element) {
    const file = element.getAttribute('w3-include-html');
    const basePath = window.location.pathname.includes('Joyn-Juls') ? '/Joyn-Juls/' : '/';
    try {
        const response = await fetch(basePath + file);
        if (!response.ok) throw new Error(`Could not load ${file}`);
        element.innerHTML = await response.text();
        element.removeAttribute('w3-include-html');
    } catch (error) { element.innerHTML = 'Page not found'; console.error(error); }
}

/** Navigates to the previous browser-history entry.
 * @returns {void}
 */
function goBack() {
    window.history.back();
}

/** Toggles the compact user submenu.
 * @returns {void}
 */
function toggleSubMenu() {
    let element = document.getElementById('subMenu');
    element.classList.toggle('open');
}

/** Closes the profile menu when the pointer moves outside its controls.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function closeSubMenuOutside(event) {
    const menu = document.getElementById('subMenu');
    const trigger = document.getElementById('userIcon');
    if (!menu?.classList.contains('open')) return;
    if (!menu.contains(event.target) && !trigger?.contains(event.target)) menu.classList.remove('open');
}

document.addEventListener('click', closeSubMenuOutside);

/** Highlights navigation entries matching the current page.
 * @returns {void}
 */
function currentPage() {
    const pageName = window.location.href.split('/').pop();
    const targetIds = navigationPages[pageName];
    if (!targetIds) return;
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    ids.forEach(markCurrentNavigationItem);
}

/** Marks one navigation item as the active page.
 * @param {string} id Database or DOM identifier.
 * @returns {void}
 */
function markCurrentNavigationItem(id) {
    document.getElementById(id)?.classList.add('currentPage');
}

/** Renders a stored photo or the contact's initials across the application.
 * @param {Contact} contact Contact record.
 * @returns {string} Rendered markup or text.
 */
function getContactAvatarHTML(contact) {
    const photo = contact?.photo || '';
    if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(photo)) {
        return escapeTaskText(contact?.initials || contact?.initial || '');
    }
    const avatar = document.createElement('img');
    avatar.className = 'contact-avatar-photo';
    avatar.src = photo;
    avatar.alt = '';
    return avatar.outerHTML;
}

/** Resolves a task assignment to the current contact instead of its old snapshot.
 * @param {Object} assignment assignment.
 * @returns {Contact|Object} Resulting data.
 */
function getAssignedContact(assignment) {
    return contacts.find(contact => contact.id === (assignment.id || assignment)) || assignment;
}

/** Renders the active user's latest contact photo or initials in the header.
 * @returns {void}
 */
function showInitials() {
    const userIcon = document.getElementById('userIcon');
    if (!userIcon || !currentUser?.name) return;
    const contact = contacts.find(item => currentUser.email &&
        item.mail?.toLowerCase() === currentUser.email.toLowerCase());
    userIcon.innerHTML = getContactAvatarHTML({ ...contact,
            initials: getNameInitials(currentUser.name) });
}

/** Returns first and last initials for a display name.
 * @param {string} name Display name.
 * @returns {string} Rendered markup or text.
 */
function getNameInitials(name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0).toUpperCase() || '';
    const last = parts.length > 1 ? parts.at(-1).charAt(0).toUpperCase() : '';
    return first + last;
}

/** Removes local session data for the active user.
 * @returns {void}
 */
function clearStorage() {
    sessionStorage.removeItem("currentUser");
}

/** Signs out from Firebase and returns to the login page.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function logout() {
    if (window.firebaseAuth?.signOut) await window.firebaseAuth.signOut();
    clearStorage();
    window.location.replace("./login.html");
}
