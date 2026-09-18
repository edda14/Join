/** Renders the complete contact list.
 * @returns {void}
 */
function renderContacts() {
    createContactList();
}

/** Builds the alphabetically grouped contact list.
 * @param {Object} newContactIndex new Contact Index.
 * @returns {void}
 */
function createContactList(newContactIndex = null) {
    const contactList = document.getElementById('contact-list');
    contactList.innerHTML = '';
    const seenContacts = new Set();
    const entries = getSortedContactEntries();
    const letters = [...new Set(entries.map(({ contact }) => getContactGroupLetter(contact)))];
    letters.forEach(letter => renderContactGroup(contactList, letter, seenContacts, newContactIndex, entries));
}

/** Sorts names for display while preserving the original contact indices.
 * @returns {Array<{contact: Contact, index: number}>} Resulting data.
 */
function getSortedContactEntries() {
    const collator = new Intl.Collator('de', { sensitivity: 'base' });
    return contacts.map((contact, index) => ({ contact, index }))
    .sort((a, b) => collator.compare(stripYouSuffix(a.contact.name), stripYouSuffix(b.contact.name)));
}

/** Groups accented names under their base letter, such as Ä under A.
 * @param {Contact} contact Contact record.
 * @returns {string} Rendered markup or text.
 */
function getContactGroupLetter(contact) {
    return stripYouSuffix(contact.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .charAt(0).toUpperCase() || '#';
}

/** Renders all unique contacts belonging to one alphabet group.
 * @param {HTMLElement} contactList contact List.
 * @param {string} letter letter.
 * @param {Array<*>} seenContacts seen Contacts.
 * @param {Object} newContactIndex new Contact Index.
 * @param {Array<*>} entries entries.
 * @returns {void}
 */
function renderContactGroup(contactList, letter, seenContacts, newContactIndex, entries) {
    let headingAdded = false;
    entries.forEach(({ contact, index }) => {
            const displayName = getContactDisplayName(contact);
            const contactKey = getContactKey(contact, displayName);
            if (!contactMatchesGroup(contact, letter, contactKey, seenContacts)) return;
            if (!headingAdded) headingAdded = appendContactHeading(contactList, letter);
            appendContactItem(contactList, contact, index, displayName, index === newContactIndex);
            seenContacts.add(contactKey);
        });
}

/** Checks whether a contact belongs in the requested alphabet group.
 * @param {Contact} contact Contact record.
 * @param {string} letter letter.
 * @param {string} contactKey contact Key.
 * @param {Array<*>} seenContacts seen Contacts.
 * @returns {*} contact matches group result.
 */
function contactMatchesGroup(contact, letter, contactKey, seenContacts) {
    return getContactGroupLetter(contact) === letter && !seenContacts.has(contactKey);
}

/** Returns the stable identity used to hide legacy contact duplicates.
 * @param {Contact} contact Contact record.
 * @param {string} displayName display Name.
 * @returns {string} Rendered markup or text.
 */
function getContactKey(contact, displayName) {
    return contact?.mail?.trim().toLowerCase() || displayName.trim().toLowerCase();
}

/** Appends an alphabet heading and reports that it was added.
 * @param {HTMLElement} contactList contact List.
 * @param {string} letter letter.
 * @returns {boolean} append contact heading result.
 */
function appendContactHeading(contactList, letter) {
    const heading = document.createElement('div');
    heading.textContent = letter;
    heading.classList.add('letter-heading');
    contactList.appendChild(heading);
    return true;
}

/** Builds and appends one selectable contact row.
 * @param {HTMLElement} contactList contact List.
 * @param {Contact} contact Contact record.
 * @param {number} index Zero-based list index.
 * @param {string} displayName display Name.
 * @param {boolean} isNewContact is New Contact.
 * @returns {void}
 */
function appendContactItem(contactList, contact, index, displayName, isNewContact) {
    const item = document.createElement('div');
    item.classList.add('contact');
    item.dataset.contactId = contact.id;
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.onkeydown = activateContactControl;
    if (isNewContact) item.classList.add('active');
    item.appendChild(createContactAvatar(contact));
    item.appendChild(createContactDetails(contact, displayName));
    item.onclick = () => selectContactItem(item, index);
    contactList.appendChild(item);
}

/** Creates the avatar element for a contact row.
 * @param {Contact} contact Contact record.
 * @returns {*} create contact avatar result.
 */
function createContactAvatar(contact) {
    const avatar = document.createElement('div');
    avatar.classList.add('profile-picture');
    avatar.style.backgroundColor = contact.profileColor;
    avatar.innerHTML = getContactAvatarHTML(contact);
    return avatar;
}

/** Creates the name and email element for a contact row.
 * @param {Contact} contact Contact record.
 * @param {string} displayName display Name.
 * @returns {*} create contact details result.
 */
function createContactDetails(contact, displayName) {
    const details = document.createElement('div');
    details.classList.add('oneContact');
    details.innerHTML = renderHtmlTemplate('createContactDetailsTemplate', [displayName, contact.mail]);
    return details;
}

/** Activates a contact row and opens its details.
 * @param {*} item item.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function selectContactItem(item, index) {
    document.querySelectorAll('.contact').forEach(contact => contact.classList.remove('active'));
    item.classList.add('active');
    contactClickHandler(index);
}

/** Opens the contact specified in the page URL, if present.
 * @returns {void}
 */
function openContactFromUrl() {
    const email = new URLSearchParams(window.location.search).get('email');
    if (!email) return;
    const contactIndex = contacts.findIndex(contact =>
        contact.mail && contact.mail.toLowerCase() === email.toLowerCase()
    );
    if (contactIndex < 0) return;
    document.querySelectorAll('.contact').forEach(contact => contact.classList.remove('active'));
    const selectedContact = document.querySelector(`[data-contact-id="${contacts[contactIndex].id}"]`);
    selectedContact?.classList.add('active');
    selectedContact?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    contactClickHandler(contactIndex);
}
