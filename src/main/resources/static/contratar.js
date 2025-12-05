const API_BASE = window.location.origin;
const API_PRODUCTOS = `${API_BASE}/api/clientes/productos`;
const API_CONTRATOS = (clienteId) => `${API_BASE}/api/clientes/${clienteId}/contratos`;
const API_SALDO_BASE = (clienteId) => `${API_BASE}/api/usuarios/${clienteId}`;

let usuarioActual = null;
let productosDisponibles = [];
let productoSeleccionado = null;
let configuracionMontoActual = null;
let cotizacionSeguroActual = null;

const GUIA_MONTO = {
  BAJO: { min: 500, sugerido: 3000 },
  MEDIO: { min: 2000, sugerido: 6000 },
  ALTO: { min: 5000, sugerido: 12000 },
  DEFAULT: { min: 300, sugerido: 1500 }
};

const CONFIG_SEGUROS_DINAMICOS = {
  salud: {
    match: (nombre) => nombre.includes('salud'),
    basePrima: 220,
    moneda: 'SOL',
    descripcionCosto: 'Prima mensual variable por edad y plan. Rango esperado: S/ 200 a S/ 1,500.',
    minPrima: 200,
    maxPrima: 1500,
    calculo: 'edad',
    factoresEdad: [
      { max: 25, factor: 0.9 },
      { max: 35, factor: 1.0 },
      { max: 45, factor: 1.4 },
      { max: 55, factor: 2.2 },
      { max: 65, factor: 3.4 },
      { max: 75, factor: 4.8 },
      { max: 120, factor: 6.8 }
    ],
    planes: {
      esencial: { etiqueta: 'Plan Esencial', factor: 1 },
      avanzado: { etiqueta: 'Plan Avanzado (+ cobertura internacional)', factor: 1.2 },
      premium: { etiqueta: 'Plan Premium (deducible bajo)', factor: 1.35 }
    }
  },
  vida: {
    match: (nombre) => nombre.includes('vida'),
    basePrima: 60,
    moneda: 'SOL',
    descripcionCosto: 'Prima mensual variable por edad y cobertura. Rango esperado: S/ 50 a S/ 500.',
    minPrima: 50,
    maxPrima: 500,
    calculo: 'edad',
    factoresEdad: [
      { max: 30, factor: 0.85 },
      { max: 40, factor: 1.0 },
      { max: 50, factor: 1.25 },
      { max: 60, factor: 1.6 },
      { max: 70, factor: 2.2 },
      { max: 120, factor: 3.5 }
    ],
    planes: {
      base: { etiqueta: 'Plan Base', factor: 1 },
      plus: { etiqueta: 'Plan Plus (enfermedades graves)', factor: 1.15 },
      elite: { etiqueta: 'Plan Elite (invalidez + renta mensual)', factor: 1.3 }
    }
  },
  vehicular: {
    match: (nombre) => nombre.includes('vehicular'),
    basePrima: 700,
    moneda: 'SOL',
    descripcionCosto: 'Prima mensual estimada segun modelo y año. Rango esperado: S/ 400 a S/ 2,000.',
    minPrima: 400,
    maxPrima: 2000,
    calculo: 'auto',
    modelos: [
      { id: 'corolla', nombre: 'Toyota Corolla / Sedan', base: 650 },
      { id: 'hilux', nombre: 'Toyota Hilux / Pick-up', base: 1150 },
      { id: 'yaris', nombre: 'Toyota Yaris / Hatchback', base: 520 },
      { id: 'cx5', nombre: 'Mazda CX-5 / SUV', base: 880 },
      { id: 'rav4', nombre: 'Toyota RAV4 / SUV', base: 940 },
      { id: 'accent', nombre: 'Hyundai Accent / Sedan', base: 560 },
      { id: 'tiggo', nombre: 'Chery Tiggo 4 / SUV', base: 780 },
      { id: 'xtrail', nombre: 'Nissan X-Trail / SUV', base: 890 }
    ]
  },
  soat: {
    match: (nombre) => nombre.includes('soat'),
    basePrima: 110,
    moneda: 'SOL',
    descripcionCosto: 'Prima referencial segun modelo y año del vehiculo. Rango esperado: S/ 30 a S/ 200.',
    minPrima: 30,
    maxPrima: 200,
    calculo: 'auto',
    modelos: [
      { id: 'moto', nombre: 'Moto 150-300cc', base: 60 },
      { id: 'sedan', nombre: 'Auto Sedan', base: 90 },
      { id: 'suv', nombre: 'SUV / Crossover', base: 105 },
      { id: 'pickup', nombre: 'Pick-up', base: 120 },
      { id: 'van', nombre: 'Van / Minivan', base: 130 }
    ]
  }
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
    cotizacionSeguroActual = null;
    contenedor.innerHTML = '<p class="text-muted">Selecciona un producto para ver su resumen.</p>';
    return;
  }

  const esSeguro = (productoSeleccionado.tipo || '').toUpperCase() === 'SEGURO';
  const configSeguroDinamico = esSeguro ? obtenerConfigSeguroDinamico(productoSeleccionado) : null;
  const requiereCotizacionSeguro = Boolean(configSeguroDinamico);
  const configMonto = construirConfiguracionMonto(productoSeleccionado);
  configuracionMontoActual = configMonto;
  cotizacionSeguroActual = requiereCotizacionSeguro
    ? {
        config: configSeguroDinamico,
        prima: null,
        plan: configSeguroDinamico.calculo === 'edad' ? Object.keys(configSeguroDinamico.planes)[0] : null,
        edad: configSeguroDinamico.calculo === 'edad' ? 30 : null,
        modelo: configSeguroDinamico.calculo === 'auto' ? (configSeguroDinamico.modelos?.[0]?.id || null) : null,
        anio: configSeguroDinamico.calculo === 'auto' ? new Date().getFullYear() : null
      }
    : null;
  
  let inputMontoHTML = '';
  let premiasInfo = '';
  
  if (esSeguro && requiereCotizacionSeguro) {
    inputMontoHTML = construirCotizadorSeguro(configSeguroDinamico, configMonto.simbolo);
    premiasInfo = `<p class="alert alert-info">Calcula la prima seg?n tu edad y plan antes de confirmar.</p>`;
  } else if (esSeguro) {
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
      <label for="montoInversion">?Cu?nto deseas invertir en este fondo? (${configMonto.nombreMoneda})</label>
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
    <p><strong>Descripci?n:</strong> ${escapeHtml(productoSeleccionado.descripcion || 'Sin descripci?n')}</p>
    ${esSeguro ? premiasInfo : `<p><strong>Costo:</strong> ${escapeHtml(productoSeleccionado.costo || 'No especificado')}</p>`}
    <p><strong>Moneda:</strong> ${productoSeleccionado.moneda || (configMonto.simbolo === '$' ? 'USD' : 'SOL')}</p>
    <p><strong>Beneficio:</strong> ${escapeHtml(productoSeleccionado.beneficio || 'No especificado')}</p>
    <p><strong>Plazo:</strong> ${escapeHtml(productoSeleccionado.plazo || 'No especificado')}</p>
    ${inputMontoHTML}
    <div class="detalle-actions">
      <button class="btn btn-success" onclick="confirmarContratacion()">Confirmar contratación</button>
      <a class="btn btn-secondary" href="cliente.html">Cancelar</a>
    </div>
  `;
  if (requiereCotizacionSeguro) {
    setTimeout(() => recalcularPrimaSeguro(), 50);
  }
}


async function confirmarContratacion() {
  if (!productoSeleccionado || !usuarioActual) return;
  const inputMonto = document.getElementById('montoInversion');
  const minimo = configuracionMontoActual?.min || 100;
  const simboloMoneda = configuracionMontoActual?.simbolo || 'S/';
  const esSeguro = (productoSeleccionado.tipo || '').toUpperCase() === 'SEGURO';
  const requiereCotizacionSeguro = Boolean(cotizacionSeguroActual?.config);
  
  let monto;
  if (esSeguro) {
    if (requiereCotizacionSeguro) {
      const prima = recalcularPrimaSeguro(true);
      if (!prima) {
        alert('Ingresa una edad v?lida y selecciona un plan para calcular la prima.');
        return;
      }
      monto = prima;
    } else {
      const premiaStr = (productoSeleccionado.costo || '').trim();
      const primaParsed = parseFloat(premiaStr);
      if (Number.isNaN(primaParsed)) {
        alert('Error: El seguro no tiene una prima v?lida configurada.');
        return;
      }
      monto = primaParsed;
    }
  } else {
    monto = parseFloat(inputMonto?.value);
  }

  if (Number.isNaN(monto)) {
    alert('Ingresa el monto que deseas invertir.');
    return;
  }

  if (!esSeguro && monto < minimo) {
    alert(`El monto minimo recomendado para este fondo es ${simboloMoneda}${formatearNumero(minimo)}.`);
    inputMonto?.focus();
    return;
  }

  const montoNormalizado = Math.round(monto * 100) / 100;

  const montoFormateado = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montoNormalizado);


  try {
    // Validaci?n en frontend: comprobar saldo disponible en la moneda del producto
    const monedaCodigo = (productoSeleccionado.moneda || 'SOL').toUpperCase();
    try {
      const saldoRes = await axios.get(API_SALDO_BASE(usuarioActual.id) + '/saldo', { params: { moneda: monedaCodigo } });
      const saldoDisponible = Number(saldoRes.data?.saldo ?? 0);
      if (montoNormalizado > saldoDisponible) {
        const tipo = esSeguro ? 'prima del seguro' : 'inversi?n';
        alert(`Saldo insuficiente. Tu saldo en ${monedaCodigo} es ${configuracionMontoActual.simbolo}${saldoDisponible.toFixed(2)}. La ${tipo} requiere ${configuracionMontoActual.simbolo}${montoNormalizado.toFixed(2)}.`);
        return;
      }
    } catch (err) {
      console.warn('No se pudo obtener saldo para validaci?n previa, se intentar? en backend.', err);
    }

    await axios.post(`${API_CONTRATOS(usuarioActual.id)}/${productoSeleccionado.id}`, { monto: montoNormalizado });
    const tipoMsg = esSeguro ? 'prima' : 'inversi?n';
    alert(`${productoSeleccionado.nombre} contratado con ?xito. Se debit? ${simboloMoneda}${montoFormateado} como ${tipoMsg}.`);
    window.location.href = 'cliente.html';
  } catch (error) {
    console.error('Error al contratar producto:', error);
    alert(error.response?.data?.mensaje || 'No se pudo completar la contrataci?n.');
  }
}



function obtenerConfigSeguroDinamico(producto) {
  const nombre = (producto.nombre || '').toLowerCase();
  return Object.values(CONFIG_SEGUROS_DINAMICOS).find(cfg => cfg.match(nombre)) || null;
}

function construirCotizadorSeguro(config, simboloMoneda) {
  const simbolo = simboloMoneda || simboloDesdeMoneda(config.moneda);

  if (config.calculo === 'auto') {
    const opcionesModelo = (config.modelos || []).map(m => `
      <option value="${m.id}">${m.nombre}</option>
    `).join('');
    const anioActual = new Date().getFullYear();
    return `
    <div class="cotizador-seguro">
      <div class="form-row">
        <div class="form-group">
          <label for="modeloAuto">Modelo del vehiculo</label>
          <select id="modeloAuto" onchange="recalcularPrimaSeguro()">
            ${opcionesModelo}
          </select>
        </div>
        <div class="form-group">
          <label for="anioAuto">Ano del vehiculo</label>
          <input type="number" id="anioAuto" min="2000" max="${anioActual + 1}" value="${anioActual}" oninput="recalcularPrimaSeguro()" />
        </div>
      </div>
      <p class="text-muted">${config.descripcionCosto}</p>
      <div id="resultadoPrima" class="alert alert-info">Selecciona modelo y ano para estimar la prima (${simbolo}).</div>
    </div>
    `;
  }

  const opcionesPlan = Object.entries(config.planes).map(([key, plan]) => `
    <option value="${key}">${plan.etiqueta}</option>
  `).join('');

  return `
  <div class="cotizador-seguro">
    <div class="form-row">
      <div class="form-group">
        <label for="edadTitular">Edad del titular</label>
        <input type="number" id="edadTitular" min="18" max="90" value="30" oninput="recalcularPrimaSeguro()" />
      </div>
      <div class="form-group">
        <label for="planSeguro">Nivel de cobertura</label>
        <select id="planSeguro" onchange="recalcularPrimaSeguro()">
          ${opcionesPlan}
        </select>
      </div>
    </div>
    <p class="text-muted">${config.descripcionCosto}</p>
    <div id="resultadoPrima" class="alert alert-info">Ingresa tu edad para estimar la prima (${simbolo}).</div>
  </div>
  `;
}

function recalcularPrimaSeguro(silencioso = false) {
  if (!cotizacionSeguroActual?.config) return null;
  const cfg = cotizacionSeguroActual.config;
  let prima = null;

  if (cfg.calculo === 'auto') {
    const modeloSelect = document.getElementById('modeloAuto');
    const anioInput = document.getElementById('anioAuto');
    const modelo = modeloSelect?.value || cfg.modelos?.[0]?.id;
    const anio = Number(anioInput?.value);
    cotizacionSeguroActual.modelo = modelo;
    cotizacionSeguroActual.anio = anio;
    prima = calcularPrimaAuto(cfg, modelo, anio);
  } else {
    const edadInput = document.getElementById('edadTitular');
    const planSelect = document.getElementById('planSeguro');
    const edad = Number(edadInput?.value);
    const plan = planSelect?.value || Object.keys(cfg.planes)[0];
    cotizacionSeguroActual.edad = edad;
    cotizacionSeguroActual.plan = plan;
    prima = calcularPrimaSeguro(cfg, edad, plan);
  }

  cotizacionSeguroActual.prima = prima;

  const resultado = document.getElementById('resultadoPrima');
  if (!resultado) return prima;

  if (!prima) {
    resultado.textContent = cfg.calculo === 'auto'
      ? 'Ingresa un ano valido (2000 en adelante) y selecciona un modelo para cotizar.'
      : 'Ingresa una edad valida (18 a 90 anos) para cotizar.';
    resultado.className = 'alert alert-warning';
    if (!silencioso) {
      console.warn('Datos fuera de rango para cotizacion.');
    }
    return null;
  }

  const simbolo = simboloDesdeMoneda(cfg.moneda);
  const detalle = cfg.calculo === 'auto'
    ? `Modelo: ${cotizacionSeguroActual.modelo || ''} / Ano: ${cotizacionSeguroActual.anio || ''}`
    : '';
  resultado.textContent = `Prima estimada: ${simbolo}${prima.toFixed(2)} ${cfg.moneda}. ${detalle}`;
  resultado.className = 'alert alert-success';
  return prima;
}

function calcularPrimaSeguro(config, edad, plan) {
  if (Number.isNaN(edad) || edad < 18 || edad > 90) return null;
  const factorEdad = config.factoresEdad.find(f => edad <= f.max)?.factor || config.factoresEdad[config.factoresEdad.length - 1].factor;
  const factorPlan = config.planes[plan]?.factor || 1;
  const primaSinTope = config.basePrima * factorEdad * factorPlan;
  const primaAjustada = Math.round(primaSinTope * 100) / 100;
  const min = config.minPrima || primaAjustada;
  const max = config.maxPrima || primaAjustada;
  return Math.min(Math.max(primaAjustada, min), max);
}

function calcularPrimaAuto(config, modeloId, anio) {
  const modelos = config.modelos || [];
  const modelo = modelos.find(m => m.id === modeloId);
  const base = modelo?.base || config.basePrima || 0;
  const anioNum = Number(anio);
  if (Number.isNaN(anioNum) || anioNum < 2000 || anioNum > new Date().getFullYear() + 1) {
    return null;
  }

  let factorAnio = 1;
  if (anioNum >= 2023) factorAnio = 1;
  else if (anioNum >= 2018) factorAnio = 1.15;
  else if (anioNum >= 2013) factorAnio = 1.35;
  else if (anioNum >= 2008) factorAnio = 1.5;
  else factorAnio = 1.7;

  const primaSinTope = base * factorAnio;
  const primaAjustada = Math.round(primaSinTope * 100) / 100;
  const min = config.minPrima || primaAjustada;
  const max = config.maxPrima || primaAjustada;
  return Math.min(Math.max(primaAjustada, min), max);
}

function simboloDesdeMoneda(monedaCodigo) {
  return (monedaCodigo || '').toUpperCase() === 'USD' ? '$' : 'S/';
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
