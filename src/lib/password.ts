import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const candidate = Buffer.from(hashPassword(password, salt));
  const stored = Buffer.from(hash || '');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  return { score, label: labels[score] };
}
