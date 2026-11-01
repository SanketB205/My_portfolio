import React from 'react'

export default function Experience() {
  const experiences = [
    {
      date: 'Present',
      role: 'Junior Intern Developer',
      company: 'CloudRegex InfoTech Pvt. Ltd.',
      location: 'Baramati, Maharashtra',
      description:
        'Contributing to software development, debugging, and testing of web applications in a collaborative environment. Gaining hands-on experience in MERN stack development, RESTful APIs, and real-world project implementation.',
    },
    {
      date: '2023',
      role: 'Junior Software Developer (Intern)',
      company: 'Regex Technologies Pvt. Ltd.',
      location: 'Phaltan, Maharashtra',
      description:
        'Developed and deployed interactive web applications using React.js and Node.js with responsive UI and performance optimization, while gaining expertise in RESTful APIs, database management, and user authentication.',
    },
  ]

  return (
    <section id="experience" className="w-full py-16 sm:py-20 lg:py-24 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Header Block */}
        <div className="text-center max-w-[600px] mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6">
            <span className="text-black text-xs">✦</span>
            <span>Experience</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-black mb-4">
            <span className="block">Where I've</span>
            <span className="block text-gray-400 font-extrabold">worked</span>
          </h2>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            My internship experience building real-world MERN applications.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="max-w-[800px] mx-auto relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[13px] sm:left-[17px] top-6 bottom-6 w-[2px] bg-gray-200" />

          {/* Timeline Items */}
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div
                key={exp.company}
                className="relative pl-9 sm:pl-12 group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[8px] sm:left-[12px] top-6 w-3 h-3 rounded-full bg-black ring-4 ring-[#F2F2F2] group-hover:scale-125 transition-transform duration-200" />

                {/* Experience Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-black leading-snug">
                      {exp.role}
                    </h3>
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 w-fit sm:w-auto">
                      {exp.date}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-gray-600 mb-1">
                    {exp.company}
                  </p>

                  <p className="text-xs sm:text-sm text-gray-400 mb-3.5 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{exp.location}</span>
                  </p>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
