const fs = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

async function create(document) {
  const { storageName, ...publicDocument } = document;
  documents.set(publicDocument.id, { ...publicDocument, storageName });
  return publicDocument;
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => {
      const dateOrder = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
      return dateOrder || first.id.localeCompare(second.id);
    })
    .map(({ storageName, ...document }) => document);
}

function findById(id) {
  return documents.get(id) || null;
}

async function getFilePath(storageName) {
  const filePath = path.resolve(storageDirectory, storageName);
  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    const error = new Error('Caminho de arquivo inválido.');
    error.code = 'DOCUMENT_FILE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  try {
    await fs.access(filePath);
    return filePath;
  } catch (cause) {
    if (cause.code === 'ENOENT') {
      const error = new Error('O arquivo deste documento não foi encontrado.');
      error.code = 'DOCUMENT_FILE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }
    throw cause;
  }
}

module.exports = { create, listByOwner, findById, getFilePath };