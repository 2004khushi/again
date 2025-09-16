const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.owner = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = (app) => {
  // Summary stats
  app.get("/api/analytics/summary", authMiddleware, async (req, res) => {
    try {
      const storeId = req.owner.storeId;

      const [customers, orders] = await Promise.all([
        prisma.customer.count({ where: { storeId } }),
        prisma.order.findMany({ where: { storeId } }),
      ]);

      const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);

      res.json({ totalCustomers: customers, totalOrders: orders.length, totalRevenue });
    } catch (err) {
      console.error("Summary error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Orders grouped by date
  app.get("/api/analytics/orders-by-date", authMiddleware, async (req, res) => {
    try {
      const storeId = req.owner.storeId;

      const orders = await prisma.order.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { storeId },
      });

      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Top 5 customers
  app.get("/api/analytics/top-customers", authMiddleware, async (req, res) => {
    try {
      const storeId = req.owner.storeId;

      const customers = await prisma.customer.findMany({
        where: { storeId },
        orderBy: { totalSpent: "desc" },
        take: 5,
      });

      res.json(customers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
