import axios from 'axios'

// In production, VITE_API_URL points to the Render backend.
// In local dev it is undefined, so we fall back to '/api' which Vite proxies to localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
