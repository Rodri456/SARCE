// js/docente-estudiantes.js
(async function () {
  const API_URL = 'http://localhost:3000';
  const ESTADO_ACTIVO = 'activo';
  const ESTADO_DESACTIVADO = 'inactivo'; // valor de estado_perfil para "desactivado temporalmente"

  const tabla = document.getElementById('tablaEstudiantes');

  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) {
    if (tabla) {
      tabla.innerHTML =
        '<tr><td colspan="3" class="text-center text-danger py-4">No se encontró la sesión. Verifica que <code>js/sesion.js</code> esté cargado en el &lt;head&gt; de esta página.</td></tr>';
    }
    console.error('docente-estudiantes: window.sarceUsuario no está definido (¿falta js/sesion.js?)');
    return;
  }

  // ---------- Referencias al DOM ----------
  const main = document.querySelector('main.app-contenido');
  const selGrado = document.getElementById('filtroGrado');
  const inpBuscar = document.getElementById('buscarEstudiante');
  const selEstado = document.getElementById('filtroEstado');
  const titulo = document.getElementById('tituloListado');
  const contador = document.getElementById('contadorEstudiantes');

  const modalAccion = document.getElementById('modalEstadoAccion');
  const modalNombre = document.getElementById('modalEstadoNombre');
  const modalIcono = document.getElementById('modalEstadoIcono');
  const modalNota = document.getElementById('modalEstadoNota');
  const btnConfirmar = document.getElementById('btnConfirmarEstado');

  // Aviso (éxito / error)
  const alerta = document.createElement('div');
  alerta.className = 'alert d-none py-2 small';
  alerta.setAttribute('role', 'alert');
  main.insertBefore(alerta, main.firstChild);

  let temporizador;
  function aviso(tipo, texto) {
    clearTimeout(temporizador);
    alerta.className = `alert alert-${tipo} py-2 small`;
    alerta.textContent = texto;
    if (tipo === 'success') temporizador = setTimeout(() => alerta.classList.add('d-none'), 5000);
  }
  const ocultarAviso = () => alerta.classList.add('d-none');

  // ---------- Utilidades ----------
  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const normalizar = (t) =>
    String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  async function pedir(url, opciones) {
    const res = await fetch(`${API_URL}${url}`, opciones);
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
    return datos;
  }

  function mensajeTabla(texto) {
    tabla.innerHTML = `<tr><td colspan="3" class="text-center text-muted-sarce py-4">${esc(texto)}</td></tr>`;
  }

  // ---------- Estado ----------
  let asignaciones = [];
  let estudiantes = [];
  let pendiente = null; // cambio esperando confirmación en el modal

  // ---------- Carga de datos ----------
  async function cargarEstudiantes() {
    const gradoId = selGrado.value;
    mensajeTabla('Cargando estudiantes...');
    contador.textContent = '';
    try {
      const lista = await pedir(`/estudiantes/docente/${usuario.id}/grado/${gradoId}`);
      estudiantes = lista
        .map((e) => ({ ...e, estado_perfil: String(e.estado_perfil).toLowerCase() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      pintar();
    } catch (err) {
      console.error(err);
      mensajeTabla(`No se pudieron cargar los estudiantes (${err.message}).`);
    }
  }

  // ---------- Pintar ----------
  const BADGE_INACTIVO = (texto) =>
    `<span class="badge-estado-inactivo"><i class="bi bi-circle-fill" style="font-size:0.5rem;"></i> ${texto}</span>`;

  function badge(estado) {
    if (estado === ESTADO_ACTIVO) {
      return '<span class="badge-estado-activo"><i class="bi bi-circle-fill" style="font-size:0.5rem;"></i> Activo</span>';
    }
    if (estado === 'retirado') return BADGE_INACTIVO('Retirado');
    return BADGE_INACTIVO('Desactivado temporalmente');
  }

  function accion(e) {
    const datos = `data-cambiar-estado data-id="${esc(e.estudiante_id)}" data-nombre-estudiante="${esc(e.nombre)}" data-bs-toggle="modal" data-bs-target="#modalEstado"`;

    if (e.estado_perfil === ESTADO_ACTIVO) {
      return `<button class="btn btn-outline-danger btn-sm" ${datos} data-accion="desactivar"><i class="bi bi-person-dash"></i> Desactivar</button>`;
    }
    if (e.estado_perfil === ESTADO_DESACTIVADO) {
      return `<button class="btn btn-sarce-outline btn-sm" ${datos} data-accion="reactivar"><i class="bi bi-person-check"></i> Reactivar</button>`;
    }
    return '<span class="small text-muted-sarce">—</span>'; // retirado: lo gestiona secretaría
  }

  function pintar() {
    const gradoNombre = selGrado.selectedOptions[0]?.textContent ?? '';
    titulo.innerHTML = `<i class="bi bi-person-gear text-azul me-1"></i> ${esc(gradoNombre)} — Listado de estudiantes`;

    const texto = normalizar(inpBuscar.value);
    const estado = selEstado.value;
    const filtrados = estudiantes.filter(
      (e) => normalizar(e.nombre).includes(texto) && (!estado || e.estado_perfil === estado)
    );

    contador.textContent =
      filtrados.length === estudiantes.length
        ? `${estudiantes.length} estudiantes`
        : `${filtrados.length} de ${estudiantes.length} estudiantes`;

    if (!estudiantes.length) return mensajeTabla('Este grado no tiene estudiantes registrados.');
    if (!filtrados.length) return mensajeTabla('Ningún estudiante coincide con los filtros.');

    tabla.innerHTML = filtrados
      .map(
        (e) => `
        <tr>
          <td>${esc(e.nombre)}</td>
          <td>${badge(e.estado_perfil)}</td>
          <td class="text-end">${accion(e)}</td>
        </tr>`
      )
      .join('');
  }

  // ---------- Modal de confirmación ----------
  tabla.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cambiar-estado]');
    if (!btn) return;

    pendiente = { id: btn.dataset.id, accion: btn.dataset.accion, nombre: btn.dataset.nombreEstudiante };
    const desactivar = pendiente.accion === 'desactivar';

    modalAccion.textContent = desactivar ? 'desactivar temporalmente' : 'reactivar';
    modalNombre.textContent = pendiente.nombre;
    modalIcono.className = desactivar ? 'bi bi-person-x' : 'bi bi-person-check';
    modalNota.textContent = desactivar
      ? 'No podrá iniciar sesión mientras esté desactivado. Puedes reactivarlo desde este mismo módulo.'
      : 'Podrá volver a iniciar sesión y aparecerá de nuevo en la gestión de calificaciones.';
  });

  btnConfirmar.addEventListener('click', async () => {
    if (!pendiente) return;
    const cambio = pendiente;
    pendiente = null;
    ocultarAviso();

    const nuevoEstado = cambio.accion === 'desactivar' ? ESTADO_DESACTIVADO : ESTADO_ACTIVO;

    try {
      await pedir(`/estudiantes/${cambio.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoPerfil: nuevoEstado, docenteId: usuario.id })
      });
      await cargarEstudiantes();
      aviso(
        'success',
        cambio.accion === 'desactivar'
          ? `${cambio.nombre} fue desactivado temporalmente.`
          : `${cambio.nombre} fue reactivado.`
      );
    } catch (err) {
      console.error(err);
      aviso('danger', `No se pudo cambiar el estado: ${err.message}`);
    }
  });

  // ---------- Filtros ----------
  selGrado.addEventListener('change', () => {
    ocultarAviso();
    cargarEstudiantes();
  });
  inpBuscar.addEventListener('input', pintar);
  selEstado.addEventListener('change', pintar);

  // ---------- Carga inicial ----------
  try {
    // Los grados que enseña este docente, según sus asignaciones
    asignaciones = await pedir(`/asignaciones/docente/${usuario.id}`);
  } catch (err) {
    console.error(err);
    mensajeTabla(`No se pudieron cargar tus grados (${err.message}). Verifica que el backend esté corriendo en ${API_URL}.`);
    return;
  }

  const grados = new Map();
  asignaciones.forEach((a) => grados.set(String(a.grado_id), a.grado_nombre));

  if (!grados.size) {
    selGrado.innerHTML = '<option>—</option>';
    mensajeTabla('No tienes grados asignados. Contacta a secretaría académica.');
    return;
  }

  selGrado.innerHTML = [...grados]
    .map(([id, nombre]) => `<option value="${esc(id)}">${esc(nombre)}</option>`)
    .join('');

  cargarEstudiantes();
})();