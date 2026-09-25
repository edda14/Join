let newUser = JSON.parse(sessionStorage.getItem('currentUser'));

/** Initializes summary and binds resize listener.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function summaryInit() {
    await includeHTML();
    await loadDataTask();
    await loadDataContacts();
    showInitials();
    updateGreeting();
    userName();
    updateSummary();
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
}

/** Opens the board, optionally at a specific section.
 * @param {string} sectionId section Id.
 * @returns {void}
 */
function redirectToBoard(sectionId) {
    if (sectionId) {
        window.location.href = `./board.html#${sectionId}`;
    } else {
        window.location.href = "./board.html";
    }
}

/** Updates the time-dependent greeting.
 * @returns {void}
 */
function updateGreeting() {
    let greetingText = document.getElementById('greetingText');
    let currentHour = new Date().getHours();
    if (currentHour < 12) {
        greetingText.textContent = 'Good Morning,';
    } else if (currentHour < 18) {
        greetingText.textContent = 'Good Afternoon,';
    } else {
        greetingText.textContent = 'Good Evening,';
    }
}

/** Renders the current user's name.
 * @returns {void}
 */
function userName() {
    let userNameContainer = document.getElementById('userName');
    let currentUser = newUser.name;
    userNameContainer.innerHTML = /*html*/`
    ${currentUser}
    `
    requestAnimationFrame(fitGreetingName);
}

/** Fits the user name into the available greeting width.
 * @returns {void}
 */
function fitGreetingName() {
    let name = document.getElementById('userName');
    if (!name || !name.clientWidth) return;
    name.style.fontSize = '';
    let availableWidth = name.clientWidth;
    let requiredWidth = name.scrollWidth;
    if (requiredWidth <= availableWidth) return;
    let currentSize = parseFloat(getComputedStyle(name).fontSize);
    name.style.fontSize = `${Math.max(24, Math.floor(currentSize * availableWidth / requiredWidth))}px`;
}

/** Calculates and renders all summary metrics.
 * @returns {void}
 */
function updateSummary() {
    let metrics = calculateSummaryMetrics();
    renderSummaryValues(metrics);
}

/** Computes metrics from task list.
 * @returns {Object} Resulting data.
 */
function calculateSummaryMetrics() {
    let urgentTasks = tasks.filter(task => task.prio === 'urgent');
    let sortedUrgent = urgentTasks.filter(task => isValidSummaryDate(task.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
        inBoard: tasks.length,
        inProgress: tasks.filter(t => t.status === 'progress').length,
        feedback: tasks.filter(t => t.status === 'feedback').length,
        urgent: urgentTasks.length,
        deadline: sortedUrgent.length > 0 ? formatDate(sortedUrgent[0].date) : urgentTasks.length ? 'No valid due date' : 'No urgent tasks',
        done: tasks.filter(t => t.status === 'done').length,
        toDo: tasks.filter(t => t.status === 'toDo').length,
        emailRequests: tasks.filter(t => isEmailTask(t)).length
    };
}

/** Checks if a task originated from an external email.
 * @param {*} t t.
 * @returns {boolean} is email task result.
 */
function isEmailTask(t) {
    return t.source === 'email' ||
    t.creator?.type === 'email' ||
    t.creator?.type === 'external';
}

/** Updates HTML elements with calculated metrics.
 * @param {*} m m.
 * @returns {void}
 */
function renderSummaryValues(m) {
    document.getElementById('tasksInBoard').textContent = m.inBoard;
    document.getElementById('tasksInProgress').textContent = m.inProgress;
    document.getElementById('awaitingFeedback').textContent = m.feedback;
    document.getElementById('urgent').textContent = m.urgent;
    document.getElementById('upcomingDeadline').textContent = m.deadline;
    document.getElementById('done').textContent = m.done;
    document.getElementById('toDo').textContent = m.toDo;
    document.getElementById('emailRequests').textContent = m.emailRequests;
}

/** Formats an ISO date for the summary deadline card.
 * @param {*} dateString date String.
 * @returns {*} format date result.
 */
function formatDate(dateString) {
    if (!isValidSummaryDate(dateString)) return 'No valid due date';
    let date = new Date(dateString);
    let options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/** Handles responsive greeting check.
 * @returns {void}
 */
function checkResponsive() {
    let overlay = document.querySelector(".animatedImageContainer");
    if (!overlay) return;
    if (window.matchMedia("(max-width: 1125px)").matches) return handleMobileGreeting(overlay);
    resetDesktopView(overlay);
    requestAnimationFrame(fitGreetingName);
}

/** Triggers mobile animation only if login flag is set.
 * @param {*} overlay overlay.
 * @returns {void}
 */
function handleMobileGreeting(overlay) {
    let shouldShow = sessionStorage.getItem('showGreeting');
    if (shouldShow === 'true') {
        sessionStorage.removeItem('showGreeting');
        overlay.classList.add('greetingOverlay');
        playGreetingAnimation(overlay);
    } else if (!overlay.classList.contains('fadeOut')) {
        overlay.classList.remove('greetingOverlay');
        overlay.style.display = 'none';
    }
}

/** Plays the fade-out animation.
 * @param {*} overlay overlay.
 * @returns {void}
 */
function playGreetingAnimation(overlay) {
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add("fadeOut"), 1000);
    setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove("fadeOut");
            overlay.classList.remove('greetingOverlay');
        }, 1500);
}

/** Runs or skips the responsive greeting animation.
 * @param {HTMLElement} background background.
 * @param {HTMLElement} animatedImage animated Image.
 * @param {MediaQueryList} mediaQuery media Query.
 * @returns {void}
 */
function greetingAnimation(background, animatedImage, mediaQuery) {
    if (mediaQuery.matches) {
        startAnimation(background, animatedImage);
    } else {
        hideElements(background, animatedImage);
    }
}

/** Starts the greeting fade-out transition.
 * @param {HTMLElement} background background.
 * @param {HTMLElement} animatedImage animated Image.
 * @returns {void}
 */
function startAnimation(background, animatedImage) {
    background.classList.add("fadeOut");
    animatedImage.classList.add("fadeOut");
    setTimeout(function () {
            hideElements(background, animatedImage);
        }, 1500);
}

/** Hides responsive greeting elements completely.
 * @param {HTMLElement} background background.
 * @param {HTMLElement} animatedImage animated Image.
 * @returns {void}
 */
function hideElements(background, animatedImage) {
    if (background) background.style.display = 'none';
    if (animatedImage) animatedImage.style.display = 'none';
}

/** Resets view when resizing back to desktop.
 * @param {*} overlay overlay.
 * @returns {void}
 */
function resetDesktopView(overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove("fadeOut");
    overlay.classList.remove('greetingOverlay');
}

/** Rejects missing and malformed imported deadlines before sorting them.
 * @param {*} value value.
 * @returns {boolean} is valid summary date result.
 */
function isValidSummaryDate(value) {
    return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
}
