// Test route to check database operations
app.get('/test-db', async (req, res) => {
  try {
    // Test inserting a store
    const testStore = await Stores.upsert(
      'test-store-id',
      'Test Store',
      'test-store.myshopify.com',
      'test-access-token'
    );
    
    res.json({
      success: true,
      store: testStore,
      message: 'Database operation successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database operation failed'
    });
  }
});