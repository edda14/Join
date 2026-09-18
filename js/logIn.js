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
    if (emailInput.value.trim() !== "" && passwordInput.value.trim() !== "") {
        logInButton.classList.add("logInValid");
    } else {
        logInButton.classList.remove("logInValid");
    }
}

/** Connects login inputs to button-state validation.
 * @returns {void}
 */
function addHoverForLogin() {
    let emailInput = document.getElementById("logInEmailInput");
    let passwordInput = document.getElementById("logInPasswordInput");
    emailInput.addEventListener("input", checkInputs);
    passwordInput.addEventListener("input", checkInputs);
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
    try {
        const firebaseUser = await authenticateLogin(emailInput.value, passwordInput.value);
        await completeLogin(firebaseUser, emailInput.value);
    } catch (error) {
        handleInvalidUser(emailInput, passwordInput);
        console.error("Firebase login failed:", error.code);
    }
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
    emailInput.style.borderColor = '#FF8190';
    passwordInput.style.borderColor = '#FF8190';
    document.querySelector('.passwordAlert').classList.remove('dNone');
    document.querySelector('.rememberMe').style.margin = '1px 42px 16px 42px';
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
