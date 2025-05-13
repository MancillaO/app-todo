import { TaskAPI } from './api.js'
import { App } from '../app.js'

export const UI = {
  // Elementos DOM
  elements: {
    taskTable: document.querySelector('.task-table'),
    tableBody: document.querySelector('.task-table tbody'),
    loadingContainer: document.querySelector('.loading-container'),
    noResultsMessage: document.querySelector('.no-results'),
    noTasksMessage: document.querySelector('.no-tasks'),
    modal: document.getElementById('taskModal'),
    taskForm: document.getElementById('taskForm'),
    btnAddTask: document.getElementById('btnAddTask'),
    btnAddTaskEmpty: document.getElementById('btnAddTaskEmpty'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancelTask: document.getElementById('btnCancelTask'),
    saveButton: document.getElementById('btnSaveTask'),
    searchBar: document.querySelector('.search-bar input'),
    searchButton: document.querySelector('.search-bar button'),
    hamburgerButton: document.getElementById('hamburgerButton'),
    menu: document.getElementById('menu')
  },

  // Variables de estado
  state: {
    editingTaskId: null
  },

  // Inicialización
  init () {
    this.setupEventListeners()
    return this
  },

  // Configuración de eventos
  setupEventListeners () {
    // Eventos de navegación
    if (this.elements.hamburgerButton && this.elements.menu) {
      this.setupMenuEvents()
    }

    // Eventos de búsqueda
    this.elements.searchButton.addEventListener('click', () => {
      const searchTerm = this.elements.searchBar.value.toLowerCase()
      this.searchTasks(searchTerm)
    })

    this.elements.searchBar.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = this.elements.searchBar.value.toLowerCase()
        this.searchTasks(searchTerm)
      }
    })

    // Eventos del modal
    this.elements.btnAddTask.addEventListener('click', () => {
      this.openModal('Nueva Tarea')
    })

    if (this.elements.btnAddTaskEmpty) {
      this.elements.btnAddTaskEmpty.addEventListener('click', () => {
        this.openModal('Nueva Tarea')
      })
    }

    this.elements.btnCloseModal.addEventListener('click', () => this.closeModal())
    this.elements.btnCancelTask.addEventListener('click', () => this.closeModal())

    this.elements.modal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.closeModal()
      }
    })

    // Formulario de tareas
    this.elements.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e))

    // Cerrar menús de acciones al hacer clic en cualquier lugar
    document.addEventListener('click', () => {
      document.querySelectorAll('.actions-menu.active').forEach(menu => {
        menu.classList.remove('active')
      })
    })
  },

  setupMenuEvents () {
    this.elements.hamburgerButton.addEventListener('click', function () {
      this.classList.toggle('hamburger-active')
      UI.elements.menu.classList.toggle('active')
    })

    // Cerrar el menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
      if (!this.elements.hamburgerButton.contains(event.target) &&
          !this.elements.menu.contains(event.target)) {
        this.elements.hamburgerButton.classList.remove('hamburger-active')
        this.elements.menu.classList.remove('active')
      }
    })

    const profileLink = this.elements.menu.querySelector('a:first-child')
    const logoutLink = this.elements.menu.querySelector('a.logout')

    if (profileLink) {
      profileLink.addEventListener('click', (e) => {
        e.preventDefault()
        console.log('Dirigiendo al perfil del usuario')
        // Implementar navegación al perfil
      })
    }

    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault()
        TaskAPI.logout()
      })
    }
  },

  // Métodos para manejar el estado visual
  toggleLoading (show) {
    if (show) {
      this.elements.loadingContainer.style.display = 'flex'
      this.elements.taskTable.style.display = 'none'
      this.elements.noResultsMessage.style.display = 'none'
      this.elements.noTasksMessage.style.display = 'none'
    } else {
      this.elements.loadingContainer.style.display = 'none'
    }
  },

  toggleNoResults (show) {
    if (show) {
      this.elements.noResultsMessage.style.display = 'flex'
      this.elements.taskTable.style.display = 'none'
      this.elements.noTasksMessage.style.display = 'none'
    } else {
      this.elements.noResultsMessage.style.display = 'none'
    }
  },

  toggleNoTasks (show) {
    if (show) {
      this.elements.noTasksMessage.style.display = 'flex'
      this.elements.taskTable.style.display = 'none'
      this.elements.noResultsMessage.style.display = 'none'
    } else {
      this.elements.noTasksMessage.style.display = 'none'
    }
  },

  showTable () {
    this.elements.taskTable.style.display = 'table'
    this.elements.noResultsMessage.style.display = 'none'
    this.elements.noTasksMessage.style.display = 'none'
  },

  toggleSaveButtonLoading (show) {
    if (show) {
      this.elements.saveButton.classList.add('loading')
    } else {
      this.elements.saveButton.classList.remove('loading')
    }
  },

  // Métodos para manipular el modal
  openModal (title = 'Nueva Tarea', taskData = null) {
    document.getElementById('modalTitle').textContent = title
    this.state.editingTaskId = null

    if (taskData) {
      document.getElementById('taskTitle').value = taskData.title || ''
      document.getElementById('taskDescription').value = taskData.description || ''
      document.getElementById('taskStatus').value = taskData.completed ? 'Completada' : 'Pendiente'

      if (taskData.id) {
        this.state.editingTaskId = taskData.id
      }
    } else {
      this.elements.taskForm.reset()
    }

    this.elements.modal.classList.add('active')
  },

  closeModal () {
    this.elements.modal.classList.remove('active')
    this.elements.saveButton.classList.remove('loading')
  },

  // Métodos para manipular tareas
  renderTasks (tasks) {
    this.elements.tableBody.innerHTML = ''

    if (!tasks || tasks.length === 0) {
      this.toggleNoTasks(true)
      return
    }

    this.showTable()

    tasks.forEach(task => {
      const row = this.createTaskRow(task)
      this.elements.tableBody.appendChild(row)
    })
  },

  createTaskRow (task) {
    const row = document.createElement('tr')
    const isCompleted = task.status === 'Completada'

    row.innerHTML = `
      <td><input type="checkbox" class="task-status" ${isCompleted ? 'checked' : ''}></td>
      <td>${task.title}</td>
      <td>${task.description || ''}</td>
      <td class="actions-cell">
        <button class="options-button"><i class="bi bi-three-dots"></i></button>
        <div class="actions-menu">
          <div class="action-item edit-action">
            <i class="bi bi-pencil"></i> Editar
          </div>
          <div class="action-item delete-action">
            <i class="bi bi-trash"></i> Eliminar
          </div>
        </div>
      </td>
    `

    if (isCompleted) {
      row.style.color = '#7f8c8d'
    }

    this.setupTaskRowEvents(row, task)
    return row
  },

  setupTaskRowEvents (row, task) {
    const optionsButton = row.querySelector('.options-button')
    const actionsMenu = row.querySelector('.actions-menu')

    // Botón de opciones
    optionsButton.addEventListener('click', function (e) {
      e.stopPropagation()
      actionsMenu.style.transform = 'translate(-80%)'
      actionsMenu.classList.toggle('active')
    })

    // Acción de editar
    const editAction = row.querySelector('.edit-action')
    editAction.addEventListener('click', () => {
      actionsMenu.classList.remove('active')
      this.openModal('Editar Tarea', {
        title: task.title,
        description: task.description || '',
        completed: task.status === 'Completada',
        id: task._id || task.id
      })
    })

    // Acción de eliminar
    const deleteAction = row.querySelector('.delete-action')
    deleteAction.addEventListener('click', () => {
      actionsMenu.classList.remove('active')
      if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        App.deleteTask(task._id || task.id)
      }
    })

    // Cambio de estado (checkbox)
    const statusCheckbox = row.querySelector('.task-status')
    statusCheckbox.addEventListener('change', function () {
      const newStatus = this.checked ? 'Completada' : 'Pendiente'
      App.updateTaskStatus(task._id || task.id, newStatus)

      if (this.checked) {
        row.style.color = '#7f8c8d'
      } else {
        row.style.textDecoration = 'none'
        row.style.color = ''
      }
    })
  },

  // Métodos para el formulario
  handleFormSubmit (e) {
    e.preventDefault()
    this.toggleSaveButtonLoading(true)

    const taskData = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      status: document.getElementById('taskStatus').value
    }

    // Validación básica
    if (!taskData.title || taskData.title.trim() === '') {
      window.alert('El título es obligatorio')
      this.toggleSaveButtonLoading(false)
      return
    }

    if (this.state.editingTaskId) {
      App.updateTask(this.state.editingTaskId, taskData)
    } else {
      App.createTask(taskData)
    }
  },

  // Buscar tareas
  searchTasks (searchTerm) {
    if (this.elements.taskTable.style.display === 'none' &&
        this.elements.noTasksMessage.style.display === 'flex' &&
        searchTerm) {
      this.toggleNoTasks(false)
      this.toggleNoResults(true)
      return
    }

    if (!searchTerm && this.elements.noResultsMessage.style.display === 'flex') {
      this.toggleNoResults(false)
      const hasRows = this.elements.tableBody.querySelectorAll('tr').length > 0

      if (!hasRows) {
        this.toggleNoTasks(true)
      } else {
        this.showTable()
      }
      return
    }

    const rows = document.querySelectorAll('.task-table tbody tr')
    let matchFound = false

    rows.forEach(row => {
      const title = row.cells[1].textContent.toLowerCase()
      const description = row.cells[2].textContent.toLowerCase()

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        row.style.display = ''
        matchFound = true
      } else {
        row.style.display = 'none'
      }
    })

    if (!matchFound && searchTerm) {
      this.toggleNoTasks(false)
      this.toggleNoResults(true)
    } else if (matchFound) {
      this.toggleNoResults(false)
      this.toggleNoTasks(false)
      this.showTable()
    } else if (!searchTerm) {
      this.toggleNoResults(false)

      if (rows.length === 0) {
        this.toggleNoTasks(true)
      } else {
        this.showTable()
      }
    }
  }
}
