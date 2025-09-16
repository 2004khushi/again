const express = require('express');
const crypto = require('crypto');
const { Stores, Products, Customers, Orders } = require('../models');

module.exports = (app, shopify, sessionStorage) => {
  const router = express.Router();

  // Shopify OAuth start
  router.get('/auth', async (req, res) => {
    try {
      const shop = req.query.shop;
      if (!shop) return res.status(400).send('Shop parameter is required');
      await shopify.auth.begin({
        shop,
        callbackPath: '/shopify/auth/callback',
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
      });
    } catch (err) {
      console.error('Auth error:', err);
      if (!res.headersSent) res.status(500).send('Auth failed');
    }
  });

  // OAuth callback
  router.get('/auth/callback', async (req, res) => {
    try {
      const result = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });
      await sessionStorage.storeSession(result.session);
      console.log(`✅ Installed for ${result.session.shop}`);
      res.redirect(`https://${result.session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
    } catch (err) {
      console.error('Auth callback error:', err);
      res.status(500).send('OAuth failed: ' + err.message);
    }
  });

  // Webhooks example (orders/create)
  router.post('/webhooks/orders/create', (req, res) => {
    try {
      const hmac = req.get('X-Shopify-Hmac-Sha256');
      const digest = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET_KEY)
        .update(req.rawBody)
        .digest('base64');
      if (hmac !== digest) return res.status(401).send('Invalid signature');

      console.log('📦 Order webhook received:', req.body);
      res.sendStatus(200);
    } catch (err) {
      console.error('Webhook error:', err);
      res.sendStatus(500);
    }
  });

  app.use('/shopify', router);
};
