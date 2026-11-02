import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../utils/axiosInstance'
import { Plus, Pencil, Trash2, X, Upload, ImageOff, ChevronUp, ChevronDown } from 'lucide-react'
import ResumeManager from '../components/ResumeManager'
import ProfileImageManager from '../components/ProfileImageManager'
import CertificationManager from '../components/CertificationManager'
import SkillManager from '../components/SkillManager'
import ExperienceManager from '../components/ExperienceManager'
import {
  saveProjectThumbnail,
  getProjectThumbnailUrl,
  deleteProjectThumbnail
} from '../utils/projectThumbnail'

// ─── Thumbnail upload section ─────────────────────────────────────
// Used inside the create/edit form.
// Props:
//   existingUrl   – current thumbnail URL from saved project (edit mode) or null
//   stagedFile    – File object staged for upload (not yet saved)
//   stagedPreview – data URL preview of stagedFile
//   onStage       – callback(file, previewDataUrl)
//   onRemove      – callback() — clear staged or existing
//   error         – validation error string
function ThumbnailUploadSection({ existingUrl, stagedFile, stagedPreview, onStage, onRemove, error }) {
  const inputRef = useRef(null)
  const displayUrl = stagedPreview || existingUrl

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      onStage(null, null, 'Only JPG, PNG, or WEBP images are allowed.')
      e.target.value = ''
      return
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      onStage(null, null, 'Image must be smaller than 5 MB.')
      e.target.value = ''
      return
    }

    // Generate preview
    const reader = new FileReader()
    reader.onload = (ev) => onStage(file, ev.target.result, null)
    reader.onerror = () => onStage(null, null, 'Failed to read the image file.')
    reader.readAsDataURL(file)

    e.target.value = ''   // allow re-selecting same file
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Thumbnail <span className="text-xs text-gray-400 font-normal">(optional · JPG, PNG, WEBP · max 5 MB)</span>
      </label>

      {displayUrl ? (
        /* ── Preview area ── */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
          <img
            src={displayUrl}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
          />
          {/* Overlay buttons */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-full text-xs font-semibold hover:bg-gray-100 transition-colors shadow"
            >
              <Upload size={13} />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 rounded-full text-xs font-semibold hover:bg-red-50 transition-colors shadow"
            >
              <ImageOff size={13} />
              Remove
            </button>
          </div>
          {/* "Staged" badge */}
          {stagedFile && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[10px] font-semibold rounded-full">
              Ready to save
            </span>
          )}
        </div>
      ) : (
        /* ── Empty drop zone ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400"
        >
          <Upload size={22} />
          <span className="text-xs font-medium">Click to upload a thumbnail</span>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Validation error */}
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [projects,       setProjects]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [reordering,     setReordering]     = useState(false)
  const [formOpen,       setFormOpen]       = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData,       setFormData]       = useState({
    title: '', description: '', techStack: '',
    githubLink: '', liveDemoLink: '',
    year: new Date().getFullYear().toString(),
    featured: false,
    order: '1'
  })
  const [formErrors,   setFormErrors]   = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Thumbnail state
  const [thumbStagedFile,    setThumbStagedFile]    = useState(null)   // File | null
  const [thumbStagedPreview, setThumbStagedPreview] = useState(null)   // dataURL | null
  const [thumbExistingUrl,   setThumbExistingUrl]   = useState(null)   // saved URL | null
  const [thumbRemoved,       setThumbRemoved]       = useState(false)  // flagged for deletion
  const [thumbError,         setThumbError]         = useState('')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const resetThumbState = () => {
    setThumbStagedFile(null)
    setThumbStagedPreview(null)
    setThumbExistingUrl(null)
    setThumbRemoved(false)
    setThumbError('')
  }

  const handleMoveProject = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= projects.length) return

    const updatedProjects = [...projects]
    const [movedProject] = updatedProjects.splice(index, 1)
    updatedProjects.splice(targetIndex, 0, movedProject)

    // Assign sequential orders
    const orderList = updatedProjects.map((p, idx) => ({
      id: p._id,
      order: idx + 1
    }))

    // Optimistically update UI
    setProjects(updatedProjects.map((p, idx) => ({ ...p, order: idx + 1 })))

    try {
      setReordering(true)
      await axiosInstance.put('/projects/reorder', { orderList })
    } catch (error) {
      console.error('Error reordering projects:', error)
      fetchProjects()
    } finally {
      setReordering(false)
    }
  }

  const openAddForm = () => {
    setEditingProject(null)
    setFormData({
      title: '', description: '', techStack: '',
      githubLink: '', liveDemoLink: '',
      year: new Date().getFullYear().toString(),
      featured: false,
      order: (projects.length + 1).toString()
    })
    setFormErrors({})
    resetThumbState()
    setFormOpen(true)
  }

  const openEditForm = (project) => {
    setEditingProject(project)
    setFormData({
      title:       project.title,
      description: project.description,
      techStack:   Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack,
      githubLink:  project.githubLink  || '',
      liveDemoLink:project.liveDemoLink|| '',
      year:        project.year?.toString() || '',
      featured:    project.featured || false,
      order:       project.order !== undefined && project.order !== null ? project.order.toString() : '1'
    })
    setFormErrors({})
    resetThumbState()
    // Populate existing thumbnail
    setThumbExistingUrl(getProjectThumbnailUrl(project) || null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingProject(null)
    setFormData({
      title: '', description: '', techStack: '',
      githubLink: '', liveDemoLink: '',
      year: new Date().getFullYear().toString(),
      featured: false,
      order: '1'
    })
    setFormErrors({})
    resetThumbState()
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim())       errors.title       = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const techStackArray = formData.techStack
        .split(',').map(t => t.trim()).filter(t => t.length > 0)

      const projectData = {
        title:       formData.title,
        description: formData.description,
        techStack:   techStackArray,
        githubLink:  formData.githubLink  || '',
        liveDemoLink:formData.liveDemoLink|| '',
        year:        formData.year ? parseInt(formData.year) : new Date().getFullYear(),
        featured:    formData.featured,
        order:       formData.order ? parseInt(formData.order) : 1
      }

      let savedProjectId

      if (editingProject) {
        // ── UPDATE ──────────────────────────────────────────────
        await axiosInstance.put(`/projects/${editingProject._id}`, projectData)
        savedProjectId = editingProject._id

        // Handle thumbnail changes
        if (thumbRemoved && thumbExistingUrl && !thumbStagedFile) {
          // Admin removed the existing thumbnail
          await deleteProjectThumbnail(savedProjectId).catch(console.error)
        }
        if (thumbStagedFile) {
          // Upload new / replacement thumbnail
          await saveProjectThumbnail(savedProjectId, thumbStagedFile).catch(err => {
            console.error('Thumbnail upload failed:', err)
            setThumbError('Project saved, but thumbnail upload failed. Try again from Edit.')
          })
        }
      } else {
        // ── CREATE ──────────────────────────────────────────────
        const res = await axiosInstance.post('/projects', projectData)
        savedProjectId = res.data._id

        if (thumbStagedFile) {
          await saveProjectThumbnail(savedProjectId, thumbStagedFile).catch(err => {
            console.error('Thumbnail upload failed:', err)
            setThumbError('Project saved, but thumbnail upload failed. Try again from Edit.')
          })
        }
      }

      await fetchProjects()
      closeForm()
    } catch (error) {
      console.error('Error saving project:', error)
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error   ||
        error.message                 ||
        'Failed to save project.'
      setFormErrors({ submit: msg })
    }
  }

  const handleDelete = async (projectId) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}`)
      setProjects(projects.filter(p => p._id !== projectId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' })
  }

  // Thumbnail callbacks
  const handleThumbStage = (file, preview, error) => {
    if (error) { setThumbError(error); return }
    setThumbStagedFile(file)
    setThumbStagedPreview(preview)
    setThumbRemoved(false)
    setThumbError('')
  }

  const handleThumbRemove = () => {
    setThumbStagedFile(null)
    setThumbStagedPreview(null)
    setThumbRemoved(true)
    setThumbError('')
    // Keep thumbExistingUrl set so we know what to delete on save
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] font-sans">
      <div className="max-w-[1400px] mx-auto px-4 py-8">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-black">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-white hover:bg-black hover:text-white border border-gray-200 text-black font-medium rounded-full text-sm transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-black">Projects</h2>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200"
            >
              <Plus size={18} />
              Add New Project
            </button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading projects...</p>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects yet — add your first one.</p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div
                  key={project._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-gray-300 transition-colors"
                >
                  {/* Sequence Reorder Controls & Order Badge */}
                  <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={index === 0 || reordering}
                      onClick={() => handleMoveProject(index, -1)}
                      className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                      title="Move project up in sequence"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md min-w-[28px] text-center" title={`Sequence Position #${index + 1}`}>
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === projects.length - 1 || reordering}
                      onClick={() => handleMoveProject(index, 1)}
                      className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                      title="Move project down in sequence"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Thumbnail preview (admin list) */}
                  {getProjectThumbnailUrl(project) && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={getProjectThumbnailUrl(project)}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-black">{project.title}</h3>
                      {project.featured && (
                        <span className="px-2 py-0.5 bg-black text-white text-xs font-medium rounded-full">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {project.year && (
                        <span className="text-xs text-gray-600 font-medium">{project.year}</span>
                      )}
                      {Array.isArray(project.techStack) && project.techStack.map((tech, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                    {(project.githubLink || project.liveDemoLink) && (
                      <div className="flex items-center gap-3 mt-2">
                        {project.githubLink && (
                          <a href={project.githubLink} target="_blank" rel="noopener noreferrer"
                             className="text-xs text-blue-600 hover:underline">GitHub →</a>
                        )}
                        {project.liveDemoLink && (
                          <a href={project.liveDemoLink} target="_blank" rel="noopener noreferrer"
                             className="text-xs text-blue-600 hover:underline">Live Demo →</a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(project)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {deleteConfirm === project._id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(project._id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(project._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs font-medium transition-colors">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills / Technologies */}
        <div className="mt-8">
          <SkillManager />
        </div>

        {/* Experience / Internships */}
        <div className="mt-6">
          <ExperienceManager />
        </div>

        {/* Resume & Profile Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
          <ResumeManager />
          <ProfileImageManager />
        </div>

        {/* Certifications */}
        <div className="mt-6">
          <CertificationManager />
        </div>
      </div>

      {/* ── Project Form Modal ─────────────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="text-xl font-extrabold text-black">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text" name="title" value={formData.title}
                  onChange={handleInputChange} placeholder="E.g., Portfolio Website"
                  className={`w-full rounded-xl border ${formErrors.title ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition`}
                />
                {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleInputChange} rows={4}
                  placeholder="Describe your project..."
                  className={`w-full rounded-xl border ${formErrors.description ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition resize-none`}
                />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tech Stack</label>
                <input
                  type="text" name="techStack" value={formData.techStack}
                  onChange={handleInputChange} placeholder="E.g., React, Node.js, MongoDB"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
                />
                <p className="text-xs text-gray-500 mt-1">Separate technologies with commas</p>
              </div>

              {/* Year & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <input
                    type="text" name="year" value={formData.year}
                    onChange={handleInputChange} placeholder="E.g., 2024"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sequence Order <span className="text-xs text-gray-400 font-normal">(1 = first)</span>
                  </label>
                  <input
                    type="number" name="order" value={formData.order}
                    onChange={handleInputChange} placeholder="E.g., 1" min="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
                  />
                </div>
              </div>

              {/* GitHub Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub Link</label>
                <input
                  type="url" name="githubLink" value={formData.githubLink}
                  onChange={handleInputChange} placeholder="https://github.com/username/repo"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
                />
              </div>

              {/* Live Demo Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Live Demo Link</label>
                <input
                  type="url" name="liveDemoLink" value={formData.liveDemoLink}
                  onChange={handleInputChange} placeholder="https://example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="featured" name="featured"
                  checked={formData.featured} onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black cursor-pointer"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mark as Featured Project
                </label>
              </div>

              {/* ── Thumbnail upload ────────────────────────────── */}
              <ThumbnailUploadSection
                existingUrl={thumbRemoved ? null : thumbExistingUrl}
                stagedFile={thumbStagedFile}
                stagedPreview={thumbStagedPreview}
                onStage={handleThumbStage}
                onRemove={handleThumbRemove}
                error={thumbError}
              />

              {/* Submit error */}
              {formErrors.submit && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium">
                  {formErrors.submit}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-medium rounded-full py-3 text-sm transition-colors duration-200"
                >
                  {editingProject ? 'Update Project' : 'Save Project'}
                </button>
                <button
                  type="button" onClick={closeForm}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-full py-3 text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

