import { useId } from 'react';
import { hashString, makeRandom, shade, withAlpha } from '@/lib/utils';

/**
 * Procedural cover artwork.
 *
 * Every game gets a deterministic, GPU-cheap SVG composition built from its
 * accent colour + genre, so the catalogue always looks designed and nothing
 * depends on third-party image hosts. If `cover_url` is set (e.g. an image you
 * upload to Supabase Storage from the admin panel) that is used instead.
 */

type Motif = 'city' | 'blocks' | 'grid' | 'burst' | 'peaks' | 'waves' | 'orbit' | 'tiles';

function motifFor(genre: string, seed: number): Motif {
  const g = genre.toLowerCase();
  if (['open-world', 'racing', 'sports'].includes(g)) return 'city';
  if (['sandbox', 'simulation'].includes(g)) return 'blocks';
  if (['shooter', 'battle-royale'].includes(g)) return 'burst';
  if (['horror', 'action'].includes(g)) return 'peaks';
  if (['rpg'].includes(g)) return 'orbit';
  if (['puzzle'].includes(g)) return 'tiles';
  if (['party'].includes(g)) return 'waves';
  return (['grid', 'waves', 'city', 'peaks'][seed % 4] as Motif) ?? 'grid';
}

export function GameArt({
  slug,
  title,
  genre,
  accent,
  coverUrl,
  className,
  rounded = true,
}: {
  slug: string;
  title: string;
  genre: string;
  accent: string;
  coverUrl?: string | null;
  className?: string;
  rounded?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const seed = hashString(slug || title);
  const rand = makeRandom(seed);
  const motif = motifFor(genre, seed);
  const dark = shade(accent, -0.42);
  const light = shade(accent, 0.24);

  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={title}
        className={`${className ?? ''} h-full w-full object-cover ${rounded ? 'rounded-xl2' : ''}`}
        loading="lazy"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={`${className ?? ''} h-full w-full ${rounded ? 'rounded-xl2' : ''}`}
      role="img"
      aria-label={`${title} cover artwork`}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={shade(accent, -0.26)} />
          <stop offset="48%" stopColor={dark} />
          <stop offset="100%" stopColor="#07080e" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.24" r="0.72">
          <stop offset="0%" stopColor={withAlpha(light, 0.55)} />
          <stop offset="100%" stopColor={withAlpha(light, 0)} />
        </radialGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="52%" stopColor="#05060a" stopOpacity="0" />
          <stop offset="100%" stopColor="#05060a" stopOpacity="0.92" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect width="300" height="400" rx={rounded ? 22 : 0} />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect width="300" height="400" fill={`url(#bg-${uid})`} />
        <rect width="300" height="400" fill={`url(#glow-${uid})`} />

        {motif === 'city' && (
          <g opacity="0.85">
            {Array.from({ length: 16 }).map((_, i) => {
              const w = 12 + rand() * 20;
              const h = 70 + rand() * 190;
              const x = i * 19 - 4;
              return (
                <g key={i}>
                  <rect x={x} y={400 - h} width={w} height={h} fill="#05060a" opacity={0.55 + rand() * 0.3} />
                  <rect x={x} y={400 - h} width={w} height={2} fill={withAlpha(light, 0.5)} />
                  {Array.from({ length: Math.floor(h / 22) }).map((__, j) =>
                    rand() > 0.55 ? (
                      <rect
                        key={j}
                        x={x + 3 + (j % 2) * (w / 2)}
                        y={400 - h + 10 + j * 20}
                        width={w / 3}
                        height={5}
                        fill={withAlpha(light, 0.22 + rand() * 0.4)}
                      />
                    ) : null,
                  )}
                </g>
              );
            })}
            <path d="M0 330 L300 250" stroke={withAlpha('#ffffff', 0.14)} strokeWidth="1.5" />
            <path d="M0 360 L300 300" stroke={withAlpha('#ffffff', 0.08)} strokeWidth="1.5" />
          </g>
        )}

        {motif === 'blocks' && (
          <g opacity="0.9">
            {Array.from({ length: 34 }).map((_, i) => {
              const s = 26 + rand() * 16;
              const x = (i % 6) * 52 - 12 + rand() * 12;
              const y = 150 + Math.floor(i / 6) * 46 + rand() * 10;
              const c = rand() > 0.6 ? light : dark;
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <path d={`M0 0 L${s / 2} ${-s / 4} L${s} 0 L${s / 2} ${s / 4} Z`} fill={withAlpha(c, 0.6)} />
                  <path d={`M0 0 L${s / 2} ${s / 4} L${s / 2} ${s / 4 + s * 0.7} L0 ${s * 0.7} Z`} fill={withAlpha('#000000', 0.42)} />
                  <path d={`M${s} 0 L${s / 2} ${s / 4} L${s / 2} ${s / 4 + s * 0.7} L${s} ${s * 0.7} Z`} fill={withAlpha(c, 0.28)} />
                </g>
              );
            })}
          </g>
        )}

        {motif === 'grid' && (
          <g opacity="0.75">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={140 + i * 22} x2="300" y2={140 + i * 22} stroke={withAlpha(light, 0.18 - i * 0.011)} strokeWidth="1" />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={150 + (i - 6) * 9}
                y1="140"
                x2={150 + (i - 6) * 46}
                y2="400"
                stroke={withAlpha(light, 0.16)}
                strokeWidth="1"
              />
            ))}
            <circle cx="150" cy="140" r="46" fill="none" stroke={withAlpha(light, 0.5)} strokeWidth="1.5" />
            <circle cx="150" cy="140" r="86" fill="none" stroke={withAlpha(light, 0.24)} strokeWidth="1" />
          </g>
        )}

        {motif === 'burst' && (
          <g opacity="0.8" transform="translate(150 190)">
            {Array.from({ length: 26 }).map((_, i) => {
              const a = (i / 26) * Math.PI * 2;
              const r1 = 40 + rand() * 16;
              const r2 = 120 + rand() * 90;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * r1}
                  y1={Math.sin(a) * r1}
                  x2={Math.cos(a) * r2}
                  y2={Math.sin(a) * r2}
                  stroke={withAlpha(i % 3 === 0 ? '#ffffff' : light, 0.14 + rand() * 0.22)}
                  strokeWidth={i % 4 === 0 ? 2 : 1}
                />
              );
            })}
            <circle r="34" fill="none" stroke={withAlpha('#ffffff', 0.5)} strokeWidth="1.6" />
            <circle r="5.5" fill={withAlpha(light, 0.95)} />
          </g>
        )}

        {motif === 'peaks' && (
          <g opacity="0.9">
            {Array.from({ length: 4 }).map((_, layer) => {
              const yBase = 250 + layer * 34;
              const pts = Array.from({ length: 7 })
                .map((__, i) => `${i * 52 - 10},${yBase - (30 + rand() * (110 - layer * 22))}`)
                .join(' ');
              return (
                <polygon
                  key={layer}
                  points={`-10,400 ${pts} 310,400`}
                  fill={withAlpha(layer % 2 ? '#05060a' : dark, 0.5 + layer * 0.13)}
                  stroke={withAlpha(light, 0.16)}
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {motif === 'waves' && (
          <g opacity="0.8">
            {Array.from({ length: 9 }).map((_, i) => (
              <path
                key={i}
                d={`M-20 ${170 + i * 26} Q 75 ${130 + i * 26 + (i % 2 ? 28 : -18)}, 150 ${170 + i * 26} T 320 ${170 + i * 26}`}
                fill="none"
                stroke={withAlpha(i % 2 ? light : '#ffffff', 0.28 - i * 0.02)}
                strokeWidth={i % 3 === 0 ? 2 : 1}
              />
            ))}
          </g>
        )}

        {motif === 'orbit' && (
          <g opacity="0.85" transform="translate(150 195)">
            {Array.from({ length: 5 }).map((_, i) => (
              <ellipse
                key={i}
                rx={54 + i * 26}
                ry={(54 + i * 26) * 0.36}
                fill="none"
                stroke={withAlpha(light, 0.3 - i * 0.045)}
                strokeWidth="1.2"
                transform={`rotate(${-24 + i * 9})`}
              />
            ))}
            <circle r="30" fill={withAlpha(dark, 0.9)} stroke={withAlpha(light, 0.55)} strokeWidth="1.4" />
            <circle r="10" fill={withAlpha(light, 0.75)} />
            {Array.from({ length: 5 }).map((_, i) => {
              const a = rand() * Math.PI * 2;
              const r = 60 + i * 24;
              return <circle key={`p${i}`} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.36} r="3.4" fill={withAlpha('#ffffff', 0.75)} />;
            })}
          </g>
        )}

        {motif === 'tiles' && (
          <g opacity="0.9" transform="translate(46 150)">
            {Array.from({ length: 16 }).map((_, i) => {
              const x = (i % 4) * 54;
              const y = Math.floor(i / 4) * 54;
              const on = rand() > 0.35;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="46"
                  height="46"
                  rx="9"
                  fill={on ? withAlpha(shade(accent, rand() * 0.3 - 0.15), 0.42 + rand() * 0.35) : withAlpha('#ffffff', 0.05)}
                  stroke={withAlpha('#ffffff', on ? 0.2 : 0.08)}
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        <rect width="300" height="400" fill={`url(#sheen-${uid})`} />
        <rect width="300" height="400" fill={`url(#fade-${uid})`} />
      </g>
    </svg>
  );
}

/** Wide banner variant used on game detail pages. */
export function GameBanner({
  slug,
  title,
  genre,
  accent,
  bannerUrl,
  className,
}: {
  slug: string;
  title: string;
  genre: string;
  accent: string;
  bannerUrl?: string | null;
  className?: string;
}) {
  if (bannerUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={bannerUrl} alt={title} className={`${className ?? ''} h-full w-full object-cover`} loading="lazy" />
    );
  }
  return (
    <div role="img" aria-label={`${title} ${genre} banner artwork`} data-game-slug={slug} className={`${className ?? ''} relative h-full w-full overflow-hidden`} style={{ background: `linear-gradient(115deg, ${shade(accent, -0.3)}, #07080e 62%)` }}>
      <div className="absolute inset-0 grid-bg opacity-[0.5]" />
      <div
        className="absolute -left-24 top-[-40%] h-[130%] w-[60%] rotate-[14deg] blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${withAlpha(accent, 0.5)}, transparent)` }}
      />
      <div
        className="absolute right-[-10%] bottom-[-50%] h-[120%] w-[55%] blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${withAlpha(shade(accent, 0.1), 0.34)}, transparent)` }}
      />
      <div className="noise" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,6,10,0.94), rgba(5,6,10,0.25) 46%, rgba(5,6,10,0.55))' }} />
    </div>
  );
}
