// ============================================
// CLIENTE - CONGLOMERADO FINANCIERO
// Lógica Frontend para Clientes
// ============================================

// ===== CONFIGURACIÓN =====
const API_AUTH = 'http://localhost:8080/api/auth';
const API_PRODUCTOS = 'http://localhost:8080/api/clientes/productos';
const API_FAVORITOS = (clienteId) => `http://localhost:8080/api/clientes/${clienteId}/favoritos`;
const API_SOLICITUDES = (clienteId) => `http://localhost:8080/api/clientes/${clienteId}/solicitudes`;

let usuarioActual = null;
let productosSeleccionados = new Set();
let productosFavoritos = new Set();
let pestañaActual = 'fondos'; // 'fondos' o 'seguros'

// Configuración de Axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  configurarLogin();
});

function verificarSesion() {
  const sesion = localStorage.getItem('usuarioCliente');
  if (sesion) {
    usuarioActual = JSON.parse(sesion);
    mostrarApp();
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
    
    if (usuarioActual.rol !== 'CLIENTE') {
      errorDiv.textContent = 'Este acceso es solo para clientes';
      errorDiv.style.display = 'block';
      return;
    }

    localStorage.setItem('usuarioCliente', JSON.stringify(usuarioActual));
    mostrarApp();
    cargarProductos();
    cargarFavoritos();
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
  localStorage.removeItem('usuarioCliente');
  usuarioActual = null;
  productosSeleccionados.clear();
  productosFavoritos.clear();
  mostrarLogin();
}

// ===== CARGA DE PRODUCTOS =====
async function cargarProductos(filtros = {}) {
  mostrarLoading(true);
  ocultarError();

  try {
    const params = new URLSearchParams();
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.riesgo) params.append('riesgo', filtros.riesgo);
    if (filtros.costoMax) params.append('costoMax', filtros.costoMax);
    if (filtros.rendimientoMin) params.append('rendimientoMin', filtros.rendimientoMin);
    if (filtros.cobertura) params.append('cobertura', filtros.cobertura);

    const res = await axios.get(`${API_PRODUCTOS}?${params.toString()}`);
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
        <h3>No se encontraron productos</h3>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    `;
    return;
  }

  const productosHTML = productos.map(prod => `
    <div class="producto-card" data-id="${prod.id}">
      <div class="producto-header">
        <div>
          <div class="producto-nombre">${escapeHtml(prod.nombre)}</div>
          <div class="producto-badges">
            <span class="badge badge-${prod.tipo.toLowerCase()}">${prod.tipo}</span>
            <span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>
          </div>
        </div>
        <div class="producto-actions-header">
          <input type="checkbox" class="checkbox-comparar" 
                 onchange="toggleComparacion(${prod.id})" 
                 ${productosSeleccionados.has(prod.id) ? 'checked' : ''}>
          <label>Comparar</label>
        </div>
      </div>

      <div class="producto-descripcion">
        <p>${escapeHtml(prod.resumen || 'Sin descripción')}</p>
      </div>

      <div class="producto-details">
        <div class="detail-item">
          <div class="detail-label">Costo Mensual</div>
          <div class="detail-value">S/ ${Number(prod.costo).toFixed(2)}</div>
        </div>
        ${prod.rendimiento ? `
        <div class="detail-item">
          <div class="detail-label">Rendimiento</div>
          <div class="detail-value">${Number(prod.rendimiento).toFixed(2)}%</div>
        </div>
        ` : ''}
        ${prod.cobertura ? `
        <div class="detail-item">
          <div class="detail-label">Cobertura</div>
          <div class="detail-value">${escapeHtml(prod.cobertura)}</div>
        </div>
        ` : ''}
      </div>

      <div class="producto-actions">
        <button class="btn btn-primary" onclick="verDetalle(${prod.id})">📄 Ver Detalles</button>
        <button class="btn btn-warning" onclick="toggleFavorito(${prod.id})" id="fav-${prod.id}">
          ${productosFavoritos.has(prod.id) ? '⭐ Quitar de Favoritos' : '☆ Agregar a Favoritos'}
        </button>
        ${prod.documentoUrl ? `
        <a href="${prod.documentoUrl}" target="_blank" class="btn btn-info">📄 Documento</a>
        ` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="productos-grid">${productosHTML}</div>`;
}

// ===== PESTAÑAS =====
function cambiarPestaña(tipo) {
  pestañaActual = tipo;
  
  // Actualizar botones de pestañas
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tipo}`).classList.add('active');
  
  // Actualizar título del catálogo
  const tituloCatalogo = document.getElementById('titulo-catalogo');
  if (tituloCatalogo) {
    tituloCatalogo.textContent = tipo === 'fondos' 
      ? '📋 Catálogo de Fondos de Inversión' 
      : '🛡️ Catálogo de Seguros';
  }
  
  // Limpiar selección de comparación al cambiar de pestaña
  productosSeleccionados.clear();
  actualizarCheckboxes();
  
  // Aplicar filtro de tipo automáticamente
  document.getElementById('filtroTipo').value = tipo === 'fondos' ? 'FONDO' : 'SEGURO';
  
  // Cargar productos del tipo seleccionado
  aplicarFiltros();
}

// ===== FILTROS =====
function aplicarFiltros() {
  const filtros = {
    tipo: pestañaActual === 'fondos' ? 'FONDO' : 'SEGURO',
    riesgo: document.getElementById('filtroRiesgo').value,
    costoMax: document.getElementById('filtroCostoMax').value || null,
    rendimientoMin: document.getElementById('filtroRendimientoMin').value || null,
    cobertura: document.getElementById('filtroCobertura').value || null
  };

  cargarProductos(filtros);
}

function limpiarFiltros() {
  document.getElementById('filtroRiesgo').value = '';
  document.getElementById('filtroCostoMax').value = '';
  document.getElementById('filtroRendimientoMin').value = '';
  document.getElementById('filtroCobertura').value = '';
  productosSeleccionados.clear();
  aplicarFiltros(); // Mantener el tipo de pestaña activa
}

// ===== DETALLE DE PRODUCTO =====
async function verDetalle(id) {
  try {
    const res = await axios.get(`${API_PRODUCTOS}/${id}`);
    const prod = res.data;
    
    const detalleHTML = `
      <h2>${escapeHtml(prod.nombre)}</h2>
      <div class="producto-detalle-info">
        <div class="detalle-section">
          <h3>📋 Información General</h3>
          <p><strong>Tipo:</strong> ${prod.tipo}</p>
          <p><strong>Riesgo:</strong> ${prod.riesgo}</p>
          <p><strong>Descripción:</strong> ${escapeHtml(prod.descripcionCorta)}</p>
        </div>

        <div class="detalle-section">
          <h3>💰 Costos y Rendimiento</h3>
          <p><strong>Costo Mensual:</strong> S/ ${Number(prod.costo).toFixed(2)}</p>
          ${prod.rendimiento ? `<p><strong>Rendimiento:</strong> ${Number(prod.rendimiento).toFixed(2)}%</p>` : ''}
        </div>

        ${prod.cobertura ? `
        <div class="detalle-section">
          <h3>🛡️ Cobertura</h3>
          <p>${escapeHtml(prod.cobertura)}</p>
        </div>
        ` : ''}

        <div class="detalle-section">
          <h3>📝 Resumen</h3>
          <p>${escapeHtml(prod.resumen || 'Sin resumen disponible')}</p>
        </div>

        ${prod.beneficios ? `
        <div class="detalle-section">
          <h3>✅ Beneficios</h3>
          <p>${escapeHtml(prod.beneficios)}</p>
        </div>
        ` : ''}

        ${prod.exclusiones ? `
        <div class="detalle-section">
          <h3>❌ Exclusiones</h3>
          <p>${escapeHtml(prod.exclusiones)}</p>
        </div>
        ` : ''}

        <div class="detalle-actions">
          <button class="btn btn-primary" onclick="toggleFavorito(${prod.id}); cerrarModalProducto();">
            ${productosFavoritos.has(prod.id) ? '⭐ Quitar de Favoritos' : '☆ Agregar a Favoritos'}
          </button>
          <button class="btn btn-secondary" onclick="solicitarInformacion(${prod.id})">
            📧 Solicitar Información
          </button>
          ${prod.documentoUrl ? `
          <a href="${prod.documentoUrl}" target="_blank" class="btn btn-info">📄 Ver Documento</a>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('productoDetalle').innerHTML = detalleHTML;
    document.getElementById('productoModal').style.display = 'flex';
  } catch (error) {
    console.error('Error al cargar detalle:', error);
    mostrarError('No se pudo cargar el detalle del producto');
  }
}

function cerrarModalProducto() {
  document.getElementById('productoModal').style.display = 'none';
}

// ===== COMPARACIÓN =====
function toggleComparacion(id) {
  if (productosSeleccionados.has(id)) {
    productosSeleccionados.delete(id);
  } else {
    if (productosSeleccionados.size >= 3) {
      alert('Solo puedes comparar hasta 3 productos a la vez');
      document.querySelector(`input[onchange="toggleComparacion(${id})"]`).checked = false;
      return;
    }
    productosSeleccionados.add(id);
  }
  actualizarCheckboxes();
}

function actualizarCheckboxes() {
  document.querySelectorAll('.checkbox-comparar').forEach(cb => {
    const id = parseInt(cb.closest('.producto-card').dataset.id);
    cb.checked = productosSeleccionados.has(id);
  });
}

async function mostrarComparacion() {
  if (productosSeleccionados.size < 2) {
    alert('Selecciona al menos 2 productos para comparar');
    return;
  }

  try {
    const res = await axios.post(`${API_PRODUCTOS}/comparar`, {
      productoIds: Array.from(productosSeleccionados)
    });

    const productos = res.data;
    let comparacionHTML = '<div class="comparacion-grid">';

    productos.forEach(prod => {
      comparacionHTML += `
        <div class="comparacion-item">
          <h3>${escapeHtml(prod.nombre)}</h3>
          <div class="comparacion-datos">
            <p><strong>Tipo:</strong> ${prod.tipo}</p>
            <p><strong>Riesgo:</strong> ${prod.riesgo}</p>
            <p><strong>Costo:</strong> S/ ${Number(prod.costo).toFixed(2)}</p>
            ${prod.rendimiento ? `<p><strong>Rendimiento:</strong> ${Number(prod.rendimiento).toFixed(2)}%</p>` : ''}
            ${prod.cobertura ? `<p><strong>Cobertura:</strong> ${escapeHtml(prod.cobertura)}</p>` : ''}
            <p><strong>Resumen:</strong> ${escapeHtml(prod.resumen || 'N/A')}</p>
          </div>
        </div>
      `;
    });

    comparacionHTML += '</div>';
    document.getElementById('comparacionContainer').innerHTML = comparacionHTML;
    document.getElementById('comparacionModal').style.display = 'flex';
  } catch (error) {
    console.error('Error al comparar:', error);
    mostrarError('No se pudieron comparar los productos');
  }
}

function cerrarModalComparacion() {
  document.getElementById('comparacionModal').style.display = 'none';
}

// ===== FAVORITOS =====
async function cargarFavoritos() {
  if (!usuarioActual) return;

  try {
    const res = await axios.get(API_FAVORITOS(usuarioActual.id));
    productosFavoritos = new Set(res.data.map(p => p.id));
    actualizarBotonesFavoritos();
  } catch (error) {
    console.error('Error al cargar favoritos:', error);
  }
}

async function toggleFavorito(productoId) {
  if (!usuarioActual) return;

  try {
    if (productosFavoritos.has(productoId)) {
      await axios.delete(`${API_FAVORITOS(usuarioActual.id)}/${productoId}`);
      productosFavoritos.delete(productoId);
    } else {
      await axios.post(`${API_FAVORITOS(usuarioActual.id)}/${productoId}`);
      productosFavoritos.add(productoId);
    }
    actualizarBotonesFavoritos();
  } catch (error) {
    console.error('Error al actualizar favorito:', error);
    mostrarError('No se pudo actualizar el favorito');
  }
}

function actualizarBotonesFavoritos() {
  productosFavoritos.forEach(id => {
    const btn = document.getElementById(`fav-${id}`);
    if (btn) {
      btn.textContent = '⭐ Quitar de Favoritos';
    }
  });
  
  document.querySelectorAll('[id^="fav-"]').forEach(btn => {
    const id = parseInt(btn.id.replace('fav-', ''));
    if (!productosFavoritos.has(id)) {
      btn.textContent = '☆ Agregar a Favoritos';
    }
  });
}

async function mostrarFavoritos() {
  await cargarFavoritos();
  if (productosFavoritos.size === 0) {
    alert('No tienes productos favoritos');
    return;
  }
  // Filtrar para mostrar solo favoritos
  aplicarFiltros();
}

// ===== SOLICITUD DE INFORMACIÓN =====
async function solicitarInformacion(productoId) {
  const mensaje = prompt('Ingresa tu mensaje o pregunta sobre este producto:');
  if (!mensaje || !mensaje.trim()) return;

  try {
    await axios.post(API_SOLICITUDES(usuarioActual.id), {
      productoId: productoId,
      mensaje: mensaje.trim()
    });
    alert('✅ Tu solicitud ha sido enviada. Nos pondremos en contacto contigo pronto.');
    cerrarModalProducto();
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    mostrarError('No se pudo enviar la solicitud');
  }
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

// Cargar productos al iniciar
if (usuarioActual) {
  cambiarPestaña('fondos'); // Iniciar con fondos
  cargarFavoritos();
}

