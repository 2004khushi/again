// utils/auth-mw.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
module.exports = function authMiddleware(req, res, next) {
  const auth = req.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.owner = data;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
