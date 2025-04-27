import { API_BASE_URL } from '../js/config.js'

document.addEventListener('DOMContentLoaded', function () {
  // Verificar si existe el token, si no, redirigir al login
  const authToken = getCookie('authToken')
  const userId = getCookie('userId')
  if (!authToken) {
  // Eliminar ambas cookies antes de redirigir
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.href = './login.html'
    return
  }

  // Función para construir URLs específicas de la API
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

  // Referencias a elementos del DOM
  const modal = document.getElementById('taskModal')
  const btnAddTask = document.getElementById('btnAddTask')
  const btnAddTaskEmpty = document.getElementById('btnAddTaskEmpty')
  const btnCloseModal = document.getElementById('btnCloseModal')
  const btnCancelTask = document.getElementById('btnCancelTask')
  const searchBar = document.querySelector('.search-bar input')
  const searchButton = document.querySelector('.search-bar button')
  const taskForm = document.getElementById('taskForm')
  const saveButton = document.getElementById('btnSaveTask')

  // Referencias a los estados de carga y mensajes
  const loadingContainer = document.querySelector('.loading-container')
  const noResultsMessage = document.querySelector('.no-results')
  const noTasksMessage = document.querySelector('.no-tasks')
  const tableBody = document.querySelector('.task-table tbody')
  const taskTable = document.querySelector('.task-table')

  let editingTaskId = null

  // Función para mostrar/ocultar el estado de carga
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

  // Función para mostrar/ocultar el mensaje de no resultados
  function toggleNoResults (show) {
    if (show) {
      noResultsMessage.style.display = 'flex'
      taskTable.style.display = 'none'
      noTasksMessage.style.display = 'none' // Asegurar que el otro mensaje esté oculto
    } else {
      noResultsMessage.style.display = 'none'
    // No mostramos automáticamente la tabla aquí, eso lo decide la función que llama
    }
  }

  // Función para mostrar/ocultar el mensaje de no tareas
  function toggleNoTasks (show) {
    if (show) {
      noTasksMessage.style.display = 'flex'
      taskTable.style.display = 'none'
      noResultsMessage.style.display = 'none' // Asegurar que el otro mensaje esté oculto
    } else {
      noTasksMessage.style.display = 'none'
    // No mostramos automáticamente la tabla aquí, eso lo decide la función que llama
    }
  }

  // Función para cargar las tareas desde la API
  function loadTasksFromAPI () {
    const apiUrl = getApiUrl('/tasks')

    // Mostrar estado de carga
    toggleLoading(true)

    // Hacer la petición fetch con el token de autorización
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
        // Primero verificamos si hay un mensaje "No tasks found"
          if (data && data.message === 'No tasks found') {
          // Este es un caso válido, no un error
            return { noTasks: true, data }
          }
          // Si la respuesta no está OK y no es el mensaje esperado, es un error
          if (!response.ok) {
            throw new Error('Error en la respuesta de la API')
          }
          // Devolvemos los datos para el siguiente then
          return { noTasks: false, data }
        })
      })
      // En la parte de la función loadTasksFromAPI donde verificamos si no hay tareas:
      .then(result => {
        // Ocultar estado de carga
        toggleLoading(false)

        // Limpiar tabla existente
        tableBody.innerHTML = ''

        // Si recibimos el mensaje de no tareas, mostramos la UI correspondiente
        if (result.noTasks) {
          toggleNoResults(false) // Asegurarse que el mensaje de búsqueda esté oculto
          toggleNoTasks(true) // Mostrar mensaje de no tareas
          return
        }

        const data = result.data

        // Verificar si hay tareas (array vacío)
        if (!Array.isArray(data) || data.length === 0) {
          toggleNoResults(false) // Asegurarse que el mensaje de búsqueda esté oculto
          toggleNoTasks(true) // Mostrar mensaje de no tareas
          return
        }

        // Si llegamos aquí hay tareas, ocultar ambos mensajes y mostrar la tabla
        toggleNoResults(false)
        toggleNoTasks(false)
        taskTable.style.display = 'table'

        // El resto del código para llenar la tabla...

        // Llenar la tabla con los datos de la API
        data.forEach(task => {
          const row = document.createElement('tr')

          // Determinar si la tarea está completada
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

            // Cerrar todos los demás menús abiertos primero
            document.querySelectorAll('.actions-menu.active').forEach(menu => {
              if (menu !== actionsMenu) {
                menu.classList.remove('active')
              }
            })

            // Alternar el menú actual
            actionsMenu.classList.toggle('active')
          })

          // Evento para editar
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

          // Evento para eliminar
          const deleteAction = row.querySelector('.delete-action')
          deleteAction.addEventListener('click', function () {
            actionsMenu.classList.remove('active')
            if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
              deleteTask(task._id || task.id)
            }
          })

          // Evento para el checkbox de estado
          const statusCheckbox = row.querySelector('.task-status')
          statusCheckbox.addEventListener('change', function () {
            updateTaskStatus(task._id || task.id, this.checked ? 'Completada' : 'Pendiente')

            // Actualizar estilo visual
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
      // Ocultar estado de carga y mostrar mensaje de error
        toggleLoading(false)
        console.error('Error al cargar tareas:', error)
        window.alert('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.')
      })
  }

  // Evento para cerrar menús al hacer clic en cualquier parte del documento
  document.addEventListener('click', function () {
    document.querySelectorAll('.actions-menu.active').forEach(menu => {
      menu.classList.remove('active')
    })
  })

  // Función para eliminar una tarea
  function deleteTask (taskId) {
    const apiUrl = getApiUrl('/tasks', taskId)

    // Mostrar estado de carga
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
        // Ocultar estado de carga
        toggleLoading(false)
        console.error('Error al eliminar la tarea:', error)
        window.alert('No se pudo eliminar la tarea. Por favor, intenta de nuevo.')
      })
  }

  // Función para actualizar el estado de una tarea
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
        return response.json() // Esperar a que se complete la promesa
      })
      .then(data => {
      // Recargar todas las tareas para asegurar que tenemos los datos actualizados
        loadTasksFromAPI()
      })
      .catch(error => {
        console.error('Error al actualizar la tarea:', error)
        window.alert('No se pudo actualizar el estado de la tarea. Por favor, intenta de nuevo.')
      })
  }

  // Función para abrir el modal
  function openModal (title = 'Nueva Tarea', taskData = null) {
    document.getElementById('modalTitle').textContent = title

    // Resetear el ID de edición
    editingTaskId = null

    // Si hay datos de tarea, llenar el formulario
    if (taskData) {
      document.getElementById('taskTitle').value = taskData.title || ''
      document.getElementById('taskDescription').value = taskData.description || ''
      document.getElementById('taskStatus').value = taskData.completed ? 'Completada' : 'Pendiente'

      // Si tiene ID, estamos editando una tarea existente
      if (taskData.id) {
        editingTaskId = taskData.id
      }
    } else {
      // Limpiar el formulario
      taskForm.reset()
    }

    modal.classList.add('active')
  }

  // Función para cerrar el modal
  function closeModal () {
    modal.classList.remove('active')
    // Asegurarse de quitar la clase loading del botón de guardar
    saveButton.classList.remove('loading')
  }

  // Función para mostrar/ocultar el estado de carga en el botón de guardar
  function toggleSaveButtonLoading (show) {
    if (show) {
      saveButton.classList.add('loading')
    } else {
      saveButton.classList.remove('loading')
    }
  }

  // Manejador de eventos para abrir modal para nueva tarea
  btnAddTask.addEventListener('click', function () {
    openModal('Nueva Tarea')
  })

  // También permitir abrir el modal desde el mensaje de "no hay tareas"
  if (btnAddTaskEmpty) {
    btnAddTaskEmpty.addEventListener('click', function () {
      openModal('Nueva Tarea')
    })
  }

  // Manejadores de eventos para cerrar el modal
  btnCloseModal.addEventListener('click', closeModal)
  btnCancelTask.addEventListener('click', closeModal)

  // Cerrar el modal al hacer clic fuera del contenido
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal()
    }
  })

  // Prevenir envío del formulario y procesarlo
  taskForm.addEventListener('submit', function (e) {
    e.preventDefault()

    // Mostrar estado de carga en el botón
    toggleSaveButtonLoading(true)

    // Obtener valores del formulario
    const taskData = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      status: document.getElementById('taskStatus').value
    }

    if (editingTaskId) {
      // Si estamos editando, enviamos un PATCH
      fetch(getApiUrl('/tasks', editingTaskId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })
        .then(response => {
          if (response.status === 401) {
            // Token inválido o expirado, redirigir al login
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
      // Si es una nueva tarea, enviamos un POST
      fetch(getApiUrl('/tasks'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...taskData,
          userId: parseInt(userId) || userId // Convertir a número si es posible
        })
      })
        .then(response => {
          if (response.status === 401) {
            // Token inválido o expirado, redirigir al login
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            window.location.href = './login.html'
            throw new Error('Sesión expirada o inválida')
          }
          if (!response.ok) {
            throw new Error('Error al crear la tarea')
          }
          closeModal()
          // Recargar las tareas para incluir la nueva
          loadTasksFromAPI()
        })
        .catch(error => {
          toggleSaveButtonLoading(false)
          console.error('Error al crear la tarea:', error)
          window.alert('No se pudo crear la tarea. Por favor, intenta de nuevo.')
        })
    }
  })

  // Funcionalidad de búsqueda
  searchButton.addEventListener('click', function () {
    const searchTerm = searchBar.value.toLowerCase()
    searchTasks(searchTerm)
  })

  // También realizar búsqueda al presionar Enter
  searchBar.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      const searchTerm = searchBar.value.toLowerCase()
      searchTasks(searchTerm)
    }
  })

  // Función para filtrar tareas en la tabla según término de búsqueda
  function searchTasks (searchTerm) {
  // Si no hay tareas en la tabla (está oculta y noTasks visible),
  // pero estamos buscando algo, debemos mostrar el mensaje de no resultados en lugar de no tareas
    if (taskTable.style.display === 'none' && noTasksMessage.style.display === 'flex' && searchTerm) {
      toggleNoTasks(false)
      toggleNoResults(true)
      return
    }

    // Si no hay término de búsqueda y no hay tareas, volvemos a mostrar el mensaje original
    if (!searchTerm && noResultsMessage.style.display === 'flex') {
      toggleNoResults(false)
      // Verificamos si realmente no hay tareas cargadas
      const hasRows = tableBody.querySelectorAll('tr').length > 0
      if (!hasRows) {
        toggleNoTasks(true)
      } else {
      // Si hay filas, mostrar la tabla
        taskTable.style.display = 'table'
      }
      return
    }

    // Búsqueda normal cuando hay tareas en la tabla
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

    // Mostrar mensaje apropiado según resultados de búsqueda
    if (!matchFound && searchTerm) {
      toggleNoTasks(false) // Ocultar mensaje de no tareas si estaba visible
      toggleNoResults(true) // Mostrar mensaje de no coincidencias
    } else if (matchFound) {
      toggleNoResults(false) // Ocultar mensaje de no coincidencias
      toggleNoTasks(false) // Ocultar mensaje de no tareas
      taskTable.style.display = 'table' // Mostrar la tabla con las coincidencias
    } else if (!searchTerm) {
    // Si no hay término de búsqueda, restablecer vista normal
      toggleNoResults(false)

      // Si no hay tareas, mostrar ese mensaje
      if (rows.length === 0) {
        toggleNoTasks(true)
      } else {
        taskTable.style.display = 'table'
      }
    }
  }

  // Función auxiliar para obtener una cookie por su nombre
  function getCookie (name) {
    const cookieArr = document.cookie.split(';')

    for (let i = 0; i < cookieArr.length; i++) {
      const cookiePair = cookieArr[i].split('=')
      const cookieName = cookiePair[0].trim()

      if (cookieName === name) {
        return decodeURIComponent(cookiePair[1])
      }
    }

    // Si no se encuentra la cookie, devolver null
    return null
  }

  // Iniciar carga de tareas al cargar la página
  loadTasksFromAPI()
})
