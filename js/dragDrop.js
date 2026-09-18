/**
 * @type {string|null} - The ID of the currently dragged element.
 */
let currentDraggedElement = null;

/**
 * @type {number|null} - The initial X coordinate when dragging starts.
 */
let initialX = null;

/**
 * @type {number|null} - The initial Y coordinate when dragging starts.
 */
let initialY = null;

/**
 * @type {boolean} - Flag to indicate if an element is currently being dragged.
 */
let isDragging = false;

/**
 * @type {HTMLElement|null} - The visual clone of the dragged element.
 */
let dragClone = null;

const STATUS_CHANGE_WEBHOOK_URL =
'https://julsino.app.n8n.cloud/webhook/join-status-change';

/**
 * Sends a successful task status change to the n8n notification workflow.
 * URL-encoded data avoids a CORS preflight for this public demo webhook.
 * Notification failures are logged without reverting the Firebase update.
 * @param {Task} task Task record.
 * @param {string} oldStatus old Status.
 * @param {string} newStatus new Status.
 * @returns {Promise<void>}
 */
async function notifyTaskStatusChange(task, oldStatus, newStatus) {
    const payload = buildStatusChangePayload(task, oldStatus, newStatus);
    try {
        await sendStatusChangePayload(payload);
    } catch (error) {
        console.error('Status notification could not be sent:', error);
    }
}

/** Builds URL-encoded notification data for n8n.
 * @param {Task} task Task record.
 * @param {string} oldStatus old Status.
 * @param {string} newStatus new Status.
 * @returns {*} build status change payload result.
 */
function buildStatusChangePayload(task, oldStatus, newStatus) {
    const creator = task.creator || {};
    return new URLSearchParams({
        taskId: task.id || '',
        title: task.title || 'Join-Ticket',
        oldStatus,
        newStatus,
        creatorName: creator.name || 'Stakeholder',
        creatorEmail: creator.email || '',
        creatorType: creator.type || 'internal',
    });
}

/** Sends encoded status data to the public n8n webhook.
 * @param {Object} payload payload.
 * @returns {*} send status change payload result.
 */
function sendStatusChangePayload(payload) {
    return fetch(STATUS_CHANGE_WEBHOOK_URL, {
            method: 'POST', mode: 'no-cors', keepalive: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: payload.toString(),
        });
}

/**
 * Persists a changed status and then triggers the creator notification.
 * @param {Task} task Task record.
 * @param {string} newStatus new Status.
 * @returns {Promise<void>}
 */
async function updateTaskStatus(task, newStatus) {
    const oldStatus = task.status;
    if (oldStatus === newStatus) return;
    await changeTask(`/task/${task.id}/status`, newStatus);
    task.status = newStatus;
    await notifyTaskStatusChange(task, oldStatus, newStatus);
}

/** Installs hover scrolling on board task rows.
 * @returns {void}
 */
function initializeBoardScrolling() {
    document.querySelectorAll('.taskContent').forEach(container => {
            container.addEventListener('mousemove', scrollTaskRow);
        });
}

/** Scrolls a task row while the pointer approaches either edge.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function scrollTaskRow(event) {
    const container = event.currentTarget;
    const { width, left } = container.getBoundingClientRect();
    const mouseX = event.clientX - left;
    const margin = width * 0.3;
    if (mouseX < margin) container.scrollLeft -= 5 * (margin - mouseX) / margin;
    else if (mouseX > width - margin) container.scrollLeft += 5 * (mouseX - width + margin) / margin;
}

document.addEventListener('DOMContentLoaded', initializeBoardScrolling);

/**
 * Stops the propagation of the event to parent elements.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function stopPropagation(event) {
    event.stopPropagation();
}
/**
 * Sets the ID of the task that is currently being dragged.
 * @param {string} taskId task Id.
 * @returns {void}
 */
function startDragging(taskId) {
    const task = tasks.find(taskItem => taskItem.id === taskId);
    currentDraggedElement = canCurrentUserModifyTask(task) ? taskId : null;
}

/**
 * Allows dropping by preventing the default behavior of the event.
 * @param {DragEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Handles the drop event by appending the dragged task to the drop zone and updating its status.
 * @async
 * Append the task to the drop zone
 * Re-render tasks to reflect changes
 * @param {DragEvent} event Interaction that triggered the handler.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function drop(event) {
    event.preventDefault();
    const dropZone = event.target.closest('.taskContent');
    await moveDraggedTask(dropZone);
}

/**
 * Handles the drop event on mobile devices by appending the dragged task to the drop zone and updating its status.
 * @async
 * Get touch coordinates
 * Update the task's status based on the drop zone ID
 * Re-render tasks to reflect changes
 * @param {TouchEvent} event Interaction that triggered the handler.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function dropMobile(event) {
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    await moveDraggedTask(target?.closest('.taskContent'));
}

/** Moves the currently dragged task into a board column.
 * @param {*} dropZone drop Zone.
 * @returns {Promise<*>} move dragged task result.
 */
async function moveDraggedTask(dropZone) {
    const task = tasks.find(item => item.id === currentDraggedElement);
    if (!canCurrentUserModifyTask(task) || !dropZone) return;
    const taskElement = document.querySelector(`[data-id="${currentDraggedElement}"]`);
    if (!taskElement) return console.error('Task element not found:', currentDraggedElement);
    dropZone.appendChild(taskElement);
    await updateTaskStatus(task, dropZone.id);
    await loadDataTask();
    renderTasks();
}

/** Prepares a task card for a possible touch drag.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function startTouchDrag(event) {
    const card = event.target.closest('.card');
    if (!card) return;
    const task = tasks.find(taskItem => taskItem.id === card.dataset.id);
    if (!canCurrentUserModifyTask(task)) return;
    currentDraggedElement = card.dataset.id;
    initialX = event.touches[0].clientX;
    initialY = event.touches[0].clientY;
    isDragging = false;
    createDragClone(card);
}

/** Creates the visual card that follows a touch gesture.
 * @param {HTMLElement} card card.
 * @returns {void}
 */
function createDragClone(card) {
    dragClone = card.cloneNode(true);
    dragClone.style.position = 'absolute';
    dragClone.style.pointerEvents = 'none';
    document.body.appendChild(dragClone);
}

/** Keeps horizontal gestures available for scrolling and handles vertical dragging.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function moveTouchDrag(event) {
    if (initialX === null || initialY === null) return;
    const { clientX, clientY } = event.touches[0];
    if (Math.abs(clientX - initialX) > Math.abs(clientY - initialY)) {
        isDragging = false;
        removeDragClone();
        currentDraggedElement = null;
        return;
    }
    continueTouchDrag(event, clientX, clientY);
}

/** Positions the clone during a cancelable vertical drag.
 * @param {Event} event Interaction that triggered the handler.
 * @param {number} currentX current X.
 * @param {number} currentY current Y.
 * @returns {void}
 */
function continueTouchDrag(event, currentX, currentY) {
    if (!event.cancelable) return;
    event.preventDefault();
    if (!isDragging) {
        isDragging = true;
        const card = document.querySelector(`[data-id="${currentDraggedElement}"]`);
        if (!dragClone && card) createDragClone(card);
    }
    if (dragClone) {
        dragClone.style.left = `${currentX}px`;
        dragClone.style.top = `${currentY}px`;
    }
}

/** Removes the visual drag card.
 * @returns {void}
 */
function removeDragClone() {
    if (!dragClone) return;
    document.body.removeChild(dragClone);
    dragClone = null;
}

/** Drops a dragged card and resets the touch gesture.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function endTouchDrag(event) {
    if (isDragging) await dropMobile(event);
    removeDragClone();
    initialX = null;
    initialY = null;
    isDragging = false;
}

document.addEventListener('touchstart', startTouchDrag, { passive: true });
document.addEventListener('touchmove', moveTouchDrag, { passive: false });
document.addEventListener('touchend', endTouchDrag, { passive: true });
