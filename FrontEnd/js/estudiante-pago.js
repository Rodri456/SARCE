// js/estudiante-pagos.js

// Valor del enum "estado" que se guarda cuando una cuota se paga.
// Si en tu base de datos se llama distinto (ej. 'pagada'), cámbialo aquí.

(async function () {
  const API_URL = 'http://localhost:3000';
  const ESTADO_PAGADO = 'pagado';
  const usuario = window.sarceUsuario; // lo define js/sesion.js
  if (!usuario) return;

  // ---------- Referencias al DOM ----------
  const main = document.querySelector('main.app-contenido');
  const stats = document.querySelectorAll('.stat-sarce .valor-stat');
  const tabla = document.querySelector('table.tabla-sarce');
  const thead = tabla.querySelector('thead');
  const tbody = tabla.querySelector('tbody');

  const form = document.querySelector('.col-lg-5 form');
  const [selCuota, selMetodo] = form.querySelectorAll('select');
  const [inpTarjeta, inpVenc, inpCvv] = form.querySelectorAll('input');
  const filaTarjeta = form.querySelector('.row.g-2');
  const btnPagar = form.querySelector('button[type="submit"]');

  thead.innerHTML = `
    <tr>
      <th>Concepto</th>
      <th>Fecha</th>
      <th class="text-end">Monto</th>
      <th class="text-center">Estado</th>
      <th></th>
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
    if (tipo === 'success') temporizador = setTimeout(() => alerta.classList.add('d-none'), 5000);
  }

  // ---------- Utilidades ----------
  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const dinero = (n) => '$' + Number(n).toFixed(2);
  const soloFecha = (f) => String(f ?? '').slice(0, 10); // "YYYY-MM-DD"
  const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

  function fechaLarga(f) {
    const [a, m, d] = soloFecha(f).split('-');
    if (!a || !m || !d) return '—';
    return `${d} ${MESES[Number(m) - 1]} ${a}`;
  }
  function fechaCorta(f) {
    const [, m, d] = soloFecha(f).split('-');
    if (!m || !d) return '—';
    return `${d} ${MESES[Number(m) - 1].replace('.', '')}`;
  }

  const esPagado = (estado) => ['pagado', 'pagada'].includes(String(estado).toLowerCase());
  const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  async function pedir(url, opciones) {
    const res = await fetch(`${API_URL}${url}`, opciones);
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.message || `Error ${res.status}`);
    return datos;
  }

  // ---------- Estado ----------
  let pagos = [];

  async function cargarPagos() {
    const datos = await pedir(`/pagos/estudiante/${usuario.id}`);
    pagos = datos
      .map((p) => ({ ...p, monto: Number(p.monto), fecha: soloFecha(p.fecha) }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  // ---------- Pintar ----------
  function pintar() {
    const pagados = pagos.filter((p) => esPagado(p.estado));
    const pendientes = pagos.filter((p) => !esPagado(p.estado));

    // Tarjetas de resumen
    const saldo = pendientes.reduce((s, p) => s + p.monto, 0);
    const proximo = pendientes.map((p) => p.fecha).sort()[0];
    stats[0].textContent = dinero(saldo);
    stats[1].textContent = pagados.length;
    stats[2].textContent = proximo ? fechaCorta(proximo) : '—';
    stats[3].textContent = pagos.length;

    // Historial
    if (!pagos.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted-sarce py-4">Aún no tienes cuotas registradas.</td></tr>';
    } else {
      tbody.innerHTML = pagos
        .map((p) => {
          const pagado = esPagado(p.estado);
          const badge = pagado
            ? '<span class="badge-pago-pagado">Pagado</span>'
            : `<span class="badge-pago-pendiente">${esc(capitalizar(String(p.estado)))}</span>`;
          const accion = pagado
            ? `<a href="#" class="small text-azul" data-accion="comprobante" data-id="${esc(p.pago_id)}">Comprobante</a>`
            : `<a href="#" class="small text-azul" data-accion="pagar" data-id="${esc(p.pago_id)}">Pagar</a>`;
          return `
            <tr>
              <td>${esc(p.concepto)}</td>
              <td>${fechaLarga(p.fecha)}</td>
              <td class="text-end">${dinero(p.monto)}</td>
              <td class="text-center">${badge}</td>
              <td class="text-end">${accion}</td>
            </tr>`;
        })
        .join('');
    }

    // Formulario de pago
    const seleccionPrevia = selCuota.value;
    if (pendientes.length) {
      selCuota.innerHTML = pendientes
        .slice()
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map((p) => `<option value="${esc(p.pago_id)}">${esc(p.concepto)} (${dinero(p.monto)})</option>`)
        .join('');
      if ([...selCuota.options].some((o) => o.value === seleccionPrevia)) selCuota.value = seleccionPrevia;
      form.querySelectorAll('select, input, button').forEach((el) => (el.disabled = false));
    } else {
      selCuota.innerHTML = '<option>No tienes cuotas pendientes</option>';
      form.querySelectorAll('select, input, button').forEach((el) => (el.disabled = true));
    }
    actualizarBoton();
  }

  function cuotaSeleccionada() {
    return pagos.find((p) => String(p.pago_id) === selCuota.value && !esPagado(p.estado));
  }

  function actualizarBoton() {
    const p = cuotaSeleccionada();
    btnPagar.innerHTML = p
      ? `<i class="bi bi-lock-fill me-1"></i> Confirmar pago de ${dinero(p.monto)}`
      : '<i class="bi bi-check2-circle me-1"></i> Sin pagos pendientes';
  }

  // ---------- Comprobante ----------
  function abrirComprobante(p) {
    const w = window.open('', '_blank');
    if (!w) {
      aviso('danger', 'El navegador bloqueó la ventana del comprobante. Permite las ventanas emergentes e inténtalo de nuevo.');
      return;
    }
    w.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Comprobante de pago #${esc(p.pago_id)}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:520px;margin:40px auto;color:#222}
  h1{font-size:20px;margin:0 0 4px} .sub{color:#666;margin:0 0 24px}
  table{width:100%;border-collapse:collapse} td{padding:8px 0;border-bottom:1px solid #ddd}
  td:first-child{color:#666} .total{font-size:18px;font-weight:bold}
  button{margin-top:24px;padding:8px 16px;cursor:pointer}
  @media print{button{display:none}}
</style></head><body>
  <h1>SARCE — CECMA</h1>
  <p class="sub">Comprobante de pago #${esc(p.pago_id)}</p>
  <table>
    <tr><td>Estudiante</td><td>${esc(p.estudiante_nombre)}</td></tr>
    <tr><td>Grado</td><td>${esc(p.grado_nombre)}</td></tr>
    <tr><td>Concepto</td><td>${esc(p.concepto)}</td></tr>
    <tr><td>Fecha</td><td>${fechaLarga(p.fecha)}</td></tr>
    <tr><td>Estado</td><td>${esc(capitalizar(String(p.estado)))}</td></tr>
    <tr><td>Monto</td><td class="total">${dinero(p.monto)}</td></tr>
  </table>
  <button onclick="window.print()">Imprimir</button>
</body></html>`);
    w.document.close();
  }

  // ---------- Eventos ----------
  tbody.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[data-accion]');
    if (!enlace) return;
    e.preventDefault();

    const pago = pagos.find((p) => String(p.pago_id) === enlace.dataset.id);
    if (!pago) return;

    if (enlace.dataset.accion === 'comprobante') {
      abrirComprobante(pago);
    } else {
      selCuota.value = String(pago.pago_id);
      actualizarBoton();
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inpTarjeta.focus();
    }
  });

  selCuota.addEventListener('change', actualizarBoton);

  selMetodo.addEventListener('change', () => {
    const conTarjeta = selMetodo.value.toLowerCase().includes('tarjeta') || selMetodo.selectedIndex === 0;
    filaTarjeta.classList.toggle('d-none', !conTarjeta);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pago = cuotaSeleccionada();
    if (!pago) return;

    const conTarjeta = selMetodo.selectedIndex === 0;
    if (conTarjeta) {
      const numero = inpTarjeta.value.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(numero)) return aviso('danger', 'El número de tarjeta no es válido.');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(inpVenc.value.trim())) return aviso('danger', 'El vencimiento debe tener el formato MM/AA.');
      if (!/^\d{3,4}$/.test(inpCvv.value.trim())) return aviso('danger', 'El CVV debe tener 3 o 4 dígitos.');
    }

    const textoBoton = btnPagar.innerHTML;
    btnPagar.disabled = true;
    btnPagar.textContent = 'Procesando...';

    try {
      // Los datos de la tarjeta NO se envían al servidor: solo se marca la cuota como pagada.
      await pedir(`/pagos/${pago.pago_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudianteId: usuario.id,
          monto: pago.monto,
          concepto: pago.concepto,
          estado: ESTADO_PAGADO,
          fecha: pago.fecha
        })
      });

      inpTarjeta.value = '';
      inpVenc.value = '';
      inpCvv.value = '';

      await cargarPagos();
      pintar();
      aviso('success', `Pago de ${dinero(pago.monto)} registrado: ${pago.concepto}.`);
    } catch (err) {
      console.error(err);
      aviso('danger', `No se pudo registrar el pago: ${err.message}`);
      btnPagar.innerHTML = textoBoton;
      btnPagar.disabled = false;
    }
  });

  // ---------- Carga inicial ----------
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted-sarce py-4">Cargando pagos...</td></tr>';

  try {
    await cargarPagos();
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted-sarce py-4">No se pudieron cargar los pagos. Verifica que el backend esté corriendo.</td></tr>';
    return;
  }

  pintar();
})();