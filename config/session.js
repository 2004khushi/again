const { Stores } = require('../models');

// Simple session storage implementation
const sessionStorage = {
  storeSession: async (session) => {
    try {
      // Extract shop name from session ID (shop name is the session ID in offline mode)
      const shop = session.id;
      await Stores.upsert(
        session.id, // Using shop domain as ID for simplicity
        'Store Name', // You might need to fetch this from Shopify API
        shop,
        session.accessToken
      );
      return true;
    } catch (err) {
      console.error('Error storing session:', err);
      return false;
    }
  },

  loadSession: async (id) => {
    try {
      const store = await Stores.findByDomain(id);
      if (store && store.access_token) {
        return {
          id: store.domain,
          shop: store.domain,
          state: 'active',
          isOnline: false,
          accessToken: store.access_token,
          scope: process.env.SCOPES
        };
      }
      return undefined;
    } catch (err) {
      console.error('Error loading session:', err);
      return undefined;
    }
  },

  deleteSession: async (id) => {
    try {
      await Stores.markAsUninstalled(id);
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      return false;
    }
  }
};

module.exports = sessionStorage;