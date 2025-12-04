const API_BASE = window.location.origin;
const API_PRODUCTOS = `${API_BASE}/api/clientes/productos`;
const API_CONTRATOS = (clienteId) => `${API_BASE}/api/clientes/${clienteId}/contratos`;
const API_SALDO_BASE = (clienteId) => `${API_BASE}/api/usuarios/${clienteId}`;

let usuarioActual = null;
let productosDisponibles = [];
let productoSeleccionado = null;
let configuracionMontoActual = null;

const GUIA_MONTO = {
  BAJO: { min: 500, sugerido: 3000 },
  MEDIO: { min: 2000, sugerido: 6000 },
  ALTO: { min: 5000, sugerido: 12000 },
  DEFAULT: { min: 300, sugerido: 1500 }
};

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
  // Cargar productos y si la URL especifica un producto, preseleccionarlo
  // pero mantener siempre el catálogo visible.
  await cargarProductosDisponibles();
  const params = new URLSearchParams(window.location.search);
  const productoId = params.get('productoId');
  if (productoId) {
    await seleccionarProducto(Number(productoId));
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
      <div class="producto-card" data-id="${prod.id}">
        <div class="producto-header">
          <div>
            <div class="producto-nombre">${escapeHtml(prod.nombre)}</div>
            <div class="producto-badges">
              <span class="badge badge-${(prod.tipo || 'FONDO').toLowerCase()}">${prod.tipo || ''}</span>
              ${prod.moneda ? `<span class="badge badge-moneda">${prod.moneda}</span>` : ''}
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
    // Si ya hay un producto seleccionado (preselección por URL), resaltar su tarjeta
    if (productoSeleccionado && productoSeleccionado.id) {
      highlightSelectedCard(productoSeleccionado.id);
    }
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
    // Asegurar que el resumen quede visible cuando se llega desde otra página
    setTimeout(() => {
      const resumen = document.getElementById('contratar-resumen');
      if (resumen) {
        try {
          resumen.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // poner el foco en el primer input del resumen para accesibilidad
          const input = resumen.querySelector('#montoInversion');
          if (input) input.focus();
        } catch (err) {
          // fallback simple
          window.location.hash = '#contratar-resumen';
        }
      }
    }, 150);
    // Resaltar la tarjeta seleccionada en el catálogo
    highlightSelectedCard(productoId);
  } catch (error) {
    console.error('Error al obtener detalle del producto:', error);
    alert('No se pudo obtener la información del producto seleccionado.');
  }
}

function highlightSelectedCard(productoId) {
  // Remover clase de cualquier tarjeta previamente seleccionada
  document.querySelectorAll('#contratar-lista .producto-card').forEach(card => {
    card.classList.remove('producto-seleccionado');
  });
  // Añadir clase a la tarjeta que coincida con el id
  const tarjeta = document.querySelector(`#contratar-lista .producto-card[data-id='${productoId}']`);
  if (tarjeta) {
    tarjeta.classList.add('producto-seleccionado');
    // Asegurarnos que la tarjeta sea visible en la ventana
    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function renderResumenSeleccion() {
  const contenedor = document.getElementById('contratar-resumen');
  if (!productoSeleccionado) {
    configuracionMontoActual = null;
    contenedor.innerHTML = '<p class="text-muted">Selecciona un producto para ver su resumen.</p>';
    return;
  }

  const esSeguro = (productoSeleccionado.tipo || '').toUpperCase() === 'SEGURO';
  const configMonto = construirConfiguracionMonto(productoSeleccionado);
  configuracionMontoActual = configMonto;
  
  let inputMontoHTML = '';
  let premiasInfo = '';
  
  if (esSeguro) {
    const primiaStr = (productoSeleccionado.costo || '').trim();
    const prima = parseFloat(primiaStr);
    premiasInfo = !Number.isNaN(prima) ? `<p class="alert alert-info"><strong>Prima Fija:</strong> ${configMonto.simbolo}${prima.toFixed(2)}</p>` : '<p class="alert alert-warning"><strong>Advertencia:</strong> Prima no configurada correctamente.</p>';
  } else {
    const sugerenciasHTML = configMonto.sugerencias.map(valor => `
      <button type="button" class="btn btn-secondary btn-sugerencia" onclick="seleccionarMontoSugerido(${valor})">
        ${configMonto.simbolo}${formatearNumero(valor)}
      </button>
    `).join('');
    inputMontoHTML = `
    <div class="form-group">
      <label for="montoInversion">¿Cuánto deseas invertir en este fondo? (${configMonto.nombreMoneda})</label>
      <input
        type="number"
        id="montoInversion"
        min="${configMonto.min}"
        step="${configMonto.paso}"
        value="${configMonto.min}"
        placeholder="${configMonto.placeholder}"
      />
      <small class="text-muted">${configMonto.mensaje}</small>
      <div class="monto-sugerencias">${sugerenciasHTML}</div>
    </div>
    `;
  }

  contenedor.innerHTML = `
    <h3>${escapeHtml(productoSeleccionado.nombre)}</h3>
    <p><strong>Tipo:</strong> ${productoSeleccionado.tipo}</p>
    ${productoSeleccionado.tipo === 'FONDO' ? `<p><strong>Riesgo:</strong> ${escapeHtml(productoSeleccionado.riesgo || 'Sin definir')}</p>` : ''}
    <p><strong>Descripción:</strong> ${escapeHtml(productoSeleccionado.descripcion || 'Sin descripción')}</p>
    ${esSeguro ? premiasInfo : `<p><strong>Costo:</strong> ${escapeHtml(productoSeleccionado.costo || 'No especificado')}</p>`}
    <p><strong>Moneda:</strong> ${productoSeleccionado.moneda || (moneda.esDolar ? "USD" : "SOL")}</p>
    <p><strong>Beneficio:</strong> ${escapeHtml(productoSeleccionado.beneficio || 'No especificado')}</p>
    <p><strong>Plazo:</strong> ${escapeHtml(productoSeleccionado.plazo || 'No especificado')}</p>
    ${inputMontoHTML}
    <div class="detalle-actions">
      <button class="btn btn-success" onclick="confirmarContratacion()">Confirmar contratación</button>
      <a class="btn btn-secondary" href="cliente.html">Cancelar</a>
    </div>
  `;
}

async function confirmarContratacion() {
  if (!productoSeleccionado || !usuarioActual) return;
  const inputMonto = document.getElementById('montoInversion');
  const minimo = configuracionMontoActual?.min || 100;
  const simboloMoneda = configuracionMontoActual?.simbolo || 'S/';
  const esSeguro = (productoSeleccionado.tipo || '').toUpperCase() === 'SEGURO';
  
  let monto;
  if (esSeguro) {
    // Para seguros, extraer la prima del campo costo
    const premiaStr = (productoSeleccionado.costo || '').trim();
    const primaParsed = parseFloat(premiaStr);
    if (Number.isNaN(primaParsed)) {
      alert('Error: El seguro no tiene una prima válida configurada.');
      return;
    }
    monto = primaParsed;
  } else {
    monto = parseFloat(inputMonto?.value);
  }

  if (Number.isNaN(monto)) {
    alert('Ingresa el monto que deseas invertir.');
    return;
  }

  if (!esSeguro && monto < minimo) {
    alert(`El monto minimo recomendado para este fondo es ${simboloMoneda}${formatearNumero(minimo)}.`);
    inputMonto.focus();
    return;
  }

  const montoNormalizado = Math.round(monto * 100) / 100;

  const montoFormateado = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montoNormalizado);


  try {
    // Validación en frontend: comprobar saldo disponible en la moneda del producto
    const monedaCodigo = (productoSeleccionado.moneda || 'SOL').toUpperCase();
    try {
      const saldoRes = await axios.get(API_SALDO_BASE(usuarioActual.id) + '/saldo', { params: { moneda: monedaCodigo } });
      const saldoDisponible = Number(saldoRes.data?.saldo ?? 0);
      if (montoNormalizado > saldoDisponible) {
        const tipo = esSeguro ? 'prima del seguro' : 'inversión';
        alert(`Saldo insuficiente. Tu saldo en ${monedaCodigo} es ${configuracionMontoActual.simbolo}${saldoDisponible.toFixed(2)}. La ${tipo} requiere ${configuracionMontoActual.simbolo}${montoNormalizado.toFixed(2)}.`);
        return;
      }
    } catch (err) {
      // Si falla la consulta de saldo, dejamos que el backend valide, pero avisamos
      console.warn('No se pudo obtener saldo para validación previa, se intentará en backend.', err);
    }

    await axios.post(`${API_CONTRATOS(usuarioActual.id)}/${productoSeleccionado.id}`, { monto: montoNormalizado });
    const tipoMsg = esSeguro ? 'prima' : 'inversión';
    alert(`${productoSeleccionado.nombre} contratado con éxito. Se debitó ${simboloMoneda}${montoFormateado} como ${tipoMsg}.`);
    window.location.href = 'cliente.html';
  } catch (error) {
    console.error('Error al contratar producto:', error);
    alert(error.response?.data?.mensaje || 'No se pudo completar la contratación.');
  }
}

function construirConfiguracionMonto(producto) {
  const riesgo = (producto.riesgo || 'DEFAULT').toUpperCase();
  const guia = GUIA_MONTO[riesgo] || GUIA_MONTO.DEFAULT;
  const moneda = detectarMoneda(producto);
  const mensaje = `Invierte desde ${moneda.simbolo}${formatearNumero(guia.min)}. Sugerencia: ${moneda.simbolo}${formatearNumero(guia.sugerido)} - ${moneda.simbolo}${formatearNumero(guia.sugerido * 2)}.`;

  return {
    min: guia.min,
    paso: moneda.esDolar ? 50 : 100,
    simbolo: moneda.simbolo,
    nombreMoneda: moneda.nombre,
    placeholder: `${moneda.simbolo}${formatearNumero(guia.sugerido)}`,
    mensaje,
    sugerencias: [guia.min, guia.sugerido, guia.sugerido * 2]
  };
}



function detectarMoneda(producto) {
  const monedaCampo = (producto.moneda || '').toUpperCase();
  if (monedaCampo === 'USD' || monedaCampo === 'DOLAR' || monedaCampo === 'DOLARES') {
    return { simbolo: '$', nombre: 'dolares', esDolar: true };
  }
  const referencia = `${producto.costo || ''} ${producto.descripcion || ''}`.toLowerCase();
  const normalizada = referencia.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (referencia.includes('usd') || normalizada.includes('dolar')) {
    return { simbolo: '$', nombre: 'dolares', esDolar: true };
  }
  return { simbolo: 'S/', nombre: 'soles', esDolar: false };
}

function formatearNumero(valor) {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function seleccionarMontoSugerido(valor) {
  const input = document.getElementById('montoInversion');
  if (!input) return;
  input.value = Number(valor);
  input.dispatchEvent(new Event('input'));
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
