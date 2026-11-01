import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HiddenAdminTrigger from './components/HiddenAdminTrigger'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'

function PublicPortfolio() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] text-gray-900 flex flex-col font-sans">
      {/* Hidden admin access gesture trigger (active on public "/" page only) */}
      <HiddenAdminTrigger />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        <Routes>
          <Route path="/" element={<PublicPortfolio />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
        {/* AI Chatbot Widget — visible on all pages */}
        <ChatWidget />
      </div>
    </Router>
  )
}
