/**
 * projectThumbnail.js — Storage abstraction for project thumbnails
 *
 * All thumbnail I/O goes through these three functions.
 * To switch from local disk to Cloudinary later, only this file changes —
 * nothing in the card UI or admin form needs to know about storage details.
 *
 * Current backend:   POST /api/projects/:id/thumbnail   (multipart)
 *                    DELETE /api/projects/:id/thumbnail
 * Thumbnail URL:     /uploads/thumbnails/<filename>
 *                    (proxied through Vite → Express in dev)
 */

import axiosInstance from './axiosInstance';

/**
 * Upload (or replace) a thumbnail for a project.
 *
 * @param {string} projectId  MongoDB _id of the project
 * @param {File}   file       Image File object from <input type="file">
 * @returns {Promise<string>} The stored thumbnail path, e.g. "/uploads/thumbnails/thumb-xxx.jpg"
 */
export async function saveProjectThumbnail(projectId, file) {
  const form = new FormData();
  form.append('thumbnail', file);

  // Do NOT set Content-Type manually — axios must auto-generate the
  // multipart/form-data header with the correct boundary, otherwise
  // Multer cannot parse the request body and rejects with a 400/500.
  const { data } = await axiosInstance.post(
    `/projects/${projectId}/thumbnail`,
    form
  );

  return data.thumbnail; // "/uploads/thumbnails/thumb-xxx.jpg"
}

/**
 * Return the URL to display a project's thumbnail.
 * Works for both local paths (/uploads/...) and future absolute URLs (Cloudinary).
 *
 * @param {object} project  Project document from the API
 * @returns {string|null}   URL string, or null if no thumbnail
 */
export function getProjectThumbnailUrl(project) {
  if (!project?.thumbnail) return null;
  // Already absolute (Cloudinary or CDN) — return as-is
  if (project.thumbnail.startsWith('http')) return project.thumbnail;
  // Relative path from backend — prefix with backend origin in production.
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
