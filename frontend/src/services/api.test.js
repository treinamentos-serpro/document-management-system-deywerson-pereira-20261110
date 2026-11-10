import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadDocument, listDocuments, uploadDocument } from './api.js';

afterEach(() => mock.restoreAll());

test('lista documentos via /api e encaminha o sinal de cancelamento', async () => {
  const documents = [{ id: 'document-id', originalName: 'arquivo.txt' }];
  const signal = new AbortController().signal;
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ documents }));

  assert.deepEqual(await listDocuments(signal), documents);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, ['/api/documents', { signal }]);
});

test('envia multipart com o campo file sem definir Content-Type manualmente', async () => {
  const file = new File(['conteudo'], 'arquivo.txt');
  const document = { id: 'document-id' };
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ document }));

  assert.deepEqual(await uploadDocument(file), document);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/upload');
  assert.equal(options.method, 'POST');
  assert.equal(options.body.get('file'), file);
  assert.equal(options.headers, undefined);
});

test('baixa o conteúdo como blob e codifica o identificador', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('conteudo'));

  assert.equal(await (await downloadDocument('id/arquivo')).text(), 'conteudo');
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents/id%2Farquivo/download');
});

test('preserva a mensagem de erro do backend', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json(
    { error: { message: 'Documento não encontrado.' } }, { status: 404 },
  ));

  await assert.rejects(downloadDocument('missing'), /Documento não encontrado/);
});

test('trata erros HTTP sem JSON e falhas de conexão', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('', { status: 502 }));
  await assert.rejects(listDocuments(), /Não foi possível concluir/);

  fetchMock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(listDocuments(), /Não foi possível conectar/);
});

test('preserva cancelamento para evitar erros após desmontagem', async () => {
  const error = new DOMException('Cancelado', 'AbortError');
  mock.method(globalThis, 'fetch', async () => { throw error; });

  await assert.rejects(listDocuments(), (received) => received === error);
});