require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { db, initializeDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'aura_forma_craft_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Global view variables & dynamic cart counter middleware
app.use(async (req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  res.locals.currentPath = req.path;
  res.locals.cartCount = 0;

  if (req.session && req.session.user) {
    try {
      const cartRow = await db.getAsync(
        'SELECT IFNULL(SUM(quantity), 0) as totalCount FROM cart_items WHERE customer_id = ?',
        [req.session.user.id]
      );
      res.locals.cartCount = cartRow ? cartRow.totalCount : 0;
    } catch (err) {
      console.error('Error fetching global cart count:', err);
    }
  }
  next();
});

// Mount Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/', require('./routes/orders'));
app.use('/admin', require('./routes/admin'));

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found | Aura & Forma',
    user: req.session ? req.session.user : null,
    error: 'The requested artisan page does not exist.',
    success: null
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('500', {
    title: 'Studio Service Notice | Aura & Forma',
    user: req.session ? req.session.user : null,
    error: 'An internal server error occurred. Please contact customer support.',
    success: null
  });
});

// Bootstrapping
async function startServer() {
  try {
    await initializeDatabase();
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, HOST, () => {
        console.log(`=======================================================`);
        console.log(`  🌿 AURA & FORMA — Online Shopping & Order System     `);
        console.log(`  📡 Server running at http://${HOST}:${PORT}           `);
        console.log(`  🌐 Local Access:    http://localhost:${PORT}          `);
        console.log(`  🔒 Admin Access:    http://localhost:${PORT}/login     `);
        console.log(`  Credentials:        admin@aurafoma.com / Admin@1234   `);
        console.log(`=======================================================`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
