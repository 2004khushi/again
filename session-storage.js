const { Stores } = require('./models');

const sessionStorage = {
  storeSession: async (session) => {
    try {
      console.log('Storing session for shop:', session.shop);
      
      await Stores.upsert(
        session.id,
        session.shop, // using shop as name
        session.shop, // domain
        session.accessToken
      );
      
      return true;
    } catch (error) {
      console.error('Error storing session:', error);
      return false;
    }
  },

  loadSession: async (id) => {
    try {
      console.log('Loading session for id:', id);
      
      const store = await Stores.findByDomain(id);
      if (store && store.access_token) {
        return {
          id: store.id,
          shop: store.domain,
          state: 'active',
          isOnline: false,
          accessToken: store.access_token,
          scope: process.env.SCOPES
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error loading session:', error);
      return undefined;
    }
  },

  deleteSession: async (id) => {
    try {
      console.log('Deleting session for id:', id);
      
      // We'll just remove the access token instead of deleting the store
      await Stores.updateAccessToken(id, null);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  },
};

module.exports = sessionStorage;