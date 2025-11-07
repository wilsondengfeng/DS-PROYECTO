const API_ADMIN_CONTRATOS = 'http://localhost:8080/api/admin/contratos';

let usuarioAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
  const sesion = localStorage.getItem('usuarioAdmin');
  if (!sesion) {
    window.location.href = 'admin.html';
    return;
  }
  usuarioAdmin = JSON.parse(sesion);
  cargarContratos();
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
    document.getElementById('contador-contratos').textContent = `${contratos.length} contratos`;

    if (!contratos.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">??</div>
          <h3>No hay contratos registrados</h3>
          <p>Aún no hay clientes con productos contratados.</p>
        </div>`;
      return;
    }

    const rows = contratos.map(contrato => `
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
