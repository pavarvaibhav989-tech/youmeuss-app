import { useRef, useCallback, useState } from 'react';
import { CloudArrowUp, FilmStrip, X } from '@phosphor-icons/react';
import { useToast } from './Toast';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Check file type by extension as fallback (file.type is unreliable on some OS/browsers)
function isVideoFile(file) {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
  if (file.type && allowedTypes.includes(file.type)) return true;

  // Fallback: check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'mkv', 'mov', 'avi', 'wmv', 'm4v'].includes(ext);
}

export default function VideoUpload({ roomId, onVideoLoaded }) {
  const fileInputRef = useRef(null);
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const abortRef = useRef(null);

  const uploadFile = useCallback(async (file) => {
    console.log('[VideoUpload] File selected:', file.name, 'type:', file.type, 'size:', file.size, 'roomId:', roomId);

    if (!isVideoFile(file)) {
      addToast(`Unsupported file type "${file.type || 'unknown'}". Use MP4, WebM, MKV, or MOV.`, 'error');
      return;
    }

    if (file.size > 3 * 1024 * 1024 * 1024) {
      addToast('File too large. Maximum size is 3GB.', 'error');
      return;
    }

    if (!roomId) {
      addToast('Room not ready — please wait and try again.', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('roomId', roomId);

    const token = localStorage.getItem('accessToken');

    if (!token) {
      addToast('Not logged in — please refresh the page.', 'error');
      setUploading(false);
      return;
    }

    try {
      // Use XMLHttpRequest for upload progress tracking
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        });

        xhr.addEventListener('load', () => {
          console.log('[VideoUpload] XHR response:', xhr.status, xhr.responseText?.substring(0, 200));
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('[VideoUpload] XHR error:', e);
          reject(new Error('Network error during upload — is the server running?'));
        });
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        console.log('[VideoUpload] Starting upload to', `${SERVER_URL}/api/videos/upload`);
        xhr.open('POST', `${SERVER_URL}/api/videos/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      // Success — build the full URL
      const storageUrl = result.video.storage_url;
      const videoUrl = storageUrl.startsWith('http')
        ? storageUrl
        : `${SERVER_URL}${storageUrl}`;
      console.log('[VideoUpload] Upload success, video URL:', videoUrl);
      onVideoLoaded(videoUrl);
      addToast(`Uploaded: ${file.name}`, 'success');
    } catch (err) {
      console.error('[VideoUpload] Upload error:', err);
      if (err.message !== 'Upload cancelled') {
        addToast(err.message || 'Upload failed', 'error');
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setFileName('');
      abortRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [roomId, onVideoLoaded, addToast]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  }, [uploadFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      addToast('Upload cancelled', 'warning');
    }
  };

  // ── Uploading state ──────────────────────────────────────
  if (uploading) {
    return (
      <div style={{
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1rem',
        background: 'var(--color-surface-800)',
        border: '1px solid color-mix(in srgb, var(--color-rose-500) 30%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <FilmStrip size={15} color="var(--color-rose-400)" />
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {fileName}
            </span>
          </div>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
            title="Cancel upload"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          width: '100%',
          background: 'var(--color-surface-700)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-rose-500), var(--color-rose-400))',
              borderRadius: '9999px',
              transition: 'width 200ms ease-out',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Uploading…</span>
          <span style={{ color: 'var(--color-rose-400)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
        </div>
      </div>
    );
  }

  // ── Default state ────────────────────────────────────────
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mkv,.mov,.avi,.m4v"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '1px dashed color-mix(in srgb, white 12%, transparent)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          background: 'color-mix(in srgb, var(--color-surface-800) 50%, transparent)',
          transition: 'border-color 150ms, background 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-rose-500) 40%, transparent)';
          e.currentTarget.style.background = 'color-mix(in srgb, var(--color-surface-800) 80%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, white 12%, transparent)';
          e.currentTarget.style.background = 'color-mix(in srgb, var(--color-surface-800) 50%, transparent)';
        }}
      >
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: 'color-mix(in srgb, var(--color-rose-500) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-rose-500) 20%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CloudArrowUp size={16} color="var(--color-rose-400)" weight="duotone" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', margin: 0 }}>
            <span style={{ color: 'var(--color-rose-400)', fontWeight: 600 }}>Click to upload</span> or drag & drop video
          </p>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            MP4, WebM, MKV, MOV — Max 3GB
          </span>
        </div>
      </div>
    </div>
  );
}
