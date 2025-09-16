const cron = require('node-cron');

cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled sync for all stores...');
  const stores = await require('./models').Stores.getAllInstalled(); // implement getAllInstalled
  for (const s of stores) {
    try {
      // call the endpoints you already wrote for /api/orders and /api/customers
      // simple: call your ingestion functions directly (better) or perform HTTP requests
      await syncStoreData(s);
    } catch (err) {
      console.error('Scheduled sync error for', s.domain, err);
    }
  }
});
