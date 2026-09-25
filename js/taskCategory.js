/** Binds the Join category picker to mouse and keyboard interactions.
 * @returns {void}
 */
function setupTaskCategory() {
    const trigger = document.getElementById('task-category');
    if (!trigger || trigger.dataset.bound) return;
    trigger.dataset.bound = 'true';
    trigger.onclick = toggleTaskCategory;
    trigger.onkeydown = handleCategoryTriggerKey;
    document.querySelectorAll('[data-category]').forEach(option => {
            option.onclick = () => selectTaskCategory(option);
            option.onkeydown = handleCategoryOptionKey;
        });
}

/** Toggles the visible category choices.
 * @returns {void}
 */
function toggleTaskCategory() {
    const list = document.getElementById('task-category-options');
    if (list.hidden) openTaskCategory();
    else closeTaskCategory();
}

/** Opens the category list and exposes its expanded state.
 * @returns {void}
 */
function openTaskCategory() {
    document.getElementById('task-category-options').hidden = false;
    document.getElementById('task-category').setAttribute('aria-expanded', 'true');
}

/** Closes the category list without moving focus.
 * @returns {void}
 */
function closeTaskCategory() {
    const list = document.getElementById('task-category-options');
    if (list) list.hidden = true;
    document.getElementById('task-category')?.setAttribute('aria-expanded', 'false');
}

/** select Task Category.
 * @param {HTMLButtonElement} option option.
 * @returns {void}
 */
function selectTaskCategory(option) {
    selectedCategory = option.dataset.category;
    categoryIsSelected = true;
    document.getElementById('task-category').value = selectedCategory;
    document.getElementById('task-category-value').textContent = selectedCategory;
    document.querySelectorAll('[data-category]').forEach(item => {
            item.setAttribute('aria-selected', String(item === option));
        });
    checkIfCategoryEmpty();
    closeTaskCategory();
    updateTaskSubmitState(document.querySelector('.join-task-form'));
    document.getElementById('task-category').focus();
}

/** handle Category Trigger Key.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {*} handle category trigger key result.
 */
function handleCategoryTriggerKey(event) {
    if (event.key === 'Escape') return dismissTaskCategory(event);
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    openTaskCategory();
    const options = [...document.querySelectorAll('[data-category]')];
    const selected = options.find(option => option.getAttribute('aria-selected') === 'true');
    const fallback = ['ArrowUp', 'End'].includes(event.key) ? options.at(-1) : options[0];
    (selected || fallback).focus();
}

/** handle Category Option Key.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {*} handle category option key result.
 */
function handleCategoryOptionKey(event) {
    if (event.key === 'Escape') return dismissTaskCategory(event);
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [...document.querySelectorAll('[data-category]')];
    const index = options.indexOf(event.currentTarget);
    const next = (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : next;
    options[target].focus();
}

/** dismiss Task Category.
 * @param {KeyboardEvent} event Interaction that triggered the handler.
 * @returns {void}
 */
function dismissTaskCategory(event) {
    if (document.getElementById('task-category-options').hidden) return;
    event.preventDefault();
    event.stopPropagation();
    closeTaskCategory();
    document.getElementById('task-category').focus();
}

/** close Category Outside.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function closeCategoryOutside(event) {
    if (!document.getElementById('category-input')?.contains(event.target)) closeTaskCategory();
}

document.addEventListener('click', closeCategoryOutside);
document.addEventListener('focusin', closeCategoryOutside);
