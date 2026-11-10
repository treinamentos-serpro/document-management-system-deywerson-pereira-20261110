const uploadService = require('../services/upload.service');

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie um arquivo no campo file.',
      },
    });
  }

  try {
    const document = await uploadService.createDocument(req.file);
    return res.status(201).json({ document });
  } catch {
    return res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Não foi possível concluir o envio do arquivo.',
      },
    });
  }
}

module.exports = { upload };