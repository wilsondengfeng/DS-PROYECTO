// ============================================
// ADMINISTRADOR - CONGLOMERADO FINANCIERO
// Lógica Frontend para Administradores
// ============================================

// ===== CONFIGURACIÓN =====
const API_BASE = window.location.origin;
const API_AUTH = `${API_BASE}/api/auth`;
const API_PRODUCTOS = `${API_BASE}/api/admin/productos`;

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
  const tipoSelect = document.getElementById('tipo');
  tipoSelect.addEventListener('change', toggleCampoRiesgo);
  toggleCampoRiesgo();
}

function toggleCampoRiesgo() {
  const tipo = document.getElementById('tipo').value;
  const campo = document.getElementById('campo-riesgo');
  if (tipo === 'FONDO') {
    campo.style.display = 'block';
  } else {
    campo.style.display = 'none';
    document.getElementById('riesgo').value = '';
  }
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
            <span class="badge badge-${(prod.tipo || 'FONDO').toLowerCase()}">${prod.tipo || 'FONDO'}</span>
            ${prod.tipo === 'FONDO' && prod.riesgo ? `<span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="producto-descripcion">
        <p><strong>Descripción:</strong> ${escapeHtml(prod.descripcion)}</p>
        <p><strong>Beneficio:</strong> ${escapeHtml(prod.beneficio || 'Sin beneficio definido')}</p>
      </div>

      <div class="producto-details">
        ${prod.tipo === 'FONDO' ? `
        <div class="detail-item">
          <div class="detail-label">Riesgo</div>
          <div class="detail-value">${escapeHtml(prod.riesgo || 'Sin definir')}</div>
        </div>` : ''}
        <div class="detail-item">
          <div class="detail-label">Costo</div>
          <div class="detail-value">${escapeHtml(prod.costo || 'No especificado')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Plazo</div>
          <div class="detail-value">${escapeHtml(prod.plazo || 'No especificado')}</div>
        </div>
      </div>

      <div class="producto-actions">
        <button class="btn btn-warning" onclick="editarProducto(${prod.id})">✏️ Editar</button>
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
    descripcion: document.getElementById('descripcion').value.trim(),
    beneficio: document.getElementById('beneficio').value.trim() || null,
    costo: document.getElementById('costo').value.trim() || null,
    plazo: document.getElementById('plazo').value.trim() || null,
    riesgo: null,
    activo: document.getElementById('activo').checked
  };

  if (producto.tipo === 'FONDO') {
    producto.riesgo = document.getElementById('riesgo').value || null;
    if (!producto.riesgo) {
      mostrarError('Selecciona el nivel de riesgo para fondos');
      return;
    }
  }

  // Validaciones básicas
  if (!producto.nombre || producto.nombre.length < 3) {
    mostrarError('El nombre debe tener al menos 3 caracteres');
    return;
  }
  if (!producto.tipo) {
    mostrarError('Selecciona un tipo de producto');
    return;
  }
  if (!producto.descripcion) {
    mostrarError('Describe el producto');
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
    const res = await axios.get(`${API_PRODUCTOS}/${id}`);
    const prod = res.data;

    document.getElementById('producto-id').value = prod.id;
    document.getElementById('nombre').value = prod.nombre || '';
    document.getElementById('tipo').value = prod.tipo || '';
    document.getElementById('riesgo').value = prod.riesgo || '';
    toggleCampoRiesgo();
    if (prod.tipo === 'FONDO') {
      document.getElementById('riesgo').value = prod.riesgo || '';
    }
    document.getElementById('descripcion').value = prod.descripcion || '';
    document.getElementById('beneficio').value = prod.beneficio || '';
    document.getElementById('costo').value = prod.costo || '';
    document.getElementById('plazo').value = prod.plazo || '';
    document.getElementById('activo').checked = prod.activo;

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
  try {
    const res = await axios.get(`${API_PRODUCTOS}/${id}`);
    const prod = res.data;
    const payload = {
      nombre: prod.nombre,
      tipo: prod.tipo,
      descripcion: prod.descripcion,
      beneficio: prod.beneficio,
      costo: prod.costo,
      plazo: prod.plazo,
      riesgo: prod.tipo === 'FONDO' ? prod.riesgo : null,
      activo: true
    };
    await axios.put(`${API_PRODUCTOS}/${id}`, payload);
    mostrarMensajeExito('✅ Producto reactivado correctamente');
    cargarProductos();
  } catch (error) {
    console.error('Error al reactivar producto:', error);
    mostrarError('No se pudo reactivar el producto');
  }
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
  document.getElementById('activo').checked = true;
  toggleCampoRiesgo();
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

