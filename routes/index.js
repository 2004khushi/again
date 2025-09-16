const express = require('express');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const router = express.Router();
const { Stores } = require('../models');

// Shopify API configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  scopes: process.env.SCOPES.split(','),
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

// Home route
router.get('/', (req, res) => {
  const shop = req.query.shop;
  let installButton = '';
  
  if (shop) {
    installButton = `<a href="/auth?shop=${shop}" class="btn">Install App</a>`;
  }
  
  res.send(`
    <html>
      <head>
        <title>Shopify App</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .container { border: 1px solid #e1e1e1; padding: 20px; border-radius: 5px; }
          h1 { color: #96bf48; }
          .btn { background-color: #96bf48; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .input { padding: 8px; margin: 10px 0; width: 300px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Your Shopify App</h1>
          <p>This app can access store information and edit products.</p>
          
          <form action="/" method="GET">
            <input type="text" name="shop" placeholder="your-store.myshopify.com" class="input" required>
            <button type="submit" class="btn">Submit</button>
          </form>
          
          ${installButton}
        </div>
      </body>
    </html>
  `);
});

// Install route
router.get('/auth', async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) {
      return res.status(400).send('Shop parameter is required');
    }

    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    res.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Auth callback - SIMPLIFIED for now
router.get('/auth/callback', async (req, res) => {
  try {
    // For v11.x, the callback handling is more complex
    // This is a simplified version - you'll need proper session storage
    const shop = req.query.shop;
    
    if (shop) {
      // In a real app, you would complete the OAuth flow here
      // For now, just show a success message
      res.send(`
        <html>
          <head><title>App Installed</title></head>
          <body>
            <h1>App successfully installed for ${shop}</h1>
            <p>You can now use the app in your Shopify admin.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send('Missing shop parameter');
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send('Authentication callback failed');
  }
});

// Webhook handler (for app uninstalls)
router.post('/webhooks/app/uninstalled', async (req, res) => {
  try {
    const shop = req.headers['x-shopify-shop-domain'];
    if (shop) {
      // Mark store as uninstalled in your database
      await Stores.markAsUninstalled(shop);
      console.log(`App uninstalled from shop: ${shop}`);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Simple health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'disconnected', error: error.message });
  }
});

module.exports = router;