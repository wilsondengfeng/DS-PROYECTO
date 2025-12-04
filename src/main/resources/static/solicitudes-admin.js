const API_BASE = window.location.origin;
const API_SOLICITUDES_ADMIN = `${API_BASE}/api/admin/solicitudes`;

document.addEventListener('DOMContentLoaded', () => {
  cargarSolicitudes();
});

async function cargarSolicitudes() {
  const cont = document.getElementById('solicitudes-container');
  const loading = document.getElementById('loading');
  const err = document.getElementById('error-message');
  cont.innerHTML = '';
  err.style.display = 'none';
  loading.style.display = 'block';

  try {
    const res = await axios.get(API_SOLICITUDES_ADMIN);
    const datos = res.data || [];
    if (!datos.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No hay solicitudes</h3><p>Actualmente no hay solicitudes de información.</p></div>';
      return;
    }

    const rows = datos.map(s => `
      <div class="producto-card solicitud-card" data-id="${s.id}">
        <div class="producto-header">
          <div>
            <div class="producto-nombre">${escapeHtml(s.productoNombre || 'Producto')}</div>
            <div class="producto-badges">
              <span class="badge badge-seguro">Solicitud</span>
            </div>
          </div>
          <div class="producto-actions-header">
            <small>${s.creadoEn ? new Date(s.creadoEn).toLocaleString() : ''}</small>
          </div>
        </div>
        <div class="producto-descripcion">
          <p><strong>Usuario:</strong> ${escapeHtml(s.usuarioNombre || '')} &lt;${escapeHtml(s.usuarioEmail || '')}&gt;</p>
          <p><strong>Mensaje:</strong> ${escapeHtml(s.mensaje || '')}</p>
        </div>
        <div class="producto-actions">
          <button class="btn btn-primary" onclick="verSolicitud(${s.id})">Ver</button>
          <button class="btn btn-danger" onclick="eliminarSolicitud(${s.id})">Eliminar</button>
        </div>
      </div>
    `).join('');

    cont.innerHTML = `<div class="productos-grid">${rows}</div>`;
  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    err.textContent = 'No se pudieron cargar las solicitudes. Reintenta más tarde.';
    err.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function verSolicitud(id) {
  const card = document.querySelector(`#solicitudes-container .solicitud-card[data-id='${id}']`);
  if (!card) return;
  alert(card.querySelector('.producto-descripcion').innerText);
}

async function eliminarSolicitud(id) {
  if (!confirm('¿Eliminar esta solicitud?')) return;
  try {
    await axios.delete(`${API_SOLICITUDES_ADMIN}/${id}`);
    alert('Solicitud eliminada');
    cargarSolicitudes();
  } catch (error) {
    console.error('Error eliminando solicitud:', error);
    alert('No se pudo eliminar la solicitud');
  }
}
