// api.js - Capa de comunicación con el servidor
import { API_BASE_URL } from '../config.js'
import { sortTasks } from '../../utils/sortTasks.js'

export const TaskAPI = {
  // Autenticación
  authToken: null,
  userId: null,

  // Inicialización
  init () {
    this.authToken = this.getCookie('authToken')
    this.userId = this.getCookie('userId')
    return this.isAuthenticated()
  },

  isAuthenticated () {
    return !!this.authToken
  },

  // Helpers para cookies
  getCookie (name) {
    const cookieArr = document.cookie.split(';')
    for (let i = 0; i < cookieArr.length; i++) {
      const cookiePair = cookieArr[i].split('=')
      const cookieName = cookiePair[0].trim()
      if (cookieName === name) {
        return decodeURIComponent(cookiePair[1])
      }
    }
    return null
  },

  logout () {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.href = './login.html'
  },

  // Headers para las peticiones
  getHeaders () {
    return {
      'Content-Type': 'application/json',
      token: this.authToken,
      user_id: this.userId
    }
  },

  // Construcción de URL
  getUrl (endpoint = '/tasks', id = '') {
    if (id) {
      return `${API_BASE_URL}${endpoint}/${id}`
    }
    return `${API_BASE_URL}${endpoint}`
  },

  // Método para manejar respuestas y verificar autenticación
  handleResponse (response) {
    if (response.status === 401) {
      this.logout()
      throw new Error('Sesión expirada o inválida')
    }
    return response
  },

  // Métodos para tareas
  async getTasks () {
    try {
      console.log(this.getUrl())

      const response = await fetch(this.getUrl('/tasks'), {
        headers: this.getHeaders()
      })

      const handledResponse = this.handleResponse(response)
      const data = await handledResponse.json()

      if (data && data.message === 'No tasks found') {
        return { tasks: [], empty: true }
      }

      if (!Array.isArray(data) || data.length === 0) {
        return { tasks: [], empty: true }
      }

      return { tasks: sortTasks(data), empty: false }
    } catch (error) {
      console.error('Error al obtener tareas:', error)
      throw error
    }
  },

  async createTask (taskData) {
    try {
      const response = await fetch(this.getUrl('/tasks'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...taskData,
          userId: parseInt(this.userId) || this.userId
        })
      })

      return this.handleResponse(response)
    } catch (error) {
      console.error('Error al crear tarea:', error)
      throw error
    }
  },

  async updateTask (taskId, taskData) {
    try {
      const response = await fetch(this.getUrl('/tasks', taskId), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(taskData)
      })

      return this.handleResponse(response)
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      throw error
    }
  },

  async deleteTask (taskId) {
    try {
      const response = await fetch(this.getUrl('/tasks', taskId), {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return this.handleResponse(response)
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
      throw error
    }
  }
}
