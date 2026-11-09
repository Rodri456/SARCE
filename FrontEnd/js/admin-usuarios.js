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
  const TABS = {
    estudiantes: document.getElementById('tabEstudiantes'),
    docentes: document.getElementById('tabDocentes'),
    materias: document.getElementById('tabMaterias')
  };
  const btnAgregar = document.getElementById('btnAgregar');
  const inpBuscar = document.getElementById('buscarUsuario');
  const colBuscar = document.getElementById('colBuscar');
  const colGrado = document.getElementById('colGrado');
  const selFiltroGrado = document.getElementById('filtroGrado');
  const tituloLista = document.getElementById('tituloLista');
  const contador = document.getElementById('contadorUsuarios');
  const thead = document.getElementById('theadUsuarios');

  // Modal "Agregar" (estudiante, docente o materia)
  const modalAgregarEl = document.getElementById('modalAgregar');
  const modalAgregarTitulo = document.getElementById('modalAgregarTitulo');
  const formAgregar = document.getElementById('formAgregar');
  const addError = document.getElementById('addError');
  const lblNombre = document.getElementById('lblNombre');
  const addNombre = document.getElementById('addNombre');
  const grupoCorreo = document.getElementById('grupoCorreo');
  const addCorreo = document.getElementById('addCorreo');
  const grupoContrasena = document.getElementById('grupoContrasena');
  const addContrasena = document.getElementById('addContrasena');
  const grupoGrado = document.getElementById('grupoGrado');
  const addGrado = document.getElementById('addGrado');
  const btnGuardar = document.getElementById('btnGuardarUsuario');

  // Modal "Asignar docente"
  const modalAsignarEl = document.getElementById('modalAsignar');
  const formAsignar = document.getElementById('formAsignar');
  const asignarMateria = document.getElementById('asignarMateria');
  const asignarDocente = document.getElementById('asignarDocente');
  const asignarGrado = document.getElementById('asignarGrado');
  const asignarError = document.getElementById('asignarError');
  const btnConfirmarAsignar = document.getElementById('btnConfirmarAsignar');

  // Modal "Eliminar"
  const eliminarTipo = document.getElementById('eliminarTipo');
  const eliminarNombre = document.getElementById('eliminarNombre');
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

  const modalAgregar = bootstrap.Modal.getOrCreateInstance(modalAgregarEl);
  const modalAsignar = bootstrap.Modal.getOrCreateInstance(modalAsignarEl);

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
    if (tipo === 'success') temporizador = setTimeout(() => alerta.classList.add('d-none'), 6000);
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
      return 'Ya existe un registro igual (por ejemplo, un usuario con ese correo).';
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
  let vista = 'estudiantes'; // 'estudiantes' | 'docentes' | 'materias'
  let estudiantes = [];
  let docentes = [];
  let materias = [];
  let asignaciones = [];
  let grados = [];
  let porEliminar = null;
  let materiaAsignando = null;

  const ETIQUETAS = {
    estudiantes: { singular: 'estudiante', plural: 'Estudiantes', icono: 'bi-people', buscar: 'Nombre o correo' },
    docentes: { singular: 'docente', plural: 'Docentes', icono: 'bi-person-workspace', buscar: 'Nombre o correo' },
    materias: { singular: 'materia', plural: 'Materias', icono: 'bi-journal-bookmark', buscar: 'Materia o docente' }
  };

  async function cargarTodo() {
    const [e, d, g, m, a] = await Promise.all([
      pedir('/estudiantes'),
      pedir('/docentes'),
      pedir('/grados'),
      pedir('/materias'),
      pedir('/asignaciones')
    ]);
    estudiantes = e.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
    docentes = d.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
    materias = m.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
    asignaciones = a;
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
    `<button class="btn btn-outline-danger btn-sm" data-eliminar data-tipo="${vista}" data-id="${esc(id)}" data-nombre="${esc(nombre)}" data-bs-toggle="modal" data-bs-target="#modalEliminar"><i class="bi bi-trash"></i> Eliminar</button>`;

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

  // Etiqueta "Docente · Grado" con una x para quitar la asignación
  const etiquetaAsignacion = (a, nombreMateria) => {
    const detalle = `${a.docente_nombre} — ${nombreMateria} (${a.grado_nombre})`;
    return `<span class="badge text-bg-light border fw-normal me-1 mb-1">${esc(a.docente_nombre)} · ${esc(a.grado_nombre)}<button type="button" class="btn btn-link btn-sm text-danger p-0 ms-2 align-baseline" aria-label="Quitar asignación" data-eliminar data-tipo="asignaciones" data-id="${esc(a.asignacion_id)}" data-nombre="${esc(detalle)}" data-bs-toggle="modal" data-bs-target="#modalEliminar"><i class="bi bi-x-lg"></i></button></span>`;
  };

  function pintar() {
    const texto = normalizar(inpBuscar.value);
    const coincide = (u) => normalizar(u.nombre).includes(texto) || normalizar(u.correo).includes(texto);

    if (vista === 'estudiantes') {
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
    } else if (vista === 'docentes') {
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
    } else {
      thead.innerHTML = '<tr><th>Materia</th><th>Docentes asignados</th><th class="text-end">Acción</th></tr>';

      const deLaMateria = (m) => asignaciones.filter((a) => String(a.materia_id) === String(m.id));
      const filtradas = materias.filter(
        (m) => normalizar(m.nombre).includes(texto) || deLaMateria(m).some((a) => normalizar(a.docente_nombre).includes(texto))
      );

      contador.textContent =
        filtradas.length === materias.length ? `${materias.length} materias` : `${filtradas.length} de ${materias.length} materias`;

      if (!materias.length) return mensajeTabla('Aún no hay materias. Usa «Agregar materia» para crear la primera.', 3);
      if (!filtradas.length) return mensajeTabla('Ninguna materia coincide con la búsqueda.', 3);

      tbody.innerHTML = filtradas
        .map((m) => {
          const asignadas = deLaMateria(m);
          const docentesHtml = asignadas.length
            ? asignadas.map((a) => etiquetaAsignacion(a, m.nombre)).join('')
            : '<span class="small text-muted-sarce">Sin docente asignado</span>';
          return `
          <tr>
            <td>${esc(m.nombre)}</td>
            <td>${docentesHtml}</td>
            <td class="text-end"><button class="btn btn-sarce-outline btn-sm" data-asignar data-id="${esc(m.id)}" data-nombre="${esc(m.nombre)}"><i class="bi bi-link-45deg"></i> Asignar docente</button></td>
          </tr>`;
        })
        .join('');
    }
  }

  // ---------- Pestañas ----------
  function cambiarVista(nueva) {
    vista = nueva;
    ocultarAviso();
    inpBuscar.value = '';
    selFiltroGrado.value = '';

    Object.entries(TABS).forEach(([clave, boton]) => {
      boton.className = `btn btn-sm ${clave === vista ? 'btn-sarce' : 'btn-sarce-outline'}`;
    });

    const et = ETIQUETAS[vista];
    btnAgregar.innerHTML = `<i class="bi bi-plus-lg"></i> Agregar ${et.singular}`;
    tituloLista.innerHTML = `<i class="bi ${et.icono} text-azul me-1"></i> ${et.plural}`;
    inpBuscar.placeholder = et.buscar;

    colGrado.classList.toggle('d-none', vista !== 'estudiantes');
    colBuscar.className = vista === 'estudiantes' ? 'col-12 col-md-8' : 'col-12';

    pintar();
  }

  Object.entries(TABS).forEach(([clave, boton]) => boton.addEventListener('click', () => cambiarVista(clave)));
  inpBuscar.addEventListener('input', pintar);
  selFiltroGrado.addEventListener('change', pintar);

  // ---------- Agregar (estudiante / docente / materia) ----------
  const opcionesGrados = () => grados.map((g) => `<option value="${esc(g.id)}">${esc(g.nombre)}</option>`).join('');

  btnAgregar.addEventListener('click', () => {
    formAgregar.reset();
    addError.classList.add('d-none');

    const esMateria = vista === 'materias';
    const icono = esMateria ? 'bi-journal-plus' : 'bi-person-plus';
    modalAgregarTitulo.innerHTML = `<i class="bi ${icono} text-azul me-1"></i> Agregar ${ETIQUETAS[vista].singular}`;
    lblNombre.textContent = esMateria ? 'Nombre de la materia' : 'Nombre completo';

    grupoCorreo.classList.toggle('d-none', esMateria);
    grupoContrasena.classList.toggle('d-none', esMateria);
    grupoGrado.classList.toggle('d-none', vista !== 'estudiantes');
    addGrado.innerHTML = opcionesGrados();

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

    // Validación según lo que se está agregando
    if (vista === 'materias') {
      if (nombre.length < 2) return mostrarErrorFormulario('Escribe el nombre de la materia.');
      if (materias.some((m) => normalizar(m.nombre) === normalizar(nombre))) {
        return mostrarErrorFormulario('Ya existe una materia con ese nombre.');
      }
    } else {
      if (nombre.length < 3) return mostrarErrorFormulario('Escribe el nombre completo.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return mostrarErrorFormulario('Escribe un correo electrónico válido.');
      if (contrasena.length < MIN_CONTRASENA) {
        return mostrarErrorFormulario(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
      }
      if (vista === 'estudiantes' && !addGrado.value) return mostrarErrorFormulario('Selecciona el grado del estudiante.');

      const yaExiste = [...estudiantes, ...docentes].some((u) => u.correo.toLowerCase() === correo.toLowerCase());
      if (yaExiste) return mostrarErrorFormulario('Ya existe un usuario con ese correo electrónico.');
    }

    const textoBoton = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    try {
      if (vista === 'estudiantes') {
        await pedir(
          '/estudiantes',
          enviarJson('POST', { nombre, correo, contrasena, gradoId: Number(addGrado.value), estadoPerfil: 'activo' })
        );
      } else if (vista === 'docentes') {
        await pedir('/docentes', enviarJson('POST', { nombre, correo, contrasena }));
      } else {
        await pedir('/materias', enviarJson('POST', { nombre }));
      }

      modalAgregar.hide();
      await cargarTodo();
      pintar();

      aviso(
        'success',
        vista === 'materias'
          ? `Materia «${nombre}» creada. Pulsa «Asignar docente» para vincularla con una maestra.`
          : `${vista === 'estudiantes' ? 'Estudiante' : 'Docente'} «${nombre}» agregado correctamente.`
      );
    } catch (err) {
      console.error(err);
      mostrarErrorFormulario(traducirError(err.message, 'agregar'));
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = textoBoton;
    }
  });

  // ---------- Asignar docente a una materia ----------
  const mostrarErrorAsignar = (texto) => {
    asignarError.textContent = texto;
    asignarError.classList.remove('d-none');
  };

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-asignar]');
    if (!btn) return;

    materiaAsignando = { id: btn.dataset.id, nombre: btn.dataset.nombre };
    asignarMateria.textContent = materiaAsignando.nombre;
    asignarError.classList.add('d-none');

    asignarDocente.innerHTML = docentes
      .map((d) => `<option value="${esc(d.docente_id)}">${esc(d.nombre)}</option>`)
      .join('');
    asignarGrado.innerHTML = opcionesGrados();

    if (!docentes.length) mostrarErrorAsignar('Primero agrega un docente en la pestaña «Docentes».');
    else if (!grados.length) mostrarErrorAsignar('No hay grados registrados.');

    modalAsignar.show();
  });

  formAsignar.addEventListener('submit', async (e) => {
    e.preventDefault();
    asignarError.classList.add('d-none');
    if (!materiaAsignando) return;

    if (!asignarDocente.value) return mostrarErrorAsignar('Selecciona un docente.');
    if (!asignarGrado.value) return mostrarErrorAsignar('Selecciona un grado.');

    const repetida = asignaciones.some(
      (a) =>
        String(a.materia_id) === String(materiaAsignando.id) &&
        String(a.docente_id) === asignarDocente.value &&
        String(a.grado_id) === asignarGrado.value
    );
    if (repetida) return mostrarErrorAsignar('Ese docente ya tiene asignada esta materia en ese grado.');

    const nombreDocente = asignarDocente.selectedOptions[0].textContent;
    const nombreGrado = asignarGrado.selectedOptions[0].textContent;
    const textoBoton = btnConfirmarAsignar.textContent;
    btnConfirmarAsignar.disabled = true;
    btnConfirmarAsignar.textContent = 'Asignando...';

    try {
      await pedir(
        '/asignaciones',
        enviarJson('POST', {
          docenteId: Number(asignarDocente.value),
          materiaId: Number(materiaAsignando.id),
          gradoId: Number(asignarGrado.value)
        })
      );

      modalAsignar.hide();
      await cargarTodo();
      pintar();
      aviso('success', `${nombreDocente} fue asignado(a) a «${materiaAsignando.nombre}» en ${nombreGrado}.`);
    } catch (err) {
      console.error(err);
      mostrarErrorAsignar(traducirError(err.message, 'asignar'));
    } finally {
      btnConfirmarAsignar.disabled = false;
      btnConfirmarAsignar.textContent = textoBoton;
    }
  });

  // ---------- Eliminar (usuario o asignación) ----------
  const RUTAS = { estudiantes: '/estudiantes', docentes: '/docentes', asignaciones: '/asignaciones' };
  const TEXTO_TIPO = { estudiantes: 'al estudiante', docentes: 'al docente', asignaciones: 'la asignación' };

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-eliminar]');
    if (!btn) return;

    porEliminar = { tipo: btn.dataset.tipo, id: btn.dataset.id, nombre: btn.dataset.nombre };
    eliminarTipo.textContent = TEXTO_TIPO[porEliminar.tipo] || 'el registro';
    eliminarNombre.textContent = porEliminar.nombre;
  });

  btnConfirmarEliminar.addEventListener('click', async () => {
    if (!porEliminar) return;
    const { tipo, id, nombre } = porEliminar;
    porEliminar = null;
    ocultarAviso();

    try {
      await pedir(`${RUTAS[tipo]}/${id}`, { method: 'DELETE' });
      await cargarTodo();
      pintar();
      aviso('success', tipo === 'asignaciones' ? `Asignación quitada: ${nombre}.` : `«${nombre}» fue eliminado.`);
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
    mensajeTabla(`No se pudieron cargar los datos (${err.message}). Verifica que el backend esté corriendo en ${API_URL}.`, 5);
    return;
  }

  cambiarVista('estudiantes');
})();