import { useState } from 'react';
import { uploadDocument } from '../services/api.js';

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    const form = event.currentTarget;
    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const document = await uploadDocument(file);
      form.reset();
      setFile(null);
      setMessage(`Arquivo "${document.originalName}" enviado com sucesso.`);
      onUploaded();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form onSubmit={handleSubmit} aria-busy={isUploading}>
        <label htmlFor="document-file">Arquivo</label>
        <div className="upload-controls">
          <input
            id="document-file"
            name="file"
            type="file"
            required
            disabled={isUploading}
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setMessage('');
            }}
          />
          <button type="submit" disabled={!file || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
      <p className="success-message" role="status">{message}</p>
    </section>
  );
}