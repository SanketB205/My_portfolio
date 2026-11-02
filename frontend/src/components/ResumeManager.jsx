import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { Upload, FileText, Trash2, Download, Check } from 'lucide-react'

export default function ResumeManager() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/resume')
      setResumes(response.data)
    } catch (error) {
      console.error('Error fetching resumes:', error)
      setResumes([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploadError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await axiosInstance.post('/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('Resume uploaded:', response.data)
      
      // Refresh resume list
      await fetchResumes()
      
      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Error uploading resume:', error)
      setUploadError(error.response?.data?.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleSetActive = async (resumeId) => {
    try {
      await axiosInstance.patch(`/resume/${resumeId}/activate`)
      await fetchResumes()
    } catch (error) {
      console.error('Error setting active resume:', error)
      alert('Failed to set active resume')
    }
  }

  const handleDelete = async (resumeId) => {
    try {
      await axiosInstance.delete(`/resume/${resumeId}`)
      setResumes(resumes.filter(r => r._id !== resumeId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting resume:', error)
      alert('Failed to delete resume')
    }
  }

  const handleDownload = async (resumeId, originalName) => {
    try {
      const response = await axios.get(`/api/resume/download/${resumeId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Failed to download resume')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm h-full flex flex-col">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-black">Resume Management</h2>
        <label className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-colors duration-200 cursor-pointer">
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload New Resume'}
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Only PDF files are accepted. Maximum file size: 5MB. 
          Uploading a new resume will automatically set it as the active one displayed on your portfolio.
        </p>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading resumes...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && resumes.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No resume uploaded yet — upload your first one.</p>
          </div>
        </div>
      )}

      {/* Resume List */}
      {!loading && resumes.length > 0 && (
        <div className="flex-1 space-y-4">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className={`border rounded-2xl p-4 flex items-start justify-between gap-4 transition-colors ${
                resume.isActive 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Left: Resume Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-red-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-black truncate">
                      {resume.originalName}
                    </h3>
                    {resume.isActive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                        <Check size={12} />
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>{formatFileSize(resume.fileSize)}</span>
                    <span>•</span>
                    <span>Uploaded {formatDate(resume.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!resume.isActive && (
                  <button
                    onClick={() => handleSetActive(resume._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-600 hover:bg-green-600 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <Check size={14} />
                    Set Active
                  </button>
                )}
                
                <button
                  onClick={() => handleDownload(resume._id, resume.originalName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-medium transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
                
                {deleteConfirm === resume._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(resume._id)}
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


