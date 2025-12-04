const API_MOVIMIENTOS = `${window.location.origin}/api/admin/movimientos`;

let movimientosCache = [];
let currentPage = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-filtrar').addEventListener('click', cargarFiltrado);
  document.getElementById('btn-todos').addEventListener('click', cargarTodos);
  document.getElementById('filter-tipo').addEventListener('change', aplicarFiltrosYRender);
  document.getElementById('page-size').addEventListener('change', (e) => {
    pageSize = Number(e.target.value) || 10;
    currentPage = 1;
    aplicarFiltrosYRender();
  });
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
  cargarTodos();
});

async function cargarFiltrado() {
  const id = document.getElementById('usuarioId').value;
  if (!id) return cargarTodos();
  await cargarMovimientos(id);
}

async function cargarTodos() {
  await cargarMovimientos();
}

async function cargarMovimientos(usuarioId) {
  const loading = document.getElementById('loading');
  const err = document.getElementById('error-message');
  const listContainer = document.getElementById('movimientos-list');
  loading.style.display = 'block';
  err.style.display = 'none';
  listContainer.innerHTML = '';
  try {
    const url = usuarioId ? `${API_MOVIMIENTOS}?usuarioId=${usuarioId}` : API_MOVIMIENTOS;
    const res = await axios.get(url);
    movimientosCache = res.data || [];
    currentPage = 1;
    aplicarFiltrosYRender();
  } catch (error) {
    console.error('Error cargando movimientos', error);
    err.textContent = 'No se pudieron cargar los movimientos.';
    err.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

function aplicarFiltrosYRender() {
  const tipo = document.getElementById('filter-tipo').value;
  let lista = movimientosCache.slice();
  if (tipo) {
    lista = lista.filter(m => String(m.tipo) === tipo);
  }
  renderPage(lista);
}

function renderPage(lista) {
  const listContainer = document.getElementById('movimientos-list');
  if (!lista.length) {
    listContainer.innerHTML = '<div class="empty-state"><h3>No hay movimientos</h3></div>';
    document.getElementById('page-info').textContent = '';
    return;
  }
  const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const pageItems = lista.slice(start, start + pageSize);
  listContainer.innerHTML = pageItems.map(m => {
    const tipo = (m.tipo || '').toUpperCase();
    return `
      <div class="movimiento-card">
        <div class="movimiento-left">
          <div style="display:flex; gap:8px; align-items:center;">
            <div style="font-weight:700;">${escapeHtml(m.usuarioNombre ?? ('#' + (m.usuarioId || '')))}</div>
            <div class="movimiento-meta">${escapeHtml(m.productoNombre ?? ('#' + (m.productoId || '')))}</div>
            <div class="movimiento-meta">• ${escapeHtml(formatFecha(m.creadoEn))}</div>
          </div>
          <div class="movimiento-meta">${escapeHtml(m.detalle || '')}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div class="movimiento-amount movimiento-type-${escapeHtml(tipo)}">${formatoMonto(m.monto)}</div>
          <div class="movimiento-meta movimiento-type-${escapeHtml(tipo)}">${escapeHtml(tipo)}</div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages} — ${lista.length} movimientos`;
}


function changePage(delta) {
  currentPage = Math.max(1, currentPage + delta);
  aplicarFiltrosYRender();
}

function formatoMonto(valor) {
  const n = Number(valor || 0);
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    return d.toLocaleString('es-PE');
  } catch (e) {
    return fechaStr;
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
