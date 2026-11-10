const documentsService = require('../services/documents.service');

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendError(res, error, fallbackCode, fallbackMessage) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code: error.code || fallbackCode,
      message: error.statusCode ? error.message : fallbackMessage,
    },
  });
}

async function list(_req, res) {
  try {
    const documents = documentsService.listDocuments();
    return res.status(200).json({ documents });
  } catch (error) {
    return sendError(res, error, 'INTERNAL_ERROR', 'Não foi possível listar os documentos.');
  }
}

async function download(req, res) {
  if (!uuidV4Pattern.test(req.params.id)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DOCUMENT_ID',
        message: 'O identificador do documento deve ser um UUID v4 válido.',
      },
    });
  }

  try {
    const { document, filePath } = await documentsService.getDownload(req.params.id);
    return res.download(filePath, document.originalName, {
      headers: { 'Content-Type': 'application/octet-stream' },
    }, (error) => {
      if (error && res.headersSent) {
        res.destroy(error);
      } else if (error) {
        sendError(res, error, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
      }
    });
  } catch (error) {
    return sendError(res, error, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }
}

module.exports = { list, download };