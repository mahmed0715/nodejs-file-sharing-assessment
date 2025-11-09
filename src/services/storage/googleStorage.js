const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

class GoogleStorage {
  constructor(configPath) {
    if (process.env.MOCK_GCS === 'true') {
      console.log('⚙️ Running in MOCK Google Storage mode');
      this.mock = true;
      this.files = new Map();
      return;
    }

    if (!configPath) throw new Error('CONFIG env variable not set');

    const abs = path.resolve(configPath);
    if (!fs.existsSync(abs)) throw new Error(`Config file not found: ${abs}`);
    const config = JSON.parse(fs.readFileSync(abs, 'utf8'));
    if (!config.projectId || !config.bucketName || !config.credentials) {
      throw new Error('Invalid GCS config file');
    }

    this.storage = new Storage({
      projectId: config.projectId,
      credentials: config.credentials
    });
    this.bucket = this.storage.bucket(config.bucketName);
  }

  async save({ path: tmpPath, originalname, mimetype }) {
    const publicKey = this._key();
    const privateKey = this._key();

    if (this.mock) {
      const dest = path.join('/tmp', `${publicKey}_${originalname}`);
      fs.copyFileSync(tmpPath, dest);
      fs.unlinkSync(tmpPath);
      this.files.set(publicKey, { privateKey, dest, mimetype, originalname });
      return { publicKey, privateKey };
    }

    const destFile = `${publicKey}_${originalname}`;
    await this.bucket.upload(tmpPath, { destination: destFile, metadata: { contentType: mimetype } });
    fs.unlinkSync(tmpPath);
    const file = this.bucket.file(destFile);
    await file.setMetadata({ metadata: { privateKey, originalname } });
    return { publicKey, privateKey };
  }

  async get(publicKey) {
    if (this.mock) {
      const meta = this.files.get(publicKey);
      if (!meta) return null;
      return { path: meta.dest, mimetype: meta.mimetype, originalname: meta.originalname };
    }

    const [files] = await this.bucket.getFiles({ prefix: `${publicKey}_` });
    if (!files.length) return null;
    const file = files[0];
    const [meta] = await file.getMetadata();
    const tmp = path.join('/tmp', meta.metadata?.originalname || file.name);
    await file.download({ destination: tmp });
    return { path: tmp, mimetype: meta.contentType, originalname: meta.metadata?.originalname };
  }

  async remove(privateKey) {
    if (this.mock) {
      for (const [pub, meta] of this.files.entries()) {
        if (meta.privateKey === privateKey) {
          fs.unlinkSync(meta.dest);
          this.files.delete(pub);
          return true;
        }
      }
      return false;
    }

    const [files] = await this.bucket.getFiles();
    for (const file of files) {
      const [meta] = await file.getMetadata();
      if (meta.metadata?.privateKey === privateKey) {
        await file.delete();
        return true;
      }
    }
    return false;
  }

  _key() {
    return Math.random().toString(36).slice(2, 14);
  }
}

module.exports = GoogleStorage;
