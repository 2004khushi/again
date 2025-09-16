const db = require('../config/database');

// Model functions that match your actual database schema
const Stores = {
  // Find store by domain
  findByDomain: async (domain) => {
    const result = await db.query(
      'SELECT * FROM stores WHERE domain = $1',
      [domain]
    );
    return result.rows[0];
  },
  
  // Create or update store - MATCHES YOUR SCHEMA
  upsert: async (id, name, domain, accessToken) => {
    console.log('Upserting store with:', { id, name, domain, accessToken });
    
    const result = await db.query(`
      INSERT INTO stores (id, name, domain, access_token) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) 
      DO UPDATE SET name = $2, domain = $3, access_token = $4
      RETURNING *
    `, [id, name, domain, accessToken]);
    
    return result.rows[0];
  },
  
  // Update store access token
  updateAccessToken: async (id, accessToken) => {
    const result = await db.query(
      'UPDATE stores SET access_token = $1 WHERE id = $2 RETURNING *',
      [accessToken, id]
    );
    return result.rows[0];
  },
  
  // Mark store as uninstalled - we'll add uninstalled_at column or use a different approach
  markAsUninstalled: async (domain) => {
    // Since your schema doesn't have uninstalled_at, we'll either:
    // 1. Delete the store, or 
    // 2. Add the column, or
    // 3. Use a different approach
    
    // Option 1: Delete the store
    const result = await db.query(
      'DELETE FROM stores WHERE domain = $1 RETURNING *',
      [domain]
    );
    return result.rows[0];
  }
};

const Products = {
  // Create or update product - MATCHES YOUR SCHEMA
  upsert: async (tenantId, shopifyId, title, price) => {
    const result = await db.query(`
      INSERT INTO products (tenant_id, shopify_id, title, price) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, shopify_id) 
      DO UPDATE SET title = $3, price = $4
      RETURNING *
    `, [tenantId, shopifyId, title, price]);
    return result.rows[0];
  },
  
  // Get products by tenant
  findByTenant: async (tenantId) => {
    const result = await db.query(
      'SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }
};

const Customers = {
  // Create or update customer - MATCHES YOUR SCHEMA
  upsert: async (tenantId, shopifyId, email, firstName, lastName) => {
    const result = await db.query(`
      INSERT INTO customers (tenant_id, shopify_id, email, first_name, last_name) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, shopify_id) 
      DO UPDATE SET email = $3, first_name = $4, last_name = $5
      RETURNING *
    `, [tenantId, shopifyId, email, firstName, lastName]);
    return result.rows[0];
  },
  
  // Get customers by tenant
  findByTenant: async (tenantId) => {
    const result = await db.query(
      'SELECT * FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }
};

const Orders = {
  // Create or update order - MATCHES YOUR SCHEMA
  upsert: async (tenantId, shopifyId, customerId, totalPrice, financialStatus) => {
    const result = await db.query(`
      INSERT INTO orders (tenant_id, shopify_id, customer_id, total_price, financial_status) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, shopify_id) 
      DO UPDATE SET customer_id = $3, total_price = $4, financial_status = $5
      RETURNING *
    `, [tenantId, shopifyId, customerId, totalPrice, financialStatus]);
    return result.rows[0];
  },
  
  // Get orders by tenant
  findByTenant: async (tenantId) => {
    const result = await db.query(
      'SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }
};

module.exports = {
  Stores,
  Products,
  Customers,
  Orders
};