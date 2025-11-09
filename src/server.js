const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const fs = require('fs');
const path = require('path');


// Ensure storage folder exists
const storageFolder = process.env.FOLDER || path.resolve(__dirname, '..', 'storage_root');
if (!fs.existsSync(storageFolder)) fs.mkdirSync(storageFolder, { recursive: true });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});