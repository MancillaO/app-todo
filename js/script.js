document.addEventListener('DOMContentLoaded', function () {
  // URL base de la API - aquí podrías integrar con variables de entorno
  const API_BASE_URL = 'http://localhost:3000'

  // Función para construir URLs específicas de la API
  function getApiUrl (endpoint = '/tasks', id = '') {
    if (id) {
      return `${API_BASE_URL}${endpoint}/${id}`
    }
    return `${API_BASE_URL}${endpoint}`
  }

  // Referencias a elementos del DOM
  const modal = document.getElementById('taskModal')
  const btnAddTask = document.getElementById('btnAddTask')
  const btnCloseModal = document.getElementById('btnCloseModal')
  const btnCancelTask = document.getElementById('btnCancelTask')
  const searchBar = document.querySelector('.search-bar input')
  const searchButton = document.querySelector('.search-bar button')
  const taskForm = document.getElementById('taskForm')

  let editingTaskId = null

  // Función para cargar las tareas desde la API
  function loadTasksFromAPI () {
    const apiUrl = getApiUrl('/tasks')

    // Hacer la petición fetch
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          console.log('')

          throw new Error('Error en la respuesta de la API')
        }
        return response.json()
      })
      .then(tasks => {
        // Limpiar tabla existente
        const tableBody = document.querySelector('.task-table tbody')
        tableBody.innerHTML = ''

        // Llenar la tabla con los datos de la API
        tasks.forEach(task => {
          const row = document.createElement('tr')

          // Determinar si la tarea está completada
          const isCompleted = task.status === 'completada'

          row.innerHTML = `
            <td><input type="checkbox" class="task-status" ${isCompleted ? 'checked' : ''}></td>
            <td>${task.title}</td>
            <td>${task.description || ''}</td>
            <td class="action-buttons">
              <button class="edit-button">Editar</button>
            </td>
            <td>
              <button class="delete-button">Eliminar</button>
            </td>
          `

          tableBody.appendChild(row)

          if (isCompleted) {
            row.style.color = '#7f8c8d'
          }

          // Asignar eventos a los botones de la nueva fila
          const editButton = row.querySelector('.edit-button')
          editButton.addEventListener('click', function () {
            openModal('Editar Tarea', {
              title: task.title,
              description: task.description || '',
              completed: isCompleted,
              id: task._id // Guardar el ID para poder actualizar la tarea
            })
          })

          const deleteButton = row.querySelector('.delete-button')
          deleteButton.addEventListener('click', function () {
            if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
              deleteTask(task._id)
            }
          })

          // Evento para el checkbox de estado
          const statusCheckbox = row.querySelector('.task-status')
          statusCheckbox.addEventListener('change', function () {
            updateTaskStatus(task._id, this.checked ? 'completada' : 'pendiente')

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
        console.error('Error al cargar tareas:', error)
        // Opcional: mostrar mensaje de error al usuario
        window.alert('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.')
      })
  }

  // Función para eliminar una tarea
  function deleteTask (taskId) {
    const apiUrl = getApiUrl('/tasks', taskId)

    fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al eliminar la tarea')
        }
        loadTasksFromAPI()
      })
      .catch(error => {
        console.error('Error al eliminar la tarea:', error)
        window.alert('No se pudo eliminar la tarea. Por favor, intenta de nuevo.')
      })
  }

  // Función para actualizar el estado de una tarea
  function updateTaskStatus (taskId, newStatus) {
    const apiUrl = getApiUrl('/tasks', taskId)

    fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al actualizar el estado de la tarea')
        }
      })
      .catch(error => {
        console.error('Error al actualizar la tarea:', error)
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
      document.getElementById('taskStatus').value = taskData.completed ? 'completed' : 'pending'

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
  }

  // Manejador de eventos para abrir modal para nueva tarea
  btnAddTask.addEventListener('click', function () {
    openModal('Nueva Tarea')
  })

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

    // Obtener valores del formulario
    const taskData = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      status: document.getElementById('taskStatus').value
    }

    if (editingTaskId) {
      // Si estamos editando, enviamos un PUT/PATCH
      fetch(getApiUrl('/tasks', editingTaskId), {
        method: 'PUT', // O PATCH, dependiendo de tu API
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al actualizar la tarea')
          }
          closeModal()
          loadTasksFromAPI()
          editingTaskId = null
        })
        .catch(error => {
          console.error('Error al actualizar la tarea:', error)
          window.alert('No se pudo actualizar la tarea. Por favor, intenta de nuevo.')
        })
    } else {
      // Si es una nueva tarea, enviamos un POST
      fetch(getApiUrl('/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al crear la tarea')
          }
          closeModal()
          // Recargar las tareas para incluir la nueva
          loadTasksFromAPI()
        })
        .catch(error => {
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
    const rows = document.querySelectorAll('.task-table tbody tr')

    rows.forEach(row => {
      const title = row.cells[1].textContent.toLowerCase()
      const description = row.cells[2].textContent.toLowerCase()

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        row.style.display = ''
      } else {
        row.style.display = 'none'
      }
    })
  }

  loadTasksFromAPI()
})
