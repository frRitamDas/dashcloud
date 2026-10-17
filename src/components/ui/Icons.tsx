import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
  </svg>
);
export const IconPause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6" y="4.5" width="4" height="15" rx="1.3" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.3" />
  </svg>
);
export const IconGamepad = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 8h11a4.5 4.5 0 0 1 4.4 3.6l.8 4A3 3 0 0 1 19.8 19c-1 0-1.6-.5-2.3-1.3l-1-1.2H7.5l-1 1.2C5.8 18.5 5.2 19 4.2 19a3 3 0 0 1-2.9-3.4l.8-4A4.5 4.5 0 0 1 6.5 8Z" />
    <path d="M8 12v2.5M6.75 13.25h2.5M15.5 12.6h.01M17.6 14.4h.01" />
  </svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M13.5 2 4.8 13.1c-.4.5 0 1.3.7 1.3h4.2l-1.2 7.2c-.1.8.9 1.2 1.4.6l8.7-11.1c.4-.5 0-1.3-.7-1.3h-4.2l1.2-7.2c.1-.8-.9-1.2-1.4-.6Z" />
  </svg>
);
export const IconCloud = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.3 9.2 4.4 4.4 0 0 1 17 18H7Z" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3Z" />
    <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 19.2a6.4 6.4 0 0 1 12.4 0M16.2 5.2a3.2 3.2 0 0 1 0 6M18 19.2a6.4 6.4 0 0 0-1.6-4.2" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 9l7 7 7-7" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.6l2.7 5.7 6.2.9-4.5 4.4 1.1 6.2L12 16.9 6.5 19.8l1.1-6.2L3.1 9.2l6.2-.9L12 2.6Z" />
  </svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.4-4.5-7.4-9.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.4 3.1C19.4 15.5 12 20 12 20Z" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 15H2.5a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.1 9.4l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 2.9 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 11h.1a2 2 0 1 1 0 4h-.09Z" />
  </svg>
);
export const IconActivity = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h4l2.5-7 5 14L17 12h4" />
  </svg>
);
export const IconServer = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01" />
  </svg>
);
export const IconTrophy = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5.5A2.5 2.5 0 0 0 8 9.5M16 5h2.5A2.5 2.5 0 0 1 16 9.5M10 13h4M9.5 20h5M12 13v7" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h11" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14.5v2.5" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12M10 11v6M14 11v6" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 18a8.5 8.5 0 1 1 16 0" />
    <path d="M12 14.5l3.6-4" />
    <circle cx="12" cy="15.4" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconWifi = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 9.5a14 14 0 0 1 19 0M6 13a9 9 0 0 1 12 0M9.4 16.4a4 4 0 0 1 5.2 0" />
    <circle cx="12" cy="19.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </svg>
);
export const IconCpu = (p: P) => (
  <svg {...base(p)}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    <rect x="9.8" y="9.8" width="4.4" height="4.4" rx="1" />
    <path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21" />
  </svg>
);
export const IconSparkles = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6L12 3.5Z" />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2ZM5 4l.6 1.5L7 6l-1.4.6L5 8l-.6-1.4L3 6l1.4-.5L5 4Z" />
  </svg>
);
export const IconFilter = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 6h17M6.5 12h11M10 18h4" />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z" />
    <path d="M10.2 19a2 2 0 0 0 3.6 0" />
  </svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-8.5 8.5M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 0 0-13.7-5.1L4 8M4 13a8 8 0 0 0 13.7 5.1L20 16" />
    <path d="M4 4v4h4M20 20v-4h-4" />
  </svg>
);
export const IconExpand = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
  </svg>
);
export const IconVolume = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3L11 6v12l-4-3.5H4v-5Z" />
    <path d="M14.5 9.5a3.5 3.5 0 0 1 0 5M17 7a7 7 0 0 1 0 10" />
  </svg>
);
export const IconMute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3L11 6v12l-4-3.5H4v-5Z" />
    <path d="M15 10l4 4M19 10l-4 4" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
    <path d="M3.8 7l7.2 5.4a1.6 1.6 0 0 0 2 0L20.2 7" />
  </svg>
);
export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);
export const IconCoins = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="9" cy="7" rx="5.5" ry="2.6" />
    <path d="M3.5 7v4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V7M9 13.6v3.4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4c0-1.1-1.5-2-3.5-2.4" />
    <ellipse cx="14.5" cy="10.6" rx="5.5" ry="2.6" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M8 11l4 4 4-4M4.5 19.5h15" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8h.01" />
  </svg>
);
export const IconWarning = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.2l8.5 15H3.5l8.5-15Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5l8.5 4.3-8.5 4.4-8.5-4.4L12 3.5Z" />
    <path d="M3.5 12.2l8.5 4.4 8.5-4.4M3.5 16.4l8.5 4.4 8.5-4.4" />
  </svg>
);
export const IconKey = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9M17.5 12v3M20 12v2.2" />
  </svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);
export const IconTicket = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v1.6a2 2 0 0 0 0 3.8v1.6A1.5 1.5 0 0 1 19 17H5a1.5 1.5 0 0 1-1.5-1.5v-1.6a2 2 0 0 0 0-3.8V8.5Z" />
    <path d="M14 7v2M14 11v2M14 15v2" />
  </svg>
);
export const IconIndia = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.6 9.5h16.8M3.6 14.5h16.8" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
export const IconShare = (p: P) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5.5" r="2.8" />
    <circle cx="6" cy="12" r="2.8" />
    <circle cx="18" cy="18.5" r="2.8" />
    <path d="M8.5 10.7l7-3.9M8.5 13.3l7 3.9" />
  </svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4.5l16 15" />
    <path d="M9.6 6.3A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.6 3.4" />
    <path d="M6.4 8.1A16.6 16.6 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.1-.5" />
    <path d="M10.2 10.4a2.6 2.6 0 0 0 3.5 3.6" />
  </svg>
);
export const IconDashboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.2" y="3.2" width="7.4" height="9" rx="1.6" />
    <rect x="13.4" y="3.2" width="7.4" height="5.4" rx="1.6" />
    <rect x="13.4" y="11.4" width="7.4" height="9.4" rx="1.6" />
    <rect x="3.2" y="15" width="7.4" height="5.8" rx="1.6" />
  </svg>
);
export const IconBan = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M6.2 6.2l11.6 11.6" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2.2" />
    <path d="M15.5 6.2A2.2 2.2 0 0 0 13.3 4H6.2A2.2 2.2 0 0 0 4 6.2v7.1a2.2 2.2 0 0 0 2.2 2.2" />
  </svg>
);
export const IconSave = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 4h10.2L20 8.3v11.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-14A1.5 1.5 0 0 1 5.5 4Z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </svg>
);
