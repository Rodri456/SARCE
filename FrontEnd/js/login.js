// js/login.js
(function () {
const API_URL = 'http://localhost:3000';

const DESTINOS = {
  estudiante: 'estudiante-notas.html',
  docente: 'docente-calificaciones.html',
  admin: 'admin-usuarios.html',
  administrador: 'admin-usuarios.html'
};

const form = document.getElementById('formLogin');
if (!form) return; // esta página no es el login
const inputUsuario = document.getElementById('usuario');
const inputContrasena = document.getElementById('contrasena');
const inputRol = document.getElementById('rolSeleccionado');
const chkRecordarme = document.getElementById('recordarme');
const botonesRol = document.querySelectorAll('.btn-rol');
const btnSubmit = form.querySelector('button[type="submit"]');

// Contenedor de errores (se crea dinámicamente, no requiere cambios en el HTML)
const alerta = document.createElement('div');
alerta.className = 'alert alert-danger d-none py-2 small';
alerta.setAttribute('role', 'alert');
form.insertBefore(alerta, form.firstChild);

function mostrarError(mensaje) {
  alerta.textContent = mensaje;
  alerta.classList.remove('d-none');
}

function ocultarError() {
  alerta.classList.add('d-none');
}

// Si ya hay sesión activa, redirigir directamente
(function revisarSesion() {
  const raw = localStorage.getItem('sarce_usuario') || sessionStorage.getItem('sarce_usuario');
  const token = localStorage.getItem('sarce_token') || sessionStorage.getItem('sarce_token');
  if (!raw) return;
  if (!token) {
    // Sesión antigua sin token: se descarta y se vuelve a iniciar sesión
    localStorage.removeItem('sarce_usuario');
    sessionStorage.removeItem('sarce_usuario');
    return;
  }
  try {
    const usuario = JSON.parse(raw);
    if (DESTINOS[usuario.rol]) window.location.href = DESTINOS[usuario.rol];
  } catch {
    localStorage.removeItem('sarce_usuario');
    sessionStorage.removeItem('sarce_usuario');
    localStorage.removeItem('sarce_token');
    sessionStorage.removeItem('sarce_token');
  }
})();

// Selector de rol (Estudiante / Docente)
botonesRol.forEach((btn) => {
  btn.addEventListener('click', () => {
    botonesRol.forEach((b) => b.classList.remove('activo'));
    btn.classList.add('activo');
    inputRol.value = btn.dataset.rol;
    ocultarError();
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError();

  const correo = inputUsuario.value.trim();
  const contrasena = inputContrasena.value;
  const rol = inputRol.value;

  if (!correo || !contrasena) {
    mostrarError('Ingresa tu correo y tu contraseña.');
    return;
  }

  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Ingresando...';

  try {
    const res = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena, rol })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      mostrarError(data.message || 'No se pudo iniciar sesión.');
      return;
    }

    const usuario = data.usuario;
    const destino = DESTINOS[usuario.rol];

    if (!data.token) {
      mostrarError('El servidor no devolvió el token de sesión. Actualiza el backend.');
      return;
    }

    if (!destino) {
      mostrarError('Tu rol no tiene un panel disponible.');
      return;
    }

    // Guardar sesión
    ['sarce_usuario', 'sarce_token'].forEach((clave) => {
      localStorage.removeItem(clave);
      sessionStorage.removeItem(clave);
    });
    const almacenamiento = chkRecordarme.checked ? localStorage : sessionStorage;
    almacenamiento.setItem('sarce_usuario', JSON.stringify(usuario));
    almacenamiento.setItem('sarce_token', data.token);

    window.location.href = destino;
  } catch (err) {
    console.error(err);
    mostrarError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = textoOriginal;
  }
});
})();