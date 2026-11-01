import React, { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Skills', href: '#skills' },
    { name: 'Projects', href: '#projects' },
    { name: 'Experience', href: '#experience' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full pt-4 sm:pt-6 pb-2 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <nav className="max-w-[1400px] mx-auto bg-white/90 backdrop-blur-md rounded-full shadow-md border border-gray-100/80 px-6 py-3 sm:px-8 sm:py-3.5 flex items-center justify-between pointer-events-auto">
        {/* Left: Logo */}
        <a href="#home" className="text-[20px] font-bold tracking-tight text-black">
          Sanket.
        </a>

        {/* Center: Nav links (desktop) */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                className="hover:text-black transition-colors duration-200"
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: CTA Pill Button */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="bg-black hover:bg-neutral-800 text-white text-sm font-medium rounded-full px-6 py-3 transition-colors duration-200 shadow-xs whitespace-nowrap"
          >
            Let's Talk
          </a>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 transition-colors focus:outline-hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden max-w-[1400px] mx-auto mt-2 bg-white rounded-3xl p-5 shadow-lg border border-gray-100 pointer-events-auto">
          <ul className="flex flex-col gap-3 text-base font-medium text-gray-700">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-2 px-3 rounded-xl hover:bg-gray-50 hover:text-black transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
