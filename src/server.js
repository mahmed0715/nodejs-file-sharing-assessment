const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

// Ensure storage folder exists
const storageFolder = process.env.FOLDER || path.resolve(__dirname, '..', 'storage_root');
if (!fs.existsSync(storageFolder)) fs.mkdirSync(storageFolder, { recursive: true });

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`File Sharing API listening on port ${port}`);
});
