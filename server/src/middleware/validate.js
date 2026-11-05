import { badRequest } from '../utils/errors.js';

/** Validates req[source] with a zod schema and stores the parsed result on req.validated. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(badRequest(details[0]?.message || 'Please check the form and try again.', details));
  }
  req.validated = result.data;
  next();
};
