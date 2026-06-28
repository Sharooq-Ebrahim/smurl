import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  // Axios errors (supports old { error } and new { message } format)
  const axiosError = error as { response?: { data?: { error?: string; message?: string } } }
  const data = axiosError?.response?.data
  if (data?.message) return data.message
  if (data?.error) return data.error
  return 'Something went wrong'
}
