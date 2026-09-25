let isChecked = false;
let guest = { name: "Guest", email: null, role: "guest" };

/** Initializes login-page data and input behavior.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function logInInit() {
    getSavedUser();
    addHoverForLogin();
    checkInputs();
}

/** Opens the sign-up page.
 * @returns {void}
 */
function redirectToSignup() {
    window.location.href = "./signUp.html";
}

/** Starts the legacy Join-logo transition when requested.
 * @returns {void}
 */
function joinImgAnimation() {
    let background = document.querySelector(".animatedImageContainer");
    let animatedImage = document.querySelector(".animatedImage");
    let responsiveImg = document.querySelector(".animatedImageResposive");
    let joinIcon = document.querySelector(".joinIcon");
    let mediaQuery = window.matchMedia("(max-width: 730px)");
    setTimeout(function() {
            startAnimation(background, animatedImage, joinIcon, responsiveImg, mediaQuery);
        }, 300);
}

/** Applies the responsive logo animation classes.
 * @param {HTMLElement} background background.
 * @param {HTMLElement} animatedImage animated Image.
 * @param {HTMLElement} joinIcon join Icon.
 * @param {HTMLElement} responsiveImg responsive Img.
 * @param {MediaQueryList} mediaQuery media Query.
 * @returns {void}
 */
function startAnimation(background, animatedImage, joinIcon, responsiveImg, mediaQuery) {
    if (mediaQuery.matches) {
        background.classList.add("fadeOut");
        responsiveImg.classList.add("move");
        animatedImage.classList.add("move");
    } else {
        background.classList.add("fadeOut");
        animatedImage.classList.add("moveToTopLeft");
    }
    setTimeout(function () {
            hideElements(background, animatedImage, joinIcon, responsiveImg, mediaQuery);
        }, 500);
}

/** Hides the completed logo-animation elements.
 * @param {HTMLElement} background background.
 * @param {HTMLElement} animatedImage animated Image.
 * @param {HTMLElement} joinIcon join Icon.
 * @param {HTMLElement} responsiveImg responsive Img.
 * @param {MediaQueryList} mediaQuery media Query.
 * @returns {void}
 */
function hideElements(background, animatedImage, joinIcon, responsiveImg, mediaQuery) {
    if (mediaQuery.matches)  {
        responsiveImg.classList.add("hideElements");
        background.classList.add("hideElements");
    }
    background.classList.add("hideElements");
    animatedImage.classList.add("hideElements");
    joinIcon.classList.remove("hideElements");
}

/** Updates the enabled visual state of the login button.
 * @returns {void}
 */
function checkInputs() {
    let logInButton = document.getElementById("logIn");
    let emailInput = document.getElementById("logInEmailInput");
    let passwordInput = document.getElementById("logInPasswordInput");
    const emailIsValid = isValidEmail(emailInput.value);
    const hasFeedback = !document.getElementById('loginPasswordError').classList.contains('dNone')
        || !document.querySelector('.passwordAlert').classList.contains('dNone');
    const canLogIn = emailIsValid && passwordInput.value.trim() !== '' && !hasFeedback;
    logInButton.disabled = !canLogIn;
    logInButton.classList.toggle("logInValid", canLogIn);
}

/** Validates a standard email address before a Firebase authentication request.
 * @param {string} email Email address to validate.
 * @returns {boolean} Whether the address has a valid local part and domain.
 */
function isValidEmail(email) {
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

/** Connects login inputs to button-state validation.
 * @returns {void}
 */
function addHoverForLogin() {
    let emailInput = document.getElementById("logInEmailInput");
    let passwordInput = document.getElementById("logInPasswordInput");
    [emailInput, passwordInput].forEach(input => input.addEventListener("input", () => {
        input.style.borderColor = '';
        setLoginInputValidity(input, false);
        clearLoginFeedbackAfterInput();
        showLiveEmailFeedback(emailInput);
        checkInputs();
    }));
}

/** Clears earlier login feedback once the user changes a credential.
 * @returns {void}
 */
function clearLoginFeedbackAfterInput() {
    document.querySelector('.passwordAlert').classList.add('dNone');
    showLoginFeedback('');
}

/** Shows the email-format hint below the password field while typing.
 * @param {HTMLInputElement} emailInput Email input to validate.
 * @returns {void}
 */
function showLiveEmailFeedback(emailInput) {
    const email = emailInput.value.trim();
    const emailIsInvalid = email !== '' && !isValidEmail(email);
    setLoginInputValidity(emailInput, emailIsInvalid);
    showLoginFeedback(emailIsInvalid ? 'Please enter a valid email address.' : '');
}

/** Authenticates the submitted member login.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function findUser(event) {
    event.preventDefault();
    const emailInput = document.getElementById("logInEmailInput");
    const passwordInput = document.getElementById("logInPasswordInput");
    resetInputBorders(emailInput, passwordInput);
    if (!validateLoginForm(emailInput, passwordInput)) return;
    try {
        const firebaseUser = await authenticateLogin(emailInput.value, passwordInput.value);
        await completeLogin(firebaseUser, emailInput.value);
    } catch (error) {
        handleInvalidUser(emailInput, passwordInput);
        console.error("Firebase login failed:", error.code);
    }
}

/** Validates login fields and displays inline feedback.
 * @param {HTMLInputElement} emailInput Email field to validate.
 * @param {HTMLInputElement} passwordInput Password field to validate.
 * @returns {boolean} Whether the login fields are valid.
 */
function validateLoginForm(emailInput, passwordInput) {
    const emailMessage = !emailInput.value.trim() ? 'Please enter your email address.' : !isValidEmail(emailInput.value) ? 'Please enter a valid email address.' : '';
    const passwordMessage = !passwordInput.value ? 'Please enter your password.' : '';
    setLoginInputValidity(emailInput, Boolean(emailMessage));
    setLoginInputValidity(passwordInput, Boolean(passwordMessage));
    showLoginFeedback(emailMessage || passwordMessage);
    checkInputs();
    return !emailMessage && !passwordMessage;
}

/** Applies the visible error state to a login input.
 * @param {HTMLInputElement} input Field to update.
 * @param {boolean} invalid Whether the field is invalid.
 * @returns {void}
 */
function setLoginInputValidity(input, invalid) {
    input.classList.toggle('inputInvalid', invalid);
    input.setAttribute('aria-invalid', String(invalid));
}

/** Shows or clears the shared login feedback below the password field.
 * @param {string} message Feedback text.
 * @returns {void}
 */
function showLoginFeedback(message) {
    const feedback = document.getElementById('loginPasswordError');
    feedback.textContent = message;
    feedback.classList.toggle('dNone', !message);
}

/** Authenticates the current login form values with Firebase.
 * @param {*} email email.
 * @param {*} password password.
 * @returns {*} authenticate login result.
 */
function authenticateLogin(email, password) {
    return window.firebaseAuth.loginWithEmail(email.trim().toLowerCase(), password, isChecked);
}

/** Stores the authenticated session and opens the board summary.
 * @param {Object} firebaseUser firebase User.
 * @param {*} enteredEmail entered Email.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function completeLogin(firebaseUser, enteredEmail) {
    const user = { uid: firebaseUser.uid,
        name: firebaseUser.displayName || enteredEmail.split('@')[0],
        email: firebaseUser.email };
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    await loadDataContacts();
    await addNewContact(user);
    redirectToSummary();
}

/** Creates a matching contact for a newly authenticated member.
 * @param {Object} user user.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function addNewContact(user) {
    const email = normalizeEmail(user.email);
    const existingContact = contacts.find(contact => normalizeEmail(contact.mail) === email);
    if (existingContact) return;
    const color = getRandomProfileColor();
    const newContact = {
        name: user.name,
        mail: email,
        phone: '',
        profileColor: color,
        initials: extractInitials(user.name),
    };
    await changeContact(`/contacts/${user.uid}`, newContact);
}

/** Returns a consistently comparable email address.
 * @param {*} email email.
 * @returns {*} normalize email result.
 */
function normalizeEmail(email = '') {
    return email.trim().toLowerCase();
}

/** Resets login input border feedback.
 * @param {HTMLElement} emailInput email Input.
 * @param {HTMLElement} passwordInput password Input.
 * @returns {void}
 */
function resetInputBorders(emailInput, passwordInput) {
    emailInput.style.borderColor = "";
    passwordInput.style.borderColor = "";
    setLoginInputValidity(emailInput, false);
    setLoginInputValidity(passwordInput, false);
    showLoginFeedback('');
    document.querySelector('.passwordAlert').classList.add('dNone');
}

/** Opens the summary page and enables the responsive greeting animation.
 * @returns {void}
 */
function redirectToSummary() {
    sessionStorage.setItem('showGreeting', 'true');
    window.location.href = "./summary.html";
}

/** Creates and stores an anonymous Firebase guest session.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function guestLogin() {
    let form = document.querySelector('form');
    try {
        const firebaseUser = await window.firebaseAuth.loginAnonymously();
        sessionStorage.setItem('currentUser', JSON.stringify({ ...guest, uid: firebaseUser.uid, isAnonymous: true }));
        form.reset();
        redirectToSummary();
    } catch (error) {
        console.error('Firebase guest login failed:', error.code);
        alert('Guest login is currently unavailable. Please try again shortly.');
    }
}

/** Displays invalid-login feedback.
 * @param {HTMLElement} emailInput email Input.
 * @param {HTMLElement} passwordInput password Input.
 * @returns {boolean} handle invalid user result.
 */
function handleInvalidUser(emailInput, passwordInput) {
    emailInput.style.borderColor = 'rgba(230, 0, 38, 1)';
    passwordInput.style.borderColor = 'rgba(230, 0, 38, 1)';
    document.querySelector('.passwordAlert').classList.remove('dNone');
    document.querySelector('.rememberMe').style.margin = '1px 42px 16px 42px';
    checkInputs();
    return false;
}

/** Toggles password visibility from the login field icon.
 * @returns {void}
 */
function handlePasswordVisibility() {
    let passwordInput = document.getElementById("logInPasswordInput");
    if (passwordInput.classList.contains("passwordInputImg")) {
        setPasswordState(passwordInput, "passwordInputImg", "lockInputImg");
    } else if (passwordInput.classList.contains("lockInputImg")) {
        setPasswordState(passwordInput, "lockInputImg", "passwordInputFocus");
    } else if (passwordInput.classList.contains("passwordInputFocus")) {
        setPasswordState(passwordInput, "passwordInputFocus", "passwordInputVisible", "text");
    } else if (passwordInput.classList.contains("passwordInputVisible")) {
        setPasswordState(passwordInput, "passwordInputVisible", "passwordInputFocus", "password");
    }
}

/** Changes the icon class and optional input type of the password field.
 * @param {HTMLElement} input Input element to read or update.
 * @param {*} oldClass old Class.
 * @param {*} newClass new Class.
 * @param {string} type type.
 * @returns {void}
 */
function setPasswordState(input, oldClass, newClass, type) {
    input.classList.remove(oldClass);
    input.classList.add(newClass);
    if (type) input.type = type;
}

/** Restores the password field's idle icon state.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handlePasswordImage(element) {
    restorePasswordField(element, 'passwordInput');
}

/** Applies the focused password field style.
 * @param {HTMLElement} element DOM element to update.
 * @returns {void}
 */
function handlePasswordStyle(element) {
    if (element.classList.contains("passwordInputImg")) {
        element.classList.remove("passwordInputImg");
        element.classList.add("passwordInputFocus");
    } else if (element.classList.contains("lockInputImg")) {
        element.classList.remove("lockInputImg");
        element.classList.add("passwordInputFocus");
    } else if (element.classList.contains("passwordInputVisible")) {
        element.classList.remove("passwordInputVisible");
        element.classList.add("passwordInputFocus");
    }
}

/** Toggles the remember-me checkbox state.
 * @param {HTMLElement} img img.
 * @returns {void}
 */
function toggleCheckbox(img) {
    let checkmark = document.getElementById("checkmark");
    checkmark.classList.toggle("dNone");
    if (checkmark.classList.contains("dNone")) {
        img.src = "/assets/img/emptyCheckbox.png";
        isChecked = false;
    } else {
        img.src = "/assets/img/chackBox.png";
        isChecked = true;
    }
}

/** Relies on Firebase Auth to restore any saved session.
 * @returns {void}
 */
function getSavedUser() {
}
