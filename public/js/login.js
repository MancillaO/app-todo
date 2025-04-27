import { API_BASE_URL } from './config.js'

document.addEventListener('DOMContentLoaded', function () {
  checkExistingSession()

  const togglePassword = document.getElementById('togglePassword')
  const passwordField = document.getElementById('password')

  togglePassword.addEventListener('click', function () {
    const isPasswordHidden = passwordField.type === 'password'
    passwordField.type = isPasswordHidden ? 'text' : 'password'

    this.classList.toggle('active', isPasswordHidden)
  })

  const loginForm = document.querySelector('.login-form')

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    const existingError = document.querySelector('.error-message-container')
    if (existingError) {
      existingError.remove()
    }

    const usuario = loginForm.querySelector('input[name="usuario"]').value
    const contrasena = loginForm.querySelector('input[name="contrasena"]').value

    const datosUsuario = {
      username: usuario,
      password: contrasena
    }
    const apiUrl = `${API_BASE_URL}/auth/login`

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosUsuario)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor')
        }
        return response.json()
      })
      .then(data => {
        console.log('Login exitoso:', data)

        if (data.token) {
          const expirationDate = new Date()
          expirationDate.setTime(expirationDate.getTime() + 60 * 60 * 1000) // 1 hora

          document.cookie = `authToken=${data.token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`

          if (data.userData && data.userData.id) {
            document.cookie = `userId=${data.userData.id}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`
          }
        }
        window.location.href = './home.html'
      })
      .catch(error => {
        console.error('Error al iniciar sesión:', error)

        const errorContainer = document.createElement('div')
        errorContainer.classList.add('error-message-container')
        errorContainer.textContent = 'Error al iniciar sesión. Por favor, verifica tus credenciales.'

        const formTitle = loginForm.querySelector('h2')
        loginForm.insertBefore(errorContainer, formTitle.nextElementSibling)
      })
  })

  function checkExistingSession () {
    const token = getCookie('authToken')
    if (token) {
      window.location.href = './home.html'
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
})
