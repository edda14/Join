let isChecked = false;

/** Returns the registration confirmation backdrop.
 * @returns {*} get sign up popup container result.
 */
function getSignUpPopupContainer() {
    let signUpPopupContainer = document.getElementById('signUpPopupContainer');
    return signUpPopupContainer;
}

/** Returns the registration confirmation card.
 * @returns {*} get sign up popup result.
 */
function getSignUpPopup() {
    let signUpPopup = document.getElementById('signUpPopup');
    return signUpPopup;
}

/** Validates and submits a new Firebase member registration.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {Promise<*>} add user result.
 */
async function addUser(event) {
    event.preventDefault();
    const inputs = getSignUpInputs();
    resetSignUpValidation(inputs);
    const error = getSignUpValidationError(inputs);
    if (error) return showSignUpValidationError(error);
    try { await registerUserInputs(inputs.name, inputs.email, inputs.password); }
    catch (registrationError) { showRegistrationError(registrationError, inputs); }
    return false;
}

/** Returns all required sign-up input elements.
 * @returns {Object} Resulting data.
 */
function getSignUpInputs() {
    return { name: document.getElementById('signUpNameInput'),
        email: document.getElementById('signUpEmailInput'),
        password: document.getElementById('signUpPasswordInput'),
        confirmPassword: document.getElementById('confirmPasswordInput') };
}

/** Validates a standard email address before a Firebase registration request.
 * @param {string} email Email address to validate.
 * @returns {boolean} Whether the address has a valid local part and domain.
 */
function isValidEmailAddress(email) {
    const normalizedEmail = email.trim();
    if (normalizedEmail.length > 254 || normalizedEmail.split('@').length !== 2) return false;
    const [localPart, domain] = normalizedEmail.split('@');
    if (!localPart || !domain || localPart.length > 64) return false;
    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)
        || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false;

    const domainLabels = domain.split('.');
    const validDomainLabel = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
    return domainLabels.length >= 2
        && domainLabels.every(label => validDomainLabel.test(label))
        && /^[A-Za-z]{2,63}$/.test(domainLabels.at(-1));
}

/** Displays missing privacy-consent feedback and cancels submission.
 * @returns {boolean} reject missing privacy consent result.
 */
/** Registers the user, stores their profile, and shows confirmation.
 * @param {string} name Display name.
 * @param {*} email email.
 * @param {*} password password.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function registerUserInputs(name, email, password) {
    const cleanName = name.value.trim();
    const cleanEmail = email.value.trim().toLowerCase();
    const user = await window.firebaseAuth.registerWithEmail(cleanName, cleanEmail, password.value);
    await saveUserProfile(user.uid, cleanName, cleanEmail);
    showSignUpPopup();
    setTimeout(hideSignUpPopupAndRedirect, 3000);
}

/** Clears previous sign-up validation feedback.
 * @param {Object} inputs Sign-up form controls.
 * @returns {void}
 */
function resetSignUpValidation(inputs) {
    Object.values(inputs).forEach(input => {
        input.classList.remove('signUpInputInvalid');
        input.setAttribute('aria-invalid', 'false');
    });
    document.getElementById('signUpFeedback').textContent = '';
}

/** Returns the first sign-up validation error.
 * @param {Object} inputs Sign-up form controls.
 * @returns {Object|null} Validation message and affected fields.
 */
function getSignUpValidationError(inputs) {
    const namePattern = /^[A-Za-zÄÖÜäöüß]+(?:[ '-][A-Za-zÄÖÜäöüß]+)*$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;
    if (!inputs.name.value.trim()) return validationError('Please enter your name.', inputs.name);
    if (!namePattern.test(inputs.name.value.trim())) return validationError('Please use only letters for your name.', inputs.name);
    if (!inputs.email.value.trim()) return validationError('Please enter your email address.', inputs.email);
    if (!isValidEmailAddress(inputs.email.value)) return validationError('Please enter a valid email address.', inputs.email);
    if (!inputs.password.value) return validationError('Please enter a password.', inputs.password);
    if (!passwordPattern.test(inputs.password.value)) return validationError('Use 8+ characters with upper/lowercase, a number and a special character.', inputs.password);
    if (!inputs.confirmPassword.value) return validationError('Please confirm your password.', inputs.confirmPassword);
    if (inputs.password.value !== inputs.confirmPassword.value) return validationError('Passwords must match.', inputs.password, inputs.confirmPassword);
    return isChecked ? null : validationError('Please accept the Privacy Policy to continue.');
}

/** Creates a validation result.
 * @param {string} message Feedback shown to the user.
 * @param {...HTMLElement} fields Invalid fields.
 * @returns {Object} Validation result.
 */
function validationError(message, ...fields) {
    return { message, fields };
}

/** Displays one sign-up validation error.
 * @param {Object} error Validation result.
 * @returns {boolean} Always false to cancel submission.
 */
function showSignUpValidationError(error) {
    document.getElementById('signUpFeedback').textContent = error.message;
    error.fields.forEach(markSignUpFieldInvalid);
    return false;
}

/** Marks one field as invalid.
 * @param {HTMLElement} field Invalid form control.
 * @returns {void}
 */
function markSignUpFieldInvalid(field) {
    field.classList.add('signUpInputInvalid');
    field.setAttribute('aria-invalid', 'true');
}

/** Stores a member profile under its Firebase UID.
 * @param {string} uid Firebase Authentication user identifier.
 * @param {string} name Display name.
 * @param {*} email email.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function saveUserProfile(uid, name, email) {
    await putUserData(`/users/${uid}`, { name, email });
}

/** Displays a readable Firebase registration error.
 * @param {Error} error Failure to display or propagate.
 * @param {Object} inputs Sign-up form controls.
 * @returns {void}
 */
function showRegistrationError(error, inputs) {
    const messages = {
        "auth/email-already-in-use": "This email address is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Please choose a stronger password.",
    };
    const message = messages[error.code] || "Sign up failed. Please try again.";
    showSignUpValidationError(validationError(message, inputs.email));
    console.error("Firebase sign-up failed:", error.code);
}

/** Shows the successful-registration popup.
 * @returns {void}
 */
function showSignUpPopup() {
    let signUpPopupContainer = getSignUpPopupContainer();
    let signUpPopup = getSignUpPopup();
    signUpPopupContainer.classList.add('show');
    signUpPopup.classList.add('moveToCenter');
}

/** Hides the successful-registration popup.
 * @returns {void}
 */
function hideSignUpPopup() {
    let signUpPopupContainer = getSignUpPopupContainer();
    let signUpPopup = getSignUpPopup();
    signUpPopupContainer.classList.remove('show');
    signUpPopup.classList.remove('moveToCenter');
}

/** Hides confirmation and returns to login.
 * @returns {void}
 */
function hideSignUpPopupAndRedirect() {
    hideSignUpPopup();
    redirectToLogIn();
}

/** Opens the login page.
 * @returns {void}
 */
function redirectToLogIn() {
    window.location.href = "./login.html";
}

/** Toggles privacy-policy acceptance.
 * @param {HTMLElement} img img.
 * @returns {void}
 */
function toggleCheckbox(img) {
    const checkmark = document.getElementById('checkmark');
    const signUpButton = document.querySelector('.signUp');
    isChecked = checkmark.style.display === 'none';
    checkmark.style.display = isChecked ? 'block' : 'none';
    img.src = isChecked ? './assets/img/chackBox.png' : './assets/img/emptyCheckbox.png';
    signUpButton.classList.toggle('signUpHover', isChecked);
    if (isChecked) {
        document.querySelector('.acceptCheckbox').classList.remove('redLine');
        signUpButton.style.marginTop = '1px';
        clearPrivacyValidationFeedback();
    }
}

/** Clears the privacy message after consent is granted.
 * @returns {void}
 */
function clearPrivacyValidationFeedback() {
    const feedback = document.getElementById('signUpFeedback');
    if (feedback.textContent.includes('Privacy Policy')) feedback.textContent = '';
}

/** Capitalizes the first character of a name field.
 * @param {string} inputName input Name.
 * @returns {void}
 */
function toUpperCase(inputName) {
    let name = inputName.value.trim();
    if (name.length > 0) {
        let firstChar = name.charAt(0).toUpperCase();
        let restOfName = name.slice(1);
        let fullName = firstChar + restOfName;
        inputName.value = fullName;
    }
}

/** Toggles visibility for the primary password field.
 * @returns {void}
 */
function handlePasswordVisibility() {
    togglePasswordField(document.getElementById('signUpPasswordInput'), 'confirmPasswordInput');
}

/** Restores the primary password field's idle icon.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handlePasswordImage(element) {
    restorePasswordField(element, 'confirmPasswordInput');
}

/** Applies focus styling to the primary password field.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handlePasswordStyle(element) {
    if (element.classList.contains("passwordInputImg")) {
        element.classList.remove("passwordInputImg");
        element.classList.add("confirmPasswordInputFocus");
    } else if (element.classList.contains("lockInputImg")) {
        element.classList.remove("lockInputImg");
        element.classList.add("confirmPasswordInputFocus");
    } else if (element.classList.contains("confirmPasswordInputVisible")) {
        element.classList.remove("confirmPasswordInputVisible");
        element.classList.add("confirmPasswordInputFocus");
    }
}

/** Toggles visibility for the confirmation password field.
 * @returns {void}
 */
function handleConfirmPasswordVisibility() {
    togglePasswordField(document.getElementById('confirmPasswordInput'), 'confirmPasswordInput');
}

/** Restores the confirmation password field's idle icon.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handleConfirmPasswordImage(element) {
    restorePasswordField(element, 'confirmPasswordInput');
}

/** Applies focus styling to the confirmation password field.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handleConfirmPasswordStyle(element) {
    if (element.classList.contains("passwordInputImg")) {
        element.classList.remove("passwordInputImg");
        element.classList.add("confirmPasswordInputFocus");
    } else if (element.classList.contains("lockInputImg")) {
        element.classList.remove("lockInputImg");
        element.classList.add("confirmPasswordInputFocus");
    } else if (element.classList.contains("confirmPasswordInputVisible")) {
        element.classList.remove("confirmPasswordInputVisible");
        element.classList.add("confirmPasswordInputFocus");
    }
}
