// js/estudiante-horarios.js


(async function () {
  const API_URL = 'http://localhost:3000';
  const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']; // columnas de la tabla, en orden
  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) {
    const t = document.querySelector('table.tabla-horario tbody');
    if (t) {
      t.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger py-4">No se encontró la sesión. ' +
        'Verifica que <code>js/sesion.js</code> esté cargado en el &lt;head&gt; de esta página.</td></tr>';
    }
    console.error('estudiante-horarios: window.sarceUsuario no está definido (¿falta js/sesion.js?)');
    return;
  }

  // ---------- Referencias al DOM ----------
  const nombreGrado = document.querySelector('.filtro-barra .fw-semibold');
  const subtitulo = document.querySelector('.filtro-barra .small.text-muted-sarce');
  const btnImprimir = document.querySelector('.filtro-barra button');
  const tbody = document.querySelector('table.tabla-horario tbody');

  // Al imprimir solo se muestra el horario
  const estiloImpresion = document.createElement('style');
  estiloImpresion.textContent = `
    @media print {
      .app-sidebar, .app-topbar, .overlay-sidebar, .pie-app, .filtro-barra button { display: none !important; }
      .app-main { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; }
    }`;
  document.head.appendChild(estiloImpresion);
  btnImprimir.addEventListener('click', generarPdf);

  // ---------- Utilidades ----------
  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "Miércoles" → "miercoles"
  const normalizar = (t) =>
    String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const aMinutos = (hora) => {
    const [h, m] = String(hora).split(':');
    return Number(h) * 60 + Number(m);
  };
  const formatoHora = (hora) => {
    const [h, m] = String(hora).split(':');
    return `${Number(h)}:${m}`; // "07:00:00" → "7:00"
  };
  const rango = (inicio, fin) => `${formatoHora(inicio)} – ${formatoHora(fin)}`;

  async function pedir(url) {
    const res = await fetch(`${API_URL}${url}`);
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
    return datos;
  }

  function mensajeTabla(texto) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-sarce py-4">${esc(texto)}</td></tr>`;
  }

  // ---------- Construcción de la tabla ----------
  function construirTabla(horarios) {
    // Franjas horarias distintas (inicio|fin), con las clases de cada día
    const franjas = new Map();
    horarios.forEach((h) => {
      const dia = normalizar(h.dia_semana);
      if (!DIAS.includes(dia)) return; // ignora sábado/domingo u otros valores

      const clave = `${h.hora_inicio}|${h.hora_fin}`;
      if (!franjas.has(clave)) {
        franjas.set(clave, { inicio: h.hora_inicio, fin: h.hora_fin, porDia: {} });
      }
      const franja = franjas.get(clave);
      (franja.porDia[dia] ||= []).push(h);
    });

    const ordenadas = [...franjas.values()].sort(
      (a, b) => aMinutos(a.inicio) - aMinutos(b.inicio) || aMinutos(a.fin) - aMinutos(b.fin)
    );

    if (!ordenadas.length) {
      mensajeTabla('Tu grado aún no tiene horario registrado.');
      return 0;
    }

    let html = '';
    let anterior = null;
    filasPdf = [];

    ordenadas.forEach((franja) => {
      // Un hueco entre dos franjas se muestra como recreo / receso
      if (anterior && aMinutos(franja.inicio) > aMinutos(anterior.fin)) {
        const minutos = aMinutos(franja.inicio) - aMinutos(anterior.fin);
        filasPdf.push({ receso: true, rango: rango(anterior.fin, franja.inicio), texto: minutos < 45 ? 'Recreo' : 'Receso' });
        html += `
          <tr>
            <td class="small text-muted-sarce">${rango(anterior.fin, franja.inicio)}</td>
            <td colspan="5"><div class="celda-clase libre">${minutos < 45 ? 'Recreo' : 'Receso'}</div></td>
          </tr>`;
      }

      const celdas = DIAS.map((dia) => {
        const clases = franja.porDia[dia];
        if (!clases) return '<td><div class="celda-clase libre">—</div></td>';
        return `<td>${clases
          .map((c) => `<div class="celda-clase">${esc(c.materia_nombre)}<small>${esc(c.docente_nombre)}</small></div>`)
          .join('')}</td>`;
      }).join('');

      html += `
        <tr>
          <td class="small text-muted-sarce">${rango(franja.inicio, franja.fin)}</td>
          ${celdas}
        </tr>`;

      filasPdf.push({
        receso: false,
        rango: rango(franja.inicio, franja.fin),
        celdas: DIAS.map(
          (dia) => (franja.porDia[dia] || []).map((c) => `${c.materia_nombre}\n${c.docente_nombre}`).join('\n') || '—'
        )
      });

      anterior = franja;
    });

    tbody.innerHTML = html;
    return ordenadas.reduce((total, f) => total + Object.values(f.porDia).reduce((s, l) => s + l.length, 0), 0);
  }

  // ---------- PDF ----------
  let filasPdf = [];

  function generarPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('No se pudo cargar el generador de PDF (revisa tu conexión a internet). Se abrirá la impresión del navegador.');
      window.print();
      return;
    }
    if (!filasPdf.length) {
      alert('Aún no hay un horario para exportar.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const ancho = doc.internal.pageSize.getWidth();
    const grado = nombreGrado.textContent;
    const fecha = new Date().toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 50, 100);
    doc.text('SARCE — CECMA', 40, 44);

    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text('Horario semanal de clases', 40, 64);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Estudiante: ${usuario.nombre}`, 40, 84);
    doc.text(`Grado: ${grado}`, 40, 98);
    doc.text(`Generado el ${fecha}`, ancho - 40, 84, { align: 'right' });

    doc.autoTable({
      startY: 112,
      head: [['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
      body: filasPdf.map((f) =>
        f.receso
          ? [
              f.rango,
              {
                content: f.texto,
                colSpan: 5,
                styles: { halign: 'center', fontStyle: 'italic', textColor: [90, 90, 90], fillColor: [238, 240, 244] }
              }
            ]
          : [f.rango, ...f.celdas]
      ),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 5, valign: 'middle', lineColor: [200, 205, 215] },
      headStyles: { fillColor: [20, 50, 100], textColor: 255, halign: 'center' },
      columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' } },
      margin: { left: 40, right: 40 }
    });

    const nombreArchivo = normalizar(grado).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'estudiante';
    doc.save(`Horario-${nombreArchivo}.pdf`);
  }

  // ---------- Carga inicial ----------
  mensajeTabla('Cargando horario...');

  try {
    // 1) Grado del estudiante
    const estudiante = await pedir(`/estudiantes/${usuario.id}`);
    nombreGrado.textContent = estudiante.grado;

    // 2) Horario de ese grado
    const horarios = await pedir(`/horarios/buscarPorGrado/${estudiante.grado_id}`);
    const total = construirTabla(horarios);
    subtitulo.textContent = total ? `${total} clases por semana` : '';
  } catch (err) {
    console.error(err);
    nombreGrado.textContent = '—';
    mensajeTabla(
      err.message === 'Estudiante no encontrado'
        ? 'Tu usuario no está registrado como estudiante, por lo que no tiene horario.'
        : `No se pudo cargar el horario (${err.message}). Verifica que el backend esté corriendo en ${API_URL}.`
    );
  }
})();