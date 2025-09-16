const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = (app) => {
  // Register
  app.post("/register", async (req, res) => {
  try {
    const { email, password, storeName } = req.body;

    if (!email || !password || !storeName) {
      return res.status(400).json({ error: "Email, password and storeName are required" });
    }

    // --- THIS IS THE FIX ---

    // 1. Check if an owner with this email already exists
    const existingOwner = await prisma.owner.findUnique({ where: { email } });
    if (existingOwner) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // 2. Find the store or create it if it doesn't exist (upsert)
    const store = await prisma.store.upsert({
      where: { domain: storeName }, // Find by this unique domain
      update: {}, // If found, do nothing
      create: { domain: storeName }, // If not found, create it
    });

    console.log(`Found or created store with ID: ${store.id}`);

    // 3. Create the new owner and connect them to the store
    const hashedPassword = await bcrypt.hash(password, 10);
    const owner = await prisma.owner.create({
      data: {
        email: email,
        password: hashedPassword,
        stores: {
          connect: {
            id: store.id,
          },
        },
      },
    });

    // -------------------------

    res.json({ success: true, message: "Registration successful!", ownerId: owner.id, storeId: store.id });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

  // Login
  app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- THIS IS THE FIX ---
    // Fetch the owner AND their related stores
    const owner = await prisma.owner.findUnique({
      where: { email },
      include: {
        stores: true, // Tell Prisma to include the stores
      },
    });

    if (!owner) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, owner.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Now you can safely access the storeId
    // We'll take the first store associated with the owner for this example
    const storeId = owner.stores[0]?.id;
    if (!storeId) {
        return res.status(404).json({ error: "No store associated with this owner."})
    }
    // -------------------------

    const token = jwt.sign(
      { ownerId: owner.id, storeId: storeId, email: owner.email }, // Now this works!
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});
};
