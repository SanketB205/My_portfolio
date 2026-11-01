import React, { useState, useEffect, useRef } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { Upload, Trash2, Check, ImageIcon, User } from 'lucide-react'

export default function ProfileImageManager() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [previewSrc, setPreviewSrc] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get('/profile-image')
      setImages(data)
    } catch (err) {
      console.error('Error fetching profile images:', err)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed (JPG, PNG, WEBP, etc.)')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5 MB')
      e.target.value = ''
      return
    }

    setUploadError('')
    setUploading(true)

    // Show local preview while uploading
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewSrc(ev.target.result)
    reader.readAsDataURL(file)

    try {
      const form = new FormData()
      form.append('profileImage', file)
      await axiosInstance.post('/profile-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchImages()
      setPreviewSrc(null)
    } catch (err) {
      console.error('Error uploading profile image:', err)
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.')
      setPreviewSrc(null)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSetActive = async (id) => {
    try {
      await axiosInstance.patch(`/profile-image/${id}/activate`)
      await fetchImages()
    } catch (err) {
      console.error('Error activating image:', err)
      alert('Failed to set active image')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/profile-image/${id}`)
      setImages((prev) => prev.filter((img) => img._id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting image:', err)
      alert('Failed to delete image')
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  // The URL the browser can reach for a stored image
  const imageUrl = (img) =>
    `http://localhost:5000/uploads/profile/${img.filename}`

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-black">Profile Image</h2>
        <label className={`flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200 ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
          <Upload size={18} />
          {uploading ? 'Uploading…' : 'Upload New Image'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Note:</strong> Accepted formats: JPG, PNG, WEBP, GIF. Max size: 5 MB.
        Uploading a new image automatically sets it as active on your portfolio.
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {/* Upload in-progress preview */}
      {uploading && previewSrc && (
        <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <img
            src={previewSrc}
            alt="Preview"
            className="w-16 h-16 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">Uploading…</p>
            <div className="mt-1 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading images…</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && images.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No profile image uploaded yet — upload your first one.</p>
          </div>
        </div>
      )}

      {/* Image list */}
      {!loading && images.length > 0 && (
        <div className="flex-1 space-y-4">
          {images.map((img) => (
            <div
              key={img._id}
              className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors ${
                img.isActive
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Thumbnail + info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img
                    src={imageUrl(img)}
                    alt={img.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextSibling.style.display = 'flex'
                    }}
                  />
                  {/* fallback icon if image fails to load */}
                  <div className="w-full h-full items-center justify-center hidden">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-black truncate max-w-[260px]">
                      {img.originalName}
                    </p>
                    {img.isActive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                        <Check size={11} />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatSize(img.fileSize)} · Uploaded {formatDate(img.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!img.isActive && (
                  <button
                    onClick={() => handleSetActive(img._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-600 hover:bg-green-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <Check size={14} />
                    Set Active
                  </button>
                )}

                {deleteConfirm === img._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(img._id)}
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
                    onClick={() => setDeleteConfirm(img._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
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
  )
}
