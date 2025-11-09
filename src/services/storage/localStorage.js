const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Simple metadata DB: files.json inside root folder
 * This keeps mapping of publicKey/privateKey -> filename, original name, mimetype, size, path
 */
class LocalStorage {
  constructor(rootFolder) {
    this.root = rootFolder;
    if (!fs.existsSync(rootFolder)) fs.mkdirSync(rootFolder, { recursive: true });

    this.metaFile = path.join(this.root, 'files.json');
    if (!fs.existsSync(this.metaFile)) fs.writeFileSync(this.metaFile, JSON.stringify({ files: [] }, null, 2));
    this._loadMeta();
  }

  _loadMeta() {
    try {
      const raw = fs.readFileSync(this.metaFile, 'utf8');
      this.meta = JSON.parse(raw);
    } catch (e) {
      this.meta = { files: [] };
    }
  }

  _saveMeta() {
    fs.writeFileSync(this.metaFile, JSON.stringify(this.meta, null, 2));
  }

  _generateKey() {
    return crypto.randomBytes(12).toString('hex'); // 24 hex chars
  }

  async save({ path: tmpPath, originalname, mimetype, size }) {
    const publicKey = this._generateKey();
    const privateKey = this._generateKey();
    const filename = `${publicKey}_${originalname.replace(/\s+/g, '_')}`;
    const dest = path.join(this.root, filename);

    // move file from tmpPath -> dest
    fs.renameSync(tmpPath, dest);

    const entry = {
      publicKey,
      privateKey,
      filename,
      originalname,
      mimetype,
      size,
      path: dest,
      createdAt: Date.now(),
      lastAccess: Date.now()
    };
    this.meta.files.push(entry);
    this._saveMeta();
    return { publicKey, privateKey };
  }

  async get(publicKey) {
    this._loadMeta();
    const entry = this.meta.files.find(f => f.publicKey === publicKey);
    if (!entry) return null;
    // update last access
    entry.lastAccess = Date.now();
    this._saveMeta();
    return entry;
  }

  async remove(privateKey) {
    this._loadMeta();
    const idx = this.meta.files.findIndex(f => f.privateKey === privateKey);
    if (idx === -1) return false;
    const entry = this.meta.files[idx];
    try { if (fs.existsSync(entry.path)) fs.unlinkSync(entry.path); } catch (e) { /* ignore */ }
    this.meta.files.splice(idx, 1);
    this._saveMeta();
    return true;
  }

  // helper to list for tests or cleanup
  listAll() {
    this._loadMeta();
    return this.meta.files;
  }
}

module.exports = LocalStorage;
