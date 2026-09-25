let categoryIsSelected = false;

let selectedCategory = '';

let selectedSubtasks = [];

let subtaskCompleted = [];

let selectedContacts = [];

let taskPrio = '';

/** Initializes all controls and data used by the task form.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function addTaskInit() {
    await includeHTML();
    setDueDateMinimum();
    restorePendingAttachments();
    await loadDataContacts();
    await renderAssignedToContacts();
    initializeTaskFormControls();
}

/** Initializes task controls after their HTML and contact data are available.
 * @returns {void}
 */
function initializeTaskFormControls() {
    [showAvailableContacts, showCategoryList, showInitials, setupContactSearchPlaceholder,
        setupSubcategoryControls, setupAttachmentPicker, setupTaskDraftPersistence,
        setupTaskAccessibility].forEach(initialize => initialize());
    setupTaskSubmitValidation();
    setBackgroundColorPrio('medium');
}

function setupTaskSubmitValidation() {
    const form = document.querySelector('.join-task-form');
    if (!form || form.dataset.submitValidationBound) return;
    form.dataset.submitValidationBound = 'true';
    const refresh = () => updateTaskSubmitState(form);
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();
}

/** Binds automatic draft saving and restores the previous form state.
 * @returns {void}
 */
function setupTaskDraftPersistence() {
    const form = document.querySelector('.join-task-form');
    if (!form || form.dataset.draftBound) return;
    form.dataset.draftBound = 'true';
    form.addEventListener('input', saveTaskDraft);
    form.addEventListener('change', saveTaskDraft);
    if (performance.getEntriesByType("navigation")[0]?.type === "reload") restoreTaskDraft();
}

/** Saves all user-entered task fields to local browser storage.
 * @returns {void}
 */
function saveTaskDraft() {
    if (isEditingTask()) return;
    const draft = {
        title: document.getElementById('task-title')?.value || '',
        description: document.getElementById('at-description')?.value || '',
        date: document.getElementById('task-due-date')?.value || '',
        priority: taskPrio, category: selectedCategory, subtasks: selectedSubtasks,
        completed: subtaskCompleted, contacts: selectedContacts
    };
    try { localStorage.setItem('joinTaskDraft', JSON.stringify(draft)); }
    catch (error) { console.warn('Task draft could not be stored.', error); }
}

/** Restores the previous task draft after the form has been rendered.
 * @returns {void}
 */
function restoreTaskDraft() {
    if (isEditingTask()) return;
    let draft;
    try { draft = JSON.parse(localStorage.getItem('joinTaskDraft') || 'null'); }
    catch (error) { return; }
    if (!draft) return;
    restoreDraftFields(draft);
    restoreDraftSelections(draft);
}

/** Restores text fields, category and priority from a saved draft.
 * @param {Object} draft Saved task form state.
 * @returns {void}
 */
function restoreDraftFields(draft) {
    setDraftField('task-title', draft.title);
    setDraftField('at-description', draft.description);
    setDraftField('task-due-date', draft.date);
    const category = draft.category && document.querySelector(`[data-category="${draft.category}"]`);
    if (category) selectTaskCategory(category);
    if (draft.priority) setBackgroundColorPrio(draft.priority);
}

/** Restores selected contacts and subtasks from a saved draft.
 * @param {Object} draft Saved task form state.
 * @returns {void}
 */
function restoreDraftSelections(draft) {
    selectedSubtasks = Array.isArray(draft.subtasks) ? draft.subtasks : [];
    subtaskCompleted = Array.isArray(draft.completed) ? draft.completed : [];
    selectedContacts = Array.isArray(draft.contacts) ? draft.contacts : [];
    renderSubcategory();
    renderSelectedContacts();
    selectedContacts.forEach(contact => updateCheckboxState(contact.id));
}

/** Restores one simple form value when it exists.
 * @param {string} id Database or DOM identifier.
 * @param {*} value value.
 * @returns {void}
 */
function setDraftField(id, value) {
    const field = document.getElementById(id);
    if (field && value) field.value = value;
}

/** Resets the complete task form, including validation and pending subtasks.
 * @returns {void}
 */
function clearTask() {
    attachmentSelectionVersion++;
    resetTaskSelections();
    pendingAttachments = [];
    persistPendingAttachments();
    resetTaskInputs();
    refreshResetTaskControls();
}

/** Refreshes rendered task controls after resetting their state.
 * @returns {void}
 */
function refreshResetTaskControls() {
    [renderAssignedToContacts, renderSelectedContacts, clearCategoryDropdown,
        renderSubcategory, renderAttachmentPreviews, deactivateSubcategory]
    .forEach(refresh => refresh());
    document.querySelectorAll('.select-items').forEach(closeContactDropdown);
    resetOtherPriorities('reset');
    setBackgroundColorPrio('medium');
}

/** Restores empty task selections and clears all subtask completion flags.
 * @returns {void}
 */
function resetTaskSelections() {
    selectedContacts = [];
    selectedSubtasks = [];
    subtaskCompleted = [];
    selectedCategory = '';
    categoryIsSelected = false;
    taskPrio = '';
}

/** Clears text fields and hides validation messages from the previous draft.
 * @returns {void}
 */
function resetTaskInputs() {
    ['task-title', 'at-description', 'task-due-date', 'add-subcategory', 'contact-search']
    .forEach(id => document.getElementById(id).value = '');
    ['task-title', 'task-due-date', 'category-input']
    .forEach(id => document.getElementById(id).style.borderColor = '');
    ['at-alert-title', 'at-alert-due-date', 'at-alert-category']
    .forEach(id => document.getElementById(id).classList.add('d-none'));
    document.getElementById('original-placeholder').style.display = '';
    ['task-title', 'task-due-date', 'task-category'].forEach(id => {
            document.getElementById(id).setAttribute('aria-invalid', 'false');
            document.getElementById(id).style.borderColor = '';
        });
}

/** Shows task-created feedback and navigates to the Board.
 * @returns {void}
 */
function goToBoard() {
    let bgAddedNote = document.getElementById('bg-task-added-note');
    bgAddedNote.hidden = false;
    bgAddedNote.style.zIndex = 999999;
    bgAddedNote.style.visibility = 'visible';
    let addedNote = document.getElementById('task-added-note');
    addedNote.classList.remove('confirmation-task-creation-shown',
        'confirmation-task-creation-hiding');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        addedNote.classList.add('confirmation-task-creation-shown');
    }));
    setTimeout(function () {
        addedNote.classList.remove('confirmation-task-creation-shown');
        addedNote.classList.add('confirmation-task-creation-hiding');
    }, 1400);
    setTimeout(function () {
        window.location.href = './board.html';
    }, 1900);
}

/** Hides the custom contact-search placeholder while typing.
 * @returns {*} setup contact search placeholder result.
 */
function setupContactSearchPlaceholder() {
    const searchInput = document.getElementById('contact-search');
    const originalPlaceholder = document.getElementById('original-placeholder');
    if (!searchInput || !originalPlaceholder) return reportMissingSearchPlaceholder();
    searchInput.addEventListener('focus', () => originalPlaceholder.style.display = 'none');
    searchInput.addEventListener('blur', function() {
            if (this.value === '') originalPlaceholder.style.display = 'block';
        });
}

/** Reports absent contact-search placeholder elements.
 * @returns {void}
 */
function reportMissingSearchPlaceholder() {
    console.error('Elemente "contact-search" oder "original-placeholder" wurden nicht gefunden.');
}
