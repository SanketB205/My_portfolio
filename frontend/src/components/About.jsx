import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'

export default function About() {
  const [projectCount,   setProjectCount]   = useState(null)
  const [certifications, setCertifications] = useState([])
  const [certsLoading,   setCertsLoading]   = useState(true)

  useEffect(() => {
    axiosInstance.get('/projects')
      .then(res => setProjectCount(res.data.length))
      .catch(() => setProjectCount(null))

    axiosInstance.get('/certifications')
      .then(res => {
        setCertifications(res.data)
      })
      .catch(() => { /* leave as empty array */ })
      .finally(() => setCertsLoading(false))
  }, [])

  const projectLabel = projectCount === null
    ? '—'
    : projectCount === 0
      ? '0'
      : `${projectCount}+`

  const education = [
    {
      degree: 'Bachelor of Engineering — Computer Engineering',
      institution: 'Savitribai Phule Pune University, VPKBIET Baramati',
      meta: 'CGPA: 8.52/10 · Present',
    },
    {
      degree: 'Diploma — Computer Engineering',
      institution: "MSBTE, SVPM's ITE Malegaon (Bk), Baramati",
      meta: '88.00% · 2021–2024',
    },
  ]

  const statsTiles = [
    {
      value: '2',
      label: 'Internships completed',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      value: projectLabel,
      label: 'Full-stack projects',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      value: 'Java, Python, C++',
      label: 'Languages known',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      value: 'JWT, bcrypt',
      label: 'Security practices used',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ]

  return (
    <section id="about" className="w-full py-16 sm:py-20 lg:py-24 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">

          {/* Left Column */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left">
            {/* Pill Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6">
              <span className="text-black text-xs">✦</span>
              <span>About Me</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-black mb-6">
              <span className="block">A bit about</span>
              <span className="block">
                my <span className="text-gray-400 font-extrabold">journey</span>
              </span>
            </h2>

            {/* Bio Paragraph */}
            <p className="text-gray-500 text-base sm:text-lg max-w-[520px] leading-relaxed mb-8 sm:mb-10 font-normal">
              Hi, I'm Sanket Bhujbal, a Computer Engineering student pursuing my Bachelor of Engineering at VPKBIET, Baramati, with a CGPA of 8.52/10. I'm a full-stack developer passionate about building modern, responsive, and scalable web applications using the MERN stack.

              I've gained practical industry experience through internships at Regex Technologies and CloudRegex InfoTech, working on web development, RESTful APIs, databases, authentication, debugging, and real-world software projects.

              I enjoy transforming ideas into reliable digital products and solving problems through technology. From EV charging and slot booking systems to blog platforms and service-booking applications, I've worked across both frontend and backend development. I'm also continuously improving my skills in Java, DSA, AI/ML, software engineering, and problem solving.
            </p>

            {/* Education Card */}
            <div className="w-full max-w-[560px] bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"
                  />
                </svg>
                Education
              </h3>

              <div className="divide-y divide-gray-100">
                {education.map((item, idx) => (
                  <div
                    key={item.degree}
                    className={`${idx === 0 ? 'pb-5' : 'pt-5'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                      <h4 className="text-sm sm:text-base font-bold text-black leading-snug">
                        {item.degree}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      {item.institution}
                    </p>
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {item.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col w-full">
            {/* White Rounded Card with 2x2 Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {statsTiles.map((tile) => (
                  <div
                    key={tile.label}
                    className="bg-[#F8F8F8] rounded-2xl p-5 border border-gray-100/70 flex flex-col justify-between min-h-[120px] transition-colors hover:bg-gray-100/70"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-white shadow-xs">
                        {tile.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-extrabold text-black leading-tight mb-1">
                        {tile.value}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 font-medium">
                        {tile.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certification Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 mt-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                Certifications
              </h3>

              <div className="divide-y divide-gray-100">
                {certsLoading
                  ? /* skeleton rows while fetching */
                    [1, 2, 3].map(n => (
                      <div key={n} className={`flex items-center gap-3 ${n === 1 ? 'pb-4' : n === 3 ? 'pt-4' : 'py-4'} animate-pulse`}>
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                          <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
                        </div>
                        <div className="h-5 w-10 bg-gray-200 rounded-full" />
                      </div>
                    ))
                  : certifications.length === 0
                    ? <p className="text-gray-400 text-sm text-center py-4">No certifications added yet.</p>
                    : certifications.map((cert, idx) => (
                        <div
                          key={cert._id}
                          className={`flex items-start gap-3 ${idx === 0 ? 'pb-4' : idx === certifications.length - 1 ? 'pt-4' : 'py-4'}`}
                        >
                          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-[10px] text-black font-bold">✦</span>
                          </span>
                          <div>
                            <p className="text-sm font-bold text-black leading-snug">
                              {cert.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>
                          </div>
                          <span className="ml-auto flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 self-start">
                            {cert.year}
                          </span>
                        </div>
                      ))
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

