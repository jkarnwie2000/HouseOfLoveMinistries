import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

// On Vercel (BLOB_READ_WRITE_TOKEN set) files are kept in memory and sent to
// Vercel Blob, because serverless functions have no persistent disk.
export const useBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const uploadFileName = (mimetype) =>
  `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED[mimetype]}`;

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
    cb(null, env.uploadDir);
  },
  filename(_req, file, cb) {
    // Never trust the client file name.
    cb(null, uploadFileName(file.mimetype));
  },
});

export const imageUpload = multer({
  storage: useBlobStorage() ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED[file.mimetype]) return cb(badRequest('Please upload a JPG, PNG, WebP or AVIF image.'));
    cb(null, true);
  },
});

/** Confirms the saved file really starts with an image signature (not just a spoofed MIME type). */
export function verifyImageSignature(fileOrBuffer) {
  let buf = Buffer.alloc(12);
  if (Buffer.isBuffer(fileOrBuffer)) {
    buf = Buffer.concat([fileOrBuffer.subarray(0, 12), buf]).subarray(0, 12);
  } else {
    const fd = fs.openSync(fileOrBuffer, 'r');
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
  }
  const hex = buf.toString('hex');
  return (
    hex.startsWith('ffd8ff') || // jpeg
    hex.startsWith('89504e47') || // png
    (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') ||
    buf.toString('ascii', 4, 12).startsWith('ftypavi') // avif
  );
}
