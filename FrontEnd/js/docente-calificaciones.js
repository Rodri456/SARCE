// js/docente-calificaciones.js

(async function () {
  const API_URL = 'http://localhost:3000';
  const NOTA_APROBATORIA = 7; // por debajo: "En riesgo"
  // Períodos del año escolar, escritos igual que en la base de datos.
  // Si tu colegio tiene más (o menos), edita esta lista.
  const PERIODOS_BASE = ['Primer Periodo', 'Segundo Periodo', 'Tercer Periodo'];
  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) return;

  // ---------- Referencias al DOM ----------
  const [selGrado, selMateria, selPeriodo, selRubro] = document.querySelectorAll('.filtro-barra select');
  const tituloTarjeta = document.querySelector('.tarjeta-header h2');
  const btnGuardar = document.querySelector('.tarjeta-header button');
  const tabla = document.querySelector('table.tabla-sarce');
  const thead = tabla.querySelector('thead');
  const tbody = tabla.querySelector('tbody');
  const main = document.querySelector('main.app-contenido');
  const notaInfo = main.querySelector('p.small.text-muted-sarce');

  // Solo hay una nota por materia y período: se oculta el selector de rubro
  if (selRubro) selRubro.closest('[class*="col-"]').classList.add('d-none'); // por si queda en el HTML
  if (notaInfo) {
    notaInfo.innerHTML =
      '<i class="bi bi-info-circle"></i> Puedes registrar y modificar notas (0 a 10), pero no eliminarlas. Cada estudiante tiene una sola nota por materia y período.';
  }

  thead.innerHTML = `
    <tr>
      <th>Estudiante</th>
      <th class="text-center" style="width:160px">Nota</th>
      <th class="text-center" style="width:160px">Estado</th>
    </tr>`;

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
    if (tipo === 'success') temporizador = setTimeout(() => alerta.classList.add('d-none'), 4000);
  }
  const ocultarAviso = () => alerta.classList.add('d-none');

  // ---------- Utilidades ----------
  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const pillEstado = (valor) => {
    if (valor === '' || valor === null || isNaN(Number(valor))) {
      return '<span class="small text-muted-sarce">Sin nota</span>';
    }
    return Number(valor) >= NOTA_APROBATORIA
      ? '<span class="nota-pill aprobada">Aprobada</span>'
      : '<span class="nota-pill riesgo">En riesgo</span>';
  };

  function mensajeTabla(texto) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted-sarce py-4">${esc(texto)}</td></tr>`;
  }

  async function pedir(url, opciones) {
    const res = await fetch(`${API_URL}${url}`, opciones);
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
    return datos;
  }

  // ---------- Estado ----------
  let asignaciones = [];
  let calificaciones = [];
  const cacheEstudiantes = {}; // gradoId -> [estudiantes]
  let periodoPrevio = null;

  // ---------- Carga de datos ----------
  async function cargarCalificaciones() {
    const datos = await pedir(`/calificaciones/docente/${usuario.id}`);
    calificaciones = datos.map((c) => ({ ...c, nota: Number(c.nota) }));
  }

  async function estudiantesDelGrado(gradoId) {
    if (!cacheEstudiantes[gradoId]) {
      const lista = await pedir(`/estudiantes/buscarPorGrado/${gradoId}`);
      cacheEstudiantes[gradoId] = lista
        .filter((e) => e.estado_perfil === 'activo')
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }
    return cacheEstudiantes[gradoId];
  }

  // ---------- Selectores ----------
  function llenarGrados() {
    const vistos = new Map();
    asignaciones.forEach((a) => vistos.set(String(a.grado_id), a.grado_nombre));
    selGrado.innerHTML = [...vistos]
      .map(([id, nombre]) => `<option value="${esc(id)}">${esc(nombre)}</option>`)
      .join('');
  }

  function llenarMaterias() {
    const delGrado = asignaciones.filter((a) => String(a.grado_id) === selGrado.value);
    selMateria.innerHTML = delGrado
      .map((a) => `<option value="${esc(a.materia_id)}">${esc(a.materia_nombre)}</option>`)
      .join('');
  }

  const normalizarTexto = (t) =>
    String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Orden natural: primer, segundo, tercer, cuarto...; lo demás al final
  const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
  const posicionPeriodo = (p) => {
    const i = ORDINALES.findIndex((o) => normalizarTexto(p).includes(o));
    return i === -1 ? 99 : i;
  };

  function llenarPeriodos() {
    // Los períodos oficiales + cualquiera que ya exista en las calificaciones
    const lista = [];
    [...PERIODOS_BASE, ...calificaciones.map((c) => c.periodo)].forEach((p) => {
      if (p && !lista.some((x) => normalizarTexto(x) === normalizarTexto(p))) lista.push(p);
    });
    lista.sort((a, b) => posicionPeriodo(a) - posicionPeriodo(b) || a.localeCompare(b, 'es'));

    selPeriodo.innerHTML =
      lista.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('') +
      '<option value="__nuevo__">+ Otro período…</option>';

    // Por defecto: el período de la calificación registrada más recientemente
    const reciente = [...calificaciones].sort(
      (a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)
    )[0];
    const inicial = reciente ? lista.find((p) => normalizarTexto(p) === normalizarTexto(reciente.periodo)) : lista[0];

    selPeriodo.value = inicial || lista[0];
    periodoPrevio = selPeriodo.value;
  }

  function periodoNuevo() {
    const nombre = (prompt('Nombre del nuevo período (ej. Cuarto Periodo):') || '').trim();
    if (!nombre) {
      selPeriodo.value = periodoPrevio;
      return false;
    }
    // Si ya existe (sin importar mayúsculas ni tildes) se selecciona el existente
    const existente = [...selPeriodo.options].find(
      (o) => o.value !== '__nuevo__' && normalizarTexto(o.value) === normalizarTexto(nombre)
    );
    if (existente) {
      selPeriodo.value = existente.value;
    } else {
      selPeriodo.add(new Option(nombre, nombre), selPeriodo.options[selPeriodo.options.length - 1]);
      selPeriodo.value = nombre;
    }
    periodoPrevio = selPeriodo.value;
    return true;
  }

  // ---------- Tabla ----------
  async function pintarTabla() {
    ocultarAviso();
    const gradoId = selGrado.value;
    const materiaId = selMateria.value;
    const periodo = selPeriodo.value;

    const gradoNombre = selGrado.selectedOptions[0]?.textContent ?? '';
    const materiaNombre = selMateria.selectedOptions[0]?.textContent ?? '';
    tituloTarjeta.innerHTML = `<i class="bi bi-journal-plus text-azul me-1"></i> ${esc(gradoNombre)} — ${esc(materiaNombre)}`;

    if (!gradoId || !materiaId) {
      mensajeTabla('Selecciona un grado y una materia.');
      btnGuardar.disabled = true;
      return;
    }

    mensajeTabla('Cargando estudiantes...');
    let estudiantes;
    try {
      estudiantes = await estudiantesDelGrado(gradoId);
    } catch (err) {
      console.error(err);
      mensajeTabla('No se pudo cargar la lista de estudiantes.');
      return;
    }

    if (!estudiantes.length) {
      mensajeTabla('Este grado no tiene estudiantes activos.');
      btnGuardar.disabled = true;
      return;
    }

    // Notas ya registradas para esta materia y período, por estudiante
    const registradas = new Map();
    calificaciones
      .filter((c) => String(c.materia_id) === String(materiaId) && c.periodo === periodo)
      .forEach((c) => registradas.set(String(c.estudiante_id), c));

    tbody.innerHTML = estudiantes
      .map((e) => {
        const reg = registradas.get(String(e.estudiante_id));
        const valor = reg ? reg.nota : '';
        return `
          <tr data-estudiante="${esc(e.estudiante_id)}"
              data-calificacion="${reg ? esc(reg.calificacion_id) : ''}"
              data-original="${reg ? reg.nota : ''}">
            <td>${esc(e.nombre)}</td>
            <td class="text-center">
              <input type="number" class="form-control form-control-sm input-nota"
                     value="${valor}" min="0" max="10" step="0.1">
            </td>
            <td class="text-center estado-celda">${pillEstado(valor)}</td>
          </tr>`;
      })
      .join('');

    btnGuardar.disabled = false;
  }

  // Actualiza el estado mientras se escribe
  tbody.addEventListener('input', (e) => {
    if (!e.target.matches('input.input-nota')) return;
    const fila = e.target.closest('tr');
    e.target.classList.remove('is-invalid');
    fila.querySelector('.estado-celda').innerHTML = pillEstado(e.target.value);

    // Resalta las notas que cambiaron respecto a lo guardado
    const original = fila.dataset.original;
    const cambio = original !== '' && e.target.value.trim() !== '' && Number(e.target.value) !== Number(original);
    e.target.classList.toggle('border-warning', cambio);
  });

  // Una nota ya registrada no se puede eliminar: si se deja vacía, se restaura
  tbody.addEventListener('change', (e) => {
    if (!e.target.matches('input.input-nota')) return;
    const fila = e.target.closest('tr');
    const original = fila.dataset.original;

    if (fila.dataset.calificacion && e.target.value.trim() === '') {
      e.target.value = original;
      e.target.classList.remove('is-invalid', 'border-warning');
      fila.querySelector('.estado-celda').innerHTML = pillEstado(original);
      aviso('info', 'Las notas registradas no se pueden eliminar, solo modificar.');
    }
  });

  // ---------- Guardar ----------
  btnGuardar.addEventListener('click', async () => {
    ocultarAviso();
    const materiaId = Number(selMateria.value);
    const periodo = selPeriodo.value;

    const pendientes = [];
    let hayError = false;

    tbody.querySelectorAll('tr[data-estudiante]').forEach((fila) => {
      const input = fila.querySelector('input.input-nota');
      const texto = input.value.trim();
      const calificacionId = fila.dataset.calificacion;
      const original = fila.dataset.original;

      if (texto === '') {
        if (calificacionId) {
          input.classList.add('is-invalid');
          hayError = true; // no se puede borrar una nota ya registrada
        }
        return;
      }

      const nota = Number(texto);
      if (isNaN(nota) || nota < 0 || nota > 10) {
        input.classList.add('is-invalid');
        hayError = true;
        return;
      }

      if (calificacionId && nota === Number(original)) return; // sin cambios

      pendientes.push({ fila, calificacionId, nota, estudianteId: Number(fila.dataset.estudiante) });
    });

    if (hayError) {
      aviso('danger', 'Revisa las notas marcadas: deben estar entre 0 y 10, y no se puede dejar vacía una nota ya registrada.');
      return;
    }
    if (!pendientes.length) {
      aviso('info', 'No hay cambios para guardar.');
      return;
    }

    const textoBoton = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    const resultados = await Promise.allSettled(
      pendientes.map((p) =>
        pedir(p.calificacionId ? `/calificaciones/${p.calificacionId}` : '/calificaciones', {
          method: p.calificacionId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estudianteId: p.estudianteId,
            materiaId,
            docenteId: usuario.id,
            nota: p.nota,
            periodo
          })
        })
      )
    );

    const fallidas = resultados.filter((r) => r.status === 'rejected');

    try {
      await cargarCalificaciones();
      await pintarTabla();
    } catch (err) {
      console.error(err);
    }

    btnGuardar.innerHTML = textoBoton;
    btnGuardar.disabled = false;

    if (fallidas.length) {
      console.error(fallidas.map((f) => f.reason));
      aviso('danger', `Se guardaron ${pendientes.length - fallidas.length} de ${pendientes.length} notas. Error: ${fallidas[0].reason.message}`);
    } else {
      const actualizadas = pendientes.filter((p) => p.calificacionId).length;
      const nuevas = pendientes.length - actualizadas;
      const detalle = [];
      if (actualizadas) detalle.push(`${actualizadas} modificada(s)`);
      if (nuevas) detalle.push(`${nuevas} nueva(s)`);
      aviso('success', `Notas guardadas: ${detalle.join(', ')}.`);
    }
  });

  // ---------- Eventos de los selectores ----------
  selGrado.addEventListener('change', () => {
    llenarMaterias();
    pintarTabla();
  });
  selMateria.addEventListener('change', pintarTabla);
  selPeriodo.addEventListener('change', () => {
    if (selPeriodo.value === '__nuevo__') {
      if (!periodoNuevo()) return;
    } else {
      periodoPrevio = selPeriodo.value;
    }
    pintarTabla();
  });

  // ---------- Carga inicial ----------
  mensajeTabla('Cargando...');
  btnGuardar.disabled = true;

  try {
    asignaciones = await pedir(`/asignaciones/docente/${usuario.id}`);
    await cargarCalificaciones();
  } catch (err) {
    console.error(err);
    mensajeTabla('No se pudieron cargar los datos. Verifica que el backend esté corriendo.');
    return;
  }

  if (!asignaciones.length) {
    selGrado.innerHTML = '<option>—</option>';
    selMateria.innerHTML = '<option>—</option>';
    mensajeTabla('No tienes materias asignadas. Contacta a secretaría académica.');
    return;
  }

  llenarGrados();
  llenarMaterias();
  llenarPeriodos();
  pintarTabla();
})();