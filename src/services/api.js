import axios from 'axios'

const api = axios.create({
  baseURL: 'https://web-production-7c992.up.railway.app',
})

// Agregar token automaticamente a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api