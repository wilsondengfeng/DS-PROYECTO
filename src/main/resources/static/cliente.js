// ============================================
// CLIENTE - CONGLOMERADO FINANCIERO
// Lógica Frontend para Clientes
// ============================================

// ===== CONFIGURACIÓN =====
const API_BASE = window.location.origin;
const API_AUTH = `${API_BASE}/api/auth`;
const API_PRODUCTOS = `${API_BASE}/api/clientes/productos`;
const API_CONTRATOS = (clienteId) => `${API_BASE}/api/clientes/${clienteId}/contratos`;
const API_SOLICITUDES = (clienteId) => `${API_BASE}/api/clientes/${clienteId}/solicitudes`;

let usuarioActual = null;
let productosSeleccionados = new Set();
let productosContratados = [];
let contratosIds = new Set();
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
    cargarProductos();
    cargarContratos(true);
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
    cargarContratos(true);
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
  renderProductosContratados();
}

function cerrarSesion() {
  localStorage.removeItem('usuarioCliente');
  usuarioActual = null;
  productosSeleccionados.clear();
  productosContratados = [];
  contratosIds.clear();
  renderProductosContratados();
  mostrarLogin();
}

// ===== CARGA DE PRODUCTOS =====
async function cargarProductos(filtros = {}) {
  console.log('Cargando productos con filtros:', filtros);
  mostrarLoading(true);
  ocultarError();

  try {
    const tipoSeleccionado = filtros.tipo || (pestañaActual === 'fondos' ? 'FONDO' : 'SEGURO');
    const soloActivosSeleccion = filtros.soloActivos ??
      (document.getElementById('filtroSoloActivos')?.checked ?? true);
    const textoBusqueda = filtros.texto ??
      document.getElementById('filtroBusqueda')?.value.trim();

    const axiosParams = {
      tipo: tipoSeleccionado,
      soloActivos: soloActivosSeleccion
    };
    if (textoBusqueda) {
      axiosParams.texto = textoBusqueda;
    }

    const res = await axios.get(API_PRODUCTOS, { params: axiosParams });
    mostrarProductos(res.data);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    console.error('Detalles:', error.response?.data);
    mostrarError('No se pudieron cargar los productos: ' + (error.response?.data?.message || error.message));
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
            ${prod.tipo === 'FONDO' && prod.riesgo ? `<span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>` : ''}
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
        <p>${escapeHtml(prod.descripcion || 'Sin descripción')}</p>
      </div>

      <div class="producto-details"></div>

      <div class="producto-actions">
        <button class="btn btn-primary" onclick="verDetalle(${prod.id})">📄 Ver Detalles</button>
        ${
          contratosIds.has(prod.id)
            ? `<button class="btn btn-danger" onclick="eliminarContrato(${prod.id})">Eliminar producto</button>`
            : `<button class="btn btn-success" onclick="contratarProducto(${prod.id})">Contratar</button>`
        }
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="productos-grid">${productosHTML}</div>`;
}

// ===== PESTAÑAS =====
function cambiarPestaña(tipo, omitirCarga = false) {
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
  if (!omitirCarga) {
    aplicarFiltros();
  }
}

// ===== FILTROS =====
function aplicarFiltros() {
  const filtros = {
    tipo: pestañaActual === 'fondos' ? 'FONDO' : 'SEGURO',
    texto: document.getElementById('filtroBusqueda')?.value.trim(),
    soloActivos: document.getElementById('filtroSoloActivos')?.checked ?? true
  };

  cargarProductos(filtros);
}

function limpiarFiltros() {
  const busqueda = document.getElementById('filtroBusqueda');
  if (busqueda) busqueda.value = '';
  const soloActivos = document.getElementById('filtroSoloActivos');
  if (soloActivos) soloActivos.checked = true;
  productosSeleccionados.clear();

  aplicarFiltros(); // Mantener el tipo de pestaña activa
}

function mostrarTodosFondos() {
  cambiarPestaña('fondos', true);

  const busqueda = document.getElementById('filtroBusqueda');
  if (busqueda) busqueda.value = '';
  const soloActivos = document.getElementById('filtroSoloActivos');
  if (soloActivos) soloActivos.checked = true;

  cargarProductos({ tipo: 'FONDO', texto: '', soloActivos: true });
}

// ===== DETALLE DE PRODUCTO =====
async function verDetalle(id) {
  try {
    const res = await axios.get(`${API_PRODUCTOS}/${id}`);
    const prod = res.data;
    const estaContratado = contratosIds.has(prod.id);
    
    const detalleHTML = `
      <h2>${escapeHtml(prod.nombre)}</h2>
      <div class="producto-detalle-info">
        <div class="detalle-section">
          <h3>📋 Información General</h3>
          <p><strong>Tipo:</strong> ${prod.tipo}</p>
          ${prod.tipo === 'FONDO' ? `<p><strong>Riesgo:</strong> ${escapeHtml(prod.riesgo || 'Sin definir')}</p>` : ''}
          <p><strong>Descripción:</strong> ${escapeHtml(prod.descripcion || 'Sin descripción')}</p>
        </div>

        <div class="detalle-section">
          <h3>💰 Condiciones</h3>
          <p><strong>Costo:</strong> ${escapeHtml(prod.costo || 'No especificado')}</p>
          <p><strong>Plazo:</strong> ${escapeHtml(prod.plazo || 'No especificado')}</p>
        </div>

        <div class="detalle-section">
          <h3>✅ Beneficio</h3>
          <p>${escapeHtml(prod.beneficio || 'Beneficio no disponible')}</p>
        </div>

        <div class="detalle-actions">
          ${
            estaContratado
              ? `<button class="btn btn-danger" onclick="eliminarContrato(${prod.id}); cerrarModalProducto();">Eliminar producto</button>`
              : `<button class="btn btn-success" onclick="contratarProducto(${prod.id}); cerrarModalProducto();">Contratar</button>`
          }
          <button class="btn btn-secondary" onclick="solicitarInformacion(${prod.id})">
            📧 Solicitar Información
          </button>
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
    const atributos = [
      { label: 'Tipo', getter: (p) => p.tipo || 'N/A' },
      { label: 'Riesgo', getter: (p) => p.tipo === 'FONDO' ? (p.riesgo || 'Sin definir') : 'No aplica' },
      { label: 'Descripción', getter: (p) => p.descripcion },
      { label: 'Beneficio', getter: (p) => p.beneficio },
      { label: 'Costo', getter: (p) => p.costo },
      { label: 'Plazo', getter: (p) => p.plazo },
      { label: 'Estado', getter: (p) => (p.activo ? 'Disponible' : 'Inactivo') }
    ];

    let comparacionHTML = '<div class="comparacion-grid">';
    productos.forEach(prod => {
      const rows = atributos.map(attr => `
        <li>
          <span>${attr.label}:</span>
          <p>${escapeHtml(attr.getter(prod) || 'N/A')}</p>
        </li>
      `).join('');

      comparacionHTML += `
        <div class="comparacion-item">
          <h3>${escapeHtml(prod.nombre)}</h3>
          <ul class="comparacion-lista">
            ${rows}
          </ul>
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

// ===== CONTRATOS =====
async function cargarContratos(refrescarCatalogo = false) {
  if (!usuarioActual) return;

  try {
    const res = await axios.get(API_CONTRATOS(usuarioActual.id));
    productosContratados = Array.isArray(res.data) ? res.data : [];
    contratosIds = new Set(productosContratados.map(p => p.id));
    renderProductosContratados();
    if (refrescarCatalogo) {
      aplicarFiltros();
    }
  } catch (error) {
    console.error('Error al cargar contratos:', error);
    productosContratados = [];
    contratosIds = new Set();
    renderProductosContratados();
  }
}

function contratarProducto(productoId) {
  if (!usuarioActual) {
    mostrarLogin();
    return;
  }
  const destino = typeof productoId === 'number'
    ? `contratar.html?productoId=${productoId}`
    : 'contratar.html';
  window.location.href = destino;
}

async function eliminarContrato(productoId) {
  if (!usuarioActual) return;
  const confirmar = confirm('¿Deseas eliminar este producto contratado?');
  if (!confirmar) return;
  try {
    await axios.delete(`${API_CONTRATOS(usuarioActual.id)}/${productoId}`);
    await cargarContratos(true);
    alert('Producto eliminado de tus contratos.');
  } catch (error) {
    console.error('Error al eliminar contrato:', error);
    mostrarError('No se pudo eliminar el producto contratado');
  }
}

function renderProductosContratados() {
  const container = document.getElementById('contratados-container');
  if (!container) return;

  if (!usuarioActual) {
    container.innerHTML = '';
    return;
  }

  if (!productosContratados.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3>Aún no tienes productos contratados</h3>
        <p>Usa el botón "Contratar producto" para explorar el catálogo.</p>
      </div>
    `;
    return;
  }

  const cards = productosContratados.map(prod => {
    const descripcion = prod.descripcion || prod.resumen || 'Sin descripción disponible';
    const beneficio = prod.beneficio || 'Consulta a tu asesor';
    const tipoClase = (prod.tipo || 'FONDO').toLowerCase();
    const tipoTexto = prod.tipo || 'FONDO';

    return `
      <div class="producto-card producto-card-compacto">
        <div class="producto-header">
          <div>
            <div class="producto-nombre">${escapeHtml(prod.nombre)}</div>
            <div class="producto-badges">
              <span class="badge badge-${tipoClase}">${escapeHtml(tipoTexto)}</span>
              ${tipoTexto === 'FONDO' && prod.riesgo ? `<span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>` : ''}
              <span class="badge badge-contratado">Contratado</span>
            </div>
          </div>
        </div>

        <div class="producto-descripcion">
          <p>${escapeHtml(descripcion)}</p>
        </div>

        <div class="producto-details"></div>

        <div class="producto-actions">
          <button class="btn btn-primary" onclick="verDetalle(${prod.id})">Ver Detalles</button>
          <button class="btn btn-danger" onclick="eliminarContrato(${prod.id})">Eliminar producto</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cards;
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

function formatearMontoContratado(monto, referenciaMoneda = '') {
  if (monto === null || monto === undefined) {
    return 'Sin registro';
  }
  const texto = (referenciaMoneda || '').toLowerCase();
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

// Cerrar modales al hacer clic fuera
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
});

// Cargar productos al iniciar (si había sesión previa)
if (usuarioActual) {
  cambiarPestaña('fondos'); // Iniciar con fondos
  cargarContratos(true);
}
