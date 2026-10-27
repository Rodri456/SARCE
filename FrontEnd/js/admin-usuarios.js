// js/admin-usuarios.js
(async function () {
  const API_URL = 'http://localhost:3000';
  const MIN_CONTRASENA = 6;

  const tbody = document.getElementById('tbodyUsuarios');

  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) {
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger py-4">No se encontró la sesión. Verifica que <code>js/sesion.js</code> esté cargado en el &lt;head&gt; de esta página.</td></tr>';
    }
    console.error('admin-usuarios: window.sarceUsuario no está definido (¿falta js/sesion.js?)');
    return;
  }

  // ---------- Referencias al DOM ----------
  const main = document.querySelector('main.app-contenido');
  const tabEstudiantes = document.getElementById('tabEstudiantes');
  const tabDocentes = document.getElementById('tabDocentes');
  const btnAgregar = document.getElementById('btnAgregar');
  const inpBuscar = document.getElementById('buscarUsuario');
  const colBuscar = document.getElementById('colBuscar');
  const colGrado = document.getElementById('colGrado');
  const selFiltroGrado = document.getElementById('filtroGrado');
  const tituloLista = document.getElementById('tituloLista');
  const contador = document.getElementById('contadorUsuarios');
  const thead = document.getElementById('theadUsuarios');

  const modalAgregarEl = document.getElementById('modalAgregar');
  const modalAgregarTitulo = document.getElementById('modalAgregarTitulo');
  const formAgregar = document.getElementById('formAgregar');
  const addError = document.getElementById('addError');
  const addNombre = document.getElementById('addNombre');
  const addCorreo = document.getElementById('addCorreo');
  const addContrasena = document.getElementById('addContrasena');
  const grupoGrado = document.getElementById('grupoGrado');
  const addGrado = document.getElementById('addGrado');
  const btnGuardar = document.getElementById('btnGuardarUsuario');

  const eliminarTipo = document.getElementById('eliminarTipo');
  const eliminarNombre = document.getElementById('eliminarNombre');
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

  const modalAgregar = bootstrap.Modal.getOrCreateInstance(modalAgregarEl);

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

  const enviarJson = (metodo, cuerpo) => ({
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  });

  // Mensajes de error de la base de datos → texto entendible
  function traducirError(mensaje, accion) {
    if (/duplicate key|already exists|unique/i.test(mensaje)) {
      return 'Ya existe un usuario con ese correo electrónico.';
    }
    if (/foreign key|referenced|still referenced/i.test(mensaje)) {
      return 'No se puede eliminar porque tiene registros asociados (calificaciones, pagos, horarios o asignaciones).';
    }
    if (accion === 'eliminar') {
      return `No se pudo eliminar (${mensaje}). Si tiene calificaciones, pagos, horarios o asignaciones registradas, no se puede eliminar.`;
    }
    return mensaje;
  }

  // ---------- Estado ----------
  let vista = 'estudiantes'; // 'estudiantes' | 'docentes'
  let estudiantes = [];
  let docentes = [];
  let grados = [];
  let porEliminar = null;

  const esEstudiantes = () => vista === 'estudiantes';

  async function cargarTodo() {
    const [e, d, g] = await Promise.all([pedir('/estudiantes'), pedir('/docentes'), pedir('/grados')]);
    estudiantes = e.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    docentes = d.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    grados = g;

    selFiltroGrado.innerHTML =
      '<option value="">Todos los grados</option>' +
      grados.map((x) => `<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join('');
  }

  // ---------- Pintar ----------
  function mensajeTabla(texto, columnas) {
    tbody.innerHTML = `<tr><td colspan="${columnas}" class="text-center text-muted-sarce py-4">${esc(texto)}</td></tr>`;
  }

  const botonEliminar = (id, nombre) =>
    `<button class="btn btn-outline-danger btn-sm" data-eliminar data-id="${esc(id)}" data-nombre="${esc(nombre)}" data-bs-toggle="modal" data-bs-target="#modalEliminar"><i class="bi bi-trash"></i> Eliminar</button>`;

  function badgeEstado(estado) {
    const e = String(estado).toLowerCase();
    if (e === 'activo') {
      return '<span class="badge-estado-activo"><i class="bi bi-circle-fill" style="font-size:0.5rem;"></i> Activo</span>';
    }
    const texto = e === 'retirado' ? 'Retirado' : 'Desactivado temporalmente';
    return `<span class="badge-estado-inactivo"><i class="bi bi-circle-fill" style="font-size:0.5rem;"></i> ${texto}</span>`;
  }

  const fechaCorta = (f) => {
    const d = new Date(f);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  function pintar() {
    const texto = normalizar(inpBuscar.value);
    const coincide = (u) => normalizar(u.nombre).includes(texto) || normalizar(u.correo).includes(texto);

    if (esEstudiantes()) {
      thead.innerHTML =
        '<tr><th>Estudiante</th><th>Correo</th><th>Grado</th><th>Estado</th><th class="text-end">Acción</th></tr>';

      const gradoId = selFiltroGrado.value;
      const filtrados = estudiantes.filter((u) => coincide(u) && (!gradoId || String(u.grado_id) === gradoId));

      contador.textContent =
        filtrados.length === estudiantes.length ? `${estudiantes.length} estudiantes` : `${filtrados.length} de ${estudiantes.length} estudiantes`;

      if (!estudiantes.length) return mensajeTabla('Aún no hay estudiantes registrados.', 5);
      if (!filtrados.length) return mensajeTabla('Ningún estudiante coincide con la búsqueda.', 5);

      tbody.innerHTML = filtrados
        .map(
          (u) => `
          <tr>
            <td>${esc(u.nombre)}</td>
            <td class="small text-muted-sarce">${esc(u.correo)}</td>
            <td>${esc(u.grado)}</td>
            <td>${badgeEstado(u.estado_perfil)}</td>
            <td class="text-end">${botonEliminar(u.estudiante_id, u.nombre)}</td>
          </tr>`
        )
        .join('');
    } else {
      thead.innerHTML = '<tr><th>Docente</th><th>Correo</th><th>Registrado</th><th class="text-end">Acción</th></tr>';

      const filtrados = docentes.filter(coincide);

      contador.textContent =
        filtrados.length === docentes.length ? `${docentes.length} docentes` : `${filtrados.length} de ${docentes.length} docentes`;

      if (!docentes.length) return mensajeTabla('Aún no hay docentes registrados.', 4);
      if (!filtrados.length) return mensajeTabla('Ningún docente coincide con la búsqueda.', 4);

      tbody.innerHTML = filtrados
        .map(
          (u) => `
          <tr>
            <td>${esc(u.nombre)}</td>
            <td class="small text-muted-sarce">${esc(u.correo)}</td>
            <td class="small text-muted-sarce">${fechaCorta(u.docente_desde)}</td>
            <td class="text-end">${botonEliminar(u.docente_id, u.nombre)}</td>
          </tr>`
        )
        .join('');
    }
  }

  // ---------- Pestañas ----------
  function cambiarVista(nueva) {
    vista = nueva;
    ocultarAviso();
    inpBuscar.value = '';
    selFiltroGrado.value = '';

    tabEstudiantes.className = `btn btn-sm ${esEstudiantes() ? 'btn-sarce' : 'btn-sarce-outline'}`;
    tabDocentes.className = `btn btn-sm ${esEstudiantes() ? 'btn-sarce-outline' : 'btn-sarce'}`;
    btnAgregar.innerHTML = `<i class="bi bi-plus-lg"></i> Agregar ${esEstudiantes() ? 'estudiante' : 'docente'}`;
    tituloLista.innerHTML = `<i class="bi bi-people text-azul me-1"></i> ${esEstudiantes() ? 'Estudiantes' : 'Docentes'}`;

    colGrado.classList.toggle('d-none', !esEstudiantes());
    colBuscar.className = esEstudiantes() ? 'col-12 col-md-8' : 'col-12';

    pintar();
  }

  tabEstudiantes.addEventListener('click', () => cambiarVista('estudiantes'));
  tabDocentes.addEventListener('click', () => cambiarVista('docentes'));
  inpBuscar.addEventListener('input', pintar);
  selFiltroGrado.addEventListener('change', pintar);

  // ---------- Agregar ----------
  btnAgregar.addEventListener('click', () => {
    formAgregar.reset();
    addError.classList.add('d-none');

    modalAgregarTitulo.innerHTML = `<i class="bi bi-person-plus text-azul me-1"></i> Agregar ${esEstudiantes() ? 'estudiante' : 'docente'}`;
    grupoGrado.classList.toggle('d-none', !esEstudiantes());
    addGrado.innerHTML = grados.map((g) => `<option value="${esc(g.id)}">${esc(g.nombre)}</option>`).join('');

    modalAgregar.show();
  });

  const mostrarErrorFormulario = (texto) => {
    addError.textContent = texto;
    addError.classList.remove('d-none');
  };

  formAgregar.addEventListener('submit', async (e) => {
    e.preventDefault();
    addError.classList.add('d-none');

    const nombre = addNombre.value.trim();
    const correo = addCorreo.value.trim();
    const contrasena = addContrasena.value;

    if (nombre.length < 3) return mostrarErrorFormulario('Escribe el nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarErrorFormulario('Escribe un correo electrónico válido.');
    if (contrasena.length < MIN_CONTRASENA) {
      return mostrarErrorFormulario(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
    }
    if (esEstudiantes() && !addGrado.value) return mostrarErrorFormulario('Selecciona el grado del estudiante.');

    const yaExiste = [...estudiantes, ...docentes].some((u) => u.correo.toLowerCase() === correo.toLowerCase());
    if (yaExiste) return mostrarErrorFormulario('Ya existe un usuario con ese correo electrónico.');

    const textoBoton = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    try {
      if (esEstudiantes()) {
        await pedir(
          '/estudiantes',
          enviarJson('POST', { nombre, correo, contrasena, gradoId: Number(addGrado.value), estadoPerfil: 'activo' })
        );
      } else {
        await pedir('/docentes', enviarJson('POST', { nombre, correo, contrasena }));
      }

      modalAgregar.hide();
      await cargarTodo();
      pintar();
      aviso('success', `${esEstudiantes() ? 'Estudiante' : 'Docente'} «${nombre}» agregado correctamente.`);
    } catch (err) {
      console.error(err);
      mostrarErrorFormulario(traducirError(err.message, 'agregar'));
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = textoBoton;
    }
  });

  // ---------- Eliminar ----------
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-eliminar]');
    if (!btn) return;

    porEliminar = { tipo: vista, id: btn.dataset.id, nombre: btn.dataset.nombre };
    eliminarTipo.textContent = esEstudiantes() ? 'al estudiante' : 'al docente';
    eliminarNombre.textContent = porEliminar.nombre;
  });

  btnConfirmarEliminar.addEventListener('click', async () => {
    if (!porEliminar) return;
    const { tipo, id, nombre } = porEliminar;
    porEliminar = null;
    ocultarAviso();

    try {
      await pedir(`/${tipo === 'estudiantes' ? 'estudiantes' : 'docentes'}/${id}`, { method: 'DELETE' });
      await cargarTodo();
      pintar();
      aviso('success', `«${nombre}» fue eliminado.`);
    } catch (err) {
      console.error(err);
      aviso('danger', traducirError(err.message, 'eliminar'));
    }
  });

  // ---------- Carga inicial ----------
  try {
    await cargarTodo();
  } catch (err) {
    console.error(err);
    mensajeTabla(`No se pudieron cargar los usuarios (${err.message}). Verifica que el backend esté corriendo en ${API_URL}.`, 5);
    return;
  }

  cambiarVista('estudiantes');
})();