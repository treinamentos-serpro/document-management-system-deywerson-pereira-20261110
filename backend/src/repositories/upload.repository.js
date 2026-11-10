const fs = require('node:fs/promises');
const path = require('node:path');
const storageDirectory = path.resolve(__dirname, '../../storage');
const documentsRepository = require('./documents.repository');

async function create(document) {
  try {
    return await documentsRepository.create(document);
  } catch (error) {
    await fs.unlink(path.join(storageDirectory, document.storageName)).catch(() => {});
    throw error;
  }
}

module.exports = { create };