/**
 * @typedef {Object} Contact
 * @property {string} id Firebase contact key.
 * @property {string} name Display name.
 * @property {string} mail Email address.
 * @property {string} phone Telephone number.
 * @property {string} initials Name initials used when no photo exists.
 * @property {string} profileColor Avatar fallback color.
 * @property {string} photo Compressed image as a base64 data URL, or an empty string.
 */

/**
 * @typedef {Object} TaskAttachment
 * @property {string} name Original filename.
 * @property {string} type MIME type of the compressed image.
 * @property {number} size Size of the compressed image in bytes.
 * @property {string} base64 Compressed image as a base64 data URL.
 */

/**
 * @typedef {Object} Task
 * @property {string} [id] Firebase task key, assigned after creation.
 * @property {string} title Task title.
 * @property {string} description Task description.
 * @property {string} date Due date in ISO format.
 * @property {string} prio urgent, medium or low.
 * @property {string} category Task category.
 * @property {string} status Current board column.
 * @property {Object[]} assignedTo Contact references and avatar fallback data.
 * @property {string[]} subcategory Subtask labels.
 * @property {string[]} completedSubtasks Subtask completion flags.
 * @property {TaskAttachment[]} attachments Compressed images and metadata.
 * @property {Object|null} creator Creator metadata.
 * @property {string} source Origin of the task.
 * @property {boolean} aiGenerated Whether AI created the task.
 * @property {string|null} createdAt Creation timestamp.
 */
