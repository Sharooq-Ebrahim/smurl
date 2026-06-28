import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { getRuntimeConfig } from '@/lib/runtimeConfig'

export const apiClient = axios.create({
  baseURL: getRuntimeConfig('API_BASE_URL'),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle backend response structure and 401
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the new backend { success: true, message: "...", data: {...} } structure
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        response.data = response.data.data
      }
    }
    return response
  },
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')
    
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server Error', 'Something went wrong on our end. Please try again.')
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network Error', 'Please check your internet connection.')
    }
    return Promise.reject(error)
  },
)
