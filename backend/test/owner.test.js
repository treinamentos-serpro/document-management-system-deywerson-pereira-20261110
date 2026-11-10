const { test } = require('node:test');
const assert = require('node:assert');

const ownerModulePath = require.resolve('../src/services/owner');

function loadOwner(defaultOwnerId) {
  const previousOwnerId = process.env.DEFAULT_OWNER_ID;
  delete require.cache[ownerModulePath];

  if (defaultOwnerId === undefined) {
    delete process.env.DEFAULT_OWNER_ID;
  } else {
    process.env.DEFAULT_OWNER_ID = defaultOwnerId;
  }

  try {
    return require(ownerModulePath);
  } finally {
    delete require.cache[ownerModulePath];
    if (previousOwnerId === undefined) {
      delete process.env.DEFAULT_OWNER_ID;
    } else {
      process.env.DEFAULT_OWNER_ID = previousOwnerId;
    }
  }
}

test('usa local-user quando DEFAULT_OWNER_ID não está definido', () => {
  assert.strictEqual(loadOwner(undefined), 'local-user');
});

test('mantém a string original quando DEFAULT_OWNER_ID contém espaços', () => {
  assert.strictEqual(loadOwner('  user-42  '), '  user-42  ');
});

test('rejeita DEFAULT_OWNER_ID em branco ao carregar o módulo', () => {
  assert.throws(
    () => loadOwner('   '),
    { message: 'DEFAULT_OWNER_ID deve ser uma string não vazia.' },
  );
});
