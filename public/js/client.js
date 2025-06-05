const socket = io();
let username = ''; // Variable para almacenar el nombre de usuario

// Verificar autenticación al cargar y obtener username
fetch('/api/user')
  .then(response => {
    if (!response.ok) window.location.href = 'login.html';
    return response.json();
  })
  .then(user => {
    username = user.username;
    console.log('Usuario autenticado:', username);
  })
  .catch(() => window.location.href = 'login.html');

var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode: "text/html",
    theme: "dracula",
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true,

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

// Funcionalidad del chat
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-message');

console.log('Estado inicial del chat:');
console.log('- chatMessages existe:', !!chatMessages);
console.log('- chatInput existe:', !!chatInput);
console.log('- sendButton existe:', !!sendButton);

if (!chatMessages || !chatInput || !sendButton) {
  console.error('No se encontraron los elementos del chat en el DOM');
} else {
  console.log('Elementos del chat inicializados correctamente');
  console.log('chatMessages HTML actual:', chatMessages.innerHTML);
}

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  } catch (error) {
    console.error('Error formateando timestamp:', error);
    return '';
  }
}

function addMessage(messageData) {
  try {
    console.log('Intentando agregar mensaje al DOM:', messageData);
    console.log('Estado del chatMessages antes de agregar:', chatMessages?.innerHTML);
    
    if (!chatMessages) {
      console.error('El contenedor de mensajes no existe');
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    // Agregar clase especial si el mensaje es del usuario actual
    if (messageData.username === username) {
      messageDiv.classList.add('own-message');
    }
    
    // Sanitizar el contenido para prevenir XSS
    const sanitizedUsername = messageData.username.replace(/[<>]/g, '');
    const sanitizedMessage = messageData.message.replace(/[<>]/g, '');
    
    const messageHTML = `
      <div class="header">
        <span class="username">${sanitizedUsername}</span>
        <span class="time">${formatTimestamp(messageData.timestamp)}</span>
      </div>
      <div class="content">${sanitizedMessage}</div>
    `;
    
    console.log('HTML del mensaje a agregar:', messageHTML);
    messageDiv.innerHTML = messageHTML;
    
    chatMessages.appendChild(messageDiv);
    console.log('Mensaje agregado. Nuevo estado del chatMessages:', chatMessages.innerHTML);
    
    // Asegurarse de que el scroll esté al final
    requestAnimationFrame(() => {
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
      console.log('Scroll aplicado al mensaje');
    });
    
    console.log('Mensaje agregado correctamente al DOM');
  } catch (error) {
    console.error('Error al agregar mensaje:', error, error.stack);
  }
}

function sendMessage() {
  try {
    const message = chatInput.value.trim();
    console.log('Intentando enviar mensaje:', message);
    console.log('Estado actual:');
    console.log('- Username:', username);
    console.log('- RoomId:', roomId);
    console.log('- chatMessages existe:', !!chatMessages);
    console.log('- Contenido actual del chat:', chatMessages?.innerHTML);
    
    if (!message) {
      console.log('Mensaje vacío, no se envía');
      return;
    }
    
    if (!username) {
      console.error('No hay username disponible');
      return;
    }

    if (!roomId) {
      console.error('No hay roomId disponible');
      return;
    }

    const messageData = {
      roomId,
      username,
      message
    };

    console.log('Emitiendo mensaje al servidor:', messageData);
    socket.emit('chat-message', messageData);
    chatInput.value = '';
  } catch (error) {
    console.error('Error al enviar mensaje:', error, error.stack);
  }
}

// Eventos del chat
if (sendButton && chatInput) {
  sendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  console.log('Eventos del chat registrados');
}

// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Socket.IO conectado');
});

socket.on('disconnect', () => {
  console.log('Socket.IO desconectado');
});

socket.on('error', (error) => {
  console.error('Error de Socket.IO:', error);
});

// Recibir historial de mensajes al unirse
socket.on('chat-history', (messages) => {
  console.log('Historial de mensajes recibido:', messages);
  if (!Array.isArray(messages)) {
    console.error('El historial de mensajes no es un array:', messages);
    return;
  }
  
  if (chatMessages) {
    console.log('Limpiando chat antes de mostrar historial');
    chatMessages.innerHTML = '';
    messages.forEach(message => {
      console.log('Procesando mensaje del historial:', message);
      addMessage(message);
    });
    console.log('Historial de mensajes mostrado');
  } else {
    console.error('Elemento chatMessages no encontrado');
  }
});

// Recibir nuevos mensajes
socket.on('chat-update', (messageData) => {
  console.log('Nuevo mensaje recibido del servidor:', messageData);
  if (messageData && messageData.username && messageData.message) {
    console.log('Mensaje válido, intentando agregar al chat');
    addMessage(messageData);
  } else {
    console.error('Mensaje recibido con formato incorrecto:', messageData);
  }
});