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
 * Automatically retries once on transient 502 Bad Gateway errors.
 *
 * @param {string}   projectId     MongoDB _id of the project
 * @param {File}     file          Image File object from <input type="file">
 * @param {function} [onProgress]  Optional callback(percent: number 0–100)
 * @returns {Promise<string>}      The Cloudinary secure URL
 */
export async function saveProjectThumbnail(projectId, file, onProgress) {
  const makeRequest = (attempt) => {
    const form = new FormData();
    form.append('thumbnail', file);

    return axiosInstance.post(
      `/projects/${projectId}/thumbnail`,
      form,
      {
        headers: { 'Content-Type': undefined },
        timeout: 30000,  // 30 s client timeout
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      }
    );
  };

  try {
    const { data } = await makeRequest(1);
    return data.thumbnail;
  } catch (err) {
    // Retry once on transient 502 (Render proxy timeout) or network error
    const status = err.response?.status;
    const isTransient = status === 502 || status === 503 || status === 504 || !err.response;

    if (isTransient) {
      console.warn(`Thumbnail upload attempt 1 failed (${status || 'network error'}), retrying...`);
      if (onProgress) onProgress(0);

      // Brief pause before retry
      await new Promise(r => setTimeout(r, 2000));

      const { data } = await makeRequest(2);
      return data.thumbnail;
    }

    throw err;
  }
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
