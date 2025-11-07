// ============================================
// SISTEMA DE GESTIÓN DE EMPLEADOS
// Lógica Frontend con Axios
// ============================================

// ===== CONFIGURACIÓN =====
const API_URL = 'http://localhost:8080/api/empleados';

// Variable global para almacenar el ID del empleado a eliminar
let empleadoAEliminar = null;

// Configuración de Axios
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para manejar errores globales
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la petición:', error);
    mostrarError('Error de conexión con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8080');
    return Promise.reject(error);
  }
);

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Aplicación iniciada (Empleados)');
  cargarEmpleados();
  configurarFormulario();
  configurarBuscador();
});

// Configurar el formulario
function configurarFormulario() {
  const form = document.getElementById('empleado-form');
  form.addEventListener('submit', guardarEmpleado);
}

// Configurar el buscador
function configurarBuscador() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      buscarEmpleados();
    }
  });
}

// ===== FUNCIONES DE CARGA =====

/** Cargar todos los empleados desde el backend */
async function cargarEmpleados() {
  console.log('📥 Cargando empleados...');
  mostrarLoading(true);
  ocultarError();

  try {
    const res = await axios.get(API_URL);
    // Puede venir como array directo o como {ok,data}
    const empleados = Array.isArray(res.data) ? res.data : (res.data.data || []);
    console.log('✅ Empleados cargados:', empleados.length);
    mostrarEmpleados(empleados);
  } catch (error) {
    console.error('❌ Error al cargar empleados:', error);
    mostrarError('No se pudieron cargar los empleados. Verifica el backend.');
  } finally {
    mostrarLoading(false);
  }
}

// ===== FUNCIONES DE VISUALIZACIÓN =====

/**
 * Mostrar la lista de empleados en el DOM
 * @param {Array} empleados
 */
function mostrarEmpleados(empleados) {
  const container = document.getElementById('empleados-container');

  if (!empleados || empleados.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <h3>No hay empleados registrados</h3>
        <p>Agrega el primero usando el formulario superior</p>
      </div>
    `;
    return;
  }

  const empleadosHTML = empleados.map(emp => `
    <div class="producto-card">
      <div class="producto-header">
        <div>
          <div class="producto-nombre">${escapeHtml(emp.nombre)} ${escapeHtml(emp.apellido || '')}</div>
          <div class="producto-id">ID: ${emp.id}</div>
        </div>
      </div>

      <div class="producto-descripcion">
        <b>Email:</b> ${escapeHtml(emp.email)}<br/>
        <b>Tel:</b> ${escapeHtml(emp.telefono || '')}
      </div>

      <div class="producto-details">
        <div class="detail-item">
          <div class="detail-label">F. Contratación</div>
          <div class="detail-value">${emp.fechaContratacion}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Salario</div>
          <div class="detail-value">S/ ${Number(emp.salario).toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Cargo</div>
          <div class="detail-value">${escapeHtml(emp.cargo || '')}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Dep. ID</div>
          <div class="detail-value">${emp.departamentoId ?? ''}</div>
        </div>
      </div>

      <div class="producto-actions">
        <button class="btn btn-warning" onclick="editarEmpleado(${emp.id})">✏️ Editar</button>
        <button class="btn btn-danger" onclick="abrirModalEliminar(${emp.id})">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="productos-grid">${empleadosHTML}</div>`;
}

// ===== FUNCIONES CRUD =====

/**
 * Guardar empleado (Crear o Actualizar)
 * @param {Event} event
 */
async function guardarEmpleado(event) {
  event.preventDefault();

  const id = document.getElementById('empleado-id').value;

  const empleado = {
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim() || null,
    fechaContratacion: document.getElementById('fechaContratacion').value,
    salario: parseFloat(document.getElementById('salario').value),
    cargo: document.getElementById('cargo').value.trim() || null,
    departamentoId: document.getElementById('departamentoId').value ? parseInt(document.getElementById('departamentoId').value) : null
  };

  // Validaciones básicas
  if (!empleado.nombre || empleado.nombre.length < 2) {
    mostrarError('El nombre debe tener al menos 2 caracteres');
    return;
  }
  if (!empleado.apellido || empleado.apellido.length < 2) {
    mostrarError('El apellido debe tener al menos 2 caracteres');
    return;
  }
  if (!empleado.email) {
    mostrarError('El email es obligatorio');
    return;
  }
  if (!empleado.fechaContratacion) {
    mostrarError('La fecha de contratación es obligatoria');
    return;
  }
  if (!(empleado.salario > 0)) {
    mostrarError('El salario debe ser mayor que 0');
    return;
  }

  console.log('💾 Guardando empleado:', empleado);

  try {
    if (id) {
      await axios.put(`${API_URL}/${id}`, empleado);
      mostrarMensajeExito('✅ Empleado actualizado correctamente');
    } else {
      await axios.post(API_URL, empleado);
      mostrarMensajeExito('✅ Empleado creado correctamente');
    }
    limpiarFormulario();
    cargarEmpleados();
  } catch (error) {
    console.error('❌ Error al guardar empleado:', error);

    if (error.response && error.response.data) {
      const payload = error.response.data;
      // Puede venir como mapa de errores o como ApiResponse
      const mensajes = typeof payload === 'object' && !Array.isArray(payload)
        ? Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join('\n')
        : String(payload);
      mostrarError(mensajes || 'Error al guardar el empleado.');
    } else {
      mostrarError('Error al guardar el empleado. Verifica los datos e intenta nuevamente.');
    }
  }
}

/** Editar un empleado existente */
async function editarEmpleado(id) {
  console.log('✏️ Editando empleado:', id);

  try {
    const res = await axios.get(`${API_URL}/${id}`);
    const emp = Array.isArray(res.data) ? res.data[0] : (res.data.data || res.data);

    document.getElementById('empleado-id').value = emp.id;
    document.getElementById('nombre').value = emp.nombre || '';
    document.getElementById('apellido').value = emp.apellido || '';
    document.getElementById('email').value = emp.email || '';
    document.getElementById('telefono').value = emp.telefono || '';
    document.getElementById('fechaContratacion').value = emp.fechaContratacion || '';
    document.getElementById('salario').value = emp.salario || '';
    document.getElementById('cargo').value = emp.cargo || '';
    document.getElementById('departamentoId').value = emp.departamentoId ?? '';

    document.getElementById('form-title').textContent = '✏️ Editar Empleado';
    document.getElementById('btn-text').textContent = '💾 Actualizar Empleado';
    document.getElementById('btn-cancel').style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('✅ Empleado cargado en el formulario');
  } catch (error) {
    console.error('❌ Error al cargar empleado:', error);
    mostrarError('No se pudo cargar el empleado para editar');
  }
}

/** Abrir modal de confirmación para eliminar */
function abrirModalEliminar(id) {
  console.log('🗑️ Abriendo modal para eliminar empleado:', id);
  empleadoAEliminar = id;
  const modal = document.getElementById('modal-confirmacion');
  modal.style.display = 'flex';
}

/** Cerrar modal */
function cerrarModal() {
  const modal = document.getElementById('modal-confirmacion');
  modal.style.display = 'none';
  empleadoAEliminar = null;
}

/** Confirmar eliminación del empleado */
async function confirmarEliminar() {
  if (!empleadoAEliminar) return;

  console.log('🗑️ Eliminando empleado:', empleadoAEliminar);
  try {
    await axios.delete(`${API_URL}/${empleadoAEliminar}`);
    mostrarMensajeExito('🗑️ Empleado eliminado correctamente');
    cerrarModal();
    cargarEmpleados();
  } catch (error) {
    console.error('❌ Error al eliminar empleado:', error);
    mostrarError('No se pudo eliminar el empleado');
    cerrarModal();
  }
}

// ===== FUNCIONES DE BÚSQUEDA =====

/** Buscar empleados por nombre */
async function buscarEmpleados() {
  const searchTerm = document.getElementById('search-input').value.trim();

  if (!searchTerm) {
    cargarEmpleados();
    return;
  }

  console.log('🔍 Buscando empleados:', searchTerm);
  mostrarLoading(true);
  ocultarError();

  try {
    const res = await axios.get(`${API_URL}/buscar`, { params: { nombre: searchTerm } });
    const empleados = Array.isArray(res.data) ? res.data : (res.data.data || []);
    mostrarEmpleados(empleados);

    if (empleados.length === 0) {
      mostrarError(`No se encontraron empleados con el término: "${searchTerm}"`);
    }
  } catch (error) {
    console.error('❌ Error al buscar empleados:', error);
    mostrarError('Error al realizar la búsqueda');
  } finally {
    mostrarLoading(false);
  }
}

// ===== FUNCIONES AUXILIARES =====

function cancelarEdicion() {
  limpiarFormulario();
}

function limpiarFormulario() {
  document.getElementById('empleado-form').reset();
  document.getElementById('empleado-id').value = '';
  document.getElementById('form-title').textContent = '➕ Agregar Nuevo Empleado';
  document.getElementById('btn-text').textContent = '💾 Guardar Empleado';
  document.getElementById('btn-cancel').style.display = 'none';
}

function mostrarLoading(mostrar) {
  const loading = document.getElementById('loading');
  loading.style.display = mostrar ? 'block' : 'none';
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = mensaje;
  errorDiv.style.display = 'block';
  setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
}

function ocultarError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.style.display = 'none';
}

function mostrarMensajeExito(mensaje) {
  const container = document.querySelector('.container');
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = mensaje;
  container.insertBefore(successDiv, container.children[1]);
  setTimeout(() => { successDiv.remove(); }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (event) => {
  const modal = document.getElementById('modal-confirmacion');
  if (event.target === modal) cerrarModal();
});

// Cerrar modal con ESC
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') cerrarModal();
});

// ===== UTILIDADES DE CONSOLA =====
function mostrarEstadisticas() {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║    SISTEMA DE GESTIÓN DE EMPLEADOS    ║
  ╠═══════════════════════════════════════╣
  ║ API URL: ${API_URL}
  ║ Estado: Conectado (si backend activo)
  ╚═══════════════════════════════════════╝
  `);
}
setTimeout(mostrarEstadisticas, 1000);

console.log('✅ Script de Empleados cargado correctamente');
