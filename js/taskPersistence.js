/** Tracks whether a task write is already in progress. */
let taskSaveInProgress = false;
let taskSubmitButtons = [];

/** Creates a manual task from the standalone Add Task page.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function addTask(event) {
    await createManualTask(event?.currentTarget);
}

/** Creates a manual task from the Board overlay.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function addTaskBoard(event) {
    await createManualTask(event?.currentTarget);
}

/** Saves a valid task and retains the form if Firebase rejects the write.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function createManualTask(form) {
    if (taskSaveInProgress) return;
    beginTaskSave(form);
    if (!checkRequiredInput()) {
        releaseTaskSubmit();
        return;
    }
    showTaskSaveError('');
    if (!await saveManualTaskWithFeedback()) releaseTaskSubmit();
}

/** Locks the active task form while its save request is being prepared.
 * @param {HTMLFormElement} form Task form containing submit controls.
 * @returns {void}
 */
function beginTaskSave(form) {
    taskSaveInProgress = true;
    taskSubmitButtons = [...(form?.querySelectorAll('button[type="submit"]') || [])];
    taskSubmitButtons.forEach(button => {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
    });
}

/** Saves the task and reports any failure while retaining the current form inputs.
 * @returns {Promise<boolean>} Whether the task was saved successfully.
 */
async function saveManualTaskWithFeedback() {
    try { return await saveManualTaskAndReset(); }
    catch (error) {
        reportTaskSaveError(error);
        return false;
    }
}

/** Restores the task form controls after a failed or cancelled save.
 * @returns {void}
 */
function releaseTaskSubmit() {
    taskSaveInProgress = false;
    taskSubmitButtons.forEach(button => {
        button.disabled = false;
        button.removeAttribute('aria-busy');
    });
    taskSubmitButtons = [];
}

/** Updates task submit buttons according to the current required-field state.
 * @param {HTMLFormElement} form Task form containing the submit controls.
 * @returns {void}
 */
function updateTaskSubmitState(form) {
    if (!form || taskSaveInProgress) return;
    const title = document.getElementById('task-title')?.value.trim();
    const dateInput = document.getElementById('task-due-date');
    const date = dateInput?.value;
    const dateValid = date && (!dateInput.min || date >= dateInput.min);
    const categoryValid = Boolean(categoryIsSelected && selectedCategory);
    const disabled = !(title && dateValid && categoryValid);
    form.querySelectorAll('button[type="submit"]').forEach(button => {
        button.disabled = disabled;
        if (disabled) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
    });
}

/** Persists the prepared task before clearing its browser draft.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function saveManualTaskAndReset() {
    if (!await prepareAttachmentsForSave()) return false;
    await postTask('/task', buildManualTask());
    localStorage.removeItem('joinTaskDraft');
    localStorage.removeItem('joinPendingAttachments');
    clearTask();
    goToBoard();
    return true;
}

/**
 * Shows a retryable save error without clearing the user's inputs.
 * @param {Error} error Failure to display or propagate.
 * @returns {void}
 */
function reportTaskSaveError(error) {
    console.error('Task could not be saved:', error);
    const reason = error.status === 401 || error.status === 403
    ? 'Firebase rejected the request. Check your login and the database validation rules.'
    : error instanceof TypeError && /fetch|network/i.test(error.message)
    ? 'The server could not be reached. Check your connection.'
    : 'The save operation failed. See the details below.';
    showTaskSaveError(`Task could not be saved. Your inputs are still available. ${reason} Details: ${error.message}`);
}

/** Shows save failures in the active task form and brings them into view.
 * @param {string} message Feedback text; an empty string clears the error.
 * @returns {void}
 */
function showTaskSaveError(message) {
    const form = document.getElementById('task-due-date')?.closest('form');
    const error = form?.querySelector('.task-save-error');
    if (!error) return;
    error.textContent = message;
    error.classList.toggle('d-none', !message);
    if (message) error.scrollIntoView({ block: 'nearest' });
}

/** Builds the shared Firebase representation of a manually created task.
 * @returns {Task} Resulting data.
 */
function buildManualTask() {
    return {
        title: document.getElementById("task-title").value,
        description: document.getElementById("at-description").value,
        assignedTo: selectedContacts?.length ? selectedContacts : [],
        date: document.getElementById("task-due-date").value,
        prio: taskPrio, category: selectedCategory,
        subcategory: selectedSubtasks, completedSubtasks: subtaskCompleted,
        attachments: pendingAttachments || [],
        status: getNewTaskStatus(), creator: getCurrentTaskCreator(), source: 'manual',
        aiGenerated: false, createdAt: new Date().toISOString(),
    };
}

/** Returns the active Board column, or Triage for the standalone task form.
 * @returns {string} Rendered markup or text.
 */
function getNewTaskStatus() {
    const overlay = document.getElementById('addTaskOverlay');
    const status = overlay && !overlay.hidden ? overlay.dataset.status : 'toDo';
    return ['triage', 'toDo', 'progress', 'feedback', 'done'].includes(status)
    ? status : 'toDo';
}

/** Deletes a permitted task and refreshes the board.
 * @param {string} id Database or DOM identifier.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function deleteTask(id) {
    const taskToDelete = tasks.find(taskItem => taskItem.id === id);
    if (!canCurrentUserModifyTask(taskToDelete)) return;
    await deleteDataTask(`/task/${id}`);
    await loadDataTask();
    renderTasks();
}

/** Deletes task data at a Firebase path.
 * @param {string} path Firebase database path.
 * @returns {Promise<*>} delete data task result.
 */
async function deleteDataTask(path) {
    return writeDatabaseJson(path, 'DELETE');
}

/**
 * Saves edited values and keeps the form available after a failed write.
 * @param {string} id Database or DOM identifier.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function saveTaskChanges(id) {
    if (taskSaveInProgress || !validateEditedTaskDate()) return;
    showTaskSaveError('');
    taskSaveInProgress = true;
    try {
        if (!await prepareAttachmentsForSave()) return;
        await persistTaskChanges(id);
    } catch (error) {
        reportTaskSaveError(error);
    } finally {
        taskSaveInProgress = false;
    }
}

/** Stops an edit with an empty or past due date and focuses its error.
 * @returns {boolean} validate edited task date result.
 */
function validateEditedTaskDate() {
    const input = document.getElementById('task-due-date');
    setDueDateMinimum();
    if (checkIfDateEmpty()) return true;
    input.focus();
    input.scrollIntoView({ block: 'center' });
    return false;
}

/**
 * Loads the current task, writes the edited values, and refreshes the board.
 * @param {string} id Database or DOM identifier.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function persistTaskChanges(id) {
    await loadDataTask();
    const existingTask = tasks.find(item => item.id === id);
    if (!canCurrentUserModifyTask(existingTask)) {
        throw new Error('Task is missing or cannot be edited.');
    }
    const updatedTask = buildUpdatedTask(existingTask);
    validateTaskDatabaseValues(updatedTask);
    await changeTask(`/task/${id}`, updatedTask);
    await refreshBoardAfterTaskSave();
}

/** Identifies values rejected by the database rules shipped with the project.
 * @param {Task} task Task record.
 * @returns {void}
 */
function validateTaskDatabaseValues(task) {
    const allowed = { status: ['triage', 'toDo', 'progress', 'feedback', 'done'],
        prio: ['urgent', 'medium', 'low'], source: ['manual', 'email', 'form'] };
    for (const [field, values] of Object.entries(allowed)) {
        if (!values.includes(task[field])) {
            throw new Error(`Task field "${field}" has value "${task[field]}". The local Firebase rules allow only: ${values.join(', ')}.`);
        }
    }
}

/** Builds a task object from edit-overlay values and immutable task data.
 * @param {Task} existingTask existing Task.
 * @returns {Task} Resulting data.
 */
function buildUpdatedTask(existingTask) {
    const subtasks = readEditedSubtasks();
    const assignees = readEditedAssignees();
    return { title: readTaskInput('task-title', 'Untitled'),
        description: readTaskInput('at-description', 'No description'),
        date: document.getElementById('task-due-date').value || todayAsIsoDate(),
        prio: getSelectedPriority(), subcategory: subtasks,
        assignedTo: assignees,
        attachments: pendingAttachments.map(file => ({ ...file })),
        status: existingTask.status, category: existingTask.category,
        completedSubtasks: subtasks.map((_, index) => subtaskCompleted[index] || 'false'), creator: existingTask.creator,
        source: existingTask.source, aiGenerated: existingTask.aiGenerated,
        createdAt: existingTask.createdAt };
}

/** Reads a trimmed task input and applies its fallback value.
 * @param {string} id Database or DOM identifier.
 * @param {string} fallback Value used when the input is empty.
 * @returns {string} Rendered markup or text.
 */
function readTaskInput(id, fallback) {
    return document.getElementById(id).value.trim() || fallback;
}

/** Returns today's local-independent ISO date.
 * @returns {string} Rendered markup or text.
 */
function todayAsIsoDate() {
    return new Date().toISOString().split('T')[0];
}

/** Reads all edited subtask labels.
 * @returns {string[]} Resulting data.
 */
function readEditedSubtasks() {
    return Array.from(document.querySelectorAll('.choosed-subcategory-input'), input => input.value);
}

/** Converts one selected contact checkbox into task assignee metadata.
 * @param {HTMLElement} input Input element to read or update.
 * @returns {Object} Resulting data.
 */
function checkboxToAssignee(input) {
    return { id: input.dataset.contactId, color: input.dataset.contactColor,
        initial: input.dataset.contactInitials };
}

/** Reads selected contacts from the edit overlay.
 * @returns {Object[]} Resulting data.
 */
function readEditedAssignees() {
    return selectedContacts.map(contact => ({ ...contact }));
}

/** Refreshes the board and closes the task overlay after a successful save.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function refreshBoardAfterTaskSave() {
    await loadDataTask();
    renderTasks();
    selectedSubtasks = [];
    off();
}
