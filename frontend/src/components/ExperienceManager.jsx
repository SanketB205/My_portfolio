import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = {
  company:          '',
  position:         '',
  location:         '',
  startDate:        '',
  endDate:          '',
  current:          false,
  description:      '',
  responsibilities: '',   // textarea — comma/newline separated
  technologies:     '',   // textarea — comma separated
}

const inputCls = (err) =>
  `w-full rounded-xl border ${err ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition`

// Format a date string or Date obj → "YYYY-MM" for <input type="month">
const toMonthInput = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// Display label: "Jan 2023 – Mar 2024" or "Jan 2023 – Present"
const dateRange = (exp) => {
  const fmt = (d) => {
    if (!d) return ''
    const date = new Date(d)
    if (isNaN(date)) return ''
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  const start = fmt(exp.startDate)
  const end   = exp.current ? 'Present' : fmt(exp.endDate)
  return [start, end].filter(Boolean).join(' – ')
}

export default function ExperienceManager() {
  const [experiences,   setExperiences]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [formOpen,      setFormOpen]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [formData,      setFormData]      = useState(emptyForm)
  const [formErrors,    setFormErrors]    = useState({})
  const [submitError,   setSubmitError]   = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { fetchExperiences() }, [])

  const fetchExperiences = async () => {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get('/experience')
      setExperiences(data)
    } catch (err) {
      console.error('Error fetching experiences:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── form helpers ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null)
    setFormData(emptyForm)
    setFormErrors({})
    setSubmitError('')
    setFormOpen(true)
  }

  const openEdit = (exp) => {
    setEditing(exp)
    setFormData({
      company:          exp.company          || '',
      position:         exp.position         || '',
      location:         exp.location         || '',
      startDate:        toMonthInput(exp.startDate),
      endDate:          exp.current ? '' : toMonthInput(exp.endDate),
      current:          exp.current          || false,
      description:      exp.description      || '',
      responsibilities: Array.isArray(exp.responsibilities)
                          ? exp.responsibilities.join('\n')
                          : (exp.responsibilities || ''),
      technologies:     Array.isArray(exp.technologies)
                          ? exp.technologies.join(', ')
                          : (exp.technologies || ''),
    })
    setFormErrors({})
    setSubmitError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setFormData(emptyForm)
    setFormErrors({})
    setSubmitError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errors = {}
    if (!formData.company.trim())     errors.company     = 'Company is required'
    if (!formData.position.trim())    errors.position    = 'Position / role is required'
    if (!formData.startDate.trim())   errors.startDate   = 'Start date is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.current && !formData.endDate.trim()) errors.endDate = 'End date required (or check "Currently working here")'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitError('')

    // Parse array fields
    const responsibilities = formData.responsibilities
      .split('\n').map(s => s.trim()).filter(Boolean)
    const technologies = formData.technologies
      .split(',').map(s => s.trim()).filter(Boolean)

    const payload = {
      company:          formData.company,
      position:         formData.position,
      location:         formData.location,
      startDate:        formData.startDate,
      endDate:          formData.current ? null : formData.endDate,
      current:          formData.current,
      description:      formData.description,
      responsibilities,
      technologies,
    }

    try {
      if (editing) {
        await axiosInstance.put(`/experience/${editing._id}`, payload)
      } else {
        await axiosInstance.post('/experience', payload)
      }
      await fetchExperiences()
      closeForm()
    } catch (err) {
      console.error('Error saving experience:', err)
      setSubmitError(err.response?.data?.message || 'Failed to save. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/experience/${id}`)
      setExperiences(prev => prev.filter(e => e._id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting experience:', err)
      alert('Failed to delete. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-black">Experience / Internships</h2>
          <p className="text-xs text-gray-400 mt-0.5">Shown in the Experience section of the public portfolio</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200"
        >
          <Plus size={18} />
          Add Experience
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading experience…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && experiences.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No experience added yet — add your first internship or job.</p>
        </div>
      )}

      {/* List */}
      {!loading && experiences.length > 0 && (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp._id}
              className="flex items-start justify-between gap-4 border border-gray-200 rounded-2xl px-5 py-4 hover:border-gray-300 transition-colors"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-black">{exp.position}</p>
                  {exp.current && (
                    <span className="px-2 py-0.5 bg-black text-white text-[10px] font-semibold rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                <p className="text-xs text-gray-400 mt-0.5">{dateRange(exp)}</p>
                {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {exp.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(exp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                {deleteConfirm === exp._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-colors"
                    >Confirm</button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(exp._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-8 py-5 border-b border-gray-100 rounded-t-3xl z-10">
              <h3 className="text-lg font-extrabold text-black">
                {editing ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X size={19} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

              {/* Company + Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="company" value={formData.company}
                    onChange={handleChange} placeholder="e.g. REGEX Technologies"
                    className={inputCls(formErrors.company)}
                  />
                  {formErrors.company && <p className="text-xs text-red-600 mt-1">{formErrors.company}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Position / Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="position" value={formData.position}
                    onChange={handleChange} placeholder="e.g. Web Development Intern"
                    className={inputCls(formErrors.position)}
                  />
                  {formErrors.position && <p className="text-xs text-red-600 mt-1">{formErrors.position}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text" name="location" value={formData.location}
                  onChange={handleChange} placeholder="e.g. Pune, India (Remote)"
                  className={inputCls(false)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month" name="startDate" value={formData.startDate}
                    onChange={handleChange}
                    className={inputCls(formErrors.startDate)}
                  />
                  {formErrors.startDate && <p className="text-xs text-red-600 mt-1">{formErrors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="month" name="endDate" value={formData.endDate}
                    onChange={handleChange} disabled={formData.current}
                    className={`${inputCls(formErrors.endDate)} disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                  {formErrors.endDate && <p className="text-xs text-red-600 mt-1">{formErrors.endDate}</p>}
                </div>
              </div>

              {/* Currently working here */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="current" name="current"
                  checked={formData.current} onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black cursor-pointer"
                />
                <label htmlFor="current" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Currently working here
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleChange} rows={3}
                  placeholder="Brief summary of your role and what you worked on…"
                  className={`${inputCls(formErrors.description)} resize-none`}
                />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Key Responsibilities
                  <span className="text-xs text-gray-400 font-normal ml-1">(one per line)</span>
                </label>
                <textarea
                  name="responsibilities" value={formData.responsibilities}
                  onChange={handleChange} rows={4}
                  placeholder={"Built REST APIs with Express\nIntegrated JWT authentication\nWorked on MongoDB schema design"}
                  className={`${inputCls(false)} resize-none`}
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Technologies Used
                  <span className="text-xs text-gray-400 font-normal ml-1">(comma separated)</span>
                </label>
                <input
                  type="text" name="technologies" value={formData.technologies}
                  onChange={handleChange} placeholder="e.g. React, Node.js, MongoDB, Express"
                  className={inputCls(false)}
                />
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-medium rounded-full py-3 text-sm transition-colors"
                >
                  {editing ? 'Update Experience' : 'Save Experience'}
                </button>
                <button
                  type="button" onClick={closeForm}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-full py-3 text-sm transition-colors"
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


