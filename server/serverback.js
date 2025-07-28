require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/books', bookRoutes);
app.use('/api', authRoutes);      // /api/login and /api/signup will work now

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
