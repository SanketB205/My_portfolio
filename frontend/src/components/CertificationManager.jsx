import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'
import axios from 'axios'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = { title: '', issuer: '', year: '' }

export default function CertificationManager() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)       // null = add, object = edit
  const [formData, setFormData] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { fetchCerts() }, [])

  const fetchCerts = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/certifications')
      setCerts(data)
    } catch (err) {
      console.error('Error fetching certifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── form helpers ────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditing(null)
    setFormData(emptyForm)
    setFormErrors({})
    setSubmitError('')
    setFormOpen(true)
  }

  const openEdit = (cert) => {
    setEditing(cert)
    setFormData({ title: cert.title, issuer: cert.issuer, year: cert.year })
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
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.issuer.trim()) errors.issuer = 'Issuer is required'
    if (!formData.year.trim())   errors.year  = 'Year is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitError('')

    try {
      if (editing) {
        await axiosInstance.put(`/certifications/${editing._id}`, formData)
      } else {
        await axiosInstance.post('/certifications', formData)
      }
      await fetchCerts()
      closeForm()
    } catch (err) {
      console.error('Error saving certification:', err)
      setSubmitError(err.response?.data?.message || 'Failed to save. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/certifications/${id}`)
      setCerts(prev => prev.filter(c => c._id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting certification:', err)
      alert('Failed to delete. Please try again.')
    }
  }

  // ── shared input class ───────────────────────────────────────────────────────
  const inputCls = (field) =>
    `w-full rounded-xl border ${formErrors[field] ? 'border-red-400' : 'border-gray-200'} px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition`

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-black">Certifications</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200"
        >
          <Plus size={18} />
          Add Certification
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading certifications…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && certs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No certifications yet — add your first one.</p>
        </div>
      )}

      {/* List */}
      {!loading && certs.length > 0 && (
        <div className="space-y-3">
          {certs.map((cert) => (
            <div
              key={cert._id}
              className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl px-5 py-4 hover:border-gray-300 transition-colors"
            >
              {/* Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[10px] text-black font-bold">✦</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black leading-snug truncate">
                    {cert.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 self-start">
                  {cert.year}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(cert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                >
                  <Pencil size={13} />
                  Edit
                </button>

                {deleteConfirm === cert._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(cert._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(cert._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
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
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-black">
                {editing ? 'Edit Certification' : 'Add Certification'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={19} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Oracle Cloud AI Foundations Associate"
                  className={inputCls('title')}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Issuer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issuer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleChange}
                  placeholder="e.g. Oracle"
                  className={inputCls('issuer')}
                />
                {formErrors.issuer && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.issuer}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="e.g. 2025"
                  className={inputCls('year')}
                />
                {formErrors.year && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.year}</p>
                )}
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
                  {editing ? 'Update Certification' : 'Save Certification'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
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
