const owner = process.env.DEFAULT_OWNER_ID ?? 'local-user';

if (!owner.trim()) {
  throw new Error('DEFAULT_OWNER_ID deve ser uma string não vazia.');
}

module.exports = owner;
