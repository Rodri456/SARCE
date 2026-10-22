// js/estudiante-notas.js

(async function () {
  const API_URL = 'http://localhost:3000';
  const NOTA_APROBATORIA = 7; // Nota mínima para considerarse "Aprobada"; por debajo: "En riesgo"
  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) return;

  const selects = document.querySelectorAll('.filtro-barra select');
  const selGrado = selects[0];
  const selPeriodo = selects[1];
  const inpMateria = document.querySelector('.filtro-barra input');
  const btnFiltrar = document.querySelector('.filtro-barra button');
  const stats = document.querySelectorAll('.stat-sarce .valor-stat');
  const tituloTarjeta = document.querySelector('.tarjeta-header h2');
  const fechaActualizado = document.querySelector('.tarjeta-header span');
  const tabla = document.querySelector('table.tabla-sarce');
  const thead = tabla.querySelector('thead');
  const tbody = tabla.querySelector('tbody');

  let todas = [];

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const normalizar = (t) =>
    String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const estadoDe = (nota) =>
    nota >= NOTA_APROBATORIA
      ? { clase: 'aprobada', texto: 'Aprobada' }
      : { clase: 'riesgo', texto: 'En riesgo' };

  // La base de datos guarda una sola nota por materia/período,
  // así que la tabla muestra: Materia, Docente, Nota final y Estado.
  thead.innerHTML = `
    <tr>
      <th>Materia</th>
      <th>Docente</th>
      <th class="text-center">Nota final</th>
      <th class="text-center">Estado</th>
    </tr>`;

  function mensajeTabla(texto) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-sarce py-4">${esc(texto)}</td></tr>`;
  }

  function pintar() {
    const periodo = selPeriodo.value;
    const delPeriodo = todas.filter((c) => c.periodo === periodo);

    // Tarjetas de resumen (calculadas sobre el período seleccionado)
    const promedio = delPeriodo.length
      ? delPeriodo.reduce((s, c) => s + c.nota, 0) / delPeriodo.length
      : null;
    const materias = new Set(delPeriodo.map((c) => c.materia_id)).size;
    const enRiesgo = delPeriodo.filter((c) => c.nota < NOTA_APROBATORIA).length;

    stats[0].textContent = delPeriodo[0]?.grado_nombre ?? '—';
    stats[1].textContent = promedio !== null ? promedio.toFixed(1) : '—';
    stats[2].textContent = materias;
    stats[3].textContent = enRiesgo;

    // Encabezado de la tarjeta
    tituloTarjeta.innerHTML = `<i class="bi bi-journal-check text-azul me-1"></i> Calificaciones — ${esc(periodo)}`;
    if (delPeriodo.length) {
      const ultima = new Date(Math.max(...delPeriodo.map((c) => new Date(c.fecha_registro))));
      fechaActualizado.textContent =
        'Actualizado ' + ultima.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      fechaActualizado.textContent = '';
    }

    // Filtro por nombre de materia
    const texto = normalizar(inpMateria.value);
    const filtradas = delPeriodo.filter((c) => normalizar(c.materia_nombre).includes(texto));

    if (!filtradas.length) {
      mensajeTabla(texto ? 'No hay materias que coincidan con la búsqueda.' : 'No hay calificaciones en este período.');
      return;
    }

    tbody.innerHTML = filtradas
      .map((c) => {
        const e = estadoDe(c.nota);
        return `
          <tr>
            <td>${esc(c.materia_nombre)}</td>
            <td>${esc(c.docente_nombre)}</td>
            <td class="text-center fw-bold">${c.nota.toFixed(1)}</td>
            <td class="text-center"><span class="nota-pill ${e.clase}">${e.texto}</span></td>
          </tr>`;
      })
      .join('');
  }

  // ---- Carga inicial ----
  mensajeTabla('Cargando calificaciones...');

  try {
    const res = await fetch(`${API_URL}/calificaciones/estudiante/${usuario.id}`);
    if (!res.ok) throw new Error('Error ' + res.status);

    const datos = await res.json();
    todas = datos.map((c) => ({ ...c, nota: Number(c.nota) }));
  } catch (err) {
    console.error(err);
    mensajeTabla('No se pudieron cargar las calificaciones. Verifica que el backend esté corriendo.');
    return;
  }

  if (!todas.length) {
    selGrado.innerHTML = '<option>—</option>';
    selPeriodo.innerHTML = '<option>—</option>';
    stats.forEach((s) => (s.textContent = '—'));
    mensajeTabla('Aún no tienes calificaciones registradas.');
    return;
  }

  // Grado (viene del registro del estudiante, es único)
  selGrado.innerHTML = `<option>${esc(todas[0].grado_nombre)}</option>`;
  selGrado.disabled = true;

  // Períodos disponibles, del más reciente al más antiguo
  const ultimaPorPeriodo = {};
  todas.forEach((c) => {
    const f = new Date(c.fecha_registro).getTime();
    if (!ultimaPorPeriodo[c.periodo] || f > ultimaPorPeriodo[c.periodo]) ultimaPorPeriodo[c.periodo] = f;
  });
  const periodos = Object.keys(ultimaPorPeriodo).sort((a, b) => ultimaPorPeriodo[b] - ultimaPorPeriodo[a]);

  selPeriodo.innerHTML = periodos.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  selPeriodo.value = periodos[0];

  selPeriodo.addEventListener('change', pintar);
  inpMateria.addEventListener('input', pintar);
  btnFiltrar.addEventListener('click', pintar);

  pintar();
})();