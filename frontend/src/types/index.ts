// Shared TypeScript types matching the Go backend

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ShortLink {
  id: number
  user_id: number
  short_code: string
  original_url: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface UpdateShortLinkStatusRequest {
  is_active: boolean
}

export interface CreateShortLinkRequest {
  original_url: string
  custom_short_code?: string
  expires_at?: string
}

export interface CreateShortLinkResponse {
  short_code: string
  original_url: string
  short_url: string
}

export interface UpdateShortLinkRequest {
  original_url: string
  expires_at?: string | null
}

export interface URLStats {
  url_id: number
  total_clicks: number
  daily_clicks: number
}

export interface ApiError {
  error: string
}

export type LinkStatus = 'active' | 'expired'

export interface URLTimelineItem {
  url_id: number
  date: string
  clicks: number
}

export interface URLDeviceItem {
  url_id: number
  device: string
  clicks: number
}
