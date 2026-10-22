// js/estudiante-calendario.js
(async function () {
  const API_URL = 'http://localhost:3000';

  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) {
    const lista = document.getElementById('listaEventos');
    if (lista) {
      lista.innerHTML =
        '<p class="text-center text-danger py-4 mb-0">No se encontró la sesión. Verifica que <code>js/sesion.js</code> esté cargado en el &lt;head&gt; de esta página.</p>';
    }
    console.error('estudiante-calendario: window.sarceUsuario no está definido (¿falta js/sesion.js?)');
    return;
  }

  // ---------- Referencias al DOM ----------
  const tituloMes = document.getElementById('tituloMes');
  const btnAnterior = document.getElementById('btnMesAnterior');
  const btnSiguiente = document.getElementById('btnMesSiguiente');
  const listaEventos = document.getElementById('listaEventos');
  const proximoEvento = document.getElementById('proximoEvento');

  // ---------- Utilidades ----------
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const normalizar = (t) =>
    String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const soloFecha = (f) => String(f ?? '').slice(0, 10); // "YYYY-MM-DD"
  const partes = (f) => soloFecha(f).split('-').map(Number); // [año, mes, día]

  const hoyTexto = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const diasEntre = (desde, hasta) => {
    const [a1, m1, d1] = partes(desde);
    const [a2, m2, d2] = partes(hasta);
    return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
  };

  // Solo se muestra hora cuando el servidor la envía como texto ("2026-10-03 08:00:00")
  function horaDe(f) {
    const s = String(f ?? '');
    if (s.includes('T')) return '';
    const m = s.match(/\s(\d{2}):(\d{2})/);
    if (!m || (m[1] === '00' && m[2] === '00')) return '';
    const h = Number(m[1]);
    return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
  }

  const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // Nombre del día de la semana, sin depender de la zona horaria
  function diaSemana(f) {
    const [a, m, d] = partes(f);
    return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  }

  // "Sábado 3 de octubre" / "Del viernes 9 al domingo 11 de octubre"
  function textoFecha(inicio, fin) {
    const [a1, m1, d1] = partes(inicio);
    const [a2, m2, d2] = partes(fin);
    const mes = (m) => MESES[m - 1].toLowerCase();
    if (fin === inicio) return `${capitalizar(diaSemana(inicio))} ${d1} de ${mes(m1)}`;
    if (a1 === a2 && m1 === m2) return `Del ${diaSemana(inicio)} ${d1} al ${diaSemana(fin)} ${d2} de ${mes(m1)}`;
    return `Del ${diaSemana(inicio)} ${d1} de ${mes(m1)} al ${diaSemana(fin)} ${d2} de ${mes(m2)}`;
  }

  // Tipo → clase de color del diseño (tipo-evento / tipo-asueto / tipo-pausa)
  function claseTipo(tipo) {
    const t = normalizar(tipo);
    if (/asueto|feriado|festivo|vacacion/.test(t)) return 'tipo-asueto';
    if (/pausa|administrativ|pedagogic|receso/.test(t)) return 'tipo-pausa';
    return 'tipo-evento';
  }

  async function pedir(url) {
    const res = await fetch(`${API_URL}${url}`);
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
    return datos;
  }

  // ---------- Estado ----------
  let eventos = [];
  const hoy = hoyTexto();
  let [anio, mes] = partes(hoy); // mes 1-12

  // ---------- Pintar ----------
  function pintarMes() {
    tituloMes.innerHTML = `<i class="bi bi-calendar-event text-azul me-1"></i> ${MESES[mes - 1]} ${anio}`;

    const primero = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const ultimo = `${anio}-${String(mes).padStart(2, '0')}-${String(new Date(anio, mes, 0).getDate()).padStart(2, '0')}`;

    // Eventos que se cruzan con el mes mostrado
    const delMes = eventos.filter((e) => e.inicio <= ultimo && e.fin >= primero);

    if (!delMes.length) {
      listaEventos.innerHTML = '<p class="text-center text-muted-sarce py-4 mb-0">No hay eventos programados en este mes.</p>';
      return;
    }

    listaEventos.innerHTML = delMes
      .map((e) => {
        const [, m, d] = partes(e.inicio);
        const detalle = [e.descripcion, e.hora].filter(Boolean).join(', ');
        const lugar = e.lugar ? ` — ${e.lugar}` : '';
        const rango = textoFecha(e.inicio, e.fin);
        const grado = e.grado_nombre ? `Solo ${e.grado_nombre}` : '';
        const subtitulo = [e.tipo, rango, detalle + lugar, grado].filter((x) => x && x.trim()).join(' · ');

        return `
          <div class="evento-calendario ${claseTipo(e.tipo)}">
            <div class="evento-fecha"><span class="dia">${String(d).padStart(2, '0')}</span><span class="mes">${MESES_CORTO[m - 1]}</span></div>
            <div>
              <div class="fw-semibold" style="color:var(--sarce-azul-800);">${esc(e.titulo)}</div>
              <div class="small text-muted-sarce">${esc(subtitulo)}</div>
            </div>
          </div>`;
      })
      .join('');
  }

  function pintarProximo() {
    // El primer evento que aún no terminó (en curso o futuro)
    const siguiente = eventos.find((e) => e.fin >= hoy);

    if (!siguiente) {
      proximoEvento.innerHTML = '<p class="small text-muted-sarce mb-0">No hay eventos próximos.</p>';
      return;
    }

    const [, m, d] = partes(siguiente.inicio);
    const faltan = diasEntre(hoy, siguiente.inicio);
    let cuando;
    if (faltan < 0) cuando = 'En curso';
    else if (faltan === 0) cuando = 'Hoy';
    else if (faltan === 1) cuando = 'Mañana';
    else cuando = `En ${faltan} días`;

    cuando = `${capitalizar(diaSemana(siguiente.inicio))} · ${cuando}`;

    proximoEvento.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="evento-fecha" style="background: rgba(242,176,30,0.16);">
          <span class="dia" style="color:#A87400;">${String(d).padStart(2, '0')}</span><span class="mes">${MESES_CORTO[m - 1]}</span>
        </div>
        <div>
          <div class="fw-semibold small" style="color:var(--sarce-azul-800);">${esc(siguiente.titulo)}</div>
          <div class="small text-muted-sarce">${cuando}</div>
        </div>
      </div>`;
  }

  // ---------- Navegación de meses ----------
  btnAnterior.addEventListener('click', () => {
    mes -= 1;
    if (mes < 1) { mes = 12; anio -= 1; }
    pintarMes();
  });
  btnSiguiente.addEventListener('click', () => {
    mes += 1;
    if (mes > 12) { mes = 1; anio += 1; }
    pintarMes();
  });

  // ---------- Carga inicial ----------
  try {
    // Grado del estudiante: los eventos de un grado solo se muestran a ese grado
    let gradoId = null;
    try {
      gradoId = (await pedir(`/estudiantes/${usuario.id}`)).grado_id;
    } catch (err) {
      console.warn('No se pudo obtener el grado del estudiante; se mostrarán solo los eventos generales.', err);
    }

    const datos = await pedir('/eventos-calendario');

    eventos = datos
      .filter((e) => e.grado_id === null || e.grado_id === undefined || String(e.grado_id) === String(gradoId))
      .map((e) => {
        const inicio = soloFecha(e.fecha_inicio);
        return { ...e, titulo: e.titulo ?? e.nombre ?? 'Evento sin nombre', inicio, fin: soloFecha(e.fecha_fin) || inicio, hora: horaDe(e.fecha_inicio) };
      })
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    // Si el mes actual no tiene eventos, se abre en el mes del próximo evento
    const pad = (n) => String(n).padStart(2, '0');
    const primeroMes = `${anio}-${pad(mes)}-01`;
    const ultimoMes = `${anio}-${pad(mes)}-${pad(new Date(anio, mes, 0).getDate())}`;
    const hayEnMes = eventos.some((e) => e.inicio <= ultimoMes && e.fin >= primeroMes);
    const proximo = eventos.find((e) => e.fin >= hoy);
    if (!hayEnMes && proximo) [anio, mes] = partes(proximo.inicio);

    pintarMes();
    pintarProximo();
  } catch (err) {
    console.error(err);
    listaEventos.innerHTML = `<p class="text-center text-muted-sarce py-4 mb-0">No se pudieron cargar los eventos (${esc(err.message)}). Verifica que el backend esté corriendo en ${esc(API_URL)}.</p>`;
    proximoEvento.innerHTML = '<p class="small text-muted-sarce mb-0">—</p>';
  }
})();