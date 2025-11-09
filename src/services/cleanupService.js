const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

/**
 * Runs a nightly job that removes files not accessed for `days` days.
 * It also removes entries from files.json metadata.
 */
function startCleanup(folder, days = 7) {
  // Run once per day at 03:00
  cron.schedule('0 3 * * *', () => {
    try {
      cleanupOldFiles(folder, days);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Cleanup job failed', e);
    }
  });

  // Also run immediately at startup
  try { cleanupOldFiles(folder, days); } catch (e) { console.error('Initial cleanup failed', e); }
}

function cleanupOldFiles(folder, maxAgeDays = 7) {
  const metaFile = path.join(folder, 'files.json');
  if (!fs.existsSync(metaFile)) return;
  const raw = fs.readFileSync(metaFile, 'utf8');
  let meta;
  try { meta = JSON.parse(raw); } catch (e) { meta = { files: [] }; }

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const survivors = [];
  for (const entry of meta.files) {
    let atime = entry.lastAccess || entry.createdAt || 0;
    // fallback to filesystem times if available
    try {
      const stats = fs.statSync(entry.path);
      atime = Math.max(atime, stats.atimeMs || 0);
    } catch (e) { /* ignore */ }

    if (atime < cutoff) {
      // delete file
      try { if (fs.existsSync(entry.path)) fs.unlinkSync(entry.path); } catch (e) { /* ignore */ }
    } else {
      survivors.push(entry);
    }
  }
  fs.writeFileSync(metaFile, JSON.stringify({ files: survivors }, null, 2));
}

module.exports = { startCleanup, cleanupOldFiles };
