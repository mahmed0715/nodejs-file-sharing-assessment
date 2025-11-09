const rateLimit = require('express-rate-limit');

// Safe IPv6-aware key generator (works for all versions)
const safeKeyGenerator = (req) => {
  // Express stores IP as "::ffff:127.0.0.1" for IPv6 localhost
  // Normalize by removing "::ffff:" prefix if present
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return ip.replace('::ffff:', '');
};

const uploadLimit = Number(process.env.UPLOAD_LIMIT || 20);
const downloadLimit = Number(process.env.DOWNLOAD_LIMIT || 200);

const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: uploadLimit,
  keyGenerator: safeKeyGenerator,
  handler: (req, res) => res.status(429).json({ error: 'Daily upload limit reached' })
});

const downloadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: downloadLimit,
  keyGenerator: safeKeyGenerator,
  handler: (req, res) => res.status(429).json({ error: 'Daily download limit reached' })
});

module.exports = { uploadLimiter, downloadLimiter };
