/** Binds the legacy assigned-contact dropdown toggle.
 * @returns {void}
 */
function setupDropdownToggle() {
    document.querySelector('.select-selected').addEventListener('click', toggleAssignmentDropdown);
    document.addEventListener('click', closeAssignmentDropdownOutside);
}

/** Toggles the contact list without triggering the outside-click handler.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function toggleAssignmentDropdown(event) {
    event.stopPropagation();
    event.currentTarget.classList.toggle('select-arrow-active');
    document.getElementById('at-contact-container').classList.toggle('select-hide');
}

/** Closes the contact list when clicking outside the selection controls.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function closeAssignmentDropdownOutside(event) {
    if (event.target.closest('.custom-select, .select-items')) return;
    document.getElementById('at-contact-container').classList.add('select-hide');
    document.querySelector('.select-selected').classList.remove('select-arrow-active');
}

/** Renders all contacts into each assignment dropdown.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function renderAssignedToContacts() {
    const markup = getUniqueSortedContacts().map(contact => generateAssignedContactsHTML(
            contact.initials, contact.name, contact.id, contact.profileColor)).join('');
    Array.from(document.getElementsByClassName('select-items'))
    .forEach(container => { container.innerHTML = markup; });
}

/** Returns contacts once each, ordered by the same name order as Contacts.
 * @returns {Contact[]} Resulting data.
 */
function getUniqueSortedContacts() {
    const unique = new Map();
    const collator = new Intl.Collator('de', { sensitivity: 'base' });
    contacts.forEach(contact => {
            const key = (contact.mail || contact.name || contact.id).trim().toLowerCase();
            if (!unique.has(key)) unique.set(key, contact);
        });
    return [...unique.values()].sort((a, b) => collator.compare(
            a.name.replace(/\s*\(You\)\s*$/, '').trim(),
            b.name.replace(/\s*\(You\)\s*$/, '').trim()));
}

/** Filters the assignment list by the entered contact name.
 * @returns {*} filter contacts result.
 */
function filterContacts() {
    const searchInput = document.getElementById('contact-search');
    if (!searchInput) return reportMissingContactElement('contact-search');
    const searchValue = searchInput.value.toLowerCase();
    const filteredContacts = getUniqueSortedContacts().filter(contact => contact.name.toLowerCase().includes(searchValue));
    const container = document.getElementById('at-contact-container');
    if (!container) return reportMissingContactElement('at-contact-container');
    container.innerHTML = filteredContacts.map(contactToAssignmentHTML).join('');
    filteredContacts.forEach(contact => updateCheckboxState(contact.id));
}

/** Reports a missing assignment control without stopping the page.
 * @param {string} id Database or DOM identifier.
 * @returns {void}
 */
function reportMissingContactElement(id) {
    console.error(`Element mit der ID "${id}" wurde nicht gefunden.`);
}

/** Converts one contact into assignment-list HTML.
 * @param {Contact} contact Contact record.
 * @returns {string} Rendered markup or text.
 */
function contactToAssignmentHTML(contact) {
    return generateAssignedContactsHTML(
        contact.initials, contact.name, contact.id, contact.profileColor);
}

/** Adds a contact to the current task selection.
 * @param {string} initials Contact initials.
 * @param {string} id Database or DOM identifier.
 * @param {string} color Validated CSS color.
 * @returns {void}
 */
function addContactToTask(initials, id, color) {
    if (!selectedContacts.some(contact => contact.id === id)) {
        selectedContacts.push({ id, initial: initials, color });
    }
    renderSelectedContacts();
    updateCheckboxState(id);
}

/** Removes a contact from the current task selection.
 * @param {string} id Database or DOM identifier.
 * @returns {void}
 */
function removeContactFromTask(id) {
    selectedContacts = selectedContacts.filter(contact => contact.id !== id);
    renderSelectedContacts();
    updateCheckboxState(id);
}

/** Synchronizes all checkboxes for one contact.
 * @param {string} contactId Contact database identifier.
 * @returns {void}
 */
function updateCheckboxState(contactId) {
    const checkboxes = document.querySelectorAll(`input[data-contact-id="${contactId}"]`);
    checkboxes.forEach(checkbox => {
            const isSelected = selectedContacts.some(contact => contact.id === contactId);
            checkbox.checked = isSelected;
            checkbox.closest('.at-contact-layout')?.classList.toggle('is-selected', isSelected);
        });
}

/** Renders avatars for the currently selected contacts.
 * @returns {void}
 */
function renderSelectedContacts() {
    document.getElementById('at-selected-contacts').innerHTML = selectedContacts
    .map(contact => renderHtmlTemplate('showChoosedContactsTemplate', [safeTaskColor(getAssignedContact(contact).profileColor || contact.color), getContactAvatarHTML(getAssignedContact(contact))])).join('');
}

/** Initializes all assignment dropdowns.
 * @returns {void}
 */
function showAvailableContacts() {
    const customSelects = document.querySelectorAll('.custom-select');
    customSelects.forEach(select => {
            const selectSelected = select.querySelector('.select-selected');
            const selectItems = select.querySelector('.select-items');
            closeContactDropdown(selectItems);
            if (select.dataset.contactDropdownBound === 'true') return;
            select.dataset.contactDropdownBound = 'true';
            showContactList(selectSelected, selectItems, customSelects);
            bindContactOutsideClick(select, selectItems);
        });
}

/** Closes an assignment dropdown and restores its arrow icon.
 * @param {HTMLElement} selectItems select Items.
 * @returns {void}
 */
function closeContactDropdown(selectItems) {
    selectItems.style.display = 'none';
    document.getElementById('contact-toggle')?.setAttribute('aria-expanded', 'false');
    selectItems.classList.add('select-hide');
    document.getElementById('open-contact-list')?.classList.remove('d-none');
    document.getElementById('close-contact-list')?.classList.add('d-none');
}

/** Closes an assignment dropdown when the user clicks elsewhere.
 * @param {*} select select.
 * @param {HTMLElement} selectItems select Items.
 * @returns {void}
 */
function bindContactOutsideClick(select, selectItems) {
    document.addEventListener('click', event => {
            if (!select.contains(event.target)) closeContactDropdown(selectItems);
        }, true);
}

/** Handles a click on an assignment-list contact.
 * @param {Event} event Interaction that triggered the handler.
 * @param {string} contactId Contact database identifier.
 * @returns {void}
 */
function handleContactSelection(event, contactId) {
    event.preventDefault();
    event.stopPropagation();
    toggleCheckbox(contactId);
}

/** Toggles one assigned contact and keeps its visual state in sync.
 * @param {string} contactId Contact database identifier.
 * @returns {void}
 */
function toggleCheckbox(contactId) {
    const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);
    if (!checkbox) return;
    checkbox.checked = !checkbox.checked;
    const selectedContact = contacts.find(contact => contact.id === contactId);
    const contactLayout = checkbox.closest('.at-contact-layout');
    updateContactSelection(checkbox.checked, selectedContact, contactLayout);
}

/** Applies a checked or unchecked contact selection.
 * @param {boolean} isSelected is Selected.
 * @param {Contact} contact Contact record.
 * @param {*} layout layout.
 * @returns {void}
 */
function updateContactSelection(isSelected, contact, layout) {
    if (isSelected) addContactToTask(contact.initials, contact.id, contact.profileColor);
    else removeContactFromTask(contact.id);
    layout?.classList.toggle('is-selected', isSelected);
}

/** Binds opening and closing of an assignment dropdown.
 * @param {HTMLElement} selectSelected select Selected.
 * @param {HTMLElement} selectItems select Items.
 * @param {Array<*>} customSelects custom Selects.
 * @returns {void}
 */
function showContactList(selectSelected, selectItems, customSelects) {
    selectSelected.addEventListener('click', function (event) {
            event.stopPropagation();
            const shouldOpen = selectItems.classList.contains('select-hide');
            customSelects.forEach(select => closeContactDropdown(select.querySelector('.select-items')));
            if (shouldOpen) openContactDropdown(selectItems);
        });
}

/** Opens an assignment dropdown and switches its arrow icon.
 * @param {HTMLElement} selectItems select Items.
 * @returns {void}
 */
function openContactDropdown(selectItems) {
    document.getElementById('contact-toggle')?.setAttribute('aria-expanded', 'true');
    selectItems.classList.remove('select-hide');
    selectItems.style.display = 'block';
    document.getElementById('open-contact-list')?.classList.add('d-none');
    document.getElementById('close-contact-list')?.classList.remove('d-none');
}
