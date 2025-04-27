// Asegúrate de tener este archivo o ajustar la ruta de importación
import { API_BASE_URL } from './config.js' // Ajusta la ruta si es necesario

console.log(API_BASE_URL)

document.addEventListener('DOMContentLoaded', function () {
  const togglePassword = document.getElementById('togglePassword')
  const passwordField = document.getElementById('password')

  togglePassword.addEventListener('click', function () {
    const isPasswordHidden = passwordField.type === 'password'
    passwordField.type = isPasswordHidden ? 'text' : 'password'

    this.classList.toggle('active', isPasswordHidden)
  })

  const registerForm = document.querySelector('.login-form')

  if (registerForm) {
    registerForm.addEventListener('submit', function (event) {
      event.preventDefault()

      const existingError = registerForm.querySelector('.error-message-container')
      if (existingError) {
        existingError.remove()
      }
      const existingSuccess = registerForm.querySelector('.success-message-container')
      if (existingSuccess) {
        existingSuccess.remove()
      }

      const usuario = registerForm.querySelector('input[name="usuario"]').value
      const email = registerForm.querySelector('input[name="email"]').value
      const contrasena = registerForm.querySelector('input[name="contrasena"]').value

      const datosRegistro = {
        username: usuario,
        email,
        password: contrasena
      }

      const registerApiUrl = `${API_BASE_URL}/users`

      fetch(registerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosRegistro)
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errData => {
              throw new Error(errData.message || 'Error en el registro. Verifica los datos.')
            }).catch(() => {
              throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
            })
          }
          return response.json()
        })
        .then(registrationData => {
          console.log('Registro exitoso:', registrationData)

          const loginApiUrl = `${API_BASE_URL}/auth/login`

          const datosLogin = {
            username: usuario,
            password: contrasena
          }

          return fetch(loginApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosLogin)
          })
        })
        .then(loginResponse => {
          if (!loginResponse.ok) {
            throw new Error('Registro exitoso, pero fallo al iniciar sesión automáticamente.')
          }
          return loginResponse.json()
        })
        .then(loginData => {
          console.log('Auto-Login exitoso:', loginData)

          if (loginData.token) {
            const expirationDate = new Date()
            expirationDate.setTime(expirationDate.getTime() + 60 * 60 * 1000)

            document.cookie = `authToken=${loginData.token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`

            if (loginData.userData && loginData.userData.id) {
              document.cookie = `userId=${loginData.userData.id}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`
            }
            window.location.href = './home.html'
          } else {
            throw new Error('Registro exitoso, pero no se recibió token de sesión.')
          }
        })
        .catch(error => {
          console.error('Error en el proceso:', error)

          const errorContainer = document.createElement('div')
          errorContainer.classList.add('error-message-container')
          errorContainer.textContent = error.message || 'Ocurrió un error. Por favor, inténtalo de nuevo.'

          const formTitle = registerForm.querySelector('h2')
          // Insertar después del título (o donde prefieras)
          if (formTitle) {
            registerForm.insertBefore(errorContainer, formTitle.nextElementSibling)
          } else {
            registerForm.prepend(errorContainer)
          }

          if (error.message.includes('fallo al iniciar sesión automáticamente') || error.message.includes('no se recibió token')) {
            errorContainer.textContent += ' Por favor, intenta iniciar sesión manualmente.'
          }
        })
    })
  } else {
    console.error('Formulario de registro no encontrado.')
  }
})
