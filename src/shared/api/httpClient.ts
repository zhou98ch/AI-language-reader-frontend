import ky from 'ky'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const httpClient = ky.create({
  prefix: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})
