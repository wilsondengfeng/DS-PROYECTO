const API_BASE = window.location.origin;
const API_ADMIN_CONTRATOS = `${API_BASE}/api/admin/contratos`;

let usuarioAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
  const sesion = localStorage.getItem('usuarioAdmin');
  if (!sesion) {
    window.location.href = 'admin.html';
    return;
  }
  usuarioAdmin = JSON.parse(sesion);
  cargarContratos();

  // hook up filtro controls
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');
  const filtroCliente = document.getElementById('filtroCliente');
  const filtroTipo = document.getElementById('filtroTipo');

  if (btnAplicar) btnAplicar.addEventListener('click', () => cargarContratos());
  if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
    if (filtroCliente) filtroCliente.value = '';
    if (filtroTipo) filtroTipo.value = 'TODOS';
    cargarContratos();
  });

  if (filtroCliente) {
    filtroCliente.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') cargarContratos();
    });
  }
});

async function cargarContratos() {
  const loading = document.getElementById('contratos-loading');
  const errorDiv = document.getElementById('contratos-error');
  const container = document.getElementById('contratos-container');
  loading.style.display = 'block';
  errorDiv.style.display = 'none';
  container.innerHTML = '';

  try {
    const res = await axios.get(API_ADMIN_CONTRATOS);
    const contratos = res.data || [];

    // Read current filtros
    const filtroTexto = (document.getElementById('filtroCliente')?.value || '').trim().toLowerCase();
    const filtroTipoSel = (document.getElementById('filtroTipo')?.value || 'TODOS');

    // Apply client-side filtering
    const contratosFiltrados = contratos.filter(c => {
      let okTipo = true;
      if (filtroTipoSel && filtroTipoSel !== 'TODOS') {
        okTipo = (String(c.tipo || '').toUpperCase() === String(filtroTipoSel).toUpperCase());
      }
      let okCliente = true;
      if (filtroTexto) {
        const nombre = String(c.usuarioNombre || '').toLowerCase();
        const email = String(c.usuarioEmail || '').toLowerCase();
        okCliente = nombre.includes(filtroTexto) || email.includes(filtroTexto);
      }
      return okTipo && okCliente;
    });

    document.getElementById('contador-contratos').textContent = `${contratosFiltrados.length} contratos`;

    if (!contratosFiltrados.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">??</div>
          <h3>No hay contratos registrados</h3>
          <p>No se encontraron contratos con los filtros aplicados.</p>
        </div>`;
      return;
    }
    const rows = contratosFiltrados.map(contrato => `
      <div class="producto-card contrato-card">
        <div class="producto-header">
          <div>
            <div class="producto-nombre">${escapeHtml(contrato.productoNombre)}</div>
            <div class="producto-badges">
              <span class="badge badge-${(contrato.tipo || 'FONDO').toLowerCase()}">${contrato.tipo}</span>
              ${contrato.riesgo ? `<span class="badge badge-riesgo-${contrato.riesgo.toLowerCase()}">Riesgo ${contrato.riesgo}</span>` : ''}
            </div>
          </div>
          <div class="text-muted">${new Date(contrato.creadoEn).toLocaleString()}</div>
        </div>
        <div class="producto-descripcion">
          <p><strong>Cliente:</strong> ${escapeHtml(contrato.usuarioNombre)} (${escapeHtml(contrato.usuarioEmail)})</p>
          <p><strong>Costo:</strong> ${escapeHtml(contrato.costo || 'No especificado')}</p>
          <p><strong>Monto contratado:</strong> ${formatearMonto(contrato.montoInvertido, contrato.costo)}</p>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="contratos-grid">${rows}</div>`;
  } catch (error) {
    console.error('Error al cargar contratos:', error);
    errorDiv.textContent = 'No se pudieron cargar los contratos. Intenta nuevamente.';
    errorDiv.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

function cerrarSesionAdmin() {
  localStorage.removeItem('usuarioAdmin');
  window.location.href = 'admin.html';
}

function formatearMonto(monto, referencia = '') {
  if (monto === null || monto === undefined) {
    return 'Sin registro';
  }
  const texto = (referencia || '').toLowerCase();
  const normalizada = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esDolar = texto.includes('usd') || normalizada.includes('dolar');
  const simbolo = esDolar ? '$' : 'S/';
  const numero = Number(monto);
  if (Number.isNaN(numero)) {
    return `${simbolo}0.00`;
  }
  return `${simbolo}${numero.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
