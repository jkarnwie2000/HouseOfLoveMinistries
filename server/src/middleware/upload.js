import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
    cb(null, env.uploadDir);
  },
  filename(_req, file, cb) {
    // Never trust the client file name.
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED[file.mimetype]}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED[file.mimetype]) return cb(badRequest('Please upload a JPG, PNG, WebP or AVIF image.'));
    cb(null, true);
  },
});

/** Confirms the saved file really starts with an image signature (not just a spoofed MIME type). */
export function verifyImageSignature(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const hex = buf.toString('hex');
  return (
    hex.startsWith('ffd8ff') || // jpeg
    hex.startsWith('89504e47') || // png
    (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') ||
    buf.toString('ascii', 4, 12).startsWith('ftypavi') // avif
  );
}
