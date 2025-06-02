const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {}; // Guardará salas y contraseñas y código

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('join-room', ({ roomId, password }) => {
    if (rooms[roomId]) {
      // Sala existe, verificar contraseña
      if (rooms[roomId].password === password) {
        socket.join(roomId);
        socket.emit('joined', rooms[roomId].code);
        console.log(`Usuario entró a sala ${roomId}`);
      } else {
        socket.emit('error-message', 'Contraseña incorrecta');
      }
    } else {
      // Crear sala nueva
      rooms[roomId] = { password, code: '' };
      socket.join(roomId);
      socket.emit('joined', '');
      console.log(`Sala ${roomId} creada`);
    }
  });

  socket.on('code-change', ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
