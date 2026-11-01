import React from 'react'

export default function Skills() {
  const mainCategories = [
    {
      title: 'Frontend',
      skills: [
        'React.js',
        'JavaScript',
        'HTML',
        'CSS',
        'Bootstrap',
        'Tailwind CSS',
      ],
      icon: (
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: 'Backend',
      skills: ['Node.js', 'Express.js', 'REST APIs', 'MVC Architecture'],
      icon: (
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
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
    },
    {
      title: 'Database',
      skills: ['MongoDB', 'SQL', 'Mongoose'],
      icon: (
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
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      title: 'Languages & Core',
      skills: [
        'Java',
        'Python',
        'C++',
        'Data Structures & Algorithms',
      ],
      icon: (
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
      ),
    },
  ]

  const extraCategories = [
    {
      title: 'Tools & Practices',
      skills: [
        'Git',
        'GitHub',
        'JWT Authentication',
        'bcrypt',
        'Axios',
        'Software Engineering Principles',
        'Payment Gateway Integration',
      ],
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Currently Exploring',
      skills: ['Machine Learning', 'Artificial Intelligence'],
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ]

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

        {/* 4-Column Main Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCategories.map((cat) => (
            <div
              key={cat.title}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-gray-100">
                  {cat.icon}
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

        {/* 2-Column Wider Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {extraCategories.map((cat) => (
            <div
              key={cat.title}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-gray-100">
                  {cat.icon}
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
      </div>
    </section>
  )
}
