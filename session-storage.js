// session-storage.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  async storeSession(session) {
    // session has fields: shop, accessToken, isOnline, expires, scope
    const domain = session.shop || session.shopDomain || session.shopifyDomain;
    const accessToken = session.accessToken || session.access_token || session.session?.accessToken;

    if (!domain) throw new Error('storeSession: missing session.shop');

    await prisma.store.upsert({
      where: { domain },
      update: {
        accessToken,
        isUninstalled: false,
      },
      create: {
        domain,
        accessToken,
      },
    });

    return true;
  },

  async loadSession(shop) {
    return prisma.store.findUnique({ where: { domain: shop } });
  },

  async deleteSession(shop) {
    // mark uninstalled
    return prisma.store.update({
      where: { domain: shop },
      data: { accessToken: null, isUninstalled: true }
    });
  }
};
