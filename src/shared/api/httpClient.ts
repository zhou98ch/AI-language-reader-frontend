import ky from 'ky'

export const httpClient = ky.create({
  prefix: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
