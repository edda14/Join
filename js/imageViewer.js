let viewerAttachments = [];

let viewerIndex = 0;

let viewerTrigger = null;

/** Keeps keyboard focus and navigation inside the stored-image gallery.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {*} handle image viewer key result.
 */
function handleImageViewerKey(event) {
    if (event.key === 'Tab') return containTaskDialogFocus(event);
    if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') return closeImageViewer();
    changeViewerImage(event.key === 'ArrowLeft' ? -1 : 1);
}

/** Opens the image gallery at the selected attachment.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function openImageViewer(index) {
    viewerTrigger = document.activeElement;
    viewerIndex = index; renderViewerImage();
    const viewer = document.getElementById('image-viewer');
    viewer.onkeydown = handleImageViewerKey;
    viewer.classList.add('is-visible');
    document.querySelector('.image-viewer-close')?.focus();
}

/** Shows the current gallery image and download link.
 * @returns {void}
 */
function renderViewerImage() {
    const file = viewerAttachments[viewerIndex];
    if (!file) return;
    document.getElementById('image-viewer-image').src = file.base64;
    document.getElementById('image-viewer-image').alt = file.name;
    const name = document.getElementById('image-viewer-name');
    name.textContent = getAttachmentDescription(file);
    name.style.setProperty('color', '#fff', 'important');
    const download = document.getElementById('image-viewer-download');
    download.href = file.base64; download.download = file.name;
}

/** Downloads an attachment without opening the image viewer.
 * @param {number} index Zero-based list index.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function downloadAttachment(index, event) {
    event?.stopPropagation();
    const file = viewerAttachments[index];
    if (!file) return;
    const link = document.createElement('a');
    link.href = file.base64;
    link.download = file.name;
    link.click();
}

/** Moves forward or backward in the image gallery.
 * @param {number} step Direction of image navigation.
 * @returns {void}
 */
function changeViewerImage(step) {
    viewerIndex = (viewerIndex + step + viewerAttachments.length) % viewerAttachments.length;
    renderViewerImage();
}

/** Closes the image gallery when its backdrop or close button is clicked.
 * @param {Event} event Interaction that triggered the handler.
 * @returns {void}
 */
function closeImageViewer(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('image-viewer').classList.remove('is-visible');
    viewerTrigger?.focus();
    viewerTrigger = null;
}
