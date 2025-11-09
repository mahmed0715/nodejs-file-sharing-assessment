const express = require('express');
const multer = require('multer');
const controller = require('../controllers/filesController');
const uploadLimiter = require('../middlewares/rateLimiter').uploadLimiter;
const downloadLimiter = require('../middlewares/rateLimiter').downloadLimiter;

const router = express.Router();
const upload = multer({ dest: '/tmp' }); // temp storage, we move to storage provider

// POST /files — upload
router.post('/', uploadLimiter, upload.single('file'), controller.uploadFile);

// GET /files/:publicKey — download
router.get('/:publicKey', downloadLimiter, controller.downloadFile);

// DELETE /files/:privateKey — delete
router.delete('/:privateKey', controller.deleteFile);

module.exports = router;
