const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

// Protect all admin routes
router.use(requireAdmin);

// GET /admin - Admin Dashboard with Analytics & Inventory Table
router.get('/', async (req, res) => {
  try {
    const products = await db.allAsync('SELECT * FROM products ORDER BY id DESC');
    const totalOrdersRow = await db.getAsync('SELECT COUNT(*) as count, IFNULL(SUM(total_amount), 0) as revenue FROM orders');
    const lowStockCountRow = await db.getAsync('SELECT COUNT(*) as count FROM products WHERE stock <= 5 AND is_active = 1');
    const activeProductsRow = await db.getAsync('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const recentOrders = await db.allAsync(`
      SELECT o.*, c.name as customer_name, c.email as customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC LIMIT 5
    `);

    res.render('admin', {
      title: 'Studio Operations & Inventory Admin | Aura & Forma',
      products,
      stats: {
        totalProducts: products.length,
        activeProducts: activeProductsRow.count,
        lowStockCount: lowStockCountRow.count,
        totalOrders: totalOrdersRow.count,
        totalRevenue: parseFloat(totalOrdersRow.revenue).toFixed(2)
      },
      recentOrders,
      user: req.session.user,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Internal Server Error loading Admin Dashboard.');
  }
});

// POST /admin/products/add - Add new artisan product
router.post('/products/add', async (req, res) => {
  try {
    const { name, description, category, price, stock, image_url } = req.body;

    if (!name || !description || !category || price === undefined || stock === undefined) {
      req.session.errorMessage = 'Please provide all mandatory product specifications.';
      return res.redirect('/admin');
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      req.session.errorMessage = 'Price must be a valid non-negative number.';
      return res.redirect('/admin');
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      req.session.errorMessage = 'Stock must be a valid non-negative integer.';
      return res.redirect('/admin');
    }

    const defaultImage = image_url && image_url.trim() 
      ? image_url.trim() 
      : 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80';

    await db.runAsync(
      `INSERT INTO products (name, description, category, price, stock, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name.trim(), description.trim(), category.trim(), parsedPrice, parsedStock, defaultImage]
    );

    req.session.successMessage = `Artisan piece "${name.trim()}" added to the catalog successfully!`;
    return res.redirect('/admin');
  } catch (err) {
    console.error('Admin add product error:', err);
    req.session.errorMessage = 'Failed to add product due to database constraint.';
    return res.redirect('/admin');
  }
});

// POST /admin/products/edit/:id - Update product details & inventory
router.post('/products/edit/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, category, price, stock, image_url } = req.body;

    const existing = await db.getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existing) {
      req.session.errorMessage = 'Product not found.';
      return res.redirect('/admin');
    }

    const updatedName = (name || existing.name).trim();
    const updatedDesc = (description || existing.description).trim();
    const updatedCat = (category || existing.category).trim();
    const updatedPrice = price !== undefined ? parseFloat(price) : existing.price;
    const updatedStock = stock !== undefined ? parseInt(stock, 10) : existing.stock;
    const updatedImg = (image_url && image_url.trim()) ? image_url.trim() : existing.image_url;

    if (isNaN(updatedPrice) || updatedPrice < 0) {
      req.session.errorMessage = 'Invalid price value.';
      return res.redirect('/admin');
    }

    if (isNaN(updatedStock) || updatedStock < 0) {
      req.session.errorMessage = 'Invalid stock quantity.';
      return res.redirect('/admin');
    }

    await db.runAsync(
      `UPDATE products 
       SET name = ?, description = ?, category = ?, price = ?, stock = ?, image_url = ?
       WHERE id = ?`,
      [updatedName, updatedDesc, updatedCat, updatedPrice, updatedStock, updatedImg, productId]
    );

    req.session.successMessage = `Product #${productId} (${updatedName}) updated successfully!`;
    return res.redirect('/admin');
  } catch (err) {
    console.error('Admin update product error:', err);
    req.session.errorMessage = 'Failed to update product.';
    return res.redirect('/admin');
  }
});

// POST /admin/products/delete/:id - Delete or Deactivate product
router.post('/products/delete/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const action = req.body.action || 'delete'; // 'delete' or 'toggle'

    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      req.session.errorMessage = 'Product not found.';
      return res.redirect('/admin');
    }

    if (action === 'toggle') {
      const newStatus = product.is_active === 1 ? 0 : 1;
      await db.runAsync('UPDATE products SET is_active = ? WHERE id = ?', [newStatus, productId]);
      req.session.successMessage = `Product "${product.name}" status set to ${newStatus === 1 ? 'Active' : 'Inactive'}.`;
    } else {
      // Check if product is in order_items before hard delete; if so, soft-deactivate to preserve order history
      const hasOrders = await db.getAsync('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [productId]);
      if (hasOrders) {
        await db.runAsync('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
        req.session.successMessage = `Product has historic orders; successfully deactivated from storefront.`;
      } else {
        await db.runAsync('DELETE FROM products WHERE id = ?', [productId]);
        req.session.successMessage = `Product "${product.name}" deleted permanently.`;
      }
    }

    return res.redirect('/admin');
  } catch (err) {
    console.error('Admin delete product error:', err);
    req.session.errorMessage = 'Unable to delete or deactivate product.';
    return res.redirect('/admin');
  }
});

module.exports = router;
