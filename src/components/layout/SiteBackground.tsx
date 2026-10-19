/**
 * A deliberately quiet canvas for the product UI.
 * The visual identity is carried by typography, spacing and content rather
 * than permanent GPU-heavy gradients or decorative motion.
 */
export function SiteBackground() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[var(--bg)]" />;
}
