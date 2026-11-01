# 📥 Add Resume Download Button to Public Portfolio

## Option 1: Add to Hero Section (Recommended)

This adds a "Download Resume" button next to your contact buttons in the Hero section.

### Step 1: Update Hero Component

Open `frontend/src/components/Hero.jsx` and add:

```javascript
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Hero() {
  const [activeResume, setActiveResume] = useState(null)

  // Fetch active resume on mount
  useEffect(() => {
    axios.get('/api/resume/active')
      .then(res => setActiveResume(res.data))
      .catch(err => console.log('No active resume available'))
  }, [])

  return (
    <section>
      {/* ... existing hero content ... */}
      
      {/* Button Group */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Existing buttons */}
        <a href="#contact" className="...">
          Get In Touch
        </a>
        
        {/* NEW: Resume Download Button */}
        {activeResume && (
          <a
            href={`/api/resume/download/${activeResume._id}`}
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-black font-medium rounded-full text-sm transition-all shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Resume
          </a>
        )}
      </div>
    </section>
  )
}
```

---

## Option 2: Add to About Section

Add a download button in your About section.

```javascript
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function About() {
  const [activeResume, setActiveResume] = useState(null)

  useEffect(() => {
    axios.get('/api/resume/active')
      .then(res => setActiveResume(res.data))
      .catch(err => console.log('No active resume'))
  }, [])

  return (
    <section id="about">
      {/* ... existing about content ... */}
      
      {activeResume && (
        <a
          href={`/api/resume/download/${activeResume._id}`}
          download
          className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-all"
        >
          📄 Download My Resume
        </a>
      )}
    </section>
  )
}
```

---

## Option 3: Add to Navbar

Add a resume download link in your navigation bar.

```javascript
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Navbar() {
  const [activeResume, setActiveResume] = useState(null)

  useEffect(() => {
    axios.get('/api/resume/active')
      .then(res => setActiveResume(res.data))
      .catch(err => console.log('No active resume'))
  }, [])

  return (
    <nav>
      <div className="flex items-center gap-6">
        {/* Existing nav links */}
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        
        {/* NEW: Resume Link */}
        {activeResume && (
          <a
            href={`/api/resume/download/${activeResume._id}`}
            download
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            Resume
          </a>
        )}
      </div>
    </nav>
  )
}
```

---

## Option 4: Floating Action Button

Add a fixed resume download button that stays visible while scrolling.

```javascript
// Add to your main portfolio page

import { useState, useEffect } from 'react'
import axios from 'axios'

function PublicPortfolio() {
  const [activeResume, setActiveResume] = useState(null)

  useEffect(() => {
    axios.get('/api/resume/active')
      .then(res => setActiveResume(res.data))
      .catch(err => console.log('No active resume'))
  }, [])

  return (
    <div>
      {/* Existing portfolio content */}
      
      {/* Floating Resume Button */}
      {activeResume && (
        <a
          href={`/api/resume/download/${activeResume._id}`}
          download
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Download Resume"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Resume</span>
        </a>
      )}
    </div>
  )
}
```

---

## 🎨 Button Styles

### Primary Black Button
```javascript
className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-all"
```

### Outline Button
```javascript
className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-black font-medium rounded-full text-sm transition-all"
```

### Minimal Text Link
```javascript
className="text-sm font-medium text-gray-700 hover:text-black underline transition-colors"
```

---

## 📝 Complete Example for Hero Section

Here's a complete example showing where to add the resume button:

```javascript
import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Hero() {
  const [activeResume, setActiveResume] = useState(null)

  useEffect(() => {
    const fetchActiveResume = async () => {
      try {
        const response = await axios.get('/api/resume/active')
        setActiveResume(response.data)
      } catch (error) {
        console.log('No active resume available')
      }
    }
    
    fetchActiveResume()
  }, [])

  return (
    <section className="...">
      <div className="...">
        <h1>Your Name</h1>
        <p>Your description...</p>
        
        {/* Button Group */}
        <div className="flex flex-wrap items-center gap-4 mt-8">
          <a
            href="#contact"
            className="px-6 py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-all"
          >
            Get In Touch
          </a>
          
          {activeResume && (
            <a
              href={`/api/resume/download/${activeResume._id}`}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-black font-medium rounded-full text-sm transition-all shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Resume
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
```

---

## 🔍 Testing

After adding the button:

1. Make sure you have an active resume uploaded in admin
2. Refresh your public portfolio page
3. The "Download Resume" button should appear
4. Click it to download the PDF
5. If no button appears, check browser console for errors

---

## 🎯 Best Practices

1. **Always check if resume exists** - Use conditional rendering: `{activeResume && <button>}`
2. **Error handling** - Gracefully handle when no resume is uploaded
3. **Loading state** - Optional: Show skeleton while fetching
4. **Mobile friendly** - Use responsive classes
5. **Accessibility** - Add proper aria-labels and alt text

---

## 📱 Responsive Example

```javascript
{activeResume && (
  <a
    href={`/api/resume/download/${activeResume._id}`}
    download
    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-xs sm:text-sm transition-all"
  >
    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span className="hidden xs:inline">Download</span> Resume
  </a>
)}
```

Choose the option that best fits your portfolio design! 🎨
