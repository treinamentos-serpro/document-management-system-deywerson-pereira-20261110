import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/api.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const documents = await listDocuments(controller.signal);
        if (!controller.signal.aborted) setDocuments(documents);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshVersion]);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="brand-mark" aria-hidden="true">DMS</span>
        <h1>Gestão de documentos</h1>
      </header>
      <UploadComponent onUploaded={refreshDocuments} />
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </main>
  );
}
