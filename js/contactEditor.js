/** Opens a contact in the edit panel.
 * @param {number} i Zero-based list index.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function showEditContact(i) {
    let contact = contacts[i];
    isItYou = isCurrentUserContact(contact);
    openEditContactPanel();
    populateEditContactPanel(contact, i);
}

/** Makes the edit-contact panel visible.
 * @returns {void}
 */
function openEditContactPanel() {
    document.getElementById('editContactSecondSection').innerHTML = '';
    document.getElementById('blurBackgroundEdit').classList.remove('d-none');
    editContact.style.display = "flex";
    setTimeout(() => { editContact.style.transform = "translateX(0)"; }, 10);
}

/** Populates the edit-contact panel with stored values.
 * @param {Contact} contact Contact record.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function populateEditContactPanel(contact, index) {
    const displayName = stripYouSuffix(contact.name);
    document.getElementById('editContactSecondSection').innerHTML = editContactHTML(index);
    document.getElementById('editName').value = displayName;
    document.getElementById('editEmail').value = contact.mail;
    document.getElementById('editPhone').value = contact.phone;
    document.getElementById('initialsEditContact').style.backgroundColor = contact.profileColor;
    contactPhotos.edit = contact.photo || '';
    document.getElementById('edit-contact-photo-preview').innerHTML = getContactAvatarHTML(contact);
    setupContactValidation('edit');
}

/** Returns the edit form markup for one contact.
 * @param {number} i Zero-based list index.
 * @returns {string} Rendered markup or text.
 */
function editContactHTML(i) {
    let contact = contacts[i];
    return getEditContactTemplate(contact, i);
}

/** Saves values edited in the contact form.
 * @param {number} i Zero-based list index.
 * @returns {Promise<*>} edit contact to array result.
 */
async function editContactToArray(i) {
    return runContactSave('edit', () => saveValidatedContactEdit(i));
}

/** Updates the same contact ID after successful field validation.
 * @param {number} i Zero-based list index.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function saveValidatedContactEdit(i) {
    const contactId = contacts[i].id;
    await changeContact(`/contacts/${contactId}`, buildEditedContact(contacts[i]));
    await loadDataContacts();
    contactClickHandler(contacts.findIndex(contact => contact.id === contactId));
    cancelEditContact();
    createContactList();
}

/** Builds a contact object from the edit form.
 * @param {Contact} contact Contact record.
 * @returns {*} build edited contact result.
 */
function buildEditedContact(contact) {
    const name = stripYouSuffix(document.getElementById('editName').value);
    return {
        ...contact,
        photo: contactPhotos.edit,
        name,
        mail: document.getElementById('editEmail').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        profileColor: contact.profileColor,
        initials: extractInitials(name),
    };
}

// Öffnet die Box 'Add new Contact'
/** Opens the add-contact panel.
 * @returns {void}
 */
function showAddContact() {
    setupContactValidation('add');
    contactPhotos.add = '';
    document.querySelector('.profilPictureDivContent').innerHTML = renderHtmlTemplate('showAddContactTemplate', [getContactPhotoPickerHTML('add')]);
    document.getElementById('addNewContactAlert').innerHTML = '';
    document.getElementById('blurBackground').classList.remove('d-none');
    addNewContact.style.display = "flex";
    setTimeout(() => {
            addNewContact.style.transform = "translateX(0)";
        }, 10);
}

/** Closes the add-contact panel.
 * @returns {void}
 */
function cancelAddContact() {
    addNewContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
            addNewContact.style.display = "none";
            document.getElementById('blurBackground').classList.add('d-none');
        }, 500);
    closeEditDiv();
}

/** Closes the edit-contact panel.
 * @returns {void}
 */
function cancelEditContact() {
    editContact.style.transform = "translateX(120vw)";
    setTimeout(() => {
            editContact.style.display = "none";
            document.getElementById('blurBackgroundEdit').classList.add('d-none');
        }, 500);
    closeEditDiv();
}
