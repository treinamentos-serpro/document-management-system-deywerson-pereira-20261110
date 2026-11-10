# Especificação - Document Management System

> Especificação do MVP para orientar o desenvolvimento guiado por especificação.
> Este documento descreve o produto e as etapas futuras; não representa a
> implementação dessas etapas.

## 1. Objetivo

Entregar uma aplicação web que permita ao usuário enviar, listar e baixar documentos armazenados no filesystem local, mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos documentos enviados no processo atual do backend.
- Download de um documento pelo identificador.
- Metadados associados a um identificador de dono configurado para a instância.
- Interface React para envio, listagem e download, com estados de carregamento, lista vazia e erro.
- Armazenamento de arquivos em `backend/storage`, usando multer com `diskStorage`.

### Fora do escopo

- Autenticação, cadastro de usuários, escolha de usuário na interface ou isolamento seguro entre usuários.
- Persistência ou recuperação automática de metadados após reinício do backend.
- Armazenamento externo, em nuvem ou em banco de dados.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Pesquisa, filtros e paginação da listagem.
- Restrição por extensão ou tipo MIME do arquivo.

### Limitação de identidade

O MVP opera como uma instância de usuário único. O campo `owner` recebe o valor de `DEFAULT_OWNER_ID`; ele é metadado de atribuição, não mecanismo de autenticação ou autorização. Todas as requisições da instância compartilham esse dono.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo por `multipart/form-data`, no campo `file`. |
| RF-02 | O backend deve aceitar qualquer tipo de arquivo, respeitando o limite de tamanho configurado. |
| RF-03 | Após um envio bem-sucedido, o sistema deve retornar os metadados do documento criado, incluindo um identificador único e o dono configurado. |
| RF-04 | O usuário pode listar os metadados dos documentos registrados para o dono configurado na instância. |
| RF-05 | A listagem deve vir ordenada do envio mais recente para o mais antigo; empates devem ser ordenados pelo `id` em ordem crescente. |
| RF-06 | O usuário pode baixar o conteúdo binário de um documento pelo `id`; a resposta deve instruir o navegador a baixar o arquivo como anexo. |
| RF-07 | O sistema deve retornar erro compreensível quando o arquivo não for informado, exceder o limite, o identificador for inválido ou o documento/arquivo não for encontrado. |
| RF-08 | A interface deve apresentar os fluxos de envio, listagem e download, incluindo estados de carregamento, lista vazia e erro. |
| RF-09 | Se um arquivo for gravado, mas o registro dos metadados falhar, o sistema deve tentar remover o arquivo recém-gravado e retornar erro de operação. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local em `backend/storage`, com multer e `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória durante a vida do processo; eles não são persistidos nem reconstruídos após reinício. |
| RNF-03 | O limite de tamanho do upload deve ser configurável por variável de ambiente. O valor padrão é 10 MiB (`10485760` bytes). |
| RNF-04 | A configuração operacional deve seguir 12-Factor e usar variáveis de ambiente, sem adicionar dependências externas de armazenamento. |
| RNF-05 | O nome físico do arquivo deve ser gerado pelo servidor a partir de um identificador único. O nome ou caminho enviado pelo cliente nunca deve definir o caminho de gravação ou leitura. |
| RNF-06 | Downloads devem ser enviados como anexos e não devem renderizar conteúdo enviado pelo usuário como conteúdo ativo da página da aplicação. |
| RNF-07 | O backend deve usar Node.js e Express em CommonJS; o frontend deve usar React e Vite em ESM, com JavaScript. |
| RNF-08 | Os metadados retornados pela API devem ser JSON UTF-8. Os erros de API devem usar o formato definido nesta especificação. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, gerado pelo servidor (UUID v4). |
| `originalName` | string | Nome original fornecido pelo cliente, preservado apenas como metadado e nome sugerido no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601, UTC. |
| `owner` | string | Identificador configurado por `DEFAULT_OWNER_ID`. |

### Dado interno de armazenamento

O repositório pode manter `storageName`, nome físico gerado pelo servidor e relativo a `backend/storage`, para localizar o conteúdo. Esse valor não deve ser retornado pela API nem derivado de `originalName`. O caminho absoluto deve ser resolvido dentro da pasta de armazenamento, sem permitir que dados da requisição o alterem.

### Ciclo de vida

O registro é criado após o multer gravar o arquivo. O registro e o caminho físico ficam disponíveis enquanto existirem no processo atual. Após reinício, os registros em memória desaparecem; os arquivos no disco podem permanecer, mas não são descobertos ou disponibilizados automaticamente pela API. Recuperação, limpeza automática e reconstrução de metadados estão fora do escopo.

## 6. Contratos de API

Os caminhos abaixo são relativos à raiz do backend. No desenvolvimento, o frontend pode chamar esses caminhos pelo prefixo `/api`; o proxy Vite remove esse prefixo antes de encaminhar a requisição.

### Formato comum de erro

Respostas de erro usam `Content-Type: application/json; charset=utf-8` e o formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para tratamento pelo cliente. `message` é uma mensagem legível em português; detalhes internos do filesystem não devem ser expostos.

### `POST /upload`

- Entrada: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Tipos de arquivo: qualquer tipo; não há allowlist por extensão ou MIME.
- Limite: `MAX_FILE_SIZE_BYTES`.
- Sucesso: `201 Created`, JSON com os metadados públicos do documento.

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-11-10T12:00:00.000Z",
    "owner": "local-user"
  }
}
```

Erros esperados:

| HTTP | `code` | Situação |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| 413 | `FILE_TOO_LARGE` | Arquivo acima de `MAX_FILE_SIZE_BYTES`. |
| 500 | `UPLOAD_FAILED` | Falha ao gravar arquivo ou registrar metadados. |

### `GET /documents`

- Entrada: sem corpo.
- Sucesso: `200 OK`, lista de metadados públicos do dono configurado, ordenada conforme RF-05. Uma lista vazia é sucesso.

```json
{
  "documents": []
}
```

Erro esperado: `500 INTERNAL_ERROR` para falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- Entrada: `id` UUID v4 no caminho.
- Sucesso: `200 OK`, conteúdo binário do arquivo com `Content-Disposition: attachment` e nome original devidamente codificado no cabeçalho. O conteúdo deve ser servido como `application/octet-stream`.
- O caminho físico deve ser obtido exclusivamente pelo registro interno associado ao `id`, nunca concatenando o parâmetro da rota ou o nome original ao diretório.

Erros esperados:

| HTTP | `code` | Situação |
| --- | --- | --- |
| 400 | `INVALID_DOCUMENT_ID` | `id` não está no formato UUID v4 esperado. |
| 404 | `DOCUMENT_NOT_FOUND` | Não existe metadado para o `id` no processo atual. |
| 404 | `DOCUMENT_FILE_NOT_FOUND` | Há metadado, mas o arquivo correspondente não está no filesystem. |
| 500 | `DOWNLOAD_FAILED` | Outra falha ao ler ou transmitir o arquivo. |

## 7. Decisões arquiteturais

- O fluxo do backend segue `routes -> controllers -> services -> repositories`.
- `routes/` declara os caminhos, aplica o middleware de upload e encaminha para controllers; multer é configurado na fronteira HTTP com `diskStorage` e destino fixo em `backend/storage`.
- `controllers/` traduz entrada/saída HTTP, valida a presença do arquivo e mapeia erros de aplicação para os códigos e formatos definidos nesta especificação.
- `services/` coordena as regras de negócio, criação dos metadados, consulta e download, sem depender de objetos HTTP do Express.
- `repositories/` mantém os metadados em memória e encapsula o acesso necessário aos arquivos locais, incluindo remoção compensatória quando o registro falhar.
- O frontend usa componentes React e `fetch` para chamar a API sob `/api` no ambiente Vite. Deve atualizar ou carregar a listagem após envio bem-sucedido e exibir erros sem perder o estado da página.
- Configuração prevista:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite de tamanho por upload, em bytes (10 MiB). |
| `DEFAULT_OWNER_ID` | `local-user` | Dono atribuído a todos os documentos da instância. |

- `backend/storage` não é configurável nesta fase, para cumprir a restrição de armazenamento local definida pelo projeto.
- Valores de configuração inválidos devem ser detectados no início da aplicação, com mensagem clara, em vez de alterar silenciosamente as regras do serviço.
- A API não implementa autenticação. O ambiente deve ser tratado como confiável; `owner` não oferece proteção contra acesso de terceiros.

## 8. Plano de execução

As etapas abaixo são um roteiro futuro de implementação. Nenhuma delas é executada pela criação desta especificação.

1. Preparar e validar a configuração do backend, o destino local de armazenamento e os limites de upload.
2. Implementar o modelo de metadados em memória e os repositórios para metadados e arquivos locais, incluindo tratamento de falha e remoção compensatória.
3. Implementar os serviços, controllers e rotas para upload, listagem e download, com os contratos e erros definidos nesta especificação.
4. Construir a interface React para upload, listagem, estados vazios e erros, integrando-a à API via `fetch` e proxy `/api`.
5. Validar os fluxos ponta a ponta, limites, arquivos ausentes, downloads inexistentes, falhas de filesystem e comportamento dos metadados após reinício.

## 9. Critérios de aceite

- Um upload válido grava o arquivo em `backend/storage` e retorna `201` com metadados públicos, sem expor o nome físico.
- Um upload ausente ou acima do limite retorna o código HTTP e o formato de erro especificados.
- A listagem retorna apenas registros em memória do dono configurado, em ordem determinística; sem documentos, retorna `200` e lista vazia.
- Um documento registrado pode ser baixado como anexo com o nome original sugerido; IDs inválidos e documentos/arquivos ausentes retornam os erros especificados.
- O sistema não usa armazenamento externo e não promete persistência de metadados entre reinícios.
- A interface permite completar os fluxos previstos e comunica estados de carregamento, vazio e erro.
- O plano de execução é apenas documental nesta entrega; não implica alterações de código de backend ou frontend.