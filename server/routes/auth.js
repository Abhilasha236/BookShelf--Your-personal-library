const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../modals/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) return res.json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.json({ message: 'User not found', success: false });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.json({ message: 'Invalid password', success: false });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // ✅ Include user name and email in response
    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});



module.exports = router;
