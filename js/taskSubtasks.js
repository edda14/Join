/** Activates the new-subtask input controls.
 * @returns {void}
 */
function activateSubcategory() {
    let inputField = document.getElementById('add-subcategory');
    if (document.getElementById('at-subcategory-clear').classList.contains('d-none')) {
        document.getElementById('at-subcategory-clear').classList.remove('d-none');
        document.getElementById('at-subcategory-border').classList.remove('d-none');
        document.getElementById('at-subcategory-confirm').classList.remove('d-none');
        document.getElementById('at-subcategory-open').classList.add('d-none');
    }
    inputField.focus();
}

/** Restores the inactive new-subtask controls.
 * @returns {void}
 */
function deactivateSubcategory() {
    document.getElementById('at-subcategory-clear')?.classList.add('d-none');
    document.getElementById('at-subcategory-border')?.classList.add('d-none');
    document.getElementById('at-subcategory-confirm')?.classList.add('d-none');
    document.getElementById('at-subcategory-open')?.classList.remove('d-none');
}

/** Binds mouse and keyboard controls for creating subtasks.
 * @returns {void}
 */
function setupSubcategoryControls() {
    const input = document.getElementById('add-subcategory');
    const container = input?.closest('.at-input-container');
    if (!input || !container || container.dataset.subcategoryBound === 'true') return;
    container.dataset.subcategoryBound = 'true';
    const clear = document.getElementById('at-subcategory-clear');
    const confirm = document.getElementById('at-subcategory-confirm');
    document.getElementById('at-subcategory-open').onclick = activateSubcategory;
    clear.onmousedown = event => event.preventDefault();
    confirm.onmousedown = event => event.preventDefault();
    clear.onclick = clearInputSubcategory;
    confirm.onclick = renderSubcategory;
    input.addEventListener('keydown', confirmSubtaskWithKeyboard);
}

/** confirm Subtask With Keyboard.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function confirmSubtaskWithKeyboard(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    renderSubcategory();
}

/** Clears the new-subtask input without closing the task overlay.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function clearInputSubcategory(event) {
    let inputField = document.getElementById('add-subcategory');
    event.stopPropagation();
    inputField.value = '';
    saveTaskDraft();
}

/** Adds a pending subtask and renders all selected subtasks.
 * @returns {void}
 */
function renderSubcategory() {
    let content = document.getElementById('added-subcategories');
    const input = document.getElementById('add-subcategory');
    if (input.value !== '') {
        selectedSubtasks.push(input.value);
        subtaskCompleted.push('false');
        input.value = '';
        deactivateSubcategory();
    }
    content.innerHTML = selectedSubtasks.map(getSubcategoryEditorHTML).join('');
    saveTaskDraft();
}

/** Returns editable HTML for one selected subtask.
 * @param {*} subtaskText subtask Text.
 * @param {number} i Zero-based list index.
 * @returns {string} Rendered markup or text.
 */
function getSubcategoryEditorHTML(subtaskText, i) {
    return renderHtmlTemplate('subcategoryEditorHTMLTemplate', [i, i + 1, i, i, escapeTaskText(subtaskText), i, i + 1, i, i + 1, i]);
}

/** Removes every selected subtask.
 * @returns {void}
 */
function removeAllSubcategory() {
    selectedSubtasks = [];
    subtaskCompleted = [];
    document.getElementById('add-subcategory').value = '';
    renderSubcategory();
}

/** Focuses one editable subtask input.
 * @param {string} inputId input Id.
 * @returns {void}
 */
function focusInput(inputId) {
    document.getElementById(inputId).focus();
}

/** Removes a selected subtask by index.
 * @param {number} i Zero-based list index.
 * @returns {void}
 */
function removeSubcategory(i) {
    selectedSubtasks.splice(i, 1);
    subtaskCompleted.splice(i, 1);
    renderSubcategory();
}

/** Removes an edited subtask when its value is left empty.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function removeEmptySubtask(index) {
    const input = document.getElementById(`choosed-subcategory-${index}`);
    if (!input || input.value.trim()) return;
    selectedSubtasks.splice(index, 1);
    subtaskCompleted.splice(index, 1);
    renderSubcategory();
}
