import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { getProjectThumbnailUrl } from '../utils/projectThumbnail'

// Character threshold beyond which "Read more" appears
const CLAMP_LIMIT = 120

// ─── Fallback icon — shown when a project has no thumbnail ────────
// Uses only inline SVG, no new icon library required.
function ProjectThumbnailFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 select-none">
      {/* Code-window icon */}
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-3">
        <svg
          className="w-7 h-7 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-400 tracking-wide">Project Preview</span>
    </div>
  )
}

// ─── Thumbnail area — image or fallback ───────────────────────────
function ProjectThumbnail({ project }) {
  const url = getProjectThumbnailUrl(project)
  const [imgError, setImgError] = useState(false)

  // Reset error state if URL changes (e.g. after reindex)
  useEffect(() => { setImgError(false) }, [url])

  return (
    <div className="aspect-video bg-gray-100 rounded-t-3xl overflow-hidden relative">
      {url && !imgError ? (
        <img
          src={url}
          alt={`${project.title} thumbnail`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <ProjectThumbnailFallback />
      )}
    </div>
  )
}

// ─── Single project card ──────────────────────────────────────────
function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = project.description.length > CLAMP_LIMIT
  const displayText = expanded || !isLong
    ? project.description
    : project.description.slice(0, CLAMP_LIMIT).trimEnd() + '…'

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group">
      <div>
        {/* Thumbnail — image or fallback icon */}
        <div className="relative">
          <ProjectThumbnail project={project} />
          {project.featured && (
            <div className="absolute top-3.5 right-3.5 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/85 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-md border border-white/10">
                <span className="text-amber-400 text-xs">★</span> Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {project.year && (
            <span className="block text-xs font-semibold text-gray-400 mb-2">
              {project.year}
            </span>
          )}

          <h3 className="text-lg sm:text-xl font-bold text-black mb-2.5 leading-snug">
            {project.title}
          </h3>

          {/* Description + toggle */}
          <div className="mb-5">
            <p className="text-gray-500 text-sm leading-relaxed">{displayText}</p>
            {isLong && (
              <button
                onClick={() => setExpanded(p => !p)}
                className="mt-1.5 text-xs font-semibold text-black hover:underline focus:outline-none transition-all"
              >
                {expanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
          </div>

          {/* Tech stack pills */}
          {project.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {project.techStack.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-[#F8F8F8] text-gray-700 border border-gray-200/70 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom links row */}
      {(project.githubLink || project.liveDemoLink) && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex items-center gap-6">
          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>
          )}
          {project.liveDemoLink && (
            <a
              href={project.liveDemoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:underline transition-all"
            >
              <span>Live Demo</span>
              <span className="text-xs">↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────
export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get('/projects')
      const data = response.data || []
      // Ensure featured projects are ordered first, then respect admin sequence (order), then newest
      const sorted = [...data].sort((a, b) => {
        if (Boolean(b.featured) !== Boolean(a.featured)) {
          return b.featured ? 1 : -1
        }
        const orderA = typeof a.order === 'number' ? a.order : 9999
        const orderB = typeof b.order === 'number' ? b.order : 9999
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
      setProjects(sorted)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="projects" className="w-full py-16 sm:py-20 lg:py-24 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6">
            <span className="text-black text-xs">✦</span>
            <span>Projects</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-black mb-4">
            <span className="block">Things I've</span>
            <span className="block text-gray-400 font-extrabold">built</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            A few full-stack projects I've built using the MERN stack.
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading projects...</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects available yet.</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

