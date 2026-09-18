/** Starts a protected page after Firebase restores authentication.
 * @param {Function} initialize initialize.
 * @returns {Promise<*>} initialize protected page result.
 */
async function initializeProtectedPage(initialize) {
    let user;
    try { user = await window.firebaseAuth.getAuthenticatedUser(); }
    catch (error) { return redirectUnauthenticatedVisitor(); }
    synchronizePageUser(user);
    watchProtectedSession();
    try { await initialize(); }
    finally { document.body.style.visibility = ''; }
}

/** Clears stale metadata and redirects without leaving the protected page in history.
 * @returns {void}
 */
function redirectUnauthenticatedVisitor() {
    document.body.style.visibility = 'hidden';
    sessionStorage.removeItem('currentUser');
    window.location.replace('./login.html');
}

/** Synchronizes session metadata with the restored Firebase user.
 * @param {Object} user user.
 * @returns {void}
 */
function synchronizePageUser(user) {
    let stored;
    try { stored = JSON.parse(sessionStorage.getItem('currentUser')); } catch (error) { stored = null; }
    const name = user.isAnonymous ? 'Guest' : user.displayName || (stored?.uid === user.uid && stored.name) || user.email?.split('@')[0] || 'Member';
    const profile = { uid: user.uid, name, email: user.email || null, role: user.isAnonymous ? 'guest' : 'member' };
    sessionStorage.setItem('currentUser', JSON.stringify(profile));
    currentUser = profile;
    if (typeof newUser !== 'undefined') newUser = profile;
}

/** Handles expired/sign-out sessions and pages restored from the browser back cache.
 * @returns {void}
 */
function watchProtectedSession() {
    window.firebaseAuth.auth.onAuthStateChanged(user => {
            if (!user) redirectUnauthenticatedVisitor();
        });
    window.addEventListener('pageshow', event => {
            if (event.persisted && !window.firebaseAuth.auth.currentUser) redirectUnauthenticatedVisitor();
        });
}

/** Starts a protected legal page or redirects to its public equivalent.
 * @param {string} publicPage public Page.
 * @returns {Promise<*>} initialize legal page result.
 */
async function initializeLegalPage(publicPage) {
    let user;
    try { user = await window.firebaseAuth.getAuthenticatedUser(); }
    catch (error) { return window.location.replace(publicPage); }
    synchronizePageUser(user);
    try { await initTemplate(); }
    finally { document.body.style.visibility = ''; }
}
