require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send("Server Connected Successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});