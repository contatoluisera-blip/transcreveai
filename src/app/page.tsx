'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar o áudio.');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resultRef.current) {
      const textToCopy = resultRef.current.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };


  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.badge}>BETA</div>
          <h1 className={styles.title}>TranscreveAi</h1>
          <p className={styles.subtitle}>Transcrição Literal e Decupagem com Timecodes de Áudios</p>
        </div>

        {!result && (
          <div className={styles.uploadSection}>
            <div 
              className={`${styles.dropZone} ${file ? styles.hasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className={styles.fileSelected}>
                  <div className={styles.iconFile}>🎙️</div>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.iconUpload}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p>Arraste e solte seu arquivo de áudio</p>
                  <span>ou clique para procurar (MP3, M4A, WAV)</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="audio/mp3, audio/m4a, audio/wav, audio/mpeg, audio/mp4" 
                hidden 
              />
            </div>

            <button 
              className={`${styles.button} ${loading ? styles.loading : ''}`} 
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? (
                <span className={styles.buttonContent}>
                  <span className={styles.spinner}></span>
                  Analisando Áudio...
                </span>
              ) : (
                'Gerar Transcrição Literal'
              )}
            </button>
            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>
        )}

        {result && (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <h2>Transcrição Literal</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={styles.resetButton}
                  style={{ backgroundColor: copied ? '#10b981' : '', color: copied ? '#fff' : '' }}
                  onClick={handleCopy}
                >
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button 
                  className={styles.resetButton}
                  onClick={() => { setResult(null); setFile(null); setCopied(false); }}
                >
                  Processar Novo Áudio
                </button>
              </div>
            </div>
            <div 
              ref={resultRef}
              className={styles.resultContent}
              dangerouslySetInnerHTML={{ __html: result }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
