/** Loads board data, shared navigation, and the initial task cards.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function initBoard() {
    await loadDataTask();
    await loadDataContacts();
    await includeHTML();
    checkIfEmpty();
    renderTasks();
    showInitials();
}

/** Opens the shared Add Task form inside the Board modal.
 * @param {string} status status.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function showOverlay(status = 'triage') {
    const overlay = document.getElementById('addTaskOverlay');
    const form = document.getElementById('board-edit-task-main-input');
    form.innerHTML = '';
    form.setAttribute('w3-include-html', './template/addTaskTemplate.html?v=20260916-2');
    prepareBoardTaskOverlay(overlay);
    overlay.dataset.status = status;
    await addTaskInit();
    configureBoardTaskFooter(form);
    clearTask();
    revealBoardTaskOverlay(overlay);
    activateTaskDialog(overlay.querySelector('[role="dialog"]'));
}

/** Prepares the Board Add Task overlay outside the viewport.
 * @param {HTMLElement} overlay overlay.
 * @returns {void}
 */
function prepareBoardTaskOverlay(overlay) {
    overlay.querySelector('.overlayContentAddTask').style.transform = 'translateX(120vw)';
    overlay.hidden = false;
    overlay.style.display = 'flex';
}

/** Slides the Board Add Task dialog into view.
 * @param {HTMLElement} overlay overlay.
 * @returns {void}
 */
function revealBoardTaskOverlay(overlay) {
    setTimeout(() => {
            overlay.querySelector('.overlayContentAddTask').style.transform = 'translateX(0)';
        }, 10);
}

/** Uses the shared form buttons with a scrollable Board-specific footer layout.
 * @param {HTMLElement} form form.
 * @returns {void}
 */
function configureBoardTaskFooter(form) {
    form.querySelector('#at-btn-container').className = 'board-task-footer';
    form.querySelector('#at-alert-description').className = 'board-task-required';
    form.querySelector('.btn-clear-add').className = 'board-task-footer-actions';
}

/** Closes the Board Add Task modal and restores the previous focus.
 * @param {Event} event Interaction that triggered the handler.
 * @param {boolean} forceClose force Close.
 * @returns {void}
 */
function offAddTask(event, forceClose = false) {
    const overlay = document.getElementById('addTaskOverlay');
    if (!forceClose && event && event.target !== overlay) return;
    hideBoardTaskOverlay(overlay);
    restoreTaskDialogFocus();
}

/** Slides out and then hides the Board Add Task overlay.
 * @param {HTMLElement} overlay overlay.
 * @returns {void}
 */
function hideBoardTaskOverlay(overlay) {
    overlay.querySelector('.overlayContentAddTask').style.transform = 'translateX(120vw)';
    setTimeout(() => {
            overlay.hidden = true;
            overlay.style.display = 'none';
        }, 500);
}

/**
 * Renders the tasks in their respective columns and updates the UI.
 * Generate task card using a template
 * Attach click event listener
 * Append task to the appropriate column
 * Update progress bar
 * Ensure columns display empty messages if needed
 * @returns {void}
 */
function renderTasks() {
    const columns = getBoardColumns();
    Object.values(columns).forEach(column => column.innerHTML = '');
    tasks.forEach((task, index) => renderTaskCard(task, index, columns));
    checkIfEmpty();
}

/** Returns the board status-to-column mapping.
 * @returns {Object} Resulting data.
 */
function getBoardColumns() {
    return { triage: document.getElementById('triage'), toDo: document.getElementById('toDo'),
        progress: document.getElementById('progress'), feedback: document.getElementById('feedback'),
        done: document.getElementById('done') };
}

/** Creates one task card and appends it to its status column.
 * @param {Task} task Task record.
 * @param {number} index Zero-based list index.
 * @param {*} columns columns.
 * @returns {void}
 */
function renderTaskCard(task, index, columns) {
    const view = getTaskCardView(task);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = getTaskTemplate(task, index, view.color, task.category,
        view.assignees, view.priorityIcon, view.completedCount, view.editSubtasks,
        task.id, view.subtasks);
    wrapper.addEventListener('click', event => openTaskFromCard(event, task, view));
    bindTaskCardKeyboard(wrapper);
    (columns[task.status] || columns.triage).appendChild(wrapper);
    updateProgressBar(view.completedCount, task.subcategory.length, index);
}

/** Collects derived values needed to render a task card and overlay.
 * @param {Task} task Task record.
 * @returns {Object} Resulting data.
 */
function getTaskCardView(task) {
    return { subtasks: getSubtask(task), editSubtasks: getEditSubtaskHTML(task.subcategory),
        completedCount: task.completedSubtasks.filter(value => value === 'true').length,
        assignees: getTaskAssignee(task.assignedTo), priorityIcon: getPriorityIcon(task.prio),
        color: task.category === 'User Story' ? '#1FD7C1' : '' };
}

/** Stops card event bubbling and opens its detail overlay.
 * @param {Event} event Interaction that triggered the handler.
 * @param {Task} task Task record.
 * @param {*} view view.
 * @returns {void}
 */
function openTaskFromCard(event, task, view) {
    event.stopPropagation();
    showOverlay1(task.title, task.description, task.date, task.prio, task.assignedTo,
        task.category, view.subtasks, task.id, view.editSubtasks, task.creator,
        task.aiGenerated, task.attachments);
}

/**
 * Retrieves the HTML for task assignees and handles overflow if there are more than three assignees.
 * @param {Array} assignedTo assigned To.
 * @returns {string} - HTML string representing the task assignees.
 */
function getTaskAssignee(assignedTo) {
    if (!Array.isArray(assignedTo) || assignedTo.length === 0) return '';
    let visibleAssignees = assignedTo.slice(0, 3);
    let taskAssignee = visibleAssignees.map(assignee => {
            let contact = contacts.find(contact => contact.id === assignee.id);
            return contact ? renderHtmlTemplate('taskAssigneeTemplate', [safeTaskColor(contact.profileColor), getContactAvatarHTML(contact)]) : '';
        }).join('');
    let remainingAssignees = assignedTo.length - visibleAssignees.length;
    if (remainingAssignees > 0) {
        taskAssignee += renderHtmlTemplate('taskAssigneeTemplate2', [remainingAssignees]);
    }
    return taskAssignee;
}
