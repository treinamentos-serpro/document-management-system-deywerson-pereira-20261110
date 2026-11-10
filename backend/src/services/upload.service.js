const { randomUUID } = require('node:crypto');
const uploadRepository = require('../repositories/upload.repository');
const owner = require('./owner');

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