import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: false,
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Reset status when user starts typing again
    if (status.success || status.error) {
      setStatus({ loading: false, success: false, error: false, message: '' })
    }
  }

  // Auto-dismiss the success/error banner so it doesn't linger on the page.
  useEffect(() => {
    if (status.loading || !status.message) return

    const timer = setTimeout(() => {
      setStatus((prev) => ({ ...prev, success: false, error: false, message: '' }))
    }, 4000)

    return () => clearTimeout(timer)
  }, [status.loading, status.message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: false, message: 'Sending...' })

    try {
      await axios.post('/api/contact', formData)
      setStatus({
        loading: false,
        success: true,
        error: false,
        message: 'Message sent successfully!',
      })
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        error: true,
        message: 'Something went wrong — please try again.',
      })
    }
  }

  const contactDetails = [
    {
      label: 'Email',
      value: 'sanketbhujbal205@gmail.com',
      href: 'mailto:sanketbhujbal205@gmail.com',
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Phone',
      value: '+91 7057130039',
      href: 'tel:+917057130039',
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
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
    },
    {
      label: 'Location',
      value: 'Phaltan, Satara, Maharashtra',
      href: null,
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ]

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/sanket-bhujbal-24b013314/',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/SanketB205',
    },
    {
      name: 'LeetCode',
      href: 'https://leetcode.com/u/RhBgdt49Pw/',
    },
  ]

  return (
    <section id="contact" className="w-full py-16 sm:py-20 lg:py-24 scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Pill Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/80 text-xs sm:text-sm font-medium text-gray-800 shadow-xs mb-6">
              <span className="text-black text-xs">✦</span>
              <span>Contact</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-black mb-4">
              <span className="block">Let's build</span>
              <span className="block text-gray-400 font-extrabold">something</span>
            </h2>

            {/* Subtext */}
            <p className="text-gray-500 text-base sm:text-lg max-w-[450px] leading-relaxed mb-8">
              Have a project in mind or an opportunity to discuss? I'd love to
              hear from you.
            </p>

            {/* Contact Info Card */}
            <div className="w-full max-w-[480px] bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs divide-y divide-gray-100">
              {contactDetails.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 ${
                    idx === 0 ? 'pb-4' : idx === contactDetails.length - 1 ? 'pt-4' : 'py-4'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">
                      {item.label}
                    </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm font-semibold text-black hover:underline break-all"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-black break-all">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Pill Links */}
            <div className="flex flex-wrap items-center gap-3 mt-8">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full px-5 py-2 shadow-xs hover:bg-black hover:text-white transition-colors duration-200"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-700 mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black transition"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black transition"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-semibold text-gray-700 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project or opportunity..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black transition resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full bg-black hover:bg-neutral-800 disabled:bg-gray-400 text-white font-medium rounded-full px-6 py-3.5 text-sm sm:text-base transition-colors duration-200 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  {status.loading ? 'Sending...' : 'Send Message'}
                </button>

                {/* Status Message */}
                {status.message && (
                  <p
                    className={`text-center text-sm font-medium pt-1 ${
                      status.loading
                        ? 'text-gray-500'
                        : status.success
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {status.message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
