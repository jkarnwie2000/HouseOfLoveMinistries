import multer from 'multer';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'The requested resource was not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : 'The upload could not be processed.';
    return res.status(400).json({ error: message });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large.' });
  }
  if (err?.type?.startsWith?.('Stripe')) {
    console.error('[stripe]', err.type, err.message);
    const status = err.statusCode && err.statusCode < 500 ? 502 : 503;
    return res.status(status).json({
      error: 'We could not reach our secure payment provider. Please try again in a moment.',
    });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    error: status >= 500 && !err.expose ? 'Something went wrong on our side. Please try again.' : err.message,
    ...(err.details ? { details: err.details } : {}),
    ...(!env.isProd && status >= 500 ? { debug: err.message } : {}),
  });
}
