const request = require('supertest');
const { app, startServer } = require('../server');
const { db, initializeDatabase } = require('../database/db');

// Test Suite Runner & Functional Verification
async function runFunctionalTests() {
  console.log('\n================================================================');
  console.log('   🧪 AURA & FORMA - AUTOMATED FUNCTIONAL TEST SUITE');
  console.log('   Testing all 10 Modules, Sessions, ACID Transactions & DB');
  console.log('================================================================\n');

  await initializeDatabase();

  const testReport = [];
  let testCount = 0;
  let passCount = 0;
  let failCount = 0;

  async function executeTest(id, description, inputDescription, expectedDescription, testFn) {
    testCount++;
    process.stdout.write(`[Running] ${id}: ${description}... `);
    try {
      const actualResult = await testFn();
      passCount++;
      console.log('✅ PASS');
      testReport.push({
        id,
        description,
        input: inputDescription,
        expected: expectedDescription,
        actual: actualResult || 'Operation completed as expected',
        status: 'PASS'
      });
    } catch (err) {
      failCount++;
      console.log('❌ FAIL');
      console.error(`   Error: ${err.message}`);
      testReport.push({
        id,
        description,
        input: inputDescription,
        expected: expectedDescription,
        actual: err.message,
        status: 'FAIL'
      });
    }
  }

  // State to pass cookies across authenticated flows
  let customerSessionCookie = null;
  let adminSessionCookie = null;
  const uniqueTestEmail = `customer_${Date.now()}@testcraft.org`;

  // 1. MODULE 1: Customer Registration
  await executeTest(
    'FT01',
    'Customer Registration with valid credentials',
    `Name: Eleanor Craft, Email: ${uniqueTestEmail}, Password: SecretPassword@123`,
    'Customer record created in SQLite customers table and redirected to /login with 302',
    async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          name: 'Eleanor Craft',
          email: uniqueTestEmail,
          password: 'SecretPassword@123'
        });

      if (res.status !== 302 || res.header.location !== '/login') {
        throw new Error(`Expected redirect to /login (302), got ${res.status} -> ${res.header.location}`);
      }

      const userInDb = await db.getAsync('SELECT * FROM customers WHERE email = ?', [uniqueTestEmail]);
      if (!userInDb) throw new Error('Customer record was not found in SQLite customers table.');
      if (userInDb.role !== 'customer') throw new Error(`Expected role 'customer', found '${userInDb.role}'`);
      return `Customer registered with DB ID ${userInDb.id}`;
    }
  );

  // 2. MODULE 1: Duplicate Registration Prevention
  await executeTest(
    'FT02',
    'Duplicate Email Registration Prevention',
    `Attempting to register again with same email: ${uniqueTestEmail}`,
    'Registration blocked, redirected to /register with error flash message',
    async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          name: 'Eleanor Duplicate',
          email: uniqueTestEmail,
          password: 'AnotherPassword@123'
        });

      if (res.status !== 302 || res.header.location !== '/register') {
        throw new Error(`Expected 302 redirect back to /register, got ${res.status}`);
      }

      const countRow = await db.getAsync('SELECT COUNT(*) as cnt FROM customers WHERE email = ?', [uniqueTestEmail]);
      if (countRow.cnt !== 1) throw new Error(`Duplicate entry found in database! Count: ${countRow.cnt}`);
      return 'Duplicate registration rejected, database integrity preserved';
    }
  );

  // 3. MODULE 2: Invalid Customer Login
  await executeTest(
    'FT03',
    'Customer Login with Invalid Credentials',
    `Email: ${uniqueTestEmail}, Incorrect Password: WrongPassword!`,
    'Authentication rejected, 302 redirect back to /login with error message',
    async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: uniqueTestEmail,
          password: 'WrongPassword!'
        });

      if (res.status !== 302 || res.header.location !== '/login') {
        throw new Error(`Expected 302 redirect back to /login, got ${res.status}`);
      }
      return 'Invalid credentials rejected gracefully';
    }
  );

  // 4. MODULE 2: Valid Customer Login & Session Creation
  await executeTest(
    'FT04',
    'Customer Login with Valid Credentials & Session Storage',
    `Email: ${uniqueTestEmail}, Password: SecretPassword@123`,
    'Session created, cookie returned, redirected to /products',
    async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: uniqueTestEmail,
          password: 'SecretPassword@123'
        });

      if (res.status !== 302 || res.header.location !== '/products') {
        throw new Error(`Expected redirect to /products (302), got ${res.status}`);
      }

      const cookies = res.headers['set-cookie'];
      if (!cookies || cookies.length === 0) {
        throw new Error('No session cookie was set in response headers.');
      }
      customerSessionCookie = cookies;
      return 'Customer authenticated and express session cookie established';
    }
  );

  // 5. MODULE 3: Product Catalogue Retrieval
  await executeTest(
    'FT05',
    'Product Catalogue Retrieval & Rendering',
    'HTTP GET /products',
    'HTTP 200 OK returned with product catalog HTML containing active items',
    async () => {
      const res = await request(app).get('/products');
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.text.includes('Kyoto Wabi-Sabi Ceramic Vase')) {
        throw new Error('Seed product "Kyoto Wabi-Sabi Ceramic Vase" missing in catalogue HTML');
      }
      return 'Catalogue rendered 200 OK with artisan products';
    }
  );

  // 6. MODULE 4: Product Search (Case-Insensitive)
  await executeTest(
    'FT06',
    'Case-Insensitive Product Search',
    'Query: "wabi-sabi"',
    'HTTP 200 OK containing "Kyoto Wabi-Sabi Ceramic Vase"',
    async () => {
      const res = await request(app).get('/products?search=wabi-sabi');
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.text.includes('Kyoto Wabi-Sabi Ceramic Vase')) {
        throw new Error('Search result did not match expected product.');
      }
      return 'Case-insensitive search matched expected product successfully';
    }
  );

  // 7. MODULE 4: Search with Non-Existent Product
  await executeTest(
    'FT07',
    'Search Non-Existent Product Keyword',
    'Query: "QuantumSupercomputer9999"',
    'HTTP 200 OK displaying "No Matching Artisan Pieces Found"',
    async () => {
      const res = await request(app).get('/products?search=QuantumSupercomputer9999');
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.text.includes('No Matching Artisan Pieces Found')) {
        throw new Error('Expected friendly "No Matching Artisan Pieces Found" notice');
      }
      return 'Empty search state handled gracefully with feedback';
    }
  );

  // Get first product for cart testing
  const sampleProduct = await db.getAsync('SELECT * FROM products WHERE stock > 5 AND is_active = 1 LIMIT 1');

  // 8. MODULE 5: Add Product to Shopping Cart
  await executeTest(
    'FT08',
    'Add Available Product to Cart',
    `Product ID: ${sampleProduct.id} ("${sampleProduct.name}"), Quantity: 2`,
    'Cart item stored in SQLite cart_items table, redirect to /cart',
    async () => {
      const res = await request(app)
        .post('/cart/add')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          productId: sampleProduct.id,
          quantity: 2
        });

      if (res.status !== 302 || res.header.location !== '/cart') {
        throw new Error(`Expected 302 redirect to /cart, got ${res.status}`);
      }

      const cartItem = await db.getAsync(
        'SELECT * FROM cart_items WHERE product_id = ?',
        [sampleProduct.id]
      );
      if (!cartItem || cartItem.quantity !== 2) {
        throw new Error(`Cart item not saved correctly. Expected qty 2, got: ${cartItem?.quantity}`);
      }
      return `Item added to cart with quantity ${cartItem.quantity}`;
    }
  );

  // 9. MODULE 6: Update Cart Quantity
  let cartItemRow = await db.getAsync('SELECT * FROM cart_items WHERE product_id = ?', [sampleProduct.id]);
  await executeTest(
    'FT09',
    'Update Cart Item Quantity',
    `Cart Item ID: ${cartItemRow.id}, New Quantity: 3`,
    'Cart item quantity updated to 3 in SQLite, redirect to /cart',
    async () => {
      const res = await request(app)
        .post('/cart/update')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          cartItemId: cartItemRow.id,
          quantity: 3
        });

      if (res.status !== 302 || res.header.location !== '/cart') {
        throw new Error(`Expected 302 redirect to /cart, got ${res.status}`);
      }

      const updatedRow = await db.getAsync('SELECT * FROM cart_items WHERE id = ?', [cartItemRow.id]);
      if (updatedRow.quantity !== 3) {
        throw new Error(`Expected quantity 3, found ${updatedRow.quantity}`);
      }
      return `Cart quantity updated to ${updatedRow.quantity}`;
    }
  );

  // 10. MODULE 6: Prevent Exceeding Stock
  await executeTest(
    'FT10',
    'Prevent Cart Quantity From Exceeding Stock',
    `Cart Item ID: ${cartItemRow.id}, Quantity: 9999 (Stock: ${sampleProduct.stock})`,
    'Update rejected, redirected to /cart with error message, quantity remains unchanged',
    async () => {
      const res = await request(app)
        .post('/cart/update')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          cartItemId: cartItemRow.id,
          quantity: 9999
        });

      if (res.status !== 302 || res.header.location !== '/cart') {
        throw new Error(`Expected 302 redirect to /cart, got ${res.status}`);
      }

      const row = await db.getAsync('SELECT * FROM cart_items WHERE id = ?', [cartItemRow.id]);
      if (row.quantity === 9999) {
        throw new Error('Validation failed! Cart quantity was allowed to exceed stock.');
      }
      return `Quantity remains ${row.quantity}; excessive quantity prevented`;
    }
  );

  // 11. MODULE 7: Remove Product from Cart
  await executeTest(
    'FT11',
    'Remove Product from Shopping Cart',
    `Cart Item ID: ${cartItemRow.id}`,
    'Item deleted from SQLite cart_items table, cart becomes empty',
    async () => {
      const res = await request(app)
        .post('/cart/remove')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          cartItemId: cartItemRow.id
        });

      if (res.status !== 302 || res.header.location !== '/cart') {
        throw new Error(`Expected 302 redirect to /cart, got ${res.status}`);
      }

      const deletedItem = await db.getAsync('SELECT * FROM cart_items WHERE id = ?', [cartItemRow.id]);
      if (deletedItem) throw new Error('Cart item was not deleted from database.');
      return 'Product removed and cart table updated';
    }
  );

  // 12. MODULE 8: Empty Cart Checkout Prevention
  await executeTest(
    'FT12',
    'Prevent Checkout with Empty Cart',
    'Attempting POST /checkout with 0 items in cart',
    'Checkout rejected, redirected to /checkout with error notice',
    async () => {
      const res = await request(app)
        .post('/checkout')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          shippingAddress: '100 Test Studio St'
        });

      if (res.status !== 302) {
        throw new Error(`Expected 302 redirect, got ${res.status}`);
      }
      return 'Empty cart checkout prevented successfully';
    }
  );

  // 13. MODULE 8: Successful Atomic Checkout Transaction & Stock Reduction
  let confirmedOrderId = null;
  await executeTest(
    'FT13',
    'Successful Checkout with Atomic ACID Transaction & Stock Decrement',
    `Re-add 2 units of "${sampleProduct.name}" (Initial stock: ${sampleProduct.stock}) and checkout`,
    'Order created with unique order_id, order_items saved, stock reduced by 2, cart cleared',
    async () => {
      // 1. Re-add item to cart
      await request(app)
        .post('/cart/add')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({ productId: sampleProduct.id, quantity: 2 });

      const stockBefore = (await db.getAsync('SELECT stock FROM products WHERE id = ?', [sampleProduct.id])).stock;

      // 2. Perform checkout
      const res = await request(app)
        .post('/checkout')
        .set('Cookie', customerSessionCookie)
        .type('form')
        .send({
          shippingAddress: '742 Evergreen Studio Terrace, NY'
        });

      if (res.status !== 302 || !res.header.location.includes('/orders/confirmation/')) {
        throw new Error(`Expected redirect to /orders/confirmation/:id, got ${res.status} -> ${res.header.location}`);
      }

      confirmedOrderId = res.header.location.split('/').pop();

      // 3. Verify Order record in SQLite
      const order = await db.getAsync('SELECT * FROM orders WHERE order_id = ?', [confirmedOrderId]);
      if (!order) throw new Error(`Order #${confirmedOrderId} not found in SQLite orders table.`);

      // 4. Verify Order Items in SQLite
      const items = await db.allAsync('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      if (items.length !== 1 || items[0].quantity !== 2) {
        throw new Error('Order items count or quantity incorrect.');
      }

      // 5. Verify stock reduction
      const stockAfter = (await db.getAsync('SELECT stock FROM products WHERE id = ?', [sampleProduct.id])).stock;
      if (stockAfter !== stockBefore - 2) {
        throw new Error(`Stock mismatch! Expected ${stockBefore - 2}, got ${stockAfter}`);
      }

      // 6. Verify cart is cleared
      const remainingCart = await db.allAsync('SELECT * FROM cart_items WHERE customer_id = ?', [order.customer_id]);
      if (remainingCart.length !== 0) {
        throw new Error('Cart was not cleared after checkout.');
      }

      return `Order ${confirmedOrderId} placed. Stock decreased from ${stockBefore} to ${stockAfter}. Cart cleared.`;
    }
  );

  // 14. MODULE 9: Customer Order History View
  await executeTest(
    'FT14',
    'Customer Order History Isolation & Rendering',
    'HTTP GET /orders with authenticated customer session',
    'HTTP 200 OK showing confirmed order ID, items, and total amount',
    async () => {
      const res = await request(app)
        .get('/orders')
        .set('Cookie', customerSessionCookie);

      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.text.includes(confirmedOrderId)) {
        throw new Error(`Order ID ${confirmedOrderId} not displayed on order history page.`);
      }
      return `Order history verified and rendered order ${confirmedOrderId}`;
    }
  );

  // 15. MODULE 10: Admin Authentication & Dashboard Access
  await executeTest(
    'FT15',
    'Admin Authentication & Dashboard Access',
    'Email: admin@aurafoma.com, Password: Admin@1234',
    'Redirected to /admin with 302, HTTP 200 rendered for /admin with stats',
    async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: 'admin@aurafoma.com',
          password: 'Admin@1234'
        });

      if (res.status !== 302 || res.header.location !== '/admin') {
        throw new Error(`Expected 302 redirect to /admin, got ${res.status} -> ${res.header.location}`);
      }

      adminSessionCookie = res.headers['set-cookie'];

      const dashRes = await request(app)
        .get('/admin')
        .set('Cookie', adminSessionCookie);

      if (dashRes.status !== 200) throw new Error(`Expected 200 OK for /admin, got ${dashRes.status}`);
      if (!dashRes.text.includes('Studio Operations & Inventory Control')) {
        throw new Error('Admin cockpit view header missing.');
      }
      return 'Admin authenticated and cockpit dashboard rendered';
    }
  );

  // 16. MODULE 10: Admin Add Product
  let newProductId = null;
  await executeTest(
    'FT16',
    'Admin Add New Artisan Product to Catalog',
    'Name: "Nagoya Hand-Carved Teak Bench", Price: 260.00, Stock: 7, Category: "Furniture"',
    'Product inserted into SQLite products table and redirected to /admin',
    async () => {
      const res = await request(app)
        .post('/admin/products/add')
        .set('Cookie', adminSessionCookie)
        .type('form')
        .send({
          name: 'Nagoya Hand-Carved Teak Bench',
          description: 'Solid reclaimed teak bench with natural live edge finish and dovetail joinery.',
          category: 'Furniture',
          price: 260.00,
          stock: 7,
          image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=700&q=80'
        });

      if (res.status !== 302 || res.header.location !== '/admin') {
        throw new Error(`Expected redirect to /admin (302), got ${res.status}`);
      }

      const prod = await db.getAsync('SELECT * FROM products WHERE name = ?', ['Nagoya Hand-Carved Teak Bench']);
      if (!prod) throw new Error('Product not found in SQLite products table.');
      newProductId = prod.id;
      return `Product created with ID #${newProductId}`;
    }
  );

  // 17. MODULE 10: Admin Update Product
  await executeTest(
    'FT17',
    'Admin Update Product Details & Inventory',
    `Product ID #${newProductId}, New Stock: 14, New Price: 275.00`,
    'Product record updated in SQLite products table',
    async () => {
      const res = await request(app)
        .post(`/admin/products/edit/${newProductId}`)
        .set('Cookie', adminSessionCookie)
        .type('form')
        .send({
          name: 'Nagoya Hand-Carved Teak Bench (Updated Edition)',
          description: 'Solid reclaimed teak bench with natural live edge finish and dovetail joinery.',
          category: 'Furniture',
          price: 275.00,
          stock: 14,
          image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=700&q=80'
        });

      if (res.status !== 302 || res.header.location !== '/admin') {
        throw new Error(`Expected redirect to /admin, got ${res.status}`);
      }

      const updated = await db.getAsync('SELECT * FROM products WHERE id = ?', [newProductId]);
      if (updated.stock !== 14 || updated.price !== 275.00) {
        throw new Error(`Product update mismatch! Price: ${updated.price}, Stock: ${updated.stock}`);
      }
      return `Product updated: price $${updated.price}, stock ${updated.stock}`;
    }
  );

  // 18. MODULE 10: Admin Delete Product
  await executeTest(
    'FT18',
    'Admin Delete Artisan Product',
    `Product ID #${newProductId}`,
    'Product removed from database products table',
    async () => {
      const res = await request(app)
        .post(`/admin/products/delete/${newProductId}`)
        .set('Cookie', adminSessionCookie)
        .type('form')
        .send({ action: 'delete' });

      if (res.status !== 302 || res.header.location !== '/admin') {
        throw new Error(`Expected redirect to /admin, got ${res.status}`);
      }

      const deleted = await db.getAsync('SELECT * FROM products WHERE id = ?', [newProductId]);
      if (deleted) throw new Error('Product still exists in SQLite database.');
      return `Product #${newProductId} successfully deleted`;
    }
  );

  // PRINT FINAL SUMMARY
  console.log('\n================================================================');
  console.log('   📊 FUNCTIONAL TEST EXECUTION REPORT SUMMARY');
  console.log('================================================================');
  console.log(`Total Functional Tests : ${testCount}`);
  console.log(`Tests Passed           : ${passCount} ✅`);
  console.log(`Tests Failed           : ${failCount} ${failCount > 0 ? '❌' : ''}`);
  console.log(`Success Rate           : ${((passCount / testCount) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFunctionalTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
