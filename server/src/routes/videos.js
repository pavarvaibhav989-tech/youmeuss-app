import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryOne, runSql } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'videos');

const router = Router();

// ─── Cloudinary setup (optional) ─────────────────────────────────────────────
// Only initialise if all three env vars are set; otherwise fall back to disk.
const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
let cloudinaryStorage = null;

if (USE_CLOUDINARY) {
  // Dynamic import so the server still starts even if the package isn't installed yet
  try {
    const { v2 } = await import('cloudinary');
    const { CloudinaryStorage } = await import('multer-storage-cloudinary');

    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    cloudinary = v2;

    cloudinaryStorage = new CloudinaryStorage({
      cloudinary: v2,
      params: {
        resource_type: 'video',
        folder: 'youmeuss',
        // Keep original filename but strip extension (Cloudinary adds it)
        public_id: (req, file) => uuidv4(),
        // Allow large uploads
        chunk_size: 6000000,
      },
    });

    console.log('☁️  Cloudinary storage enabled');
  } catch (e) {
    console.warn('⚠️  Cloudinary packages not installed. Falling back to disk storage.');
    console.warn('   Run: npm install cloudinary multer-storage-cloudinary');
  }
} else {
  console.log('💾  Local disk storage for uploads (set CLOUDINARY_* env vars to use cloud storage)');
}

// ─── Multer storage ───────────────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.wmv'];

const upload = multer({
  storage: (USE_CLOUDINARY && cloudinaryStorage) ? cloudinaryStorage : diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type "${file.mimetype}". Allowed: MP4, WebM, MKV, MOV`));
  },
});

// ─── Helper: get the public URL for the uploaded file ────────────────────────
function getVideoUrl(req, file) {
  if (USE_CLOUDINARY && cloudinaryStorage && file.path) {
    // Cloudinary returns the secure URL in file.path
    return file.path;
  }
  // Disk: return a path relative to the server — the client prepends VITE_API_URL
  return `/uploads/videos/${file.filename}`;
}

/**
 * POST /api/videos/upload
 */
router.post('/upload', authenticate, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 2GB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { roomId } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      const id = uuidv4();
      const storage_url = getVideoUrl(req, req.file);

      runSql(
        'INSERT INTO videos (id, room_id, uploaded_by, storage_url, original_name) VALUES (?, ?, ?, ?, ?)',
        [id, roomId, req.user.id, storage_url, req.file.originalname]
      );

      const video = queryOne('SELECT * FROM videos WHERE id = ?', [id]);

      console.log(`📹 Video uploaded: ${req.file.originalname} → ${storage_url}`);
      res.status(201).json({ video });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/**
 * GET /api/videos/:id
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const video = queryOne('SELECT * FROM videos WHERE id = ?', [req.params.id]);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video });
  } catch (err) {
    console.error('Get video error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
