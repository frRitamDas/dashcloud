export function SiteBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      <div className="absolute inset-0 bg-[#05060a]" />
      <div
        className="absolute left-1/2 top-[-38vh] h-[78vh] w-[112vw] -translate-x-1/2 opacity-[0.5]"
        style={{ background: 'radial-gradient(closest-side, rgba(109,92,255,0.22), rgba(109,92,255,0.05) 55%, transparent 78%)' }}
      />
      <div
        className="absolute right-[-18vw] top-[22vh] h-[54vh] w-[54vw] opacity-[0.4]"
        style={{ background: 'radial-gradient(closest-side, rgba(34,211,238,0.14), transparent 72%)' }}
      />
      <div
        className="absolute left-[-16vw] bottom-[-12vh] h-[52vh] w-[52vw] opacity-[0.42]"
        style={{ background: 'radial-gradient(closest-side, rgba(251,113,133,0.1), transparent 72%)' }}
      />
      <div className="absolute inset-0 grid-bg opacity-[0.32] mask-fade-b" />
      <div className="noise" />
    </div>
  );
}
