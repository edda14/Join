/** Fills the dynamic slots of an inert HTML template.
 * @param {string} name Display name.
 * @param {Array<*>} values Escaped text or rendered child markup for the template slots.
 * @returns {string} Rendered markup.
 */
function renderHtmlTemplate(name, values = []) {
    const template = document.getElementById(name);
    if (!template) throw new Error('Missing HTML template: ' + name);
    return template.innerHTML.replace(/\{\{slot(\d+)\}\}/g, (_, index) => String(values[Number(index)]));
}

/** Advances a password input's icon and visibility state.
 * @param {HTMLElement} element DOM element to update.
 * @param {string} prefix Password field icon class prefix.
 * @returns {void}
 */
function togglePasswordField(element, prefix) {
    const isVisible = element.type === 'text';
    const toggle = element.parentElement.querySelector('[class*="VisibilityBTN"]');
    element.type = isVisible ? 'password' : 'text';
    element.classList.remove('passwordInputImg', 'lockInputImg', prefix + 'Focus', prefix + 'Visible');
    element.classList.add(isVisible ? prefix + 'Focus' : prefix + 'Visible');
    toggle?.classList.toggle('passwordVisibilityVisible', !isVisible);
}

/** Restores a password input's idle icon after focus leaves.
 * @param {HTMLElement} element DOM element to update.
 * @param {string} prefix Password field icon class prefix.
 * @returns {void}
 */
function restorePasswordField(element, prefix) {
    const states = ['passwordInputImg', 'lockInputImg', prefix + 'Focus', prefix + 'Visible'];
    const index = states.findIndex(state => element.classList.contains(state));
    if (index < 0) return;
    element.classList.replace(states[index], index === 0 ? states[1] : states[0]);
    if (index >= 2) element.type = 'password';
}
