import { AxiosRequestConfig } from 'axios'
import { apiClient } from './axios'

/**
 * A utility hook/collection for making API requests with optional custom headers.
 * Note: `apiClient` automatically injects the Authorization Bearer token via interceptors,
 * so you typically do not need to manually pass it here.
 */

export const getWithHeader = async <T>(
  url: string,
  headers?: Record<string, string>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.get<T>(url, {
    ...config,
    headers: {
      ...config?.headers,
      ...headers,
    },
  })
  return response.data
}

export const queryPostWithHeader = async <T, D = unknown>(
  url: string,
  data: D,
  headers?: Record<string, string>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      ...headers,
    },
  })
  return response.data
}

export const putWithHeader = async <T, D = unknown>(
  url: string,
  data: D,
  headers?: Record<string, string>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      ...headers,
    },
  })
  return response.data
}

export const deleteWithHeader = async <T>(
  url: string,
  headers?: Record<string, string>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.delete<T>(url, {
    ...config,
    headers: {
      ...config?.headers,
      ...headers,
    },
  })
  return response.data
}

/**
 * Hook to access the fetcher methods easily inside React components
 */
export const useFetcher = () => {
  return {
    getWithHeader,
    queryPostWithHeader,
    putWithHeader,
    deleteWithHeader,
  }
}
