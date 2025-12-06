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
const API_SALDO_BASE = (clienteId) => `${API_BASE}/api/usuarios/${clienteId}`;
const API_CHATBOT = `${API_BASE}/api/chatbot`;

const MONEDAS = {
  SOL: { simbolo: 'S/', nombre: 'soles' },
  USD: { simbolo: '$', nombre: 'dolares' }
};

let usuarioActual = null;
let productosSeleccionados = new Set();
let productosContratados = [];
let contratosIds = new Set();
let saldoSol = 0;
let saldoUsd = 0;
let pestañaActual = 'fondos'; // 'fondos' o 'seguros'
let catalogoCache = [];

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
    cargarSaldo();
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
    cargarSaldo();
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
  renderSaldoCaja();
  renderProductosContratados();
}

function cerrarSesion() {
  localStorage.removeItem('usuarioCliente');
  usuarioActual = null;
  productosSeleccionados.clear();
  productosContratados = [];
  contratosIds.clear();
  saldoSol = 0;
  saldoUsd = 0;
  renderSaldoCaja();
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
    const soloActivosSeleccion = filtros.soloActivos ?? true;
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
    catalogoCache = Array.isArray(res.data) ? res.data : [];
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
            ${prod.moneda ? `<span class="badge badge-moneda">${escapeHtml(prod.moneda)}</span>` : ''}
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
      ? '📋 Catalogo de Fondos de Inversion' 
      : '🛡️ Catalogo de Seguros';
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
    soloActivos: true
  };

  cargarProductos(filtros);
}

function limpiarFiltros() {
  const busqueda = document.getElementById('filtroBusqueda');
  if (busqueda) busqueda.value = '';
  productosSeleccionados.clear();

  aplicarFiltros(); // Mantener el tipo de pestaña activa
}

function mostrarTodosFondos() {
  cambiarPestaña('fondos', true);

  const busqueda = document.getElementById('filtroBusqueda');
  if (busqueda) busqueda.value = '';
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
          <p><strong>Visitas:</strong> ${prod.visitas ?? 0}</p>
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
    renderSaldoCaja();
    if (refrescarCatalogo) {
      aplicarFiltros();
    }
  } catch (error) {
    console.error('Error al cargar contratos:', error);
    productosContratados = [];
    contratosIds = new Set();
    renderProductosContratados();
    renderSaldoCaja();
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
  const confirmar = confirm('Deseas eliminar este producto contratado?');
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

async function aumentarInversion(productoId) {
  if (!usuarioActual) return;
  const producto = productosContratados.find(p => p.id === productoId);
  const actual = Number(producto?.montoInvertido || 0);
  const valor = prompt('Cuanto deseas invertir adicionalmente en este producto?');
  if (valor === null) return;
  const montoAdicional = normalizarEntradaMonetaria(valor);
  if (montoAdicional === null) {
    alert('Monto invalido. Intenta nuevamente.');
    return;
  }
  const nuevoTotal = Math.round((actual + montoAdicional) * 100) / 100;
  try {
    const url = API_CONTRATOS(usuarioActual.id) + '/' + productoId;
    console.log('URL:', url, 'Monto total:', nuevoTotal);
    const res = await axios.post(url, { monto: nuevoTotal });
    console.log('Respuesta:', res.data);
    await cargarSaldo();
    await cargarContratos(true);
    alert('Inversion aumentada correctamente.');
  } catch (error) {
    console.error('Error al aumentar inversion:', error);
    console.error('Detalles:', error.response?.data);
    const msg = error.response?.data?.mensaje || 'No se pudo aumentar la inversion';
    alert(msg + ' (Status: ' + (error.response?.status || '?') + ')');
    mostrarError(msg);
  }
}

async function disminuirInversion(productoId) {
  if (!usuarioActual) return;
  const producto = productosContratados.find(p => p.id === productoId);
  const actual = Number(producto?.montoInvertido || 0);
  if (!producto) {
    alert('No encontramos el producto en tus contratos.');
    return;
  }
  const valor = prompt(`Cuanto deseas reducir de este producto? Monto actual: ${formatearMontoContratado(actual, producto.moneda || '')}`);
  if (valor === null) return;
  const reduccion = normalizarEntradaMonetaria(valor);
  if (reduccion === null) {
    alert('Monto invalido. Intenta nuevamente.');
    return;
  }
  if (reduccion > actual) {
    alert('No puedes reducir mas de lo invertido.');
    return;
  }
  const nuevoTotal = Math.max(0, Math.round((actual - reduccion) * 100) / 100);
  try {
    const url = API_CONTRATOS(usuarioActual.id) + '/' + productoId;
    const res = await axios.post(url, { monto: nuevoTotal });
    console.log('Respuesta:', res.data);
    await cargarSaldo();
    await cargarContratos(true);
    alert('Inversion reducida correctamente.');
  } catch (error) {
    console.error('Error al disminuir inversion:', error);
    const msg = error.response?.data?.mensaje || 'No se pudo reducir la inversion';
    alert(msg);
    mostrarError(msg);
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
              ${prod.moneda ? `<span class="badge badge-moneda">${escapeHtml(prod.moneda)}</span>` : ''}
              ${tipoTexto === 'FONDO' && prod.riesgo ? `<span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>` : ''}
              <span class="badge badge-contratado">Contratado</span>
            </div>
          </div>
        </div>

        <div class="producto-descripcion">
          <p>${escapeHtml(descripcion)}</p>
          <p><strong>Monto invertido:</strong> ${formatearMontoContratado(prod.montoInvertido, prod.moneda || prod.costo)}</p>
        </div>

        <div class="producto-details"></div>

        <div class="producto-actions">
          <button class="btn btn-primary" onclick="verDetalle(${prod.id})">Ver Detalles</button>
          ${tipoTexto === 'SEGURO' ? '' : `<button class="btn btn-warning" onclick="aumentarInversion(${prod.id})">Aumentar inversion</button>`}
          ${tipoTexto === 'SEGURO' ? '' : `<button class="btn btn-secondary" onclick="disminuirInversion(${prod.id})">Disminuir inversion</button>`}
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
  const texto = (referenciaMoneda || '').toString();
  const upper = texto.toUpperCase();
  const normalizada = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esDolar = upper === 'USD' || normalizada.includes('usd') || normalizada.includes('dolar');
  const simbolo = esDolar ? '$' : 'S/';
  const numero = Number(monto);
  if (Number.isNaN(numero)) {
    return `${simbolo}0.00`;
  }
  return `${simbolo}${numero.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const sanitized = text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const div = document.createElement('div');
    div.textContent = sanitized;
    return div.innerHTML;
}


// ===== SALDO (API) =====
async function cargarSaldo() {
  if (!usuarioActual) {
    saldoSol = 0;
    saldoUsd = 0;
    renderSaldoCaja();
    return;
  }
  try {
    const [solRes, usdRes] = await Promise.all([
      axios.get(API_SALDO_BASE(usuarioActual.id) + '/saldo?moneda=SOL'),
      axios.get(API_SALDO_BASE(usuarioActual.id) + '/saldo?moneda=USD')
    ]);
    saldoSol = Number(solRes.data?.saldo ?? 0);
    saldoUsd = Number(usdRes.data?.saldo ?? 0);
    console.log('Saldos cargados - SOL:', saldoSol, 'USD:', saldoUsd);
    renderSaldoCaja();
  } catch (error) {
    console.error('Error al obtener saldo:', error);
    console.error('Detalles:', error.response?.data);
  }
}

async function procesarOperacionSaldo(moneda, tipo, monto) {
  try {
    // Validaciones
    if (!usuarioActual || !usuarioActual.id) {
      alert('Por favor inicia sesion nuevamente.');
      return;
    }
    
    // Asegurar que monto es un número
    const numMonto = typeof monto === 'string' ? parseFloat(monto) : Number(monto);
    console.log('Monto procesado:', numMonto, 'Es numero valido:', !Number.isNaN(numMonto));
    
    if (Number.isNaN(numMonto) || numMonto <= 0) {
      alert('El monto debe ser un numero positivo.');
      return;
    }
    
    // Validar que usuario tiene saldo suficiente para retiros
    if (tipo === 'RETIRO') {
      const saldoDisponible = moneda === 'USD' ? saldoUsd : saldoSol;
      console.log('Saldo disponible:', saldoDisponible, 'Monto a retirar:', numMonto);
      if (numMonto > saldoDisponible) {
        alert('Saldo insuficiente para este retiro.');
        return;
      }
    }
    
    // Construir URL
    const endpoint = tipo === 'DEPOSITO' ? 'depositos' : 'retiros';
    const url = API_SALDO_BASE(usuarioActual.id) + '/' + endpoint + '?moneda=' + moneda;
    
    // Construir payload
    const payload = { monto: numMonto };
    
    console.log('=== OPERACION SALDO ===');
    console.log('URL:', url);
    console.log('Tipo:', tipo);
    console.log('Moneda:', moneda);
    console.log('Payload:', JSON.stringify(payload));
    
    // Enviar solicitud
    const response = await axios.post(url, payload);
    
    console.log('Respuesta exitosa:', response.data);
    
    // Actualizar saldo local
    if (response.data && response.data.saldo !== undefined) {
      console.log('Saldo antes de actualizar - SOL:', saldoSol, 'USD:', saldoUsd);
      if (moneda === 'USD') {
        saldoUsd = Number(response.data.saldo);
        console.log('Actualizado saldoUsd a:', saldoUsd);
      } else {
        saldoSol = Number(response.data.saldo);
        console.log('Actualizado saldoSol a:', saldoSol);
      }
      console.log('Saldo despues de actualizar - SOL:', saldoSol, 'USD:', saldoUsd);
      console.log('Llamando a renderSaldoCaja()...');
      renderSaldoCaja();
      console.log('renderSaldoCaja() completado');
    } else {
      console.error('Response data no contiene saldo:', response.data);
    }
    
    // Mostrar mensaje de exito
    const msg = tipo === 'DEPOSITO' 
      ? 'Deposito de ' + moneda + ' ' + numMonto.toFixed(2) + ' registrado correctamente.' 
      : 'Retiro de ' + moneda + ' ' + numMonto.toFixed(2) + ' realizado correctamente.';
    alert(msg);
    
  } catch (error) {
    console.error('=== ERROR EN OPERACION SALDO ===');
    console.error('Error:', error);
    console.error('Config:', error.config);
    console.error('Response Status:', error.response?.status);
    console.error('Response Data:', error.response?.data);
    console.error('Response Headers:', error.response?.headers);
    
    // Intentar extraer mensaje de error
    let mensajeError = 'No se pudo procesar la operacion';
    if (error.response?.data?.mensaje) {
      mensajeError = error.response.data.mensaje;
    } else if (error.response?.data?.message) {
      mensajeError = error.response.data.message;
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    const statusCode = error.response?.status || 'desconocido';
    alert(mensajeError + ' (Error ' + statusCode + ')');
  }
}

function renderSaldoCaja() {
  console.log('=== RENDER SALDO CAJA ===');
  console.log('saldoSol:', saldoSol);
  console.log('saldoUsd:', saldoUsd);
  console.log('productosContratados:', productosContratados);
  
  const acumulados = productosContratados.reduce((acc, p) => {
    const moneda = (p.moneda || 'SOL').toUpperCase();
    acc[moneda] = (acc[moneda] || 0) + Number(p.montoInvertido || 0);
    return acc;
  }, { SOL: 0, USD: 0 });

  console.log('acumulados:', acumulados);
  
  renderTarjetaSaldo('SOL', saldoSol, acumulados.SOL || 0);
  renderTarjetaSaldo('USD', saldoUsd, acumulados.USD || 0);
}

function renderTarjetaSaldo(moneda, saldoDisponible, invertido) {
  const clave = moneda.toLowerCase();
  const simbolo = MONEDAS[moneda]?.simbolo || 'S/';
  const leyenda = document.getElementById(`saldo-${clave}-leyenda`);
  const valor = document.getElementById(`saldo-${clave}-valor`);
  const totalElem = document.getElementById(`saldo-${clave}-total`);
  const invertidoElem = document.getElementById(`saldo-${clave}-invertido`);
  const disponibleElem = document.getElementById(`saldo-${clave}-disponible`);
  const barra = document.getElementById(`saldo-${clave}-barra-fill`);

  console.log(`=== RENDER TARJETA ${moneda} ===`);
  console.log('Saldo disponible:', saldoDisponible);
  console.log('Invertido:', invertido);
  console.log('Elemento valor:', valor ? 'encontrado' : 'NO ENCONTRADO');
  console.log('Elemento leyenda:', leyenda ? 'encontrado' : 'NO ENCONTRADO');
  console.log('Elemento total:', totalElem ? 'encontrado' : 'NO ENCONTRADO');
  console.log('Elemento invertido:', invertidoElem ? 'encontrado' : 'NO ENCONTRADO');
  console.log('Elemento disponible:', disponibleElem ? 'encontrado' : 'NO ENCONTRADO');
  console.log('Elemento barra:', barra ? 'encontrado' : 'NO ENCONTRADO');

  const total = saldoDisponible + invertido;
  const porcentaje = total > 0 ? Math.min(100, (invertido / total) * 100) : 0;

  if (valor) {
    const formatted = formatearMontoDisplay(saldoDisponible, moneda);
    console.log(`Actualizando saldo-${clave}-valor a: ${formatted}`);
    valor.textContent = formatted;
  }
  if (leyenda) {
    const newLeyenda = saldoDisponible > 0
      ? `Saldo disponible en ${MONEDAS[moneda]?.nombre || 'saldo'}.`
      : 'Recarga tu cuenta para operar.';
    console.log(`Actualizando saldo-${clave}-leyenda a: ${newLeyenda}`);
    leyenda.textContent = newLeyenda;
  }
  if (totalElem) {
    const formatted = formatearMontoDisplay(total, moneda);
    console.log(`Actualizando saldo-${clave}-total a: ${formatted}`);
    totalElem.textContent = formatted;
  }
  if (invertidoElem) {
    const formatted = formatearMontoDisplay(invertido, moneda);
    console.log(`Actualizando saldo-${clave}-invertido a: ${formatted}`);
    invertidoElem.textContent = formatted;
  }
  if (disponibleElem) {
    const formatted = formatearMontoDisplay(saldoDisponible, moneda);
    console.log(`Actualizando saldo-${clave}-disponible a: ${formatted}`);
    disponibleElem.textContent = formatted;
  }
  if (barra) {
    console.log(`Actualizando saldo-${clave}-barra-fill a: ${porcentaje}%`);
    barra.style.width = `${porcentaje}%`;
  }
}

function abrirOperacionSaldo(moneda, tipo) {
  if (!usuarioActual) {
    mostrarLogin();
    return;
  }
  const esDeposito = tipo === 'DEPOSITO';
  const mensaje = esDeposito
    ? 'Ingresa el monto que deseas depositar en ' + moneda + ':'
    : 'Ingresa el monto que deseas retirar en ' + moneda + ':';
  const valor = prompt(mensaje);
  if (valor === null) return;

  const monto = normalizarEntradaMonetaria(valor);
  if (monto === null) {
    alert('Monto invalido. Intenta nuevamente.');
    return;
  }
  
  console.log('Abriendo operacion - Moneda:', moneda, 'Tipo:', tipo, 'Monto:', monto, 'Tipo monto:', typeof monto);
  procesarOperacionSaldo(moneda, tipo, monto);
}

function normalizarEntradaMonetaria(entrada) {
  if (!entrada || typeof entrada !== 'string') return null;
  
  // Limpiar espacios en blanco
  entrada = entrada.trim();
  
  // Reemplazar coma con punto para decimales
  entrada = entrada.replace(',', '.');
  
  // Convertir a número
  const numero = parseFloat(entrada);
  
  // Validar que sea un número válido y positivo
  if (isNaN(numero) || numero <= 0) {
    return null;
  }
  
  return numero;
}

function formatearMontoDisplay(monto, moneda = 'SOL') {
  const numero = Number(monto);
  const simbolo = MONEDAS[moneda]?.simbolo || 'S/';
  if (Number.isNaN(numero)) {
    return `${simbolo}0.00`;
  }
  return `${simbolo}${numero.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  cargarSaldo();
}

// ===== CHATBOT =====
document.addEventListener('DOMContentLoaded', () => {
  inicializarChatbot();
});

function inicializarChatbot() {
  const toggle = document.getElementById('chatbot-toggle');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = panel?.querySelector('.chatbot-close');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');

  if (!toggle || !panel || !form || !input || !messages) return;

  const enviar = (texto, rol = 'bot') => {
    const burbuja = document.createElement('div');
    burbuja.className = `chatbot-bubble ${rol}`;
    burbuja.textContent = texto;
    messages.appendChild(burbuja);
    messages.scrollTop = messages.scrollHeight;
  };

  const saludar = () => {
    enviar('Hola, soy tu asesor virtual Wilson. Te ayudo a sugerir fondos/seguros y estimar primas de Vida, Salud, Vehicular o SOAT. Cuéntame tu edad, perfil (bajo/medio/alto) o modelo/año del auto.');
  };

  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      if (!messages.childElementCount) saludar();
      input.focus();
    }
  });
  closeBtn?.addEventListener('click', () => panel.classList.remove('open'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    enviar(texto, 'user');
    input.value = '';
    await procesarChatbot(texto, enviar);
  });
}

async function procesarChatbot(texto, enviar) {
  const fallback = generarRespuestaLocal(texto);
  try {
    const res = await axios.post(API_CHATBOT, {
      mensaje: texto,
      usuarioId: usuarioActual?.id
    });
    const respuesta = (res.data?.respuesta || '').toString().trim();
    enviar(respuesta || fallback, 'bot');
  } catch (error) {
    console.error('Error al contactar al chatbot backend:', error);
    const detalle = error.response?.data?.mensaje || error.message || 'No pude conectar con el asistente.';
    enviar(`${detalle} Intento ayudarte igual:\n${fallback}`, 'bot');
  }
}

function generarRespuestaLocal(texto) {
  const lower = texto.toLowerCase();

  // Detectar edad y modelo/año básico
  const edadMatch = lower.match(/(\d{2})\s*a[nñ]os?/);
  const edad = edadMatch ? parseInt(edadMatch[1], 10) : null;
  const anoMatch = lower.match(/(20\d{2}|19\d{2})/);
  const ano = anoMatch ? parseInt(anoMatch[1], 10) : null;

  const esVehicular = lower.includes('vehicular') || lower.includes('auto') || lower.includes('carro');
  const esSoat = lower.includes('soat');
  const esSalud = lower.includes('salud');
  const esVida = lower.includes('vida');
  const perfil = lower.includes('alto') ? 'ALTO' : lower.includes('medio') ? 'MEDIO' : lower.includes('bajo') ? 'BAJO' : null;

  if (esVehicular || esSoat) {
    const prima = estimarPrimaVehicularOsoat({ esSoat, ano, texto: lower });
    const nombre = esSoat ? 'SOAT' : 'Seguro Vehicular';
    const baseMsg = prima
      ? `${nombre} estimado: S/ ${prima.toFixed(2)} al mes.`
      : `${nombre} estimado: S/ 30 - 200 (SOAT) o S/ 400 - 2,000 (Vehicular) según modelo y año.`;
    const detalle = ano ? `Año ${ano}.` : 'Agrega modelo y año (ej: Corolla 2019) para mayor precisión.';
    const recomendacion = sugerirProductosPorTipo('SEGURO', esSoat ? 'soat' : 'vehicular');
    return `${baseMsg} ${detalle}\n${recomendacion}`;
  }

  if (esSalud || esVida) {
    const prima = estimarPrimaSaludVida({ esVida, edad });
    const nombre = esVida ? 'Seguro de Vida' : 'Seguro de Salud';
    const baseMsg = prima
      ? `${nombre} estimado: S/ ${prima.toFixed(2)} al mes.`
      : `${nombre} típico: Vida S/ 50-500 según edad; Salud S/ 200-1500 según edad/plan.`;
    const recomendacion = sugerirProductosPorTipo('SEGURO', esVida ? 'vida' : 'salud');
    return `${baseMsg}\n${recomendacion}`;
  }

  // Fondos por perfil
  if (perfil) {
    const recomendacion = sugerirFondosPorPerfil(perfil);
    return recomendacion;
  }

  // fallback general
  return 'Puedo ayudarte si me dices: tu edad y si buscas Vida/Salud, o el modelo/año de tu auto para Vehicular/SOAT, o tu perfil de riesgo (bajo/medio/alto) para fondos.';
}

function sugerirProductosPorTipo(tipo, palabraClave = '') {
  const lista = (catalogoCache || []).filter(p => (p.tipo || '').toUpperCase() === tipo);
  const filtrada = palabraClave
    ? lista.filter(p => (p.nombre || '').toLowerCase().includes(palabraClave))
    : lista;
  const top = (filtrada.length ? filtrada : lista).slice(0, 2);
  if (!top.length) return 'No encontré productos en el catálogo cargado.';
  return 'Opciones recomendadas:\n' + top.map(p => `- ${p.nombre}: ${p.descripcion || ''}`).join('\n');
}

function sugerirFondosPorPerfil(perfil) {
  const lista = (catalogoCache || []).filter(p => (p.tipo || '').toUpperCase() === 'FONDO');
  const ordenRiesgo = perfil === 'ALTO' ? ['ALTO', 'MEDIO', 'BAJO'] : perfil === 'MEDIO' ? ['MEDIO', 'BAJO', 'ALTO'] : ['BAJO', 'MEDIO'];
  const ordenada = lista.sort((a, b) => {
    const ia = ordenRiesgo.indexOf((a.riesgo || 'MEDIO').toUpperCase());
    const ib = ordenRiesgo.indexOf((b.riesgo || 'MEDIO').toUpperCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const top = ordenada.slice(0, 3);
  if (!top.length) return 'No encontré fondos en el catálogo cargado.';
  const intro = perfil === 'ALTO' ? 'Perfil agresivo:'
    : perfil === 'MEDIO' ? 'Perfil balanceado:'
    : 'Perfil conservador:';
  return `${intro}\n` + top.map(p => `- ${p.nombre} (${p.riesgo || 'N/A'}): ${p.descripcion || ''}`).join('\n');
}

function estimarPrimaSaludVida({ esVida, edad }) {
  if (!edad || edad < 18 || edad > 90) return null;
  if (esVida) {
    if (edad <= 30) return 70;
    if (edad <= 40) return 110;
    if (edad <= 50) return 160;
    if (edad <= 60) return 230;
    return 320;
  }
  // Salud
  if (edad <= 25) return 260;
  if (edad <= 35) return 320;
  if (edad <= 45) return 520;
  if (edad <= 55) return 820;
  if (edad <= 65) return 1150;
  return 1400;
}

function estimarPrimaVehicularOsoat({ esSoat, ano, texto }) {
  const modelos = [
    { id: 'corolla', match: ['corolla', 'sedan'], base: esSoat ? 90 : 650 },
    { id: 'hilux', match: ['hilux', 'pickup'], base: esSoat ? 120 : 1150 },
    { id: 'yaris', match: ['yaris', 'hatch'], base: esSoat ? 85 : 520 },
    { id: 'cx5', match: ['cx-5', 'cx5', 'suv'], base: esSoat ? 105 : 880 },
    { id: 'rav4', match: ['rav4', 'rav 4'], base: esSoat ? 110 : 940 },
  ];
  const model = modelos.find(m => m.match.some(k => texto.includes(k)));
  const base = model ? model.base : esSoat ? 100 : 800;
  const year = ano && ano >= 2000 && ano <= new Date().getFullYear() + 1 ? ano : null;
  let factor = 1;
  if (year) {
    if (year >= 2022) factor = 1;
    else if (year >= 2016) factor = 1.15;
    else if (year >= 2010) factor = 1.3;
    else factor = 1.5;
  }
  const prima = base * factor;
  const min = esSoat ? 30 : 400;
  const max = esSoat ? 200 : 2000;
  return Math.min(Math.max(prima, min), max);
}
