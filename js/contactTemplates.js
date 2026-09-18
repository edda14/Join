/** Returns one selectable contact row for task assignment.
 * @param {string} initials Contact initials.
 * @param {string} contactName Contact display name.
 * @param {string} id Database or DOM identifier.
 * @param {string} color Validated CSS color.
 * @returns {string} Rendered markup or text.
 */
function generateAssignedContactsHTML(initials, contactName, id, color) {
    return renderHtmlTemplate('assignedContactsHTMLTemplate', [safeTaskColor(color), getContactAvatarHTML(getAssignedContact({ id, initials })), escapeTaskText(contactName), escapeTaskText(id), escapeTaskText(contactName), safeTaskColor(color), escapeTaskText(initials)]);
}

/** Returns the desktop contact-detail markup.
 * @param {Contact} contact Contact record.
 * @param {number} i Zero-based list index.
 * @returns {*} get contact view template result.
 */
function getContactViewTemplate(contact, i) {
    return `${getContactProfileHTML(contact, i)}
    <div class="contactInformation"><p>Contact Information</p></div>
    <div>${getContactInformationHTML(contact)}</div>`;
}

/** Returns a contact's avatar, name, and desktop actions.
 * @param {Contact} contact Contact record.
 * @param {number} index Zero-based list index.
 * @returns {string} Rendered markup or text.
 */
function getContactProfileHTML(contact, index) {
    return renderHtmlTemplate('contactProfileHTMLTemplate', [contact.profileColor, getContactAvatarHTML(contact), getContactDisplayName(contact), index, contact.id]);
}

/** Returns a contact's email and phone fields.
 * @param {Contact} contact Contact record.
 * @returns {string} Rendered markup or text.
 */
function getContactInformationHTML(contact) {
    const phoneNumber = String(contact.phone || '').replace(/[^+0-9]/g, '');
    return renderHtmlTemplate('contactInformationHTMLTemplate', [contact.mail, contact.mail, phoneNumber, escapeTaskText(contact.phone || '')]);
}

/** Returns the mobile contact-detail markup.
 * @param {Contact} contact Contact record.
 * @param {number} i Zero-based list index.
 * @returns {string} get responsive contact template result.
 */
function getResponsiveContactTemplate(contact, i) {
    return renderHtmlTemplate('responsiveContactTemplate', [getContactProfileHTML(contact, i), getContactInformationHTML(contact), getResponsiveContactActionsHTML(contact, i)]);
}

/** Returns mobile edit/delete controls for a contact.
 * @param {Contact} contact Contact record.
 * @param {number} index Zero-based list index.
 * @returns {string} Rendered markup or text.
 */
function getResponsiveContactActionsHTML(contact, index) {
    return renderHtmlTemplate('responsiveContactActionsHTMLTemplate', [index, index, contact.id]);
}

/** Returns the contact-edit form markup.
 * @param {Contact} contact Contact record.
 * @param {number} i Zero-based list index.
 * @returns {string} get edit contact template result.
 */
function getEditContactTemplate(contact, i) {
    return renderHtmlTemplate('editContactTemplate', [getContactPhotoPickerHTML('edit'), getEditContactInputsHTML(), contact.id, i]);
}

/** Returns the input group used by the contact-edit form.
 * @returns {string} Rendered markup or text.
 */
function getEditContactInputsHTML() {
    return renderHtmlTemplate('editContactInputsHTMLTemplate', []);
}
