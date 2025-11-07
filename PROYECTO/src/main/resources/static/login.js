const API_AUTH = 'http://localhost:8080/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-login').addEventListener('click', login);
});

async function login() {
  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value.trim();
  const msg = document.getElementById('msg');

  msg.textContent = '';

  if (!usuario || !clave) {
    msg.textContent = 'Completa ambos campos.';
    return;
  }

  try {
    await axios.post(`${API_AUTH}/login`, { usuario, clave });
    location.href = './index.html';
  } catch (e) {
    msg.textContent = e?.response?.data || 'Usuario o contraseña incorrectos';
  }
}

