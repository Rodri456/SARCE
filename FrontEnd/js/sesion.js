// js/sesion.js
// Se carga en el <head> de cada vista protegida.
// Cada vista declara su rol en la etiqueta <html data-rol="estudiante|docente">.

(function () {
  const LOGIN = 'login.html';
  // Roles con acceso de administrador (deben coincidir con ROLES_ADMIN del .env del backend)
  const ROLES_ADMIN = ['admin', 'administrador'];
  const DESTINOS = {
    estudiante: 'estudiante-notas.html',
    docente: 'docente-calificaciones.html',
    admin: 'admin-usuarios.html',
    administrador: 'admin-usuarios.html'
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

  function leerToken() {
    return localStorage.getItem('sarce_token') || sessionStorage.getItem('sarce_token');
  }

  function cerrarSesion() {
    ['sarce_usuario', 'sarce_token'].forEach((clave) => {
      localStorage.removeItem(clave);
      sessionStorage.removeItem(clave);
    });
    window.location.replace(LOGIN);
  }

  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

  // Este script no debe hacer nada en la propia página de login
  if (paginaActual === LOGIN) return;

  // Evita bucles: nunca redirige a la página en la que ya estamos
  function irA(destino) {
    if (paginaActual === destino) return false;
    window.location.replace(destino);
    return true;
  }

  const usuario = leerSesion();
  const token = leerToken();
  const rolRequerido = document.documentElement.dataset.rol;

  // 1) Sin sesión (o sesión antigua sin token) → login
  if (!usuario || !token) {
    ['sarce_usuario', 'sarce_token'].forEach((clave) => {
      localStorage.removeItem(clave);
      sessionStorage.removeItem(clave);
    });
    irA(LOGIN);
    return;
  }

  // 2) Rol incorrecto → a su propia vista (o login si el rol no es válido)
  const cumpleRol = rolRequerido === 'admin' ? ROLES_ADMIN.includes(usuario.rol) : usuario.rol === rolRequerido;
  if (rolRequerido && !cumpleRol) {
    if (irA(DESTINOS[usuario.rol] || LOGIN)) return;
  }

  // Toda petición a la API lleva el token automáticamente.
  // Si el servidor responde 401 (sesión vencida o inválida) se cierra la sesión.
  // IMPORTANTE: si cambias el puerto del backend, cámbialo también aquí.
  const API_BASE = 'http://localhost:3000';
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (recurso, opciones = {}) => {
    const url = typeof recurso === 'string' ? recurso : recurso.url;
    const esApi = url.startsWith(API_BASE);

    if (esApi) {
      opciones = { ...opciones, headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` } };
    }

    const respuesta = await fetchOriginal(recurso, opciones);
    if (esApi && respuesta.status === 401) cerrarSesion();
    return respuesta;
  };

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