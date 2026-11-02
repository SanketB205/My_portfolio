import React, { useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'

const DefaultIcon = () => (
  <svg
    className="w-4 h-4 text-black"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
)

export default function Skills() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get('/skills')
      .then(res => {
        const skills = res.data
        const grouped = skills.reduce((acc, skill) => {
          const cat = skill.category || 'Other'
          if (!acc[cat]) acc[cat] = []
          acc[cat].push(skill.name)
          return acc
        }, {})
        const categories = Object.entries(grouped).map(([title, skills]) => ({ title, skills }))
        setCategories(categories)
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="skills" className="w-full py-16 sm:py-20 lg:py-24 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Header Block */}
        <div className="text-center max-w-[600px] mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6">
            <span className="text-black text-xs">✦</span>
            <span>Skills</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-black mb-4">
            <span className="block">Tools I work</span>
            <span className="block text-gray-400 font-extrabold">with</span>
          </h2>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            Technologies and practices I use to build full-stack web applications.
          </p>
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No skills added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-gray-100">
                    <DefaultIcon />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-black">
                    {cat.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-[#F8F8F8] text-gray-700 border border-gray-200/70 rounded-full text-xs sm:text-sm font-medium px-3 py-1 hover:bg-gray-100 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

