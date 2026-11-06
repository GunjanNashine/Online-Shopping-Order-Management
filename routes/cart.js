const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// All cart operations require authentication
router.use(requireAuth);

// GET /cart - View Shopping Cart
router.get('/', async (req, res) => {
  try {
    const customerId = req.session.user.id;

    const cartItems = await db.allAsync(`
      SELECT 
        c.id as cart_item_id,
        c.quantity,
        c.product_id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.stock,
        p.image_url,
        p.is_active,
        (c.quantity * p.price) as subtotal
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ?
      ORDER BY c.id ASC
    `, [customerId]);

    let grandTotal = 0;
    let totalItems = 0;
    cartItems.forEach(item => {
      grandTotal += item.subtotal;
      totalItems += item.quantity;
    });

    res.render('cart', {
      title: 'Your Shopping Bag | Aura & Forma',
      cartItems,
      grandTotal,
      totalItems,
      user: req.session.user,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Cart view error:', err);
    req.session.errorMessage = 'Unable to display your shopping bag. Please try again.';
    res.redirect('/products');
  }
});

// POST /cart/add - Add product to cart
router.post('/add', async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const productId = parseInt(req.body.productId, 10);
    const quantity = parseInt(req.body.quantity || 1, 10);

    if (!productId || isNaN(productId)) {
      req.session.errorMessage = 'Invalid product selection.';
      return res.redirect('/products');
    }

    if (isNaN(quantity) || quantity <= 0) {
      req.session.errorMessage = 'Please select a valid positive quantity.';
      return res.redirect(`/products/${productId}`);
    }

    // Verify product exists and active
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product || product.is_active !== 1) {
      req.session.errorMessage = 'This artisan piece is currently unavailable or inactive.';
      return res.redirect('/products');
    }

    // Validate available stock
    if (product.stock <= 0) {
      req.session.errorMessage = `"${product.name}" is completely out of stock.`;
      return res.redirect('/products');
    }

    // Check existing cart item
    const existingCartItem = await db.getAsync(
      'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );

    const targetQuantity = existingCartItem ? existingCartItem.quantity + quantity : quantity;

    if (targetQuantity > product.stock) {
      req.session.errorMessage = `Cannot add ${targetQuantity} units. Only ${product.stock} units are currently in stock for "${product.name}".`;
      return res.redirect('/cart');
    }

    if (existingCartItem) {
      await db.runAsync(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [targetQuantity, existingCartItem.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)',
        [customerId, productId, targetQuantity]
      );
    }

    req.session.successMessage = `Added "${product.name}" (${quantity} unit) to your shopping bag!`;
    return res.redirect('/cart');
  } catch (err) {
    console.error('Add to cart error:', err);
    req.session.errorMessage = 'Failed to add item to bag. Please try again.';
    return res.redirect('/products');
  }
});

// POST /cart/update - Update item quantity
router.post('/update', async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const cartItemId = parseInt(req.body.cartItemId, 10);
    const action = req.body.action; // 'increase', 'decrease', or direct 'quantity'
    let newQuantity = parseInt(req.body.quantity, 10);

    const cartItem = await db.getAsync(`
      SELECT c.*, p.stock, p.name 
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.customer_id = ?
    `, [cartItemId, customerId]);

    if (!cartItem) {
      req.session.errorMessage = 'Item not found in your shopping bag.';
      return res.redirect('/cart');
    }

    if (action === 'increase') {
      newQuantity = cartItem.quantity + 1;
    } else if (action === 'decrease') {
      newQuantity = cartItem.quantity - 1;
    }

    if (isNaN(newQuantity) || newQuantity <= 0) {
      // If decreased to 0 or negative, remove the item
      await db.runAsync('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
      req.session.successMessage = `Removed "${cartItem.name}" from your bag.`;
      return res.redirect('/cart');
    }

    if (newQuantity > cartItem.stock) {
      req.session.errorMessage = `Cannot set quantity to ${newQuantity}. Maximum available inventory is ${cartItem.stock}.`;
      return res.redirect('/cart');
    }

    await db.runAsync(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [newQuantity, cartItemId]
    );

    req.session.successMessage = `Updated quantity for "${cartItem.name}" to ${newQuantity}.`;
    return res.redirect('/cart');
  } catch (err) {
    console.error('Cart update error:', err);
    req.session.errorMessage = 'Error updating cart item.';
    return res.redirect('/cart');
  }
});

// POST /cart/remove - Remove item from cart
router.post('/remove', async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const cartItemId = parseInt(req.body.cartItemId, 10);

    const cartItem = await db.getAsync(`
      SELECT c.*, p.name 
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ? AND c.customer_id = ?
    `, [cartItemId, customerId]);

    if (cartItem) {
      await db.runAsync('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
      req.session.successMessage = `Removed "${cartItem.name}" from your bag.`;
    }

    return res.redirect('/cart');
  } catch (err) {
    console.error('Cart item remove error:', err);
    req.session.errorMessage = 'Failed to remove item from bag.';
    return res.redirect('/cart');
  }
});

module.exports = router;
