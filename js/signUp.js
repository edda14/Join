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
    const { name, email, password, confirmPassword } = getSignUpInputs();
    resetInputBorders(name, email, password, confirmPassword);
    if (!isValidInput(name, email, password, confirmPassword)) {
        handleInvalidInput(name, email, password, confirmPassword);
        return false;
    }
    if (!isChecked) return rejectMissingPrivacyConsent();
    try { await registerUserInputs(name, email, password); }
    catch (error) { showRegistrationError(error, email, password, confirmPassword); }
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

/** Displays missing privacy-consent feedback and cancels submission.
 * @returns {boolean} reject missing privacy consent result.
 */
function rejectMissingPrivacyConsent() {
    document.querySelector('.acceptCheckbox').classList.add('redLine');
    document.querySelector('.signUp').style.marginTop = '0px';
    return false;
}

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
 * @param {string} name Display name.
 * @param {*} email email.
 * @param {*} password password.
 * @param {HTMLElement} confirmPassword confirm Password.
 * @returns {void}
 */
function resetInputBorders(name, email, password, confirmPassword) {
    name.style.borderColor = "";
    email.style.borderColor = "";
    password.style.borderColor = "";
    confirmPassword.style.borderColor = "";
    document.querySelector(".passwordAlert").classList.add("dNone");
    document.querySelector(".acceptCheckbox").style.marginTop = "14px";
}

/** Checks all required sign-up values and password rules.
 * @param {string} name Display name.
 * @param {*} email email.
 * @param {*} password password.
 * @param {HTMLElement} confirmPassword confirm Password.
 * @returns {boolean} is valid input result.
 */
function isValidInput(name, email, password, confirmPassword) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;
    return (
    name.value !== "" &&
    email.value !== "" &&
    passwordRegex.test(password.value) &&
    password.value === confirmPassword.value
    );
}

/** Marks invalid sign-up inputs.
 * @param {string} name Display name.
 * @param {*} email email.
 * @param {*} password password.
 * @param {HTMLElement} confirmPassword confirm Password.
 * @returns {void}
 */
function handleInvalidInput(name, email, password, confirmPassword) {
    if (name.value === "") name.style.borderColor = "#FF8190";
    if (email.value === "") email.style.borderColor = "#FF8190";
    if (password.value === "") password.style.borderColor = "#FF8190";
    if (confirmPassword.value === "")
    confirmPassword.style.borderColor = "#FF8190";
    if (password.value !== confirmPassword.value) {
        password.style.borderColor = "#FF8190";
        confirmPassword.style.borderColor = "#FF8190";
        document.querySelector(".passwordAlert").classList.remove("dNone");
        document.querySelector(".acceptCheckbox").style.marginTop = "0px";
    }
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
 * @param {*} email email.
 * @param {*} password password.
 * @param {HTMLElement} confirmPassword confirm Password.
 * @returns {void}
 */
function showRegistrationError(error, email, password, confirmPassword) {
    const alert = document.querySelector(".passwordAlert");
    const messages = {
        "auth/email-already-in-use": "This email address is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Please choose a stronger password.",
    };
    alert.textContent = messages[error.code] || "Sign up failed. Please try again.";
    alert.classList.remove("dNone");
    email.style.borderColor = "#FF8190";
    password.style.borderColor = "#FF8190";
    confirmPassword.style.borderColor = "#FF8190";
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
    }
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
