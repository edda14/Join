/**
 * Shows the edit overlay for a specific task.
 * @async
 * Load the tasks from the backend
 * Find the specific task by its ID
 * Remove all elements with the specified classes
 * Removes the element from the DOM
 * Check assigned contacts and update checkboxes
 * Use assignedTo from task
 * Mark the checkbox as checked
 * Generate the subtask HTML if the task has subcategories
 * @param {string} id Database or DOM identifier.
 * @returns {Promise<*>} show edit overlay result.
 */
async function showEditOverlay(id) {
    await loadDataTask();
    const task = tasks.find(task => task.id === id);
    if (!canCurrentUserModifyTask(task)) return;
    if (!task) return console.error('Task not found');
    await addTaskInit();
    initializeTaskEditState(task);
    prepareEditOverlay(id);
    bindEditSaveButton(id);
    selectAssignedContacts(task.assignedTo || []);
    const subtasks = Array.isArray(task.subcategory) ? getEditSubtaskHTML(task.subcategory) : '';
    renderEditTaskData(id, task.title, task.description, task.date, task.prio, subtasks);
    document.getElementById('task-title').focus();
}

/**
 * Copies task selections so edits cannot mutate the loaded task prematurely.
 * @param {Task} task Task record.
 * @returns {void}
 */
function initializeTaskEditState(task) {
    pendingAttachments = task.attachments.map(file => ({ ...file }));
    renderAttachmentPreviews();
    selectedSubtasks = [...task.subcategory];
    subtaskCompleted = task.subcategory.map((_, index) => task.completedSubtasks[index] || 'false');
    selectedContacts = task.assignedTo.map(contact => ({ ...contact }));
}

/** Switches the detail overlay into its task-edit form.
 * @param {string} id Database or DOM identifier.
 * @returns {void}
 */
function prepareEditOverlay(id) {
    document.getElementById(`edit-task-overlay${id}`).classList.remove('d-none');
    const form = document.getElementById(`edit-main-input-container${id}`);
    form.classList.replace('main-input-container', 'edit-main-input-container');
    document.getElementById('task-category').disabled = true;
    ['input-border-container', 'at-alert-description', 'at-btn-container',
        'category-headline', 'category-input', 'at-subcategory-open', 'editDiv']
    .forEach(elementId => document.getElementById(elementId)?.classList.add('d-none'));
    document.querySelector('.right-left-container').style.display = 'block';
    removeTaskDetailElements();
}

/** Removes task-detail elements that are replaced by edit controls.
 * @returns {void}
 */
function removeTaskDetailElements() {
    document.querySelectorAll('.overlayContent > :not(.edit-task-overlay)')
    .forEach(element => element.remove());
    document.querySelector('.overlayContent').setAttribute('aria-label', 'Edit task');
}

/** Binds the edit overlay save button to the active task.
 * @param {string} id Database or DOM identifier.
 * @returns {*} bind edit save button result.
 */
function bindEditSaveButton(id) {
    document.querySelector('.board-task-edit-btn').onclick = event => {
        event.preventDefault();
        return saveTaskChanges(id);
    };
}

/** Marks the task's current assignees in the edit dropdown.
 * @param {Array<*>} assignedContacts assigned Contacts.
 * @returns {void}
 */
function selectAssignedContacts(assignedContacts) {
    assignedContacts.forEach(contact => selectAssignedContact(contact.id || contact));
}

/** Selects one assigned contact in the edit dropdown.
 * @param {string} contactId Contact database identifier.
 * @returns {*} select assigned contact result.
 */
function selectAssignedContact(contactId) {
    const checkbox = document.querySelector(`input[data-contact-id="${contactId}"]`);
    if (!checkbox) return console.warn(`Checkbox with ID ${contactId} not found.`);
    checkbox.checked = true;
    checkbox.closest('.at-contact-layout')?.classList.add('is-selected');
}

/**
 * Renders the task data in the edit overlay.
 * Ensure correct rendering before setting priority background
 * Assign the generated HTML or an empty string if there are no subtasks
 * Set the priority icon
 * @param {string} id Database or DOM identifier.
 * @param {string} taskTitle task Title.
 * @param {string} taskDescription task Description.
 * @param {string} taskDueDate task Due Date.
 * @param {string} taskPriority task Priority.
 * @param {string} subtaskHTML Rendered subtask markup.
 * @returns {void}
 */
function renderEditTaskData(id, taskTitle, taskDescription, taskDueDate, taskPriority, subtaskHTML) {
    document.getElementById('task-title').value = taskTitle;
    document.getElementById('at-description').value = taskDescription;
    document.getElementById('task-due-date').value = taskDueDate;
    document.getElementById('added-subcategories').innerHTML = subtaskHTML;
    const priorityIcon = getPriorityIcon(taskPriority);
    const priorityIconElement = document.getElementById('priority-icon');
    if (priorityIconElement && priorityIcon) priorityIconElement.src = priorityIcon;
    resetOtherPriorities('reset');
    setBackgroundColorPrio(taskPriority || 'medium');
}

/**
 * Gets the selected priority level for a task.
 * @returns {string} The selected priority ('urgent', 'medium', or 'low').
 */
function getSelectedPriority() {
    const priorityElements = document.querySelectorAll('.at-prio-item');
    for (const element of priorityElements) {
        if (element.classList.contains('at-bg-urgent')) {
            return 'urgent';
        } else if (element.classList.contains('at-bg-medium')) {
            return 'medium';
        } else if (element.classList.contains('at-bg-low')) {
            return 'low';
        }
    }
    return 'low';
}
