const express = require('express');
const filesRouter = require('./routes/files');
const cleanupService = require('./services/cleanupService');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const app = express();

app.use(express.json());
app.get('/openapi.json', (req, res) => res.json(swaggerDocument));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount files router
app.use('/files', filesRouter);

// Start cleanup service
const folder = process.env.FOLDER || path.resolve(__dirname, '..', 'storage_root');
const days = Number(process.env.CLEANUP_DAYS || 7);

// ✅ prevent cron from running in tests
if (process.env.NODE_ENV !== 'test') {
  const cleanupService = require('./services/cleanupService');
  cleanupService.startCleanup(folder, days);
}

module.exports = app;
