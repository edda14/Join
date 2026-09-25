let profileColors = [
    '#B9A7EA',
    '#F3A6C8',
    '#9BCBF4',
    '#F4DB72',
    '#A8C8A0',
    '#F4B69D',
    '#91D4CC',
    '#C7A6E8',
    '#F3A7A7',
    '#AAB8EB',
    '#A8DDB5',
    '#E7B58A',
];

/**
 * Returns a random pastel color, preferring colors not yet used by a contact.
 * This keeps the contact list varied before colors begin to repeat.
 * @returns {string} Rendered markup or text.
 */
function getRandomProfileColor() {
    const usedColors = new Set(contacts.map(contact => contact.profileColor));
    const unusedColors = profileColors.filter(color => !usedColors.has(color));
    const colorPool = unusedColors.length > 0 ? unusedColors : profileColors;
    return colorPool[Math.floor(Math.random() * colorPool.length)];
}

/** Removes the current-user suffix from a contact name.
 * @param {string} name Display name.
 * @returns {string} Rendered markup or text.
 */
function stripYouSuffix(name = '') {
    return name.replace(/\s*\(You\)\s*$/, '').trim();
}

/** Checks whether a contact represents the signed-in user.
 * @param {Contact} contact Contact record.
 * @returns {boolean} is current user contact result.
 */
function isCurrentUserContact(contact) {
    const signedInUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return Boolean(
        signedInUser?.email &&
        contact?.mail &&
        signedInUser.email.toLowerCase() === contact.mail.toLowerCase()
    );
}

/** Returns the contact name used in the interface.
 * @param {Contact} contact Contact record.
 * @returns {string} Rendered markup or text.
 */
function getContactDisplayName(contact) {
    const name = stripYouSuffix(contact?.name || '');
    return isCurrentUserContact(contact) ? `${name} (You)` : name;
}

/** Initializes the contacts page.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function contactInit() {
    await includeHTML();
    showInitials();
    await loadDataContacts();
    renderContacts();
    openContactFromUrl();
    window.matchMedia('(max-width: 1000px)').addEventListener('change', refreshContactLayout);
}

/** Extracts uppercase initials from a full name.
 * @param {string} name Display name.
 * @returns {string} Rendered markup or text.
 */
function extractInitials(name) {
    const names = name.split(' ');
    let initial = '';
    for (let i = 0; i < names.length; i++) {
        initial += names[i].charAt(0).toUpperCase();
    }
    return initial;
}

/** Validates and saves the add-contact form.
 * @returns {Promise<*>} get new contact result.
 */
async function getNewContact() {
    return runContactSave('add', createValidatedContact);
}

/** Persists validated add-contact inputs and closes the panel on success.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function createValidatedContact() {
    const inputs = getNewContactInputs();
    const newContactIndex = await saveNewContact(inputs);
    clearContactInputs(inputs);
    cancelAddContact();
    slideSuccessfullyContact();
    const openDelay = window.innerWidth <= 1000 ? 500 : 0;
    window.setTimeout(() => contactClickHandler(newContactIndex), openDelay);
}

/** Returns the add-contact input elements.
 * @returns {Object} Resulting data.
 */
function getNewContactInputs() {
    return {
        name: document.getElementById('fullName'),
        email: document.getElementById('emailAdress'),
        phone: document.getElementById('phoneNumber'),
    };
}

/** Saves a new contact and refreshes the selected contact view.
 * @param {*} inputs inputs.
 * @returns {Promise<number>} Index of the newly created contact.
 */
async function saveNewContact(inputs) {
    const contact = buildNewContact(inputs);
    const result = await postContact('/contacts', contact);
    await loadDataContacts();
    const index = contacts.findIndex(contactItem => contactItem.id === result?.name);
    if (index < 0) throw new Error('The new contact could not be loaded.');
    createContactList(index);
    return index;
}

/** Builds the storage object for a new contact.
 * @param {*} inputs inputs.
 * @returns {*} build new contact result.
 */
function buildNewContact(inputs) {
    return {
        mail: inputs.email.value.trim(),
        name: inputs.name.value.trim(),
        initials: extractInitials(inputs.name.value.trim()),
        phone: inputs.phone.value.trim(),
        profileColor: getRandomProfileColor(),
        photo: contactPhotos.add,
    };
}

/** Clears all add-contact fields.
 * @param {*} inputs inputs.
 * @returns {void}
 */
function clearContactInputs(inputs) {
    Object.values(inputs).forEach(input => { input.value = ''; });
}

/** Opens a selected contact in the appropriate layout.
 * @param {number} i Zero-based list index.
 * @returns {void}
 */
function contactClickHandler(i) {
    let contact = contacts[i];
    if (window.innerWidth <= 1000) {
        editContactResponsive(contact, i);
    } else {
        document.getElementById('contactListContent').classList.remove('d-none');
        let contactSection = document.getElementById('viewContact');
        contactSection.innerHTML = getContactViewTemplate(contact, i);
    }
    const details = document.getElementById('viewContact');
    details.tabIndex = -1;
    details.focus({ preventScroll: true });
}

/** Opens contact details in the responsive layout.
 * @param {Contact} contact Contact record.
 * @param {number} i Zero-based list index.
 * @returns {void}
 */
function editContactResponsive(contact, i) {
    document.getElementById('contactListContent').classList.add('d-none');
    document.getElementById('contactContent').classList.remove('d-noneResp');
    document.getElementById('addContactResp').classList.add('d-noneResp');
    let contactSection = document.getElementById('viewContact');
    contactSection.innerHTML = getResponsiveContactTemplate(contact, i);
}

/** Slides the responsive edit actions into view.
 * @param {number} i Zero-based list index.
 * @returns {void}
 */
function showEditDiv(i) {
    let editDivResp = document.getElementById('editDivResp');
    setTimeout(() => {
            editDivResp.style.right = '6px';
        }, 10);
}

/** Slides the responsive edit actions out of view.
 * @returns {void}
 */
function closeEditDiv() {
    const editDivResp = document.getElementById('editDivResp');
    if (!editDivResp) return;
    setTimeout(() => {
            editDivResp.style.right = '-200px';
        }, 10);
}

/** Returns from responsive contact details to the contact list.
 * @returns {void}
 */
function closeEditResponsive() {
    const allContacts = document.querySelectorAll('.contact');
    allContacts.forEach(c => c.classList.remove('active'));
    document.getElementById('contactListContent').classList.remove('d-none');
    document.getElementById('contactContent').classList.add('d-noneResp');
    document.getElementById('addContactResp').classList.remove('d-noneResp');
}

/** Displays the contact-created confirmation briefly.
 * @returns {void}
 */
function slideSuccessfullyContact() {
    let container = document.getElementById('successfullyContainer');
    let successfully = document.getElementById('successfully');
    container.style.display = 'flex';
    successfully.classList.add('slide-in-bottom');
    setTimeout(() => {
            successfully.classList.remove('slide-in-bottom');
            container.style.display = 'none';
        }, 1000);
}

/** Activates contact actions with Enter or Space.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function activateContactControl(event) {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.currentTarget.click();
}

/** Restores the selected contact when the navigation layout changes.
 * @returns {void}
 */
function refreshContactLayout() {
    const selected = document.querySelector('.contact.active');
    const index = contacts.findIndex(contact => contact.id === selected?.dataset.contactId);
    if (index >= 0) contactClickHandler(index);
    else closeEditResponsive();
}
