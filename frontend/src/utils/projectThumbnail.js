/**
 * projectThumbnail.js — Storage abstraction for project thumbnails
 *
 * All thumbnail I/O goes through these three functions.
 * Backend uploads to Cloudinary and returns the secure_url.
 *
 * Current backend:   POST /api/projects/:id/thumbnail   (multipart)
 *                    DELETE /api/projects/:id/thumbnail
 * Thumbnail URL:     Cloudinary secure_url (https://res.cloudinary.com/...)
 */

import axiosInstance from './axiosInstance';

/**
 * Upload (or replace) a thumbnail for a project.
 *
 * @param {string}   projectId     MongoDB _id of the project
 * @param {File}     file          Image File object from <input type="file">
 * @param {function} [onProgress]  Optional callback(percent: number 0–100)
 * @returns {Promise<string>}      The Cloudinary secure URL
 */
export async function saveProjectThumbnail(projectId, file, onProgress) {
  const form = new FormData();
  form.append('thumbnail', file);

  // Do NOT set Content-Type manually — axios must auto-generate the
  // multipart/form-data header with the correct boundary, otherwise
  // Multer cannot parse the request body and rejects with a 400/500.
  const { data } = await axiosInstance.post(
    `/projects/${projectId}/thumbnail`,
    form,
    {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    }
  );

  return data.thumbnail; // Cloudinary secure_url
}

/**
 * Return the URL to display a project's thumbnail.
 * Cloudinary URLs are absolute (https://res.cloudinary.com/...),
 * so they're returned as-is.
 *
 * @param {object} project  Project document from the API
 * @returns {string|null}   URL string, or null if no thumbnail
 */
export function getProjectThumbnailUrl(project) {
  if (!project?.thumbnail) return null;
  // Cloudinary / CDN — already absolute
  if (project.thumbnail.startsWith('http')) return project.thumbnail;
  // Legacy: relative path from old local storage — prefix with backend origin.
  // In local dev VITE_API_URL is undefined so the Vite proxy handles it.
  const backendBase = import.meta.env.VITE_API_URL ?? '';
  return `${backendBase}${project.thumbnail}`;
}

/**
 * Remove a project's thumbnail from storage and clear the field.
 *
 * @param {string} projectId  MongoDB _id of the project
 * @returns {Promise<void>}
 */
export async function deleteProjectThumbnail(projectId) {
  await axiosInstance.delete(`/projects/${projectId}/thumbnail`);
}
