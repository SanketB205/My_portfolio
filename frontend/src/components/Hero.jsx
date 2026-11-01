import React, { useState, useEffect } from 'react'
import axios from 'axios'
// Bundled fallback — only used when the backend has NO uploaded profile image
import fallbackProfileImg from '../assets/ChatGPT Image Sep 11, 2026, 08_21_05 PM.png'

export default function Hero() {
  const [activeResume, setActiveResume] = useState(null)
  const [profileSrc, setProfileSrc] = useState(null)   // null = loading; avoids hardcoded flash
  const [profileLoading, setProfileLoading] = useState(true)
  const [projectCount, setProjectCount] = useState(null)
  const [skills, setSkills] = useState([])
  const [experiences, setExperiences] = useState([])

  useEffect(() => {
    // Fetch active resume
    axios.get('/api/resume/active')
      .then(res => setActiveResume(res.data))
      .catch(() => {})

    // Fetch active profile image from DB — only fall back to bundled asset if none uploaded
    axios.get('/api/profile-image/active')
      .then(res => {
        const img = res.data
        setProfileSrc(`/uploads/profile/${img.filename}`)
      })
      .catch(() => {
        // Backend unreachable or no image uploaded — use bundled asset as last resort
        setProfileSrc(fallbackProfileImg)
      })
      .finally(() => setProfileLoading(false))

    // Fetch real project count
    axios.get('/api/projects')
      .then(res => setProjectCount(res.data.length))
      .catch(() => setProjectCount(null))

    // Fetch skills for pills and count
    axios.get('/api/skills')
      .then(res => setSkills(res.data))
      .catch(() => setSkills([]))

    // Fetch experience for internship count
    axios.get('/api/experience')
      .then(res => setExperiences(res.data))
      .catch(() => setExperiences([]))
  }, [])

  // Format count: show exact number, append "+" when ≥ 1
  const projectLabel = projectCount === null
    ? '—'
    : projectCount === 0
      ? '0'
      : `${projectCount}+`

  const skillCountLabel = skills.length > 0 ? `${skills.length}+` : '—'
  const internshipLabel = experiences.length > 0 ? experiences.length.toString() : '—'

  const stats = [
    { value: projectLabel,    label: 'Projects' },
    { value: skillCountLabel, label: 'Technologies' },
    { value: internshipLabel, label: 'Internships' },
  ]

  const skillPills = skills.slice(0, 6).map(s => s.name)

  return (
    <section id="home" className="w-full py-8 sm:py-12 lg:py-16 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6 sm:mb-8">
              <span className="text-black text-xs">✦</span>
              <span>Full Stack Web Developer</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[70px] xl:text-[76px] font-extrabold tracking-tight leading-[1.05] text-black mb-6">
              <span className="block">Building</span>
              <span className="block">
                Scalable <span className="text-gray-400 font-extrabold">Web</span>
              </span>
              <span className="block">Applications</span>
            </h1>

            {/* Subtext Paragraph */}
            <p className="text-gray-500 text-base sm:text-lg max-w-[500px] leading-relaxed mb-8 sm:mb-10 font-normal">
              I build full-stack web applications with clean UI, secure
              authentication, and scalable backend architecture using the MERN
              stack.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8 sm:mb-10">
              <a
                href="#projects"
                className="bg-black hover:bg-neutral-800 text-white font-medium rounded-full px-7 py-3.5 text-sm sm:text-base transition-colors duration-200 shadow-xs inline-flex items-center justify-center"
              >
                View Projects
              </a>
              {activeResume ? (
                <a
                  href={`/api/resume/download/${activeResume._id}`}
                  download={activeResume.originalName}
                  className="bg-white hover:bg-gray-50 text-black border border-black font-medium rounded-full px-7 py-3.5 text-sm sm:text-base transition-colors duration-200 shadow-xs inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </a>
              ) : (
                <span className="bg-white text-gray-400 border border-gray-200 font-medium rounded-full px-7 py-3.5 text-sm sm:text-base shadow-xs inline-flex items-center justify-center gap-2 cursor-not-allowed select-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume Unavailable
                </span>
              )}
            </div>

            {/* Skill Pills */}
            <div className="flex flex-wrap items-center gap-2.5 mb-10 sm:mb-14">
              {skillPills.map((skill) => (
                <span
                  key={skill}
                  className="bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-full px-4 py-2 shadow-xs transition-colors hover:border-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 sm:gap-14 pt-2">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl sm:text-4xl font-extrabold text-black">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end items-center relative mt-6 lg:mt-0 px-4 sm:px-6 lg:px-0">
            {/* White Rounded Card */}
            <div className="relative bg-white p-3.5 sm:p-4 rounded-[2.5rem] shadow-xl shadow-black/5 w-full max-w-[430px]">
              {/* Floating Badge Top-Left */}
              {/* <div className="absolute top-6 sm:top-8 -left-3 sm:-left-7 bg-white rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg shadow-black/10 border border-gray-100 z-10">
                <span className="block text-[11px] sm:text-xs text-gray-400 font-medium leading-tight">
                  Frontend
                </span>
                <span className="block text-xs sm:text-sm font-bold text-black whitespace-nowrap mt-0.5">
                  MERN Developer
                </span>
              </div> */}

              {/* Profile Image — skeleton while loading, DB image once resolved */}
              <div className="overflow-hidden rounded-2xl w-full">
                {profileSrc === null ? (
                  /* Skeleton placeholder — same aspect ratio as the image */
                  <div className="w-full aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
                ) : (
                  <img
                    src={profileSrc}
                    alt="Sanket Profile"
                    className="w-full aspect-[4/5] object-cover block"
                    onError={() => setProfileSrc(fallbackProfileImg)}
                  />
                )}
              </div>

              {/* Floating Badge Bottom-Right */}
              {/* <div className="absolute bottom-6 sm:bottom-8 -right-3 sm:-right-7 bg-white rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg shadow-black/10 border border-gray-100 z-10">
                <span className="block text-[11px] sm:text-xs text-gray-400 font-medium leading-tight">
                  Specialized In
                </span>
                <span className="block text-xs sm:text-sm font-bold text-black whitespace-nowrap mt-0.5">
                  REST APIs & Auth
                </span>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
