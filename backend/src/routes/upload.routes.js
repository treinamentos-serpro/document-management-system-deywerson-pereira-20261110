const { randomUUID } = require('node:crypto');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');

const storageDirectory = path.resolve(__dirname, '../../storage');
const maxFileSizeBytes = Number(process.env.MAX_FILE_SIZE_BYTES ?? 10485760);

if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination: storageDirectory,
  filename: (_req, _file, callback) => callback(null, randomUUID()),
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes, files: 1 },
});

const router = express.Router();
router.post('/', upload.single('file'), uploadController.upload);

function handleUploadError(error, _req, res, _next) {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'O arquivo excede o limite de tamanho permitido.',
      },
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie exatamente um arquivo no campo file.',
      },
    });
  }

  return res.status(500).json({
    error: {
      code: 'UPLOAD_FAILED',
      message: 'Não foi possível concluir o envio do arquivo.',
    },
  });
}

router.use(handleUploadError);

module.exports = router;