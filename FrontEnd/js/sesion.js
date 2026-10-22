// js/sesion.js
// Se carga en el <head> de cada vista protegida.
// Cada vista declara su rol en la etiqueta <html data-rol="estudiante|docente">.

(function () {
  const LOGIN = 'login.html';
  const DESTINOS = {
    estudiante: 'estudiante-notas.html',
    docente: 'docente-calificaciones.html'
  };

  function leerSesion() {
    const raw = localStorage.getItem('sarce_usuario') || sessionStorage.getItem('sarce_usuario');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('sarce_usuario');
    sessionStorage.removeItem('sarce_usuario');
    window.location.replace(LOGIN);
  }

  const usuario = leerSesion();
  const rolRequerido = document.documentElement.dataset.rol;

  // 1) Sin sesión → login
  if (!usuario) {
    window.location.replace(LOGIN);
    return;
  }

  // 2) Rol incorrecto → a su propia vista (o login si el rol no es válido)
  if (rolRequerido && usuario.rol !== rolRequerido) {
    window.location.replace(DESTINOS[usuario.rol] || LOGIN);
    return;
  }

  // Disponible para los demás scripts de la vista
  window.sarceUsuario = usuario;
  window.sarceCerrarSesion = cerrarSesion;

  document.addEventListener('DOMContentLoaded', () => {
    // Nombre e iniciales en la barra superior
    const nombreEl = document.querySelector('.app-topbar span.text-muted-sarce');
    const avatarEl = document.querySelector('.avatar-usuario');

    if (nombreEl) nombreEl.textContent = usuario.nombre;
    if (avatarEl) {
      const iniciales = usuario.nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('');
      avatarEl.textContent = iniciales;
    }

    // Botón "Cerrar sesión"
    document.querySelectorAll('.salir-sidebar a').forEach((enlace) => {
      enlace.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarSesion();
      });
    });
  });
})();