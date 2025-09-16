// In routes/dashboard.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database'); // This now correctly exports prisma

router.get('/', async (req, res) => {
  try {
    const shop = req.query.shop;

    if (!shop) {
      console.log('Dashboard loaded without shop parameter, redirecting.');
      return res.redirect('/');
    }

    // Use Prisma client to find the store by domain - NOTE: lowercase 'store'
    const store = await prisma.store.findUnique({
      where: { domain: shop }
    });

    if (!store) {
      console.log(`Store not found for domain: ${shop}, redirecting.`);
      return res.redirect(`/?shop=${shop}`);
    }

    // Use Prisma client for counts - all model names should be lowercase
    const productsCount = await prisma.product.count({
      where: { storeId: store.id }
    });

    const customersCount = await prisma.customer.count({
      where: { storeId: store.id }
    });

    const ordersCount = await prisma.order.count({
      where: { storeId: store.id }
    });

    // The rest of your HTML rendering code...
    res.send(`
      <html>
        <head>
          <title>Dashboard - ${shop}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 1200px; margin: 40px auto; padding: 20px; color: #333; }
            h1 { color: #007bff; }
            .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
            .card { border: 1px solid #e1e4e8; padding: 20px; border-radius: 8px; background: #f6f8fa; text-align: center; }
            .card h2 { margin-top: 0; }
            .card .stat { font-size: 2.5em; font-weight: 600; color: #007bff; margin: 10px 0; }
            .btn { background: #007bff; color: white; padding: 12px 18px; text-decoration: none; border: none; border-radius: 6px; display: inline-block; margin-top: 15px; cursor: pointer; font-size: 1em; }
            .btn:hover { background: #0056b3; }
            #message-bar { margin: 20px 0; padding: 15px; border-radius: 6px; display: none; }
            .success { color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; }
            .error { color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; }
          </style>
        </head>
        <body>
          <h1>📊 Dashboard for ${shop}</h1>
          <p>This dashboard shows the data synced to your database.</p>
          <div class="dashboard-grid">
            <div class="card">
              <h2>Total Products</h2>
              <p class="stat" id="products-stat">${productsCount}</p>
              <button onclick="syncData('products')" class="btn">🔄 Sync Products</button>
            </div>
            <div class="card">
              <h2>Total Customers</h2>
              <p class="stat" id="customers-stat">${customersCount}</p>
              <button onclick="syncData('customers')" class="btn">🔄 Sync Customers</button>
            </div>
            <div class="card">
              <h2>Total Orders</h2>
              <p class="stat" id="orders-stat">${ordersCount}</p>
              <button onclick="syncData('orders')" class="btn">🔄 Sync Orders</button>
            </div>
          </div>
          <div id="message-bar"></div>
          <a href="/" class="btn" style="background-color: #6c757d;">← Go Home</a>
          
          <script>
  async function syncData(type) {
    console.log("--- 🕵️‍♂️ Sync button clicked! ---");
    console.log("Sync type:", type);

    const messageBar = document.getElementById('message-bar');
    messageBar.style.display = 'block';
    messageBar.className = '';
    messageBar.innerHTML = '⏳ Syncing ' + type + '... please wait.';
    
    // Let's find the HTML element for the number we want to update
    const elementId = type + '-stat';
    const statElement = document.getElementById(elementId);
    
    console.log("Looking for element with ID:", elementId);
    console.log("Found element:", statElement); // <-- This will tell us if the ID is wrong

    try {
      const shopDomain = '${shop}';
      const response = await fetch('/api/sync-' + type + '?shop=' + encodeURIComponent(shopDomain));
      const result = await response.json();
      
      console.log("Received API response:", result); // <-- This will show us the data from the server

      if (result.success) {
        messageBar.className = 'success';
        messageBar.innerHTML = '✅ ' + result.message;
        
        // Let's try to update the number
        if (statElement && result.count !== undefined) {
          console.log('Updating element with new count: ' + result.count);
          statElement.textContent = result.count;
          console.log("Update complete!");
        } else {
          console.error("❌ Could not update count. Either statElement is null or result.count is missing.");
        }
      } else {
        messageBar.className = 'error';
        messageBar.innerHTML = '❌ Error: ' + (result.error || 'Sync failed.');
      }
    } catch (error) {
      messageBar.className = 'error';
      messageBar.innerHTML = '❌ Network Error: ' + error.message;
    }
  }
</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

module.exports = router;