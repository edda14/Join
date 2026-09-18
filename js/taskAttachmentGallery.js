/** Opens pending images in a keyboard-accessible gallery.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function openPendingAttachment(index) {
    if (!pendingAttachments[index]) return;
    const viewer = document.createElement('div');
    viewer.className = 'pending-image-viewer';
    viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Image gallery');
    viewer.opener = document.activeElement;
    viewer.attachments = pendingAttachments.slice();
    viewer.innerHTML = pendingGalleryMarkup();
    bindPendingGallery(viewer);
    document.body.appendChild(viewer); showPendingGalleryImage(viewer, index);
    viewer.querySelector('.pending-gallery-close').focus();
}

/** Returns gallery controls independently of the current image.
 * @returns {string} Rendered markup or text.
 */
function pendingGalleryMarkup() {
    return renderHtmlTemplate('pendingGalleryMarkupTemplate', []);
}

/** Binds navigation, closing, and keyboard controls once.
 * @param {HTMLElement} viewer Image viewer container.
 * @returns {void}
 */
function bindPendingGallery(viewer) {
    viewer.querySelector('.pending-gallery-close').onclick = () => closePendingGallery(viewer);
    viewer.querySelector('.pending-gallery-prev').onclick = () => showPendingGalleryImage(viewer, viewer.imageIndex - 1);
    viewer.querySelector('.pending-gallery-next').onclick = () => showPendingGalleryImage(viewer, viewer.imageIndex + 1);
    viewer.onclick = event => { if (event.target === viewer) closePendingGallery(viewer); };
    viewer.onkeydown = event => handlePendingGalleryKey(event, viewer);
}

/** Displays one image, wrapping at either end of the gallery.
 * @param {HTMLElement} viewer Image viewer container.
 * @param {number} index Zero-based list index.
 * @returns {void}
 */
function showPendingGalleryImage(viewer, index) {
    viewer.imageIndex = (index + viewer.attachments.length) % viewer.attachments.length;
    const file = viewer.attachments[viewer.imageIndex];
    viewer.querySelector('img').src = file.base64;
    viewer.querySelector('img').alt = file.name;
    viewer.querySelector('span').textContent = getAttachmentDescription(file);
}

/** Handles arrow keys, Escape, and focus containment in the gallery.
 * @param {Event} event Interaction that triggered the handler.
 * @param {HTMLElement} viewer Image viewer container.
 * @returns {*} handle pending gallery key result.
 */
function handlePendingGalleryKey(event, viewer) {
    if (event.key === 'Tab') return containTaskDialogFocus(event);
    if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') return closePendingGallery(viewer);
    showPendingGalleryImage(viewer, viewer.imageIndex + (event.key === 'ArrowLeft' ? -1 : 1));
}

/** Closes the gallery and returns focus to its opener.
 * @param {HTMLElement} viewer Image viewer container.
 * @returns {void}
 */
function closePendingGallery(viewer) {
    viewer.remove();
    if (viewer.opener?.isConnected) viewer.opener.focus();
}
