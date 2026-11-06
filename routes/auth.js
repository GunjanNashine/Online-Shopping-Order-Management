const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/db');
const { redirectIfAuthenticated } = require('../middleware/auth');

// GET /register
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', {
    title: 'Create Account | Aura & Forma',
    error: req.session.errorMessage || null,
    success: req.session.successMessage || null
  });
  req.session.errorMessage = null;
  req.session.successMessage = null;
});

// POST /register
router.post('/register', redirectIfAuthenticated, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Field validation
    if (!name || !email || !password) {
      req.session.errorMessage = 'All fields are required. Please fill in your name, email, and password.';
      return res.redirect('/register');
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      req.session.errorMessage = 'Please enter a valid email address.';
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.session.errorMessage = 'Password must be at least 6 characters in length.';
      return res.redirect('/register');
    }

    // Check duplicate email
    const existingUser = await db.getAsync('SELECT id FROM customers WHERE email = ?', [trimmedEmail]);
    if (existingUser) {
      req.session.errorMessage = 'An account with this email address already exists. Please sign in instead.';
      return res.redirect('/register');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert customer
    await db.runAsync(
      'INSERT INTO customers (name, email, password, role) VALUES (?, ?, ?, ?)',
      [trimmedName, trimmedEmail, hashedPassword, 'customer']
    );

    req.session.successMessage = 'Registration successful! You may now sign in with your credentials.';
    return res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.session.errorMessage = 'A server error occurred during registration. Please try again.';
    return res.redirect('/register');
  }
});

// GET /login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Sign In | Aura & Forma',
    error: req.session.errorMessage || null,
    success: req.session.successMessage || null
  });
  req.session.errorMessage = null;
  req.session.successMessage = null;
});

// POST /login
router.post('/login', redirectIfAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.errorMessage = 'Please provide both your email address and password.';
      return res.redirect('/login');
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user
    const user = await db.getAsync('SELECT * FROM customers WHERE email = ?', [trimmedEmail]);
    if (!user) {
      req.session.errorMessage = 'Invalid email or password. Please verify your credentials.';
      return res.redirect('/login');
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.errorMessage = 'Invalid email or password. Please verify your credentials.';
      return res.redirect('/login');
    }

    // Set Session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.successMessage = `Welcome back, ${user.name}!`;

    // Role-based redirection
    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    return res.redirect('/products');
  } catch (err) {
    console.error('Login error:', err);
    req.session.errorMessage = 'An unexpected error occurred while logging in.';
    return res.redirect('/login');
  }
});

// GET & POST /logout
const handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};

router.get('/logout', handleLogout);
router.post('/logout', handleLogout);

module.exports = router;
