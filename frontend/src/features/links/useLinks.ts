import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLinks, createLink, updateLink, deleteLink } from '@/api/links'
import { getStats, getTimeline, getDevices } from '@/api/analytics'
import type { CreateShortLinkRequest, UpdateShortLinkRequest } from '@/types'

export const LINKS_QUERY_KEY = ['links'] as const

export function useLinks() {
  return useQuery({
    queryKey: LINKS_QUERY_KEY,
    queryFn: getLinks,
  })
}

export function useCreateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShortLinkRequest) => createLink(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_QUERY_KEY }),
  })
}

export function useUpdateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: UpdateShortLinkRequest }) =>
      updateLink(code, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_QUERY_KEY }),
  })
}

export function useDeleteLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => deleteLink(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_QUERY_KEY }),
  })
}

export function useLinkStats(urlId: number) {
  return useQuery({
    queryKey: ['stats', urlId] as const,
    queryFn: () => getStats(urlId),
    enabled: urlId > 0,
  })
}

export function useLinkTimeline(urlId: number, days: number) {
  return useQuery({
    queryKey: ['timeline', urlId, days] as const,
    queryFn: () => getTimeline(urlId, days),
    enabled: urlId > 0,
  })
}

export function useLinkDevices(urlId: number) {
  return useQuery({
    queryKey: ['devices', urlId] as const,
    queryFn: () => getDevices(urlId),
    enabled: urlId > 0,
  })
}
