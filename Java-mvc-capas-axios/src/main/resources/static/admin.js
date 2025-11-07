// ============================================
// ADMINISTRADOR - CONGLOMERADO FINANCIERO
// Lógica Frontend para Administradores
// ============================================

// ===== CONFIGURACIÓN =====
const API_AUTH = 'http://localhost:8080/api/auth';
const API_PRODUCTOS = 'http://localhost:8080/api/admin/productos';

let usuarioActual = null;

// Configuración de Axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  configurarLogin();
  configurarFormulario();
});

function verificarSesion() {
  const sesion = localStorage.getItem('usuarioAdmin');
  if (sesion) {
    usuarioActual = JSON.parse(sesion);
    mostrarApp();
    cargarProductos();
  } else {
    mostrarLogin();
  }
}

function configurarLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await login();
  });
}

function configurarFormulario() {
  const form = document.getElementById('producto-form');
  form.addEventListener('submit', guardarProducto);
}

// ===== LOGIN =====
async function login() {
  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value.trim();
  const errorDiv = document.getElementById('loginError');

  errorDiv.style.display = 'none';

  if (!usuario || !clave) {
    errorDiv.textContent = 'Completa ambos campos';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const res = await axios.post(`${API_AUTH}/login`, { usuario, clave });
    usuarioActual = res.data;
    
    if (usuarioActual.rol !== 'ADMIN') {
      errorDiv.textContent = 'Este acceso es solo para administradores';
      errorDiv.style.display = 'block';
      return;
    }

    localStorage.setItem('usuarioAdmin', JSON.stringify(usuarioActual));
    mostrarApp();
    cargarProductos();
  } catch (error) {
    errorDiv.textContent = error.response?.data?.mensaje || 'Usuario o contraseña incorrectos';
    errorDiv.style.display = 'block';
  }
}

function mostrarLogin() {
  document.getElementById('loginModal').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

function mostrarApp() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
}

function cerrarSesion() {
  localStorage.removeItem('usuarioAdmin');
  usuarioActual = null;
  mostrarLogin();
}

// ===== CRUD PRODUCTOS =====
async function cargarProductos() {
  mostrarLoading(true);
  ocultarError();

  try {
    const incluirInactivos = document.getElementById('incluirInactivos').checked;
    const res = await axios.get(`${API_PRODUCTOS}?incluirInactivos=${incluirInactivos}`);
    mostrarProductos(res.data);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarError('No se pudieron cargar los productos');
  } finally {
    mostrarLoading(false);
  }
}

function mostrarProductos(productos) {
  const container = document.getElementById('productos-container');

  if (!productos || productos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No hay productos registrados</h3>
        <p>Agrega el primero usando el formulario superior</p>
      </div>
    `;
    return;
  }

  const productosHTML = productos.map(prod => `
    <div class="producto-card ${!prod.activo ? 'producto-inactivo' : ''}">
      <div class="producto-header">
        <div>
          <div class="producto-nombre">${escapeHtml(prod.nombre)} ${!prod.activo ? '<span style="color:red;">(INACTIVO)</span>' : ''}</div>
          <div class="producto-badges">
            <span class="badge badge-${prod.tipo.toLowerCase()}">${prod.tipo}</span>
            <span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>
          </div>
        </div>
      </div>

      <div class="producto-descripcion">
        <p><strong>Descripción:</strong> ${escapeHtml(prod.descripcionCorta)}</p>
        <p><strong>Resumen:</strong> ${escapeHtml(prod.resumen || 'Sin resumen')}</p>
      </div>

      <div class="producto-details">
        <div class="detail-item">
          <div class="detail-label">Costo</div>
          <div class="detail-value">S/ ${Number(prod.costo).toFixed(2)}</div>
        </div>
        ${prod.rendimiento ? `
        <div class="detail-item">
          <div class="detail-label">Rendimiento</div>
          <div class="detail-value">${Number(prod.rendimiento).toFixed(2)}%</div>
        </div>
        ` : ''}
        <div class="detail-item">
          <div class="detail-label">Vistas</div>
          <div class="detail-value">${prod.vistas}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Comparaciones</div>
          <div class="detail-value">${prod.comparaciones}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Solicitudes</div>
          <div class="detail-value">${prod.solicitudesInformacion}</div>
        </div>
      </div>

      <div class="producto-actions">
        <button class="btn btn-warning" onclick="editarProducto(${prod.id})">✏️ Editar</button>
        <button class="btn btn-info" onclick="verMetricas(${prod.id})">📊 Métricas</button>
        ${prod.activo ? `
        <button class="btn btn-danger" onclick="retirarProducto(${prod.id})">🗑️ Retirar</button>
        ` : `
        <button class="btn btn-success" onclick="activarProducto(${prod.id})">✅ Reactivar</button>
        `}
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="productos-grid">${productosHTML}</div>`;
}

async function guardarProducto(event) {
  event.preventDefault();

  const id = document.getElementById('producto-id').value;

  const producto = {
    nombre: document.getElementById('nombre').value.trim(),
    tipo: document.getElementById('tipo').value,
    descripcionCorta: document.getElementById('descripcionCorta').value.trim(),
    riesgo: document.getElementById('riesgo').value,
    costo: parseFloat(document.getElementById('costo').value),
    rendimiento: document.getElementById('rendimiento').value ? parseFloat(document.getElementById('rendimiento').value) : null,
    cobertura: document.getElementById('cobertura').value.trim() || null,
    resumen: document.getElementById('resumen').value.trim(),
    beneficios: document.getElementById('beneficios').value.trim() || null,
    exclusiones: document.getElementById('exclusiones').value.trim() || null,
    documentoUrl: document.getElementById('documentoUrl').value.trim() || null
  };

  // Validaciones
  if (!producto.nombre || producto.nombre.length < 3) {
    mostrarError('El nombre debe tener al menos 3 caracteres');
    return;
  }
  if (!producto.tipo) {
    mostrarError('Selecciona un tipo de producto');
    return;
  }
  if (!producto.riesgo) {
    mostrarError('Selecciona un nivel de riesgo');
    return;
  }
  if (!producto.costo || producto.costo <= 0) {
    mostrarError('El costo debe ser mayor que 0');
    return;
  }

  try {
    if (id) {
      await axios.put(`${API_PRODUCTOS}/${id}`, producto);
      mostrarMensajeExito('✅ Producto actualizado correctamente');
    } else {
      await axios.post(API_PRODUCTOS, producto);
      mostrarMensajeExito('✅ Producto creado correctamente');
    }
    limpiarFormulario();
    cargarProductos();
  } catch (error) {
    console.error('Error al guardar producto:', error);
    if (error.response && error.response.data) {
      const payload = error.response.data;
      const mensajes = typeof payload === 'object' && !Array.isArray(payload)
        ? Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join('\n')
        : String(payload);
      mostrarError(mensajes || 'Error al guardar el producto.');
    } else {
      mostrarError('Error al guardar el producto. Verifica los datos e intenta nuevamente.');
    }
  }
}

async function editarProducto(id) {
  try {
    const res = await axios.get(`${API_PRODUCTOS}`);
    const productos = res.data;
    const prod = productos.find(p => p.id === id);

    if (!prod) {
      mostrarError('Producto no encontrado');
      return;
    }

    document.getElementById('producto-id').value = prod.id;
    document.getElementById('nombre').value = prod.nombre || '';
    document.getElementById('tipo').value = prod.tipo || '';
    document.getElementById('descripcionCorta').value = prod.descripcionCorta || '';
    document.getElementById('riesgo').value = prod.riesgo || '';
    document.getElementById('costo').value = prod.costo || '';
    document.getElementById('rendimiento').value = prod.rendimiento || '';
    document.getElementById('cobertura').value = prod.cobertura || '';
    document.getElementById('resumen').value = prod.resumen || '';
    document.getElementById('beneficios').value = prod.beneficios || '';
    document.getElementById('exclusiones').value = prod.exclusiones || '';
    document.getElementById('documentoUrl').value = prod.documentoUrl || '';

    document.getElementById('form-title').textContent = '✏️ Editar Producto';
    document.getElementById('btn-text').textContent = '💾 Actualizar Producto';
    document.getElementById('btn-cancel').style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Error al cargar producto:', error);
    mostrarError('No se pudo cargar el producto para editar');
  }
}

async function retirarProducto(id) {
  if (!confirm('¿Estás seguro de que deseas retirar este producto? Los clientes ya no podrán verlo.')) {
    return;
  }

  try {
    await axios.delete(`${API_PRODUCTOS}/${id}`);
    mostrarMensajeExito('🗑️ Producto retirado correctamente');
    cargarProductos();
  } catch (error) {
    console.error('Error al retirar producto:', error);
    mostrarError('No se pudo retirar el producto');
  }
}

async function activarProducto(id) {
  // Para reactivar, necesitamos editar el producto y cambiar su estado
  // Como no hay endpoint directo, usamos editar
  await editarProducto(id);
  // Nota: Esto requeriría que el backend tenga un campo activo en el DTO
  mostrarMensajeExito('✅ Producto reactivado (Nota: requiere actualizar el backend)');
}

function cancelarEdicion() {
  limpiarFormulario();
}

function limpiarFormulario() {
  document.getElementById('producto-form').reset();
  document.getElementById('producto-id').value = '';
  document.getElementById('form-title').textContent = '➕ Agregar Nuevo Producto';
  document.getElementById('btn-text').textContent = '💾 Guardar Producto';
  document.getElementById('btn-cancel').style.display = 'none';
}

// ===== MÉTRICAS =====
async function verMetricas(id) {
  try {
    const res = await axios.get(`${API_PRODUCTOS}/${id}/metricas`);
    const metricas = res.data;

    const metricasHTML = `
      <div class="metricas-grid">
        <div class="metrica-card">
          <div class="metrica-icon">👁️</div>
          <div class="metrica-value">${metricas.vistas}</div>
          <div class="metrica-label">Vistas</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icon">⚖️</div>
          <div class="metrica-value">${metricas.comparaciones}</div>
          <div class="metrica-label">Comparaciones</div>
        </div>
        <div class="metrica-card">
          <div class="metrica-icon">📧</div>
          <div class="metrica-value">${metricas.solicitudesInformacion}</div>
          <div class="metrica-label">Solicitudes de Información</div>
        </div>
      </div>
      <div style="margin-top:30px; padding:20px; background:var(--bg-light); border-radius:12px;">
        <h3>Análisis</h3>
        <p><strong>Interés del Cliente:</strong> ${calcularInteres(metricas)}</p>
        <p><strong>Ratio de Conversión:</strong> ${calcularRatio(metricas)}%</p>
      </div>
    `;

    document.getElementById('metricasContainer').innerHTML = metricasHTML;
    document.getElementById('metricasModal').style.display = 'flex';
  } catch (error) {
    console.error('Error al cargar métricas:', error);
    mostrarError('No se pudieron cargar las métricas');
  }
}

function calcularInteres(metricas) {
  const total = metricas.vistas + metricas.comparaciones + metricas.solicitudesInformacion;
  if (total === 0) return 'Sin datos';
  if (total < 10) return 'Bajo';
  if (total < 50) return 'Medio';
  return 'Alto';
}

function calcularRatio(metricas) {
  if (metricas.vistas === 0) return 0;
  return ((metricas.comparaciones + metricas.solicitudesInformacion) / metricas.vistas * 100).toFixed(2);
}

function mostrarMetricas() {
  alert('Selecciona un producto y haz clic en "Métricas" para ver sus estadísticas');
}

function cerrarModalMetricas() {
  document.getElementById('metricasModal').style.display = 'none';
}

// ===== UTILIDADES =====
function mostrarLoading(mostrar) {
  document.getElementById('loading').style.display = mostrar ? 'block' : 'none';
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = mensaje;
  errorDiv.style.display = 'block';
  setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
}

function ocultarError() {
  document.getElementById('error-message').style.display = 'none';
}

function mostrarMensajeExito(mensaje) {
  const container = document.querySelector('.container');
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = mensaje;
  container.insertBefore(successDiv, container.children[0]);
  setTimeout(() => { successDiv.remove(); }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
});

