const path = require('path');
const fs = require('fs');
const LocalStorage = require('../services/storage/localStorage');
const mime = require('mime-types');

const GoogleStorage = require('../services/storage/googleStorage');

const providerType = process.env.PROVIDER || 'local';
let provider;

if (providerType === 'google') {
  provider = new GoogleStorage(process.env.CONFIG);
} else {
  const folder = process.env.FOLDER || path.resolve(__dirname, '..', '..', 'storage_root');
  provider = new LocalStorage(folder);
}

/**
 * Upload handler
 * Accepts `multipart/form-data` with key `file`.
 * Returns { publicKey, privateKey }.
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const f = req.file;
    const result = await provider.save({
      path: f.path,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    });
    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Upload error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Download handler
 * Streams file for given publicKey
 */
exports.downloadFile = async (req, res) => {
  try {
    const publicKey = req.params.publicKey;
    const meta = await provider.get(publicKey);
    if (!meta) return res.status(404).json({ error: 'File not found' });

    // update access time (provider may update metadata, but ensure fs atime for cleanup)
    try { fs.utimesSync(meta.path, new Date(), new Date()); } catch (e) {}

    res.setHeader('Content-Type', meta.mimetype || mime.lookup(meta.filename) || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.originalname || meta.filename}"`);
    const stream = fs.createReadStream(meta.path);
    stream.pipe(res);
    stream.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Stream error', err);
      res.status(500).end();
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Download error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete handler
 * Deletes file by privateKey
 */
exports.deleteFile = async (req, res) => {
  try {
    const privateKey = req.params.privateKey;
    const ok = await provider.remove(privateKey);
    if (!ok) return res.status(404).json({ error: 'File not found or invalid private key' });
    return res.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Delete error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
