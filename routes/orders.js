const express = require('express');
const router = express.Router();
const { db, processCheckoutTransaction } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /checkout - Checkout review page
router.get('/checkout', async (req, res) => {
  try {
    const customerId = req.session.user.id;

    const cartItems = await db.allAsync(`
      SELECT 
        c.id as cart_item_id,
        c.quantity,
        p.id as product_id,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.image_url,
        p.is_active,
        (c.quantity * p.price) as subtotal
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ?
    `, [customerId]);

    if (!cartItems || cartItems.length === 0) {
      req.session.errorMessage = 'Your shopping bag is empty. Please add items before proceeding to checkout.';
      return res.redirect('/cart');
    }

    let subtotal = 0;
    let stockError = null;
    cartItems.forEach(item => {
      subtotal += item.subtotal;
      if (item.stock < item.quantity) {
        stockError = `Insufficient stock for "${item.name}". Only ${item.stock} available.`;
      }
    });

    const shipping = subtotal >= 100 ? 0 : 15.00;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((subtotal + shipping + tax).toFixed(2));

    res.render('checkout', {
      title: 'Simulated Order Checkout | Aura & Forma',
      cartItems,
      subtotal,
      shipping,
      tax,
      grandTotal,
      stockError,
      user: req.session.user,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Checkout page error:', err);
    req.session.errorMessage = 'Error preparing checkout page.';
    res.redirect('/cart');
  }
});

// POST /checkout - Execute atomic simulated checkout transaction
router.post('/checkout', async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const shippingAddress = (req.body.shippingAddress || '124 Artisanal Way, Craft Studio District, NY 10012').trim();

    if (!shippingAddress) {
      req.session.errorMessage = 'Please provide a valid shipping address.';
      return res.redirect('/checkout');
    }

    // Call atomic SQLite transaction
    const orderResult = await processCheckoutTransaction(customerId, shippingAddress);

    req.session.successMessage = `Order #${orderResult.orderId} placed successfully!`;
    return res.redirect(`/orders/confirmation/${orderResult.orderId}`);
  } catch (err) {
    console.error('Checkout processing error:', err.message);
    req.session.errorMessage = err.message || 'Failed to place order due to inventory or database constraint.';
    return res.redirect('/checkout');
  }
});

// GET /orders/confirmation/:orderId - Order Confirmation Page
router.get('/orders/confirmation/:orderId', async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const orderId = req.params.orderId;

    const order = await db.getAsync(
      'SELECT * FROM orders WHERE order_id = ? AND customer_id = ?',
      [orderId, customerId]
    );

    if (!order) {
      req.session.errorMessage = 'Order not found.';
      return res.redirect('/orders');
    }

    const orderItems = await db.allAsync(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    res.render('confirmation', {
      title: `Order Confirmed: ${order.order_id} | Aura & Forma`,
      order,
      orderItems,
      user: req.session.user,
      error: null,
      success: req.session.successMessage || 'Thank you for supporting artisanal craftsmanship!'
    });
    req.session.successMessage = null;
  } catch (err) {
    console.error('Confirmation page error:', err);
    res.redirect('/orders');
  }
});

// GET /orders - Customer Order History
router.get('/orders', async (req, res) => {
  try {
    const customerId = req.session.user.id;

    // Fetch only customer's own orders
    const orders = await db.allAsync(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC',
      [customerId]
    );

    // Fetch items for each order
    for (const order of orders) {
      order.items = await db.allAsync(
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
        [order.id]
      );
    }

    res.render('orders', {
      title: 'Order History & Status | Aura & Forma',
      orders,
      user: req.session.user,
      error: req.session.errorMessage || null,
      success: req.session.successMessage || null
    });
    req.session.errorMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    console.error('Order history error:', err);
    req.session.errorMessage = 'Unable to fetch your order history.';
    res.redirect('/products');
  }
});

module.exports = router;
