// app.js - Punto de entrada de la aplicación
import { TaskAPI } from './services/api.js'
import { UI } from './services/ui.js'

// Objeto App global para coordinar
const App = {
  // Inicialización de la aplicación
  init () {
    document.addEventListener('DOMContentLoaded', () => {
      // Verificar autenticación
      if (!TaskAPI.init()) {
        TaskAPI.logout()
        return
      }

      // Inicializar UI
      UI.init()

      // Cargar tareas
      this.loadTasks()

      // Exponer App al ámbito global para acceso desde UI
      window.App = this
    })
  },

  // Cargar tareas desde la API
  async loadTasks () {
    try {
      UI.toggleLoading(true)
      const result = await TaskAPI.getTasks()

      if (result.empty) {
        UI.toggleNoTasks(true)
      } else {
        UI.renderTasks(result.tasks)
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error)
      window.alert('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.')
    } finally {
      UI.toggleLoading(false)
    }
  },

  // Crear una nueva tarea
  async createTask (taskData) {
    try {
      await TaskAPI.createTask(taskData)
      UI.closeModal()
      this.loadTasks()
    } catch (error) {
      console.error('Error al crear la tarea:', error)
      window.alert('No se pudo crear la tarea. Por favor, intenta de nuevo.')
    } finally {
      UI.toggleSaveButtonLoading(false)
    }
  },

  // Actualizar una tarea existente
  async updateTask (taskId, taskData) {
    try {
      await TaskAPI.updateTask(taskId, taskData)
      UI.closeModal()
      this.loadTasks()
    } catch (error) {
      console.error('Error al actualizar la tarea:', error)
      window.alert('No se pudo actualizar la tarea. Por favor, intenta de nuevo.')
    } finally {
      UI.toggleSaveButtonLoading(false)
    }
  },

  // Eliminar una tarea
  async deleteTask (taskId) {
    try {
      UI.toggleLoading(true)
      await TaskAPI.deleteTask(taskId)
      this.loadTasks()
    } catch (error) {
      console.error('Error al eliminar la tarea:', error)
      window.alert('No se pudo eliminar la tarea. Por favor, intenta de nuevo.')
      UI.toggleLoading(false)
    }
  },

  // Actualizar el estado de una tarea
  async updateTaskStatus (taskId, newStatus) {
    try {
      await TaskAPI.updateTask(taskId, { status: newStatus })
      this.loadTasks()
    } catch (error) {
      console.error('Error al actualizar el estado de la tarea:', error)
      window.alert('No se pudo actualizar el estado de la tarea. Por favor, intenta de nuevo.')
    }
  }
}

// Iniciar la aplicación
App.init()

// Exportar para acceso desde otros módulos
export { App }
