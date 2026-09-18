const contactSaveState = { add: false, edit: false };

/** Returns the input elements of the selected contact form.
 * @param {string} mode Add or edit contact mode.
 * @returns {{name: HTMLInputElement, email: HTMLInputElement, phone: HTMLInputElement}} Contact inputs.
 */
function getContactFormFields(mode) {
    const ids = mode === 'add' ? ['fullName', 'emailAdress', 'phoneNumber'] : ['editName', 'editEmail', 'editPhone'];
    return Object.fromEntries(['name', 'email', 'phone'].map((name, index) => [name, document.getElementById(ids[index])]));
}

/** Validates a contact field without changing the form.
 * @param {string} field Name, email or phone field.
 * @param {string} value Entered field value.
 * @returns {string} Error message, or an empty string for valid input.
 */
function getContactFieldError(field, value) {
    if (!value.trim()) return 'This field is required.';
    const rules = {
        name: [/^[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*(?:\s+[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*)+$/u, 'Enter a first and last name without numbers.'],
        email: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
        phone: [/^\+?[0-9]+$/, 'Use digits only, optionally starting with +.'],
    };
    return rules[field][0].test(value.trim()) ? '' : rules[field][1];
}

/** Displays a contact field's validation result.
 * @param {HTMLInputElement} input Input element to read or update.
 * @param {*} message Feedback text; an empty string clears the error.
 * @returns {void}
 */
function showContactFieldError(input, message) {
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message;
    error.hidden = !message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.closest('.inputBox').classList.toggle('contact-input-invalid', Boolean(message));
}

/** Validates every contact field and focuses the first invalid input.
 * @param {string} mode Add or edit contact mode.
 * @returns {boolean} Whether all fields are valid.
 */
function validateContactForm(mode) {
    let firstInvalid = null;
    for (const [field, input] of Object.entries(getContactFormFields(mode))) {
        const message = getContactFieldError(field, input.value);
        showContactFieldError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
    }
    firstInvalid?.focus();
    firstInvalid?.scrollIntoView({ block: 'nearest' });
    return !firstInvalid;
}

/** Binds contact field validation and clears old feedback.
 * @param {string} mode Contact editor mode: add or edit.
 * @returns {void}
 */
function setupContactValidation(mode) {
    for (const [field, input] of Object.entries(getContactFormFields(mode))) {
        input.setAttribute('aria-describedby', `${input.id}-error`);
        input.setAttribute('aria-label', {name: 'First and last name', email: 'Email', phone: 'Phone'}[field]);
        showContactFieldError(input, '');
        input.onblur = () => showContactFieldError(input, getContactFieldError(field, input.value));
        input.oninput = () => {
            if (input.getAttribute('aria-invalid') === 'true') showContactFieldError(input, getContactFieldError(field, input.value));
        };
    }
    showContactSaveError(mode, '');
}

/** set Contact Form Busy.
 * @param {string} mode Contact editor mode: add or edit.
 * @param {*} busy busy.
 * @returns {void}
 */
function setContactFormBusy(mode, busy) {
    contactSaveState[mode] = busy;
    const panel = document.getElementById(mode === 'add' ? 'addNewContactSecondSection' : 'editContactSecondSection');
    panel.setAttribute('aria-busy', String(busy));
    panel.querySelectorAll('button, input').forEach(control => { control.disabled = busy; });
}

/** show Contact Save Error.
 * @param {string} mode Contact editor mode: add or edit.
 * @param {*} message Feedback text; an empty string clears the error.
 * @returns {void}
 */
function showContactSaveError(mode, message) {
    const panel = document.getElementById(mode === 'add' ? 'addNewContactSecondSection' : 'editContactSecondSection');
    const error = panel.querySelector('.contact-save-error');
    error.textContent = message;
    error.hidden = !message;
}

/** run Contact Save.
 * @param {string} mode Contact editor mode: add or edit.
 * @param {*} save save.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function runContactSave(mode, save) {
    if (contactSaveState[mode] || !validateContactForm(mode)) return;
    showContactSaveError(mode, '');
    setContactFormBusy(mode, true);
    try { await waitForContactPhoto(mode); await save(); }
    catch (error) { showContactSaveError(mode, `Contact could not be saved. Your inputs are retained. ${error.message}`); }
    finally { setContactFormBusy(mode, false); }
}
