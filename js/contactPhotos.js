let contactPhotos = { add: '', edit: '' };

let contactPhotoReads = { add: null, edit: null };

/** Returns the keyboard-accessible camera and its hidden file input.
 * @param {string} mode Contact editor mode: add or edit.
 * @returns {string} Rendered markup or text.
 */
function getContactPhotoPickerHTML(mode) {
    return renderHtmlTemplate('contactPhotoPickerHTMLTemplate', [mode, mode, mode]);
}

/** Reads a selected photo while keeping the previous photo on failure.
 * @param {HTMLElement} input Input element to read or update.
 * @param {string} mode Contact editor mode: add or edit.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function selectContactPhoto(input, mode) {
    const file = input.files[0];
    if (!file) return;
    showContactSaveError(mode, '');
    const read = readContactPhoto(file);
    contactPhotoReads[mode] = read;
    try {
        const photo = await read;
        if (!input.isConnected || contactPhotoReads[mode] !== read) return;
        contactPhotos[mode] = photo;
        renderContactPhotoPreview(mode);
    } catch (error) { if (input.isConnected && contactPhotoReads[mode] === read) showContactSaveError(mode, error.message); }
    finally { if (contactPhotoReads[mode] === read) { input.value = ''; contactPhotoReads[mode] = null; } }
}

/** Validates and decodes a local JPEG or PNG without uploading it yet.
 * @param {File} file Selected image file.
 * @returns {Promise<*>} read contact photo result.
 */
async function readContactPhoto(file) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Please select a JPEG or PNG photo.');
    if (file.size > 10 * 1024 * 1024) throw new Error('The profile photo must not exceed 10 MB.');
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        return resizeContactPhoto(image);
    } catch (error) { throw new Error('The profile photo could not be read. Please select another image.'); }
    finally { URL.revokeObjectURL(url); }
}

/** Produces a small square photo for Firebase and circular avatars.
 * @param {*} image image.
 * @returns {*} resize contact photo result.
 */
function resizeContactPhoto(image) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    canvas.getContext('2d').drawImage(image, (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    return canvas.toDataURL('image/jpeg', 0.85);
}

/** Updates only the photo preview in the active contact form.
 * @param {string} mode Contact editor mode: add or edit.
 * @returns {void}
 */
function renderContactPhotoPreview(mode) {
    const preview = document.getElementById(`${mode}-contact-photo-preview`);
    if (mode === 'add' && !contactPhotos.add) {
        preview.innerHTML = renderHtmlTemplate('renderContactPhotoPreviewTemplate', []);
    } else preview.innerHTML = getContactAvatarHTML({ photo: contactPhotos[mode] });
}

/** Waits for a photo still being processed before persisting the form.
 * @param {string} mode Contact editor mode: add or edit.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
async function waitForContactPhoto(mode) {
    if (contactPhotoReads[mode]) await contactPhotoReads[mode];
}
