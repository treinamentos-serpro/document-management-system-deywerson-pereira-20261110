const { randomUUID } = require('node:crypto');
const uploadRepository = require('../repositories/upload.repository');

const owner = process.env.DEFAULT_OWNER_ID ?? 'local-user';

if (!owner.trim()) {
  throw new Error('DEFAULT_OWNER_ID deve ser uma string não vazia.');
}

async function createDocument(file) {
  return uploadRepository.create({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  });
}

module.exports = { createDocument };