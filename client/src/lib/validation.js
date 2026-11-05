export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

/**
 * Tiny rule-based validator.
 * rules: { field: [[testFn, message], ...] }  →  returns { field: firstMessage }
 */
export function validateFields(values, rules) {
  const errors = {};
  for (const [field, checks] of Object.entries(rules)) {
    for (const [test, message] of checks) {
      if (!test(values[field], values)) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

export const required = (msg) => [(v) => String(v ?? '').trim().length > 0, msg];
export const minLen = (n, msg) => [(v) => String(v ?? '').trim().length >= n, msg];
export const email = (msg = 'Please enter a valid email address.') => [isEmail, msg];

/** Moves focus to the first invalid field in a form. */
export function focusFirstError(form) {
  requestAnimationFrame(() => form?.querySelector('[aria-invalid="true"]')?.focus());
}
