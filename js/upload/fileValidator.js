// File validation
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 25 * 1024 * 1024;

export function validateFile(file) {
  if (!file) return { ok: false, error: 'No file provided' };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: `Unsupported file type: ${file.type}. Use PNG, JPG, or WEBP.` };
  if (file.size === 0) return { ok: false, error: 'File is empty' };
  if (file.size > MAX_BYTES) return { ok: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.` };
  return { ok: true };
}