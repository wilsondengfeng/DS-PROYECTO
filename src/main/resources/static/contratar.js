const API_PRODUCTOS = 'http://localhost:8080/api/clientes/productos';
const API_CONTRATOS = (clienteId) => `http://localhost:8080/api/clientes/${clienteId}/contratos`;

let usuarioActual = null;
let productosDisponibles = [];
let productoSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSesionContratar();
});

function verificarSesionContratar() {
  const sesion = localStorage.getItem('usuarioCliente');
  if (!sesion) {
    window.location.href = 'cliente.html';
    return;
  }
  usuarioActual = JSON.parse(sesion);
  inicializarContratacion();
}

async function inicializarContratacion() {
  await cargarProductosDisponibles();
  const params = new URLSearchParams(window.location.search);
  const productoId = params.get('productoId');
  if (productoId) {
    seleccionarProducto(Number(productoId));
  }
}

async function cargarProductosDisponibles() {
  const contenedor = document.getElementById('contratar-lista');
  contenedor.innerHTML = '<p>Cargando productos...</p>';
  try {
    const res = await axios.get(API_PRODUCTOS, { params: { soloActivos: true } });
    productosDisponibles = res.data || [];
    if (!productosDisponibles.length) {
      contenedor.innerHTML = '<p>No hay productos disponibles por el momento.</p>';
      return;
    }

    const tarjetas = productosDisponibles.map(prod => `
      <div class="producto-card">
        <div class="producto-header">
          <div>
            <div class="producto-nombre">${escapeHtml(prod.nombre)}</div>
            <div class="producto-badges">
              <span class="badge badge-${(prod.tipo || 'FONDO').toLowerCase()}">${prod.tipo || ''}</span>
              ${prod.tipo === 'FONDO' && prod.riesgo ? `<span class="badge badge-riesgo-${prod.riesgo.toLowerCase()}">Riesgo ${prod.riesgo}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="producto-descripcion">
          <p>${escapeHtml(prod.descripcion || 'Sin descripción')}</p>
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
            <div class="detail-label">Beneficio</div>
            <div class="detail-value">${escapeHtml(prod.beneficio || 'No especificado')}</div>
          </div>
        </div>
        <div class="producto-actions">
          <button class="btn btn-primary" onclick="seleccionarProducto(${prod.id})">Seleccionar</button>
        </div>
      </div>
    `).join('');

    contenedor.innerHTML = `<div class="productos-grid">${tarjetas}</div>`;
  } catch (error) {
    console.error('Error al cargar productos para contratación:', error);
    contenedor.innerHTML = '<p class="error-message">No se pudieron cargar los productos. Intenta nuevamente.</p>';
  }
}

async function seleccionarProducto(productoId) {
  try {
    const res = await axios.get(`${API_PRODUCTOS}/${productoId}`);
    productoSeleccionado = res.data;
    renderResumenSeleccion();
    document.getElementById('contratar-resumen').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error al obtener detalle del producto:', error);
    alert('No se pudo obtener la información del producto seleccionado.');
  }
}

function renderResumenSeleccion() {
  const contenedor = document.getElementById('contratar-resumen');
  if (!productoSeleccionado) {
    contenedor.innerHTML = '<p class="text-muted">Selecciona un producto para ver su resumen.</p>';
    return;
  }

  contenedor.innerHTML = `
    <h3>${escapeHtml(productoSeleccionado.nombre)}</h3>
    <p><strong>Tipo:</strong> ${productoSeleccionado.tipo}</p>
    ${productoSeleccionado.tipo === 'FONDO' ? `<p><strong>Riesgo:</strong> ${escapeHtml(productoSeleccionado.riesgo || 'Sin definir')}</p>` : ''}
    <p><strong>Descripción:</strong> ${escapeHtml(productoSeleccionado.descripcion || 'Sin descripción')}</p>
    <p><strong>Costo:</strong> ${escapeHtml(productoSeleccionado.costo || 'No especificado')}</p>
    <p><strong>Beneficio:</strong> ${escapeHtml(productoSeleccionado.beneficio || 'No especificado')}</p>
    <p><strong>Plazo:</strong> ${escapeHtml(productoSeleccionado.plazo || 'No especificado')}</p>
    <div class="detalle-actions">
      <button class="btn btn-success" onclick="confirmarContratacion()">Confirmar contratación</button>
      <a class="btn btn-secondary" href="cliente.html">Cancelar</a>
    </div>
  `;
}

async function confirmarContratacion() {
  if (!productoSeleccionado || !usuarioActual) return;
  try {
    await axios.post(`${API_CONTRATOS(usuarioActual.id)}/${productoSeleccionado.id}`);
    alert('Producto contratado con éxito.');
    window.location.href = 'cliente.html';
  } catch (error) {
    console.error('Error al contratar producto:', error);
    alert(error.response?.data?.mensaje || 'No se pudo completar la contratación.');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
