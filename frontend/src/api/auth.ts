import { apiClient } from '@/lib/axios'
import type { AuthResponse } from '@/types'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  name: string
  email: string
  password: string
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/login', data)
  return res.data
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/register', data)
  return res.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout')
}
