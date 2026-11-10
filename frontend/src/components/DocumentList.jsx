import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading">
      <div className="section-heading">
        <h2 id="documents-heading">Documentos</h2>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={isLoading}>
          Atualizar
        </button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {isLoading ? (
        <p className="list-status" role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <p className="list-status">{error ? 'A listagem está indisponível.' : 'Nenhum documento enviado.'}</p>
      ) : (
        <div className="table-scroll" role="region" aria-label="Lista de documentos" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col">Proprietário</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <th scope="row" className="document-name">{document.originalName}</th>
                  <td>{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
                  <td className="document-owner">{document.owner}</td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}