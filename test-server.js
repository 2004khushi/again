const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Test Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .container { border: 1px solid #e1e1e1; padding: 20px; border-radius: 5px; }
          h1 { color: #96bf48; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Test Server is Running! ✅</h1>
          <p>Your ngrok is working correctly.</p>
          <p>Next steps:</p>
          <ol>
            <li>Add your Shopify API credentials to .env file</li>
            <li>Update your app settings in Shopify Partners</li>
            <li>Restart with the main server.js</li>
          </ol>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Ngrok: https://ee6f5a3e8a0a.ngrok-free.app`);
});