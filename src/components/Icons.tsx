interface P {
  size?: number;
  className?: string;
}

const base = (size?: number) => ({
  width: size ?? 16,
  height: size ?? 16,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconLogo = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#101b21" stroke="#27404b" />
    <path
      d="M6.5 16.5h3.6l1.8-5.4 2.8 10.4 2.3-7.4 1.5 2.4h7"
      stroke="#ffb454"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPlay = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4.5v15l12-7.5L7 4.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReset = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

export const IconShuffle = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="m4 4 5 5" />
  </svg>
);

export const IconColumns = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4" width="7.5" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="7.5" height="16" rx="1.5" />
  </svg>
);

export const IconZap = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
  </svg>
);

export const IconHash = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 3 7 21M17 3l-2 18M3.5 8.5h17M3 15.5h17" />
  </svg>
);

export const IconClock = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconGauge = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 19a10 10 0 1 1 16 0" />
    <path d="m12 13 4.5-4.5" />
    <circle cx="12" cy="13" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconText = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 6h16M4 12h10M4 18h14" />
  </svg>
);

export const IconSliders = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
    <circle cx="16" cy="8" r="2.2" />
    <circle cx="10" cy="16" r="2.2" />
  </svg>
);
