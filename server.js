const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/codeSync', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelos
const User = mongoose.model('User', {
  username: String,
  password: String,
  savedRooms: [{
    roomId: String,
    password: String,
    name: String
  }]
});

// Configuración de sesiones
app.use(session({
  secret: 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/codeSync' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 día
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
      savedRooms: []
    });
    await user.save();
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.userId = user._id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
});

app.get('/api/user', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  
  const user = await User.findById(req.session.userId, { password: 0 });
  res.json(user);
});

app.post('/api/save-room', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  
  await User.updateOne(
    { _id: req.session.userId },
    { $addToSet: { savedRooms: req.body } }
  );
  res.json({ success: true });
});

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

server.listen(3000, '0.0.0.0', () => {
  console.log('Servidor escuchando en la red local en el puerto 3000');
});