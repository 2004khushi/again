// models/index.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  Stores: {
    findByDomain: async (domain) => prisma.store.findUnique({ where: { domain } }),
    markAsUninstalled: async (domain) =>
      prisma.store.update({
        where: { domain },
        data: { accessToken: null, isUninstalled: true },
      }),
  },

  Products: {
    upsert: async (storeId, shopifyId, title, price) => {
      return prisma.product.upsert({
        where: { shopifyId },
        update: { title, price, storeId },
        create: { shopifyId, title, price, storeId },
      });
    },
  },

  Customers: {
    upsert: async (storeId, shopifyId, email, firstName, lastName, totalSpent = 0) => {
      return prisma.customer.upsert({
        where: { shopifyId },
        update: { email, firstName, lastName, totalSpent, storeId },
        create: { shopifyId, email, firstName, lastName, totalSpent, storeId },
      });
    },
    incrementSpent: async (storeId, shopifyId, amount) => {
      const cust = await prisma.customer.findUnique({ where: { shopifyId } });
      if (cust) {
        return prisma.customer.update({
          where: { shopifyId },
          data: { totalSpent: { increment: amount } },
        });
      }
      // If customer not found, create a new one with initial spent
      return prisma.customer.create({
        data: { shopifyId, totalSpent: amount, storeId },
      });
    },
  },

  Orders: {
    upsert: async (storeId, shopifyId, createdAt, totalPrice, customerShopifyId, lineItems) => {
      return prisma.order.upsert({
        where: { shopifyId },
        update: {
          createdAt: new Date(createdAt),
          totalPrice,
          customerShopifyId,
          lineItems: JSON.parse(lineItems || '[]'),
          storeId,
        },
        create: {
          shopifyId,
          createdAt: new Date(createdAt),
          totalPrice,
          customerShopifyId,
          lineItems: JSON.parse(lineItems || '[]'),
          storeId,
        },
      });
    },
  },

  Owners: {
    create: async (email, password, storeId = null) => {
      return prisma.owner.create({
        data: { email, password, storeId },
      });
    },
    findByEmail: async (email) => prisma.owner.findUnique({ where: { email } }),
    linkToStore: async (ownerId, storeId) => {
      return prisma.owner.update({
        where: { id: ownerId },
        data: { storeId },
      });
    },
  },
};
