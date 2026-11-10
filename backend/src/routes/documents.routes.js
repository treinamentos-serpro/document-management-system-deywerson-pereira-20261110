const express = require('express');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();

router.get('/', documentsController.list);
router.get('/:id/download', documentsController.download);

module.exports = router;