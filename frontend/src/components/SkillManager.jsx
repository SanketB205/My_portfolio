import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'
import axios from 'axios'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools', 'Other']
const LEVELS     = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const emptyForm  = { name: '', category: 'Frontend', level: 'Intermediate' }

// ─── Input class helper ────────────────────────────────────────────
const inputCls = (err) =>
  `w-full rounded-xl border ${err ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition`

export default function SkillManager() {
  const [skills,        setSkills]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [formOpen,      setFormOpen]      = useState(false)
  const [editing,       setEditing]       = useState(null)   // null = add mode
  const [formData,      setFormData]      = useState(emptyForm)
  const [formErrors,    setFormErrors]    = useState({})
  const [submitError,   setSubmitError]   = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { fetchSkills() }, [])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/skills')
      setSkills(data)
    } catch (err) {
      console.error('Error fetching skills:', err)
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

  const openEdit = (skill) => {
    setEditing(skill)
    setFormData({ name: skill.name, category: skill.category, level: skill.level || 'Intermediate' })
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
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errors = {}
    if (!formData.name.trim())     errors.name     = 'Skill name is required'
    if (!formData.category.trim()) errors.category = 'Category is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitError('')
    try {
      if (editing) {
        await axiosInstance.put(`/skills/${editing._id}`, formData)
      } else {
        await axiosInstance.post('/skills', formData)
      }
      await fetchSkills()
      closeForm()
    } catch (err) {
      console.error('Error saving skill:', err)
      setSubmitError(err.response?.data?.message || 'Failed to save. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/skills/${id}`)
      setSkills(prev => prev.filter(s => s._id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting skill:', err)
      alert('Failed to delete skill. Please try again.')
    }
  }

  // Group skills by category for display
  const grouped = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-black">Skills / Technologies</h2>
          <p className="text-xs text-gray-400 mt-0.5">Grouped by category on the public portfolio</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200"
        >
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading skills…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && skills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No skills yet — add your first one.</p>
        </div>
      )}

      {/* Grouped list */}
      {!loading && skills.length > 0 && (
        <div className="space-y-6">
          {CATEGORIES.filter(cat => grouped[cat]?.length).map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{cat}</h3>
              <div className="space-y-2">
                {grouped[cat].map(skill => (
                  <div
                    key={skill._id}
                    className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl px-5 py-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-black" />
                      <span className="text-sm font-bold text-black truncate">{skill.name}</span>
                      <span className="text-xs text-gray-400 font-medium hidden sm:block">{skill.level}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(skill)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      {deleteConfirm === skill._id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(skill._id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-colors"
                          >Confirm</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(skill._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-black">
                {editing ? 'Edit Skill' : 'Add Skill'}
              </h3>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X size={19} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skill Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="e.g. React, Node.js, MongoDB"
                  className={inputCls(formErrors.name)}
                />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category" value={formData.category} onChange={handleChange}
                  className={inputCls(formErrors.category)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formErrors.category && <p className="text-xs text-red-600 mt-1">{formErrors.category}</p>}
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proficiency Level</label>
                <select
                  name="level" value={formData.level} onChange={handleChange}
                  className={inputCls(false)}
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
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
                  {editing ? 'Update Skill' : 'Save Skill'}
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
