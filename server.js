require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const followerRoutes = require('./routes/followerRoutes');
const postsRoutes = require('./routes/postsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
// using epress everything working 
const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server and attach socket.io
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Make io accessible in controllers
app.set('io', io);

// Connect to MongoDB or fallback to mock database
connectDB();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/follow', followerRoutes);
app.use('/api', postsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api', require('./routes/chatRoutes'));

app.get('/', (req, res) => {
  res.send("Hello World");
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  socket.on('join', (userId) => {
    socket.join(userId);
  });
  socket.on('send_message', (data) => {
    io.to(data.recipient).emit('receive_message', data);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { io, server };