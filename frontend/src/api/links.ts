import { apiClient } from '@/lib/axios'
import type {
  ShortLink,
  CreateShortLinkRequest,
  CreateShortLinkResponse,
  UpdateShortLinkRequest,
  UpdateShortLinkStatusRequest,
} from '@/types'

export async function getLinks(): Promise<ShortLink[]> {
  const res = await apiClient.get<ShortLink[]>('/api/v1/shorten')
  return res.data ?? []
}

export async function createLink(
  data: CreateShortLinkRequest,
): Promise<CreateShortLinkResponse> {
  const res = await apiClient.post<CreateShortLinkResponse>(
    '/api/v1/shorten',
    data,
  )
  return res.data
}

export async function updateLink(
  code: string,
  data: UpdateShortLinkRequest,
): Promise<void> {
  await apiClient.put(`/api/v1/shorten/${code}`, data)
}

export async function updateLinkStatus(
  code: string,
  data: UpdateShortLinkStatusRequest,
): Promise<void> {
  await apiClient.patch(`/api/v1/shorten/${code}/status`, data)
}

export async function deleteLink(code: string): Promise<void> {
  await apiClient.delete(`/api/v1/shorten/${code}`)
}

export function getQRCodeUrl(code: string): string {
  return `/api/v1/qr/${code}`
}
