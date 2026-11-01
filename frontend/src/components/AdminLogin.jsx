import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(credentials.email, credentials.password)
      // Redirect to admin dashboard on successful login
      navigate('/admin')
    } catch (err) {
      // Display error message
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm text-center">
        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-xl">
          🔐
        </div>

        <h1 className="text-2xl font-extrabold text-black mb-1">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6">
          Access the portfolio administration dashboard
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-[#FBFBFB] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 text-white font-medium rounded-full py-3 text-sm transition-colors duration-200 shadow-xs cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
          >
            ← Back to Portfolio
          </button>
        </div>
      </div>
    </div>
  )
}
