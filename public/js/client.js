const socket = io();

// Verificar autenticación al cargar
fetch('/api/user')
  .then(response => {
    if (!response.ok) window.location.href = 'login.html';
  })
  .catch(() => window.location.href = 'login.html');

var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode: "text/html",
    theme: "dracula",
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true
});

const errorDiv = document.getElementById('error');
editor.setSize(1200, 400);

// Obtener roomId y password de la URL
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
const password = params.get('pass');

if (!roomId || !password) {
  errorDiv.textContent = 'Falta ID de sala o contraseña.';
  editor.setOption('readOnly', true);
} else {
  socket.emit('join-room', { roomId, password });
  
  // Opcional: Guardar la sala si el usuario quiere
  document.getElementById('save-room-btn')?.addEventListener('click', () => {
    const roomName = prompt('Ingrese un nombre para esta sala (opcional):') || roomId;
    fetch('/api/save-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, password, name: roomName })
    }).then(response => {
      if (response.ok) alert('Sala guardada en tu perfil!');
    });
  });
}

const nombreroom = document.getElementById('nombreroom');
if (roomId) {
  nombreroom.textContent = `${roomId}`;
}

socket.on('joined', (code) => {
  errorDiv.textContent = '';
  editor.setValue(code);
});

socket.on('error-message', (msg) => {
  errorDiv.textContent = msg;
  editor.setOption('readOnly', true);
});

// Cuando el usuario escribe, envía cambios al servidor
editor.on('change', () => {
  const code = editor.getValue();
  socket.emit('code-change', { roomId, code });
});

// Cuando llega actualización de código desde otro usuario
socket.on('code-update', (code) => {
  if (code !== editor.getValue()) {
    editor.setValue(code);
  }
});

document.getElementById("run").addEventListener("click", () => {
  const code = editor.getValue();
  const win = window.open();
  win.document.open();
  win.document.write(code);
  win.document.close();
});