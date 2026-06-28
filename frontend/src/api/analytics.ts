import { apiClient } from '@/lib/axios'
import type { URLStats, URLTimelineItem, URLDeviceItem } from '@/types'

export async function getStats(urlId: number): Promise<URLStats> {
  const res = await apiClient.get<URLStats>(`/api/v1/analytics/${urlId}`)
  return res.data
}

export async function getTimeline(urlId: number, days: number): Promise<URLTimelineItem[]> {
  const res = await apiClient.get<URLTimelineItem[]>(`/api/v1/analytics/${urlId}/timeline`, {
    params: { days },
  })
  return res.data ?? []
}

export async function getDevices(urlId: number): Promise<URLDeviceItem[]> {
  const res = await apiClient.get<URLDeviceItem[]>(`/api/v1/analytics/${urlId}/devices`)
  return res.data ?? []
}
