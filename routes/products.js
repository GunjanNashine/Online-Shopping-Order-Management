const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// GET / - Brand Homepage
router.get('/', async (req, res) => {
  try {
    const featuredProducts = await db.allAsync(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC LIMIT 4'
    );
    const newArrivals = await db.allAsync(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT 4'
    );
    const categories = await db.allAsync(
      'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
    );

    res.render('index', {
      title: 'Aura & Forma | Curated Artisanal Living',
      featuredProducts,
      newArrivals,
      categories: categories.map(c => c.category),
      user: req.session.user || null,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).render('index', {
      title: 'Aura & Forma | Curated Artisanal Living',
      featuredProducts: [],
      newArrivals: [],
      categories: [],
      user: req.session.user || null,
      error: 'Unable to load catalog at this time.',
      success: null
    });
  }
});

// GET /products - Full Catalogue with Search, Category Filter & Sorting
router.get('/products', async (req, res) => {
  try {
    const searchQuery = (req.query.search || '').trim();
    const selectedCategory = (req.query.category || '').trim();
    const sortBy = (req.query.sort || 'newest').trim();

    let sql = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    // Search filter (case-insensitive name or description)
    if (searchQuery) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      sql += ' AND category = ?';
      params.push(selectedCategory);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sortBy === 'name_asc') {
      sql += ' ORDER BY name ASC';
    } else {
      sql += ' ORDER BY id DESC';
    }

    const products = await db.allAsync(sql, params);
    const allCategories = await db.allAsync(
      'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
    );

    res.render('products', {
      title: 'Artisanal Catalogue | Aura & Forma',
      products,
      categories: allCategories.map(c => c.category),
      currentSearch: searchQuery,
      currentCategory: selectedCategory || 'All',
      currentSort: sortBy,
      user: req.session.user || null,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Catalogue fetch error:', err);
    res.status(500).render('products', {
      title: 'Artisanal Catalogue | Aura & Forma',
      products: [],
      categories: [],
      currentSearch: '',
      currentCategory: 'All',
      currentSort: 'newest',
      user: req.session.user || null,
      error: 'An unexpected error occurred while fetching the catalog.',
      success: null
    });
  }
});

// GET /products/:id - Single Product Details
router.get('/products/:id', async (req, res) => {
  try {
    const product = await db.getAsync(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [req.params.id]
    );

    if (!product) {
      req.session.errorMessage = 'The requested artisan piece could not be found or is inactive.';
      return res.redirect('/products');
    }

    const relatedProducts = await db.allAsync(
      'SELECT * FROM products WHERE category = ? AND id != ? AND is_active = 1 LIMIT 3',
      [product.category, product.id]
    );

    res.render('product-detail', {
      title: `${product.name} | Aura & Forma`,
      product,
      relatedProducts,
      user: req.session.user || null,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Product details error:', err);
    res.redirect('/products');
  }
});

module.exports = router;
