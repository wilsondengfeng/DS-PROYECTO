const API_METRICS = `${window.location.origin}/api/admin/metrics`;

let productosCache = [];
let tiposCache = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sort-products')?.addEventListener('change', aplicarOrden);
  cargarMetrics();
});

async function cargarMetrics() {
  const loading = document.getElementById('loading');
  const err = document.getElementById('error-message');
  loading.style.display = 'block';
  err.style.display = 'none';
  try {
    const res = await axios.get(API_METRICS);
    const data = res.data || {};
    productosCache = data.productos || [];
    tiposCache = data.porTipo || [];
    renderResumenTotal(data.totalContratado);
    renderPorTipo(tiposCache);
    renderPorProducto(productosCache);
  } catch (error) {
    console.error('Error cargando metrics:', error);
    err.textContent = 'No se pudieron cargar las métricas. Reintenta más tarde.';
    err.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

function renderResumenTotal(total) {
  const cont = document.getElementById('resumen-total');
  cont.innerHTML = `<h3>Total contratado: <strong>${formatoMonto(total)}</strong></h3>`;
}

function renderPorTipo(tipos) {
  const cont = document.getElementById('por-tipo');
  if (!tipos.length) {
    cont.innerHTML = '<p>No hay contratos registrados.</p>';
    return;
  }

  // compute fondo vs seguro
  const mapa = {};
  tipos.forEach(t => { mapa[t.tipo] = Number(t.totalContratado || 0); });
  const fondo = mapa['FONDO'] || 0;
  const seguro = mapa['SEGURO'] || 0;
  const suma = fondo + seguro;
  const pctFondo = suma > 0 ? Math.round((fondo / suma) * 100) : 0;
  const pctSeguro = suma > 0 ? Math.round((seguro / suma) * 100) : 0;

  document.getElementById('fill-fondo').style.width = pctFondo + '%';
  document.getElementById('fill-seguro').style.width = pctSeguro + '%';
  document.getElementById('label-fondo').textContent = `Fondos: ${pctFondo}%`;
  document.getElementById('label-seguro').textContent = `Seguros: ${pctSeguro}%`;

  cont.innerHTML = tipos.map(t => `
    <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
      <div><strong>${escapeHtml(t.tipo)}</strong></div>
      <div>${formatoMonto(t.totalContratado)}</div>
    </div>
  `).join('');
}

function aplicarOrden() {
  const val = document.getElementById('sort-products').value;
  let arr = productosCache.slice();
  if (val === 'visitas_desc') {
    arr.sort((a,b) => (b.visitas||0) - (a.visitas||0));
  } else if (val === 'monto_desc') {
    arr.sort((a,b) => Number(b.totalContratado||0) - Number(a.totalContratado||0));
  }
  renderPorProducto(arr);
}

function renderPorProducto(productos) {
  const cont = document.getElementById('por-producto');
  if (!productos.length) {
    cont.innerHTML = '<p>No hay productos registrados.</p>';
    return;
  }
  cont.innerHTML = productos.map(p => {
    const tipo = (p.tipo || '').toUpperCase();
    const cls = tipo === 'SEGURO' ? 'seguro' : 'fondo';
    return `
      <div class="producto-card-metric ${cls}">
        <div class="left">
          <div class="nombre">${escapeHtml(p.productoNombre || 'Producto')}</div>
          <div style="display:flex; gap:8px; align-items:center; margin-top:6px;">
            <div class="monto">${formatoMonto(p.totalContratado)}</div>
            <div class="tipo-badge ${tipo === 'SEGURO' ? 'badge-seguro' : 'badge-fondo'}">${escapeHtml(tipo || '')}</div>
          </div>
        </div>
        <div class="visitas">${escapeHtml(String(p.visitas ?? 0))}</div>
      </div>
    `;
  }).join('');
}

function formatoMonto(valor) {
  const n = Number(valor || 0);
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
