/** Remembers the control that opened the current task dialog. */
let taskDialogOpener = null;

/** Binds keyboard controls once per rendered task form.
 * @returns {void}
 */
function setupTaskAccessibility() {
    const search = document.getElementById('contact-search');
    if (!search || search.dataset.keyboardBound) return;
    search.dataset.keyboardBound = 'true';
    search.addEventListener('keydown', handleContactSearchKey);
    search.addEventListener('input', () => openContactDropdown(document.getElementById('at-contact-container')));
    document.getElementById('at-contact-container').addEventListener('keydown', closeContactListOnEscape);
}

/** handle Contact Search Key.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {*} handle contact search key result.
 */
function handleContactSearchKey(event) {
    const list = document.getElementById('at-contact-container');
    if (event.key === 'Escape') return closeContactListOnEscape(event);
    if (!['ArrowDown', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    openContactDropdown(list);
    list.querySelector('input')?.focus();
}

/** close Contact List On Escape.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function closeContactListOnEscape(event) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    closeContactDropdown(document.getElementById('at-contact-container'));
    document.getElementById('contact-search').focus();
}

/** update Assigned Contact.
 * @param {HTMLInputElement} input Input element to read or update.
 * @returns {void}
 */
function updateAssignedContact(input) {
    const contact = contacts.find(item => item.id === input.dataset.contactId);
    if (!contact) return;
    updateContactSelection(input.checked, contact, input.closest('.at-contact-layout'));
}

/**
 * Exposes validation visually and to assistive technology.
 * @param {string} id Database or DOM identifier.
 * @param {string} messageId message Id.
 * @param {boolean} invalid invalid.
 * @returns {boolean} Whether the field is valid.
 */
function validateTaskField(id, messageId, invalid) {
    const input = document.getElementById(id);
    input.setAttribute('aria-invalid', String(invalid));
    input.style.borderColor = invalid ? 'rgba(230, 0, 38, 1)' : '';
    document.getElementById(messageId).classList.toggle('d-none', !invalid);
    return !invalid;
}

/** bind Task Card Keyboard.
 * @param {HTMLElement} wrapper wrapper.
 * @returns {void}
 */
function bindTaskCardKeyboard(wrapper) {
    const card = wrapper.querySelector('.card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', event => {
            if (!['Enter', ' '].includes(event.key)) return;
            event.preventDefault();
            card.click();
        });
}

/** activate Task Dialog.
 * @param {HTMLElement} dialog dialog.
 * @returns {void}
 */
function activateTaskDialog(dialog) {
    taskDialogOpener = document.activeElement;
    dialog.onkeydown = handleTaskDialogKey;
    dialog.focus();
}

/** Returns focus to the control that opened the task dialog.
 * @returns {void}
 */
function restoreTaskDialogFocus() {
    if (taskDialogOpener?.isConnected) taskDialogOpener.focus();
    taskDialogOpener = null;
}

/** handle Task Dialog Key.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function handleTaskDialogKey(event) {
    if (event.key === 'Escape') {
        event.stopPropagation();
        if (event.currentTarget.closest('#addTaskOverlay')) offAddTask(null, true);
        else off();
    }
    if (event.key === 'Tab') containTaskDialogFocus(event);
}

/** contain Task Dialog Focus.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function containTaskDialogFocus(event) {
    const selector = 'button, input, textarea, select, a[href], [tabindex="0"]';
    const controls = [...event.currentTarget.querySelectorAll(selector)]
    .filter(element => !element.disabled && element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!first || (event.shiftKey && document.activeElement === first)
    || (!event.shiftKey && document.activeElement === last)
    || document.activeElement === event.currentTarget) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
    }
}

/**
 * Closes a task overlay after its exit animation finishes.
 * @param {HTMLElement} overlay overlay.
 * @param {HTMLElement} content content.
 * @returns {void}
 */
function animateTaskDialogClose(overlay, content) {
    content.style.transform = 'translateX(120vw)';
    setTimeout(() => {
        overlay.style.display = 'none';
        content.style.transform = 'translateX(120vw)';
    }, 500);
}

/** mark Keyboard Navigation.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function markKeyboardNavigation(event) {
    if (['Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        document.documentElement.setAttribute('data-keyboard-navigation', '');
    }
}

/** Removes keyboard focus markers when using a mouse, pen, or touch.
 * @returns {void}
 */
function markPointerNavigation() {
    document.documentElement.removeAttribute('data-keyboard-navigation');
}

document.addEventListener('keydown', markKeyboardNavigation, true);
document.addEventListener('pointerdown', markPointerNavigation, true);
