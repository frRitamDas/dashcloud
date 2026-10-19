const INTERNAL_ORIGIN = 'https://dashcloud.internal';

/**
 * Only accept same-origin relative destinations from user-controlled query
 * parameters. This blocks protocol-relative and external redirect targets.
 */
export function safeInternalPath(value: string | null | undefined, fallback = '/profile'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;

  try {
    const parsed = new URL(value, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
