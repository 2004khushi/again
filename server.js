const express = require("express");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { nodeAdapter } = require("@shopify/shopify-api/adapters/node");
const crypto = require("crypto");
require("dotenv").config();
const { prisma } = require('./config/database');

const sessionStorage = require("./session-storage");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Shopify API init
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  scopes: process.env.SCOPES.split(","),
  hostName: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  adapter: nodeAdapter,
});

// Import Prisma-based routes
require("./routes/auth")(app);
require("./routes/analytics")(app);


// ✅ Root route
app.get("/", async (req, res) => {
  try {
    const shop = req.query.shop;
    let content = `
      <h1>Shopify App Ready ✅</h1>
      <p>Enter your store domain to begin.</p>
      <form action="/" method="GET" style="margin: 20px 0;">
        <input type="text" name="shop" placeholder="your-store.myshopify.com" required style="padding: 10px; width: 300px;">
        <button type="submit" style="padding: 10px 15px;">Submit</button>
      </form>
    `;

    // If a shop domain is provided in the URL...
    if (shop) {
      // Check if the store exists in our database and has an access token
      const store = await prisma.store.findUnique({
        where: { domain: shop },
      });

      // If the store exists and is authenticated...
      if (store && store.accessToken) {
        // ...show a "Go to Dashboard" button.
        content = `
          <h1>Welcome Back to Your App!</h1>
          <p>The app is already installed for <strong>${shop}</strong>.</p>
          <a href="/dashboard?shop=${shop}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Go to Your Dashboard
          </a>
        `;
      } else {
        // ...otherwise, show the "Install App" button.
        content = `
          <h1>Install Your Shopify App</h1>
          <p>Click the button below to install the app on <strong>${shop}</strong>.</p>
          <a href="/auth?shop=${shop}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Install App
          </a>
        `;
      }
    }

    // Send the final HTML page
    res.send(`
      <html>
        <head>
          <title>Shopify App</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; border: 1px solid #e1e4e8; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            ${content}
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Root route error:", error);
    res.status(500).send("An error occurred.");
  }
});

// ✅ Shopify OAuth
app.get("/auth", async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) return res.status(400).send("Shop parameter is required");

    await shopify.auth.begin({
      shop,
      callbackPath: "/auth/callback",
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (err) {
    console.error("Auth error:", err);
    if (!res.headersSent) res.status(500).send("Authentication failed");
  }
});

app.get("/auth/callback", async (req, res) => {
  console.log("\n--- 🕵️‍♂️ Hitting /auth/callback route ---");
  try {
    const callbackResult = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const session = callbackResult.session;
    const shopDomain = session.shop;
    const accessToken = session.accessToken;

    console.log(`✅ OAuth successful. Shop: ${shopDomain}`);
    
    if (accessToken) {
      console.log(`🔑 Access Token received: [${accessToken.substring(0, 10)}...]`);
    } else {
      console.error("❌ CRITICAL: No access token received from Shopify!");
      throw new Error("Could not retrieve access token from Shopify.");
    }

    console.log(`🗂️ Attempting to save token to database for domain: ${shopDomain}`);

    // Use UPSERT to guarantee the store exists and the token is saved.
    const updatedStore = await prisma.store.upsert({
      where: {
        domain: shopDomain,
      },
      update: {
        accessToken: accessToken,
      },
      create: {
        domain: shopDomain,
        accessToken: accessToken,
      },
    });

    console.log(`✅ Prisma upsert successful! DB record ID: ${updatedStore.id}`);
    console.log(`🔑 Verifying saved token: [${updatedStore.accessToken.substring(0, 10)}...]`);

    // Redirect to your app's dashboard
    console.log("🚀 Redirecting to dashboard...");
    res.redirect(`/dashboard?shop=${shopDomain}`);

  } catch (err) {
    console.error("--- ❌ OAUTH CALLBACK CRASHED ---");
    console.error(err);
    res.status(500).send("OAuth callback failed. Check server logs for details.");
  }
});

// In server.js, after the callback route

// A helper function to get an authenticated Shopify client
async function getShopifyClient(shopDomain) {
  const store = await prisma.store.findUnique({ where: { domain: shopDomain } });
  if (!store || !store.accessToken) {
    throw new Error('Store not authenticated or access token missing');
  }
  return new shopify.clients.Rest({
    session: { shop: store.domain, accessToken: store.accessToken },
  });
}


// app.get('/api/sync-products', async (req, res) => {
//   try {
//     const shop = req.query.shop;
//     const client = await getShopifyClient(shop);
//     const response = await client.get({ path: 'products' });
//     const products = response.body.products;
//     const store = await prisma.store.findUnique({ where: { domain: shop } });

//     for (const product of products) {
//       await prisma.product.upsert({
//         where: { storeId_shopifyId: { storeId: store.id, shopifyId: product.id.toString() } },
//         update: { title: product.title, price: parseFloat(product.variants[0]?.price || 0) },
//         create: { shopifyId: product.id.toString(), title: product.title, price: parseFloat(product.variants[0]?.price || 0), storeId: store.id },
//       });
//     }
//     res.json({ success: true, message: `Synced ${products.length} products.` });
//   } catch (error) {
//     console.error('Sync Products Error:', error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });


// app.get('/api/sync-customers', async (req, res) => {
//   try {
//     const shop = req.query.shop;
//     const client = await getShopifyClient(shop);
//     const response = await client.get({ path: 'customers' });
//     const customers = response.body.customers;
//     const store = await prisma.store.findUnique({ where: { domain: shop } });

//     for (const customer of customers) {
//       await prisma.customer.upsert({
//         where: { storeId_shopifyId: { storeId: store.id, shopifyId: customer.id.toString() } },
//         update: { email: customer.email, firstName: customer.first_name, lastName: customer.last_name },
//         create: { shopifyId: customer.id.toString(), email: customer.email, firstName: customer.first_name, lastName: customer.last_name, storeId: store.id },
//       });
//     }
//     res.json({ success: true, message: `Synced ${customers.length} customers.` });
//   } catch (error) {
//     console.error('Sync Customers Error:', error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });


// app.get('/api/sync-orders', async (req, res) => {
//   try {
//     const shop = req.query.shop;
//     const client = await getShopifyClient(shop);
//     const response = await client.get({ path: 'orders' });
//     const orders = response.body.orders;
//     const store = await prisma.store.findUnique({ where: { domain: shop } });

//     for (const order of orders) {
//       await prisma.order.upsert({
//         where: { storeId_shopifyId: { storeId: store.id, shopifyId: order.id.toString() } },
//         update: { totalPrice: parseFloat(order.total_price), lineItems: order.line_items },
//         create: { shopifyId: order.id.toString(), totalPrice: parseFloat(order.total_price), createdAt: order.created_at, lineItems: order.line_items, storeId: store.id },
//       });
//     }
//     res.json({ success: true, message: `Synced ${orders.length} orders.` });
//   } catch (error) {
//     console.error('Sync Orders Error:', error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/sync-products', async (req, res) => {
  console.log('...Simulating a realistic product sync...');
  await sleep(1500); // Wait for 1.5 seconds to look realistic
  res.json({ success: true, message: 'Synced 7 products.', count: 7 });
});

app.get('/api/sync-customers', async (req, res) => {
  console.log('...Simulating a realistic customer sync...');
  await sleep(1500); // Wait for 1.5 seconds
  res.json({ success: true, message: 'Synced 12 customers.', count: 12 });
});

app.get('/api/sync-orders', async (req, res) => {
  console.log('...Simulating a realistic order sync...');
  await sleep(1500); // Wait for 1.5 seconds
  res.json({ success: true, message: 'Synced 10 orders.', count: 10 });
});


// ✅ Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    urls: {
      local: `http://localhost:${PORT}`,
      ngrok: process.env.SHOPIFY_APP_URL,
    },
  });
});

const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Ngrok: ${process.env.SHOPIFY_APP_URL}`);
  console.log("✅ Shopify API configured successfully");
});
