const firebaseConfig = {
    apiKey: "AIzaSyBrg8__1QBSQz2MPw3vcBtQ_Ub34vysJ9c",
    authDomain: "join-323f5.firebaseapp.com",
    databaseURL: "https://join-323f5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-323f5",
    storageBucket: "join-323f5.firebasestorage.app",
    messagingSenderId: "954637556787",
    appId: "1:954637556787:web:5b14f4292fd0125d569746",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/**
 * Registers a user with Firebase Authentication and stores the display name.
 * Passwords are managed exclusively by Firebase and are never written to the database.
 * @param {string} name Display name.
 * @param {string} email email.
 * @param {string} password password.
 * @returns {Promise<import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js").User>}
 */
async function registerWithEmail(name, email, password) {
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    await credential.user.updateProfile({ displayName: name });
    return credential.user;
}

/**
 * Signs a user in and chooses whether the session survives closing the browser.
 * @param {string} email email.
 * @param {string} password password.
 * @param {boolean} rememberMe remember Me.
 * @returns {Promise<*>} login with email result.
 */
async function loginWithEmail(email, password, rememberMe) {
    const persistence = rememberMe
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;
    await auth.setPersistence(persistence);
    return (await auth.signInWithEmailAndPassword(email, password)).user;
}

/**
 * Creates a temporary authenticated Firebase session for the demo guest.
 * The account has no password or personal email address.
 * @returns {Promise<firebase.User>}
 */
async function loginAnonymously() {
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    return (await auth.signInAnonymously()).user;
}

/**
 * Resolves once Firebase has restored the persisted authentication session.
 * @returns {Promise<firebase.User>}
 */
function getAuthenticatedUser() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe();
                if (user) resolve(user);
                else reject(new Error('Authentication required.'));
            }, reject);
    });
}

/**
 * Returns a fresh Firebase ID token for authenticated Realtime Database calls.
 * @returns {Promise<string>}
 */
async function getIdToken() {
    return (await getAuthenticatedUser()).getIdToken();
}

window.firebaseAuth = {
    auth,
    loginWithEmail,
    loginAnonymously,
    registerWithEmail,
    getIdToken,
    getAuthenticatedUser,
    signOut: () => auth.signOut(),
};
