let pendingAttachments = [];

/** Serializes image processing and exposes completion to the save actions. */
let attachmentProcessing = Promise.resolve(true);

/** Invalidates unfinished selections when their form or selection is reset. */
let attachmentSelectionVersion = 0;

/** Binds the image picker and renders selected previews.
 * @returns {void}
 */
function setupAttachmentPicker() {
    const picker = document.getElementById('task-attachments');
    if (!picker || picker.dataset.bound) return;
    picker.dataset.bound = 'true';
    picker.addEventListener('change', handleAttachmentSelection);
    document.getElementById('delete-all-attachments')?.addEventListener('click', clearAllAttachments);
}

/** Restores selected images saved locally before a page reload.
 * @returns {void}
 */
function restorePendingAttachments() {
    attachmentSelectionVersion++;
    if (isEditingTask()) return;
    try { pendingAttachments = JSON.parse(localStorage.getItem('joinPendingAttachments') || '[]'); }
    catch (error) { pendingAttachments = []; }
    if (!Array.isArray(pendingAttachments)) pendingAttachments = [];
    renderAttachmentPreviews();
}

/** Persists the current image selection in the browser.
 * @returns {void}
 */
function persistPendingAttachments() {
    if (isEditingTask()) return;
    try { localStorage.setItem('joinPendingAttachments', JSON.stringify(pendingAttachments)); }
    catch (error) { console.warn('Attachments could not be stored locally.', error); }
}

/** Keeps an existing task's edit state separate from the new-task draft.
 * @returns {boolean} is editing task result.
 */
function isEditingTask() {
    const form = document.getElementById('task-title')?.closest('form');
    return Boolean(form?.id.startsWith('edit-main-input-container'));
}

/** Removes every selected attachment before the task is saved.
 * @returns {void}
 */
function clearAllAttachments() {
    attachmentSelectionVersion++;
    pendingAttachments = [];
    persistPendingAttachments();
    renderAttachmentPreviews();
}

/** Validates and compresses all newly selected images.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {Promise<*>} handle attachment selection result.
 */
async function handleAttachmentSelection(event) {
    if (taskSaveInProgress) return;
    const files = [...event.target.files];
    const invalid = files.find(file => !['image/jpeg', 'image/png'].includes(file.type));
    if (invalid) return showAttachmentError('Only JPEG and PNG images are allowed.');
    const version = attachmentSelectionVersion;
    attachmentProcessing = attachmentProcessing.then(() => processAttachmentFiles(files, version));
    try { await attachmentProcessing; }
    finally { event.target.value = ''; }
}

/** Processes one selection and reports failures inline without losing older images.
 * @param {File[]} files Selected image files.
 * @param {number} version Selection version used to discard stale upload results.
 * @returns {Promise<*>} process attachment files result.
 */
async function processAttachmentFiles(files, version) {
    try { return await addCompressedAttachments(files, version); }
    catch (error) {
        if (version !== attachmentSelectionVersion) return false;
        showAttachmentError('The images could not be processed. Please select valid JPEG or PNG files.');
        return false;
    }
}

/** Validates the actual Base64 array, including restored drafts, against 1 MB.
 * @param {Array<*>} attachments Images with their saved metadata and base64 data.
 * @returns {boolean} validate attachment size result.
 */
function validateAttachmentSize(attachments = pendingAttachments) {
    const size = new TextEncoder().encode(JSON.stringify(attachments)).length;
    if (size <= 1024 * 1024) return true;
    showAttachmentError('The total attachment size must not exceed 1 MB.');
    document.getElementById('task-attachments')?.scrollIntoView({ block: 'center' });
    return false;
}

/** Waits for selected images before checking the final array sent to Firebase.
 * @returns {Promise<*>} prepare attachments for save result.
 */
async function prepareAttachmentsForSave() {
    await attachmentProcessing;
    return validateAttachmentSize();
}

/** Adds compressed files only when their complete Base64 array fits the limit.
 * @param {File[]} files Selected image files.
 * @param {number} version Selection version used to discard stale upload results.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function addCompressedAttachments(files, version = attachmentSelectionVersion) {
    const compressedFiles = await Promise.all(files.map(compressAttachment));
    if (version !== attachmentSelectionVersion) return false;
    if (!validateAttachmentSize([...compressedFiles, ...pendingAttachments])) return false;
    showAttachmentError('');
    pendingAttachments = [...compressedFiles, ...pendingAttachments];
    persistPendingAttachments();
    renderAttachmentPreviews();
    return true;
}

/** Shows or clears the attachment validation message.
 * @param {string} message Feedback text; an empty string clears the error.
 * @returns {void}
 */
function showAttachmentError(message) {
    const error = document.getElementById('task-attachment-error');
    if (!error) return;
    error.textContent = message;
    error.classList.toggle('d-none', !message);
}

/** Compresses one image to JPEG data with an 800px edge limit.
 * @param {File} file Selected image file.
 * @returns {Promise<*>} compress attachment result.
 */
async function compressAttachment(file) {
    const image = await loadAttachmentImage(file);
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Image compression failed.');
    return { name: file.name.replace(/\.(png|jpe?g)$/i, '.jpg'), originalName: file.name,
        type: blob.type, size: blob.size, base64: await blobToBase64(blob) };
}

/** Loads a selected file as an image element.
 * @param {File} file Selected image file.
 * @returns {Promise<*>} load attachment image result.
 */
function loadAttachmentImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image(), url = URL.createObjectURL(file);
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image.')); };
        image.src = url;
    });
}

/** Converts a Blob into its base64 data URL representation.
 * @param {*} blob blob.
 * @returns {Promise<*>} blob to base64 result.
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
}

/** Displays compact previews for selected attachments.
 * @returns {void}
 */
function renderAttachmentPreviews() {
    const preview = document.getElementById('task-attachment-preview');
    if (!preview) return;
    preview.classList.toggle('has-attachments', pendingAttachments.length > 0);
    document.getElementById('delete-all-attachments')?.classList.toggle('is-visible', pendingAttachments.length > 0);
    preview.innerHTML = pendingAttachments.map((file, index) => renderHtmlTemplate('renderAttachmentPreviewsTemplate', [file.base64, escapeTaskText(file.name), index, escapeTaskText(file.name), escapeTaskText(file.name), index])).join('');
    preview.querySelectorAll('[data-attachment-index]').forEach(image => image.addEventListener('click', () => openPendingAttachment(Number(image.dataset.attachmentIndex))));
    preview.querySelectorAll('[data-attachment-index]').forEach(makeAttachmentKeyboardAccessible);
}

/** Gives image previews a button role and keyboard activation.
 * @param {*} image image.
 * @returns {void}
 */
function makeAttachmentKeyboardAccessible(image) {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Open image ${image.alt}`);
    image.onkeydown = event => {
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        image.click();
    };
}

/** Formats the stored image metadata for either gallery.
 * @param {File} file Selected image file.
 * @returns {string} Rendered markup or text.
 */
function getAttachmentDescription(file) {
    return `${file.name} · ${file.type || 'Unknown type'} · ${((file.size || 0) / 1024).toFixed(1)} KB`;
}

/** Removes one pending attachment before saving the task.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function removeAttachment(index) {
    pendingAttachments.splice(index, 1); persistPendingAttachments(); renderAttachmentPreviews();
}
