// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const saveModel = require('./saveModel');

// const app = express();
// const port = 3001;

// app.use(cors());
// app.use(express.json()); 

// app.get('/', (req,res)=>{

    
//     res.send("hello world");
// })

// app.post('/login', async(req,res)=>{
//    const { name, password } = req.body;

 
//    const data = await saveModel.create({ name, password });

//    res.send("data save sucessufly");
    
// })

// app.post('/signup', async (req, res) => {
//   try {
//     const { email, userName, password } = req.body;

//     const data = await saveModel.create({
//       email: email,
//       name: userName,
//       password: password,
//     });

//     return res.status(200).json({
//       code: 200,
//       success: true,
//       message: "Registration successful",
//       data: {
//         id: data._id,
//         name: data.name,
//         email: data.email,
//       }
//     });
//   } catch (error) {
//     console.error("Signup error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong during signup"
//     });
//   }
// });

// mongoose.connect('mongodb://localhost:27017/saurabh')
//   .then(() => {
//     console.log("Database connected");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

// app.listen(port,()=>{
//     console.log(`Server is running on ${port}`); 
// })



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// const express = require('express');
// const app = express();

// app.listen(3000,()=>{
//   console.log("Server is running on port 3000");
// })