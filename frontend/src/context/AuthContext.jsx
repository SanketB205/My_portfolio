import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    if (storedToken) {
      setToken(storedToken)
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username: email,
        password: password
      })

      const { token: authToken } = response.data

      // Store token in localStorage and state
      localStorage.setItem('admin_token', authToken)
      setToken(authToken)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      // Handle error and return meaningful message
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Login failed. Please check your credentials.'
      
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    // Clear token from localStorage and state
    localStorage.removeItem('admin_token')
    setToken(null)
    setIsAuthenticated(false)
  }

  const value = {
    token,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
