declare global {
  interface Window {
    env: Array<{
      source: string
      target: {
        API_BASE_URL: string
      }
    }>
  }
}

export const getRuntimeConfig = (key: keyof Window['env'][number]['target']) => {
  const match = window.env?.find((e) => e.source === window.location.origin)
  if (!match) throw new Error(`Missing config for origin: ${window.location.origin}`)
  return match.target[key]
}
