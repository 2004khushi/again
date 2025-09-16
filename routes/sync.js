// routes/sync.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const auth = require('../middleware/auth'); // Make sure you have this middleware

// Sync products
router.get('/products', auth, async (req, res) => {
  try {
    const { shop } = req.query;
    const storeId = req.storeId;

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Shop parameter required' });
    }

    console.log(`Syncing products for shop: ${shop}, storeId: ${storeId}`);

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create dummy products
    await prisma.product.createMany({
      data: [
        {
          shopifyId: 'prod_1_' + Date.now(),
          title: 'Test Product 1',
          price: 29.99,
          storeId: storeId
        },
        {
          shopifyId: 'prod_2_' + Date.now(),
          title: 'Test Product 2',
          price: 49.99,
          storeId: storeId
        }
      ],
      skipDuplicates: true
    });

    res.json({ 
      success: true, 
      message: 'Products synced successfully',
      count: 2
    });
  } catch (error) {
    console.error('Sync products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync customers
router.get('/customers', auth, async (req, res) => {
  try {
    const { shop } = req.query;
    const storeId = req.storeId;

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Shop parameter required' });
    }

    console.log(`Syncing customers for shop: ${shop}, storeId: ${storeId}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await prisma.customer.createMany({
      data: [
        {
          shopifyId: 'cust_1_' + Date.now(),
          email: 'customer1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          totalSpent: 150.50,
          storeId: storeId
        },
        {
          shopifyId: 'cust_2_' + Date.now(),
          email: 'customer2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          totalSpent: 89.99,
          storeId: storeId
        }
      ],
      skipDuplicates: true
    });

    res.json({ 
      success: true, 
      message: 'Customers synced successfully',
      count: 2
    });
  } catch (error) {
    console.error('Sync customers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { shop } = req.query;
    const storeId = req.storeId;

    if (!shop) {
      return res.status(400).json({ success: false, error: 'Shop parameter required' });
    }

    console.log(`Syncing orders for shop: ${shop}, storeId: ${storeId}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await prisma.order.createMany({
      data: [
        {
          shopifyId: 'order_1_' + Date.now(),
          createdAt: new Date(),
          totalPrice: 150.50,
          storeId: storeId,
          lineItems: JSON.stringify([{ product: 'Test Product 1', quantity: 2 }])
        },
        {
          shopifyId: 'order_2_' + Date.now(),
          createdAt: new Date(),
          totalPrice: 89.99,
          storeId: storeId,
          lineItems: JSON.stringify([{ product: 'Test Product 2', quantity: 1 }])
        }
      ],
      skipDuplicates: true
    });

    res.json({ 
      success: true, 
      message: 'Orders synced successfully',
      count: 2
    });
  } catch (error) {
    console.error('Sync orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;