/** Limits the due-date picker to today and future dates.
 * @returns {void}
 */
function setDueDateMinimum() {
    const dateInput = document.getElementById('task-due-date');
    if (dateInput) dateInput.min = todayAsIsoDate();
}

/** Selects or deselects a task priority.
 * @param {string} prio prio.
 * @returns {void}
 */
function setBackgroundColorPrio(prio) {
    let prioStatus = document.getElementById(prio);
    let prioImgDeactive = document.getElementById(`${prio}-img-deactive`);
    let prioImgActive = document.getElementById(`${prio}-img-active`);
    resetOtherPriorities(prio);
    if (prioStatus.classList.contains(`at-bg-${prio}`)) {
        removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
        taskPrio = '';
    } else {
        addBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
        taskPrio = prio;
    }
}

/** Applies the active appearance to a priority button.
 * @param {string} prio prio.
 * @param {string} prioStatus prio Status.
 * @param {*} prioImgDeactive prio Img Deactive.
 * @param {*} prioImgActive prio Img Active.
 * @returns {void}
 */
function addBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.add(`at-bg-${prio}`);
    prioStatus.setAttribute('aria-pressed', 'true');
    prioImgDeactive.style.display = 'none';
    prioImgActive.style.display = 'block';
}

/** Restores the inactive appearance of a priority button.
 * @param {string} prio prio.
 * @param {string} prioStatus prio Status.
 * @param {*} prioImgDeactive prio Img Deactive.
 * @param {*} prioImgActive prio Img Active.
 * @returns {void}
 */
function removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive) {
    prioStatus.classList.remove(`at-bg-${prio}`);
    prioStatus.setAttribute('aria-pressed', 'false');
    prioImgDeactive.style.display = 'block';
    prioImgActive.style.display = 'none';
}

/** Deselects every priority except the supplied value.
 * @param {string} selectedPrio selected Prio.
 * @returns {void}
 */
function resetOtherPriorities(selectedPrio) {
    const priorities = ['urgent', 'medium', 'low'];
    priorities.forEach(prio => {
            if (prio !== selectedPrio) {
                let prioStatus = document.getElementById(prio);
                let prioImgDeactive = document.getElementById(`${prio}-img-deactive`);
                let prioImgActive = document.getElementById(`${prio}-img-active`);
                removeBackgroundColor(prio, prioStatus, prioImgDeactive, prioImgActive);
            }
        });
}

/** Initializes all category dropdowns.
 * @returns {void}
 */
function showCategoryList() {
    setupTaskCategory();
}

/** Resets the selected category and closes its dropdown.
 * @returns {void}
 */
function clearCategoryDropdown() {
    categoryIsSelected = false;
    selectedCategory = '';
    document.getElementById('task-category').value = '';
    document.getElementById('task-category-value').textContent = 'Select task category';
    document.querySelectorAll('[data-category]').forEach(option => option.setAttribute('aria-selected', 'false'));
    closeTaskCategory();
}

/** Validates all required task fields.
 * @returns {boolean} check required input result.
 */
function checkRequiredInput() {
    let isTitleValid = checkIfTitleEmpty();
    let isDateValid = checkIfDateEmpty();
    let isCategoryValid = checkIfCategoryEmpty();
    return isTitleValid && isDateValid && isCategoryValid;
}

/** Validates the task title input.
 * @returns {boolean} check if title empty result.
 */
function checkIfTitleEmpty() {
    return validateTaskField('task-title', 'at-alert-title', !document.getElementById('task-title').value.trim());
}

/** Validates the due-date input.
 * @returns {boolean} check if date empty result.
 */
function checkIfDateEmpty() {
    const input = document.getElementById('task-due-date');
    const isEmpty = !input.value;
    const isPast = !isEmpty && input.value < input.min;
    const alert = document.getElementById('at-alert-due-date');
    alert.textContent = isPast ? 'The due date is in the past. Please select today or a future date.' : 'This field is required';
    const invalid = isEmpty || isPast;
    return validateTaskField('task-due-date', 'at-alert-due-date', invalid);
}

/** Validates the task category selection.
 * @returns {boolean} check if category empty result.
 */
function checkIfCategoryEmpty() {
    return validateTaskField('task-category', 'at-alert-category', !categoryIsSelected);
}
