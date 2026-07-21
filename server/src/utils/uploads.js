const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const { config } = require('../config');
const {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
} = require('../constants');
const { createHttpError } = require('./normalize');

function ensureUploadDir() {
  fs.mkdirSync(config.uploadPath, { recursive: true });
}

function extensionOf(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ext;
}

function hasUnsafeName(filename) {
  if (!filename) return true;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return true;
  // Reject double extensions like file.pdf.exe
  const parts = filename.split('.');
  if (parts.length > 2) {
    const last = `.${parts[parts.length - 1].toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.has(last)) return true;
  }
  return false;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureUploadDir();
      cb(null, config.uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename(_req, file, cb) {
    const ext = extensionOf(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = extensionOf(file.originalname);
  if (hasUnsafeName(file.originalname)) {
    return cb(createHttpError(400, 'Unsafe filename rejected.', 'INVALID_FILENAME'));
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(createHttpError(400, `File type ${ext || '(none)'} is not allowed.`, 'INVALID_FILE_TYPE'));
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(createHttpError(400, `MIME type ${file.mimetype} is not allowed.`, 'INVALID_FILE_TYPE'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_FILES,
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

function mapUploadedFiles(files = []) {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_UPLOAD_BYTES) {
    throw createHttpError(
      400,
      `Total upload size exceeds ${Math.round(MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024))} MB.`,
      'UPLOAD_TOO_LARGE'
    );
  }

  return files.map((file) => ({
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    absolutePath: file.path,
  }));
}

function removeFiles(files = []) {
  for (const file of files) {
    const target = file.absolutePath || (file.storedName ? path.join(config.uploadPath, file.storedName) : null);
    if (!target) continue;
    try {
      if (fs.existsSync(target)) fs.unlinkSync(target);
    } catch (error) {
      console.error('Failed to remove upload:', target, error.message);
    }
  }
}

module.exports = {
  upload,
  mapUploadedFiles,
  removeFiles,
  ensureUploadDir,
};
