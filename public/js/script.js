import { API_BASE_URL } from './config.js'
import { sortTasks } from '../utils/sortTasks.js'

document.addEventListener('DOMContentLoaded', function () {
  const authToken = getCookie('authToken')
  const userId = getCookie('userId')
  if (!authToken) {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.href = './login.html'
    return
  }

  const hamburgerButton = document.getElementById('hamburgerButton')
  const menu = document.getElementById('menu')

  if (hamburgerButton && menu) {
    hamburgerButton.addEventListener('click', function () {
      this.classList.toggle('hamburger-active')
      menu.classList.toggle('active')
    })

    // Cerrar el menú al hacer clic fuera de él
    document.addEventListener('click', function (event) {
      if (!hamburgerButton.contains(event.target) && !menu.contains(event.target)) {
        hamburgerButton.classList.remove('hamburger-active')
        menu.classList.remove('active')
      }
    })

    const profileLink = menu.querySelector('a:first-child')
    const logoutLink = menu.querySelector('a.logout')

    if (profileLink) {
      profileLink.addEventListener('click', function (e) {
        e.preventDefault()
        console.log('Dirigiendo al perfil del usuario')
        // Aquí iría la lógica para ir al perfil
      })
    }

    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault()
        logout()
      })
    }
  }

  function logout () {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    window.location.href = './login.html'
  }

  function getApiUrl (endpoint = '/tasks', id = '') {
    if (id) {
      return `${API_BASE_URL}${endpoint}/${id}`
    }
    return `${API_BASE_URL}${endpoint}`
  }

  function getAuthHeaders () {
    return {
      'Content-Type': 'application/json',
      token: authToken,
      user_id: userId
    }
  }

  const modal = document.getElementById('taskModal')
  const btnAddTask = document.getElementById('btnAddTask')
  const btnAddTaskEmpty = document.getElementById('btnAddTaskEmpty')
  const btnCloseModal = document.getElementById('btnCloseModal')
  const btnCancelTask = document.getElementById('btnCancelTask')
  const searchBar = document.querySelector('.search-bar input')
  const searchButton = document.querySelector('.search-bar button')
  const taskForm = document.getElementById('taskForm')
  const saveButton = document.getElementById('btnSaveTask')

  const loadingContainer = document.querySelector('.loading-container')
  const noResultsMessage = document.querySelector('.no-results')
  const noTasksMessage = document.querySelector('.no-tasks')
  const tableBody = document.querySelector('.task-table tbody')
  const taskTable = document.querySelector('.task-table')

  let editingTaskId = null

  function toggleLoading (show) {
    if (show) {
      loadingContainer.style.display = 'flex'
      taskTable.style.display = 'none'
      noResultsMessage.style.display = 'none'
      noTasksMessage.style.display = 'none'
    } else {
      loadingContainer.style.display = 'none'
      taskTable.style.display = 'table'
    }
  }

  function toggleNoResults (show) {
    if (show) {
      noResultsMessage.style.display = 'flex'
      taskTable.style.display = 'none'
      noTasksMessage.style.display = 'none'
    } else {
      noResultsMessage.style.display = 'none'
    }
  }

  function toggleNoTasks (show) {
    if (show) {
      noTasksMessage.style.display = 'flex'
      taskTable.style.display = 'none'
      noResultsMessage.style.display = 'none'
    } else {
      noTasksMessage.style.display = 'none'
    }
  }

  function loadTasksFromAPI () {
    const apiUrl = getApiUrl('/tasks')

    toggleLoading(true)

    fetch(apiUrl, {
      headers: getAuthHeaders()
    })
      .then(response => {
        if (response.status === 401) {
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.href = './login.html'
          throw new Error('Sesión expirada o inválida')
        }
        return response.json().then(data => {
          if (data && data.message === 'No tasks found') {
            return { noTasks: true, data }
          }
          if (!response.ok) {
            throw new Error('Error en la respuesta de la API')
          }
          return { noTasks: false, data }
        })
      })
      .then(result => {
        toggleLoading(false)

        tableBody.innerHTML = ''

        if (result.noTasks) {
          toggleNoResults(false)
          toggleNoTasks(true)
          return
        }

        const data = result.data

        if (!Array.isArray(data) || data.length === 0) {
          toggleNoResults(false)
          toggleNoTasks(true)
          return
        }

        toggleNoResults(false)
        toggleNoTasks(false)
        taskTable.style.display = 'table'

        const sortedTasks = sortTasks(data)
        sortedTasks.forEach(task => {
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

          tableBody.appendChild(row)

          if (isCompleted) {
            row.style.color = '#7f8c8d'
          }

          const optionsButton = row.querySelector('.options-button')
          const actionsMenu = row.querySelector('.actions-menu')

          optionsButton.addEventListener('click', function (e) {
            e.stopPropagation()

            actionsMenu.style.transform = 'translate(-80%)'
            actionsMenu.classList.toggle('active')
          })

          const editAction = row.querySelector('.edit-action')
          editAction.addEventListener('click', function () {
            actionsMenu.classList.remove('active')
            openModal('Editar Tarea', {
              title: task.title,
              description: task.description || '',
              completed: isCompleted,
              id: task._id || task.id
            })
          })

          const deleteAction = row.querySelector('.delete-action')
          deleteAction.addEventListener('click', function () {
            actionsMenu.classList.remove('active')
            if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
              deleteTask(task._id || task.id)
            }
          })

          const statusCheckbox = row.querySelector('.task-status')
          statusCheckbox.addEventListener('change', function () {
            updateTaskStatus(task._id || task.id, this.checked ? 'Completada' : 'Pendiente')

            if (this.checked) {
              row.style.color = '#7f8c8d'
            } else {
              row.style.textDecoration = 'none'
              row.style.color = ''
            }
          })
        })
      })
      .catch(error => {
        toggleLoading(false)
        console.error('Error al cargar tareas:', error)
        window.alert('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.')
      })
  }

  document.addEventListener('click', function () {
    document.querySelectorAll('.actions-menu.active').forEach(menu => {
      menu.classList.remove('active')
    })
  })

  function deleteTask (taskId) {
    const apiUrl = getApiUrl('/tasks', taskId)
    toggleLoading(true)

    fetch(apiUrl, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(response => {
        if (response.status === 401) {
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.href = './login.html'
          throw new Error('Sesión expirada o inválida')
        }
        if (!response.ok) {
          throw new Error('Error al eliminar la tarea')
        }
        loadTasksFromAPI()
      })
      .catch(error => {
        toggleLoading(false)
        console.error('Error al eliminar la tarea:', error)
        window.alert('No se pudo eliminar la tarea. Por favor, intenta de nuevo.')
      })
  }

  function updateTaskStatus (taskId, newStatus) {
    const apiUrl = getApiUrl('/tasks', taskId)

    fetch(apiUrl, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    })
      .then(response => {
        if (response.status === 401) {
        // Eliminar ambas cookies
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.href = './login.html'
          throw new Error('Sesión expirada o inválida')
        }
        if (!response.ok) {
          throw new Error('Error al actualizar el estado de la tarea')
        }
        return response.json()
      })
      .then(data => {
        loadTasksFromAPI()
      })
      .catch(error => {
        console.error('Error al actualizar la tarea:', error)
        window.alert('No se pudo actualizar el estado de la tarea. Por favor, intenta de nuevo.')
      })
  }

  function openModal (title = 'Nueva Tarea', taskData = null) {
    document.getElementById('modalTitle').textContent = title

    editingTaskId = null

    if (taskData) {
      document.getElementById('taskTitle').value = taskData.title || ''
      document.getElementById('taskDescription').value = taskData.description || ''
      document.getElementById('taskStatus').value = taskData.completed ? 'Completada' : 'Pendiente'

      if (taskData.id) {
        editingTaskId = taskData.id
      }
    } else {
      taskForm.reset()
    }

    modal.classList.add('active')
  }

  function closeModal () {
    modal.classList.remove('active')
    saveButton.classList.remove('loading')
  }

  function toggleSaveButtonLoading (show) {
    if (show) {
      saveButton.classList.add('loading')
    } else {
      saveButton.classList.remove('loading')
    }
  }

  btnAddTask.addEventListener('click', function () {
    openModal('Nueva Tarea')
  })

  if (btnAddTaskEmpty) {
    btnAddTaskEmpty.addEventListener('click', function () {
      openModal('Nueva Tarea')
    })
  }

  btnCloseModal.addEventListener('click', closeModal)
  btnCancelTask.addEventListener('click', closeModal)

  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal()
    }
  })

  taskForm.addEventListener('submit', function (e) {
    e.preventDefault()

    toggleSaveButtonLoading(true)

    const taskData = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      status: document.getElementById('taskStatus').value
    }

    if (editingTaskId) {
      fetch(getApiUrl('/tasks', editingTaskId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })
        .then(response => {
          if (response.status === 401) {
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            window.location.href = './login.html'
            throw new Error('Sesión expirada o inválida')
          }
          if (!response.ok) {
            throw new Error('Error al actualizar la tarea')
          }
          closeModal()
          loadTasksFromAPI()
          editingTaskId = null
        })
        .catch(error => {
          toggleSaveButtonLoading(false)
          console.error('Error al actualizar la tarea:', error)
          window.alert('No se pudo actualizar la tarea. Por favor, intenta de nuevo.')
        })
    } else {
      fetch(getApiUrl('/tasks'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...taskData,
          userId: parseInt(userId) || userId
        })
      })
        .then(response => {
          if (response.status === 401) {
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            window.location.href = './login.html'
            throw new Error('Sesión expirada o inválida')
          }
          if (!response.ok) {
            throw new Error('Error al crear la tarea')
          }
          closeModal()
          loadTasksFromAPI()
        })
        .catch(error => {
          toggleSaveButtonLoading(false)
          console.error('Error al crear la tarea:', error)
          window.alert('No se pudo crear la tarea. Por favor, intenta de nuevo.')
        })
    }
  })

  searchButton.addEventListener('click', function () {
    const searchTerm = searchBar.value.toLowerCase()
    searchTasks(searchTerm)
  })

  searchBar.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      const searchTerm = searchBar.value.toLowerCase()
      searchTasks(searchTerm)
    }
  })

  function searchTasks (searchTerm) {
    if (taskTable.style.display === 'none' && noTasksMessage.style.display === 'flex' && searchTerm) {
      toggleNoTasks(false)
      toggleNoResults(true)
      return
    }

    if (!searchTerm && noResultsMessage.style.display === 'flex') {
      toggleNoResults(false)
      const hasRows = tableBody.querySelectorAll('tr').length > 0
      if (!hasRows) {
        toggleNoTasks(true)
      } else {
        taskTable.style.display = 'table'
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
      toggleNoTasks(false)
      toggleNoResults(true)
    } else if (matchFound) {
      toggleNoResults(false)
      toggleNoTasks(false)
      taskTable.style.display = 'table'
    } else if (!searchTerm) {
      toggleNoResults(false)

      if (rows.length === 0) {
        toggleNoTasks(true)
      } else {
        taskTable.style.display = 'table'
      }
    }
  }

  function getCookie (name) {
    const cookieArr = document.cookie.split(';')

    for (let i = 0; i < cookieArr.length; i++) {
      const cookiePair = cookieArr[i].split('=')
      const cookieName = cookiePair[0].trim()

      if (cookieName === name) {
        return decodeURIComponent(cookiePair[1])
      }
    }
    return null
  }
  loadTasksFromAPI()
})
