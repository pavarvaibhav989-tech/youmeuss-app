import { useRef, useCallback, useState } from 'react';
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

    if (file.size > 2 * 1024 * 1024 * 1024) {
      addToast('File too large. Maximum size is 2GB.', 'error');
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
      // Cloudinary returns a full https:// URL; disk storage returns a relative path
      const storageUrl = result.video.storage_url;
      const videoUrl = storageUrl.startsWith('http')
        ? storageUrl
        : `${SERVER_URL}${storageUrl}`;
      console.log('[VideoUpload] Upload success, video URL:', videoUrl);
      onVideoLoaded(videoUrl);
      addToast(`✅ Uploaded: ${file.name}`, 'success');
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
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [roomId, onVideoLoaded, addToast]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    console.log('[VideoUpload] handleFileSelect triggered, file:', file?.name);
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
      <div className="flex flex-col gap-3 w-full">
        <div className="border-2 border-dashed border-brand-500/40 rounded-xl p-5 text-center bg-surface-700/20">
          <div className="text-sm text-text-primary font-medium mb-1 truncate max-w-full">
            📤 Uploading: {fileName}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-600 rounded-full overflow-hidden mt-3 mb-2">
            <div
              className="h-full gradient-brand rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-400 font-mono">{progress}%</span>
            <button
              onClick={handleCancel}
              className="text-red-400 hover:text-red-300 cursor-pointer bg-transparent border-none text-xs underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Default state ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mkv,.mov,.avi,.m4v"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="group border-2 border-dashed border-surface-400/30 hover:border-brand-500/50
                   rounded-xl p-6 text-center cursor-pointer transition-all duration-300
                   hover:bg-surface-700/30"
      >
        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">🎬</div>
        <p className="text-sm text-text-secondary">
          <span className="text-brand-400 font-medium">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-text-muted mt-1">MP4, WebM, MKV, MOV — Max 2GB</p>
      </div>
    </div>
  );
}
