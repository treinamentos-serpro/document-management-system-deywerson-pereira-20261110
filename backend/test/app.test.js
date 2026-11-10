const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

const storageDirectory = path.resolve(__dirname, '../storage');

async function startServer(t) {
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://localhost:${server.address().port}`;
}

async function uploadFile(baseUrl, content, filename) {
  const form = new FormData();
  form.append('file', new Blob([content]), filename);
  return fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('lista vazia quando nenhum documento foi enviado', async (t) => {
  const baseUrl = await startServer(t);

  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { documents: [] });
});

test('faz upload de arquivo e retorna somente metadados públicos', async (t) => {
  const baseUrl = await startServer(t);
  const existingFiles = new Set(await fs.readdir(storageDirectory));

  t.after(async () => {
    const currentFiles = await fs.readdir(storageDirectory);
    await Promise.all(currentFiles
      .filter((file) => !existingFiles.has(file))
      .map((file) => fs.unlink(path.join(storageDirectory, file))));
  });

  const response = await uploadFile(baseUrl, 'conteudo local', 'documento.txt');
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.deepStrictEqual(Object.keys(body.document).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.strictEqual(body.document.originalName, 'documento.txt');
  assert.strictEqual(body.document.size, Buffer.byteLength('conteudo local'));
  assert.strictEqual(body.document.owner, process.env.DEFAULT_OWNER_ID || 'local-user');

  const uploadedFiles = (await fs.readdir(storageDirectory))
    .filter((file) => !existingFiles.has(file));
  assert.strictEqual(uploadedFiles.length, 1);
  assert.strictEqual(
    await fs.readFile(path.join(storageDirectory, uploadedFiles[0]), 'utf8'),
    'conteudo local',
  );
});

test('retorna erro compreensível quando o arquivo não é informado', async (t) => {
  const baseUrl = await startServer(t);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'FILE_REQUIRED');
});

test('lista documentos e baixa o arquivo como anexo', async (t) => {
  const baseUrl = await startServer(t);
  const existingFiles = new Set(await fs.readdir(storageDirectory));
  t.after(async () => {
    const currentFiles = await fs.readdir(storageDirectory);
    await Promise.all(currentFiles
      .filter((file) => !existingFiles.has(file))
      .map((file) => fs.unlink(path.join(storageDirectory, file))));
  });

  const uploadResponse = await uploadFile(baseUrl, 'conteudo para download', 'arquivo.txt');
  const { document } = await uploadResponse.json();
  const listResponse = await fetch(`${baseUrl}/documents`);
  const { documents } = await listResponse.json();
  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);

  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual(documents.find((item) => item.id === document.id), document);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="arquivo.txt"/);
  assert.strictEqual(await downloadResponse.text(), 'conteudo para download');
});

test('preserva os bytes de um arquivo binario no upload e download', async (t) => {
  const baseUrl = await startServer(t);
  const existingFiles = new Set(await fs.readdir(storageDirectory));
  t.after(async () => {
    const currentFiles = await fs.readdir(storageDirectory);
    await Promise.all(currentFiles
      .filter((file) => !existingFiles.has(file))
      .map((file) => fs.unlink(path.join(storageDirectory, file))));
  });

  const content = Buffer.from([0, 1, 127, 128, 254, 255]);
  const uploadResponse = await uploadFile(baseUrl, content, 'arquivo.bin');
  const { document } = await uploadResponse.json();

  assert.strictEqual(uploadResponse.status, 201);
  assert.strictEqual(document.size, content.length);

  const response = await fetch(`${baseUrl}/documents/${document.id}/download`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(Number(response.headers.get('content-length')), content.length);
  assert.deepStrictEqual(Buffer.from(await response.arrayBuffer()), content);
});

test('valida o UUID e reporta documento inexistente', async (t) => {
  const baseUrl = await startServer(t);

  const invalidResponse = await fetch(`${baseUrl}/documents/invalido/download`);
  const invalidBody = await invalidResponse.json();
  const missingResponse = await fetch(
    `${baseUrl}/documents/550e8400-e29b-41d4-a716-446655440000/download`,
  );
  const missingBody = await missingResponse.json();

  assert.strictEqual(invalidResponse.status, 400);
  assert.strictEqual(invalidBody.error.code, 'INVALID_DOCUMENT_ID');
  assert.strictEqual(missingResponse.status, 404);
  assert.strictEqual(missingBody.error.code, 'DOCUMENT_NOT_FOUND');
});
