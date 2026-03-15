import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const boardsAPI = {
  getAll: () => api.get('/boards'),
  create: (data) => api.post('/boards', data),
  get: (id) => api.get(`/boards/${id}`),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  invite: (id, data) => api.post(`/boards/${id}/invite`, data),
}

export const tasksAPI = {
  getByBoard: (boardId) => api.get(`/tasks/board/${boardId}`),
  create: (boardId, data) => api.post(`/tasks/board/${boardId}`, data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  move: (taskId, data) => api.patch(`/tasks/${taskId}/move`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  addComment: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
}

export const analyticsAPI = {
  getBoard: (boardId) => api.get(`/analytics/board/${boardId}`),
  getUser: () => api.get('/analytics/user'),
}

export default api
