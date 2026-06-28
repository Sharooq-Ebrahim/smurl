import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  closing?: boolean
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'closing'>) => void
  removeToast: (id: string) => void
  dismissToast: (id: string) => void
}

const TOAST_LIMIT = 5

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  
  addToast: (newToast) => set((state) => {
    // Deduplication logic: ignore if there's an active toast with the same title and type
    const isDuplicate = state.toasts.some(
      (t) => t.title === newToast.title && t.type === newToast.type && !t.closing
    )
    if (isDuplicate) return state

    const id = Math.random().toString(36).slice(2, 9)
    const toast = { ...newToast, id, closing: false }
    
    // Add to front, slice to limit
    const newToasts = [toast, ...state.toasts].slice(0, TOAST_LIMIT)
    return { toasts: newToasts }
  }),

  // Mark toast as closing (triggers exit animation)
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.map((t) => (t.id === id ? { ...t, closing: true } : t)),
  })),

  // Remove fully from state
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}))

// Helper to easily trigger toasts without hooks if needed
export const toast = {
  success: (title: string, description?: string, duration = 4000) => 
    useToastStore.getState().addToast({ title, description, type: 'success', duration }),
  error: (title: string, description?: string, duration = 4000) => 
    useToastStore.getState().addToast({ title, description, type: 'error', duration }),
  info: (title: string, description?: string, duration = 4000) => 
    useToastStore.getState().addToast({ title, description, type: 'info', duration }),
  warning: (title: string, description?: string, duration = 4000) => 
    useToastStore.getState().addToast({ title, description, type: 'warning', duration }),
}
