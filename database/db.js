const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDirectory = path.join(__dirname);
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const dbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH)
  : path.join(dbDirectory, 'shopping.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err.message);
  } else {
    console.log(`✅ SQLite Database connected successfully at: ${dbPath}`);
  }
});

// Enable Foreign Key support in SQLite
db.run('PRAGMA foreign_keys = ON');

// Promisified helper methods for clean async/await
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Database Initialization & Schema Definition
async function initializeDatabase() {
  try {
    // 1. Customers Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Products Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        stock INTEGER NOT NULL CHECK(stock >= 0),
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Cart Items Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (customer_id, product_id)
      )
    `);

    // 4. Orders Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL,
        total_amount REAL NOT NULL CHECK(total_amount >= 0),
        shipping_address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Confirmed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // 5. Order Items Table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        subtotal REAL NOT NULL CHECK(subtotal >= 0),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Seed Admin Account
    const adminEmail = 'admin@aurafoma.com';
    const existingAdmin = await db.getAsync('SELECT * FROM customers WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash('Admin@1234', 10);
      await db.runAsync(
        'INSERT INTO customers (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Aura & Forma Administrator', adminEmail, hashedAdminPassword, 'admin']
      );
      console.log('👤 Default Admin seeded: admin@aurafoma.com / Admin@1234');
    }

    // Seed Demo Customer Account
    const demoEmail = 'john@example.com';
    const existingDemo = await db.getAsync('SELECT * FROM customers WHERE email = ?', [demoEmail]);
    if (!existingDemo) {
      const hashedDemoPassword = await bcrypt.hash('Customer@123', 10);
      await db.runAsync(
        'INSERT INTO customers (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['John Doe', demoEmail, hashedDemoPassword, 'customer']
      );
      console.log('👤 Default Demo Customer seeded: john@example.com / Customer@123');
    }

    // Seed Curated Artisan Products
    const productCountRow = await db.getAsync('SELECT COUNT(*) as count FROM products');
    if (productCountRow.count === 0) {
      const sampleProducts = [
        {
          name: 'Kyoto Wabi-Sabi Ceramic Vase',
          description: 'Hand-thrown stoneware finished with raw textured volcanic ash glaze and organic silhouettes.',
          category: 'Ceramics',
          price: 78.00,
          stock: 15,
          image_url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Nordic Oak & Linen Lounge Chair',
          description: 'Solid European FSC-certified oak frame with hand-loomed natural linen cushioning.',
          category: 'Furniture',
          price: 340.00,
          stock: 8,
          image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Scandi Travertine Fluted Table Lamp',
          description: 'Carved natural travertine stone base paired with an architectural pleated linen shade.',
          category: 'Lighting',
          price: 125.00,
          stock: 12,
          image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Hand-Woven Organic Cotton Throw',
          description: 'Spun from chemical-free organic Aegean cotton with tactile herringbone weave and eyelash fringe.',
          category: 'Textiles',
          price: 54.00,
          stock: 25,
          image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Hinoki Wood & Amber Botanical Candle',
          description: 'Pure soy and rapeseed wax infused with Japanese Hinoki cypress, cedar resin, and black pepper.',
          category: 'Fragrance',
          price: 32.00,
          stock: 30,
          image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Sculptural Terracotta Fruit Vessel',
          description: 'Earthy unglazed terracotta centerpiece bowl celebrating raw imperfections and brutalist curves.',
          category: 'Ceramics',
          price: 62.00,
          stock: 10,
          image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Brushed Brass Minimalist Wall Sconce',
          description: 'Warm ambient glow generated through hand-spun solid brushed brass dome reflector.',
          category: 'Lighting',
          price: 110.00,
          stock: 14,
          image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Raw Silk & Merino Wool Cushion Cover',
          description: 'Textured slub silk front with ethical New Zealand wool backing and concealed brass zipper.',
          category: 'Textiles',
          price: 45.00,
          stock: 18,
          image_url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Smoked Oak Pedestal Coffee Table',
          description: 'Sculpted low coffee table crafted from quartersawn oak with a water-based matte smoked finish.',
          category: 'Furniture',
          price: 490.00,
          stock: 5,
          image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=700&q=80'
        },
        {
          name: 'Cedar & Vetiver Studio Room Mist',
          description: 'Grounding apothecary room and linen mist crafted in small artisanal batches with natural botanicals.',
          category: 'Fragrance',
          price: 28.00,
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80'
        }
      ];

      for (const prod of sampleProducts) {
        await db.runAsync(
          'INSERT INTO products (name, description, category, price, stock, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [prod.name, prod.description, prod.category, prod.price, prod.stock, prod.image_url]
        );
      }
      console.log(`📦 Seeded ${sampleProducts.length} curated artisan products into the catalog.`);
    }

    console.log('✅ SQLite database schema and seeds initialized successfully.');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Transaction-safe Checkout Operation
async function processCheckoutTransaction(customerId, shippingAddress) {
  // Start SQLite transaction
  await db.runAsync('BEGIN IMMEDIATE TRANSACTION');

  try {
    // 1. Fetch current cart items joined with product table
    const cartItems = await db.allAsync(`
      SELECT 
        c.id as cart_item_id,
        c.product_id,
        c.quantity,
        p.name as product_name,
        p.price,
        p.stock,
        p.is_active
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.customer_id = ?
    `, [customerId]);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    // 2. Validate stock and active status for every item
    let calculatedTotal = 0;
    for (const item of cartItems) {
      if (item.is_active !== 1) {
        throw new Error(`Product "${item.product_name}" is currently unavailable.`);
      }
      if (item.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.product_name}". Only ${item.stock} item(s) left in inventory.`);
      }
      calculatedTotal += item.price * item.quantity;
    }

    // 3. Generate Unique Order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `AF-${Date.now().toString().slice(-4)}-${randomSuffix}`;

    // 4. Insert into orders table
    const orderResult = await db.runAsync(
      `INSERT INTO orders (order_id, customer_id, total_amount, shipping_address, status)
       VALUES (?, ?, ?, ?, 'Confirmed')`,
      [orderNumber, customerId, calculatedTotal, shippingAddress]
    );

    const newDbOrderId = orderResult.lastID;

    // 5. Insert order items & reduce stock atomically
    for (const item of cartItems) {
      const itemSubtotal = item.price * item.quantity;
      await db.runAsync(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newDbOrderId, item.product_id, item.product_name, item.price, item.quantity, itemSubtotal]
      );

      // Decrement product inventory
      await db.runAsync(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear customer's cart
    await db.runAsync('DELETE FROM cart_items WHERE customer_id = ?', [customerId]);

    // Commit Transaction
    await db.runAsync('COMMIT');

    return {
      success: true,
      orderId: orderNumber,
      totalAmount: calculatedTotal,
      itemCount: cartItems.length
    };
  } catch (error) {
    // Rollback on any failure
    await db.runAsync('ROLLBACK');
    throw error;
  }
}

module.exports = {
  db,
  initializeDatabase,
  processCheckoutTransaction
};
