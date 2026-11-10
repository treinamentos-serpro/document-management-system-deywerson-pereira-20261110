const documentsRepository = require('../repositories/documents.repository');

const owner = process.env.DEFAULT_OWNER_ID ?? 'local-user';

if (!owner.trim()) {
  throw new Error('DEFAULT_OWNER_ID deve ser uma string não vazia.');
}

function listDocuments() {
  return documentsRepository.listByOwner(owner);
}

async function getDownload(id) {
  const document = documentsRepository.findById(id);
  if (!document) {
    const error = new Error('O documento solicitado não foi encontrado.');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const filePath = await documentsRepository.getFilePath(document.storageName);
  const { storageName, ...publicDocument } = document;
  return { document: publicDocument, filePath };
}

module.exports = { listDocuments, getDownload };