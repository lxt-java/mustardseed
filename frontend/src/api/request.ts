import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.response.use(
  (res: AxiosResponse) => {
    const body = res.data
    if (body && body.code !== undefined) {
      if (body.code === 200) {
        return body.data
      }
      return Promise.reject(new Error(body.message || 'Request failed'))
    }
    return body
  },
  (err) => {
    console.error('[API Error]', err.message)
    return Promise.reject(err)
  },
)

export default request
