const icons = {
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6m-5 0v6.5L4.5 18a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9.5V3" /><path d="M7.5 15h9" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8v4H8z" /><circle cx="8" cy="14" r=".5" fill="currentColor" /><circle cx="12" cy="14" r=".5" fill="currentColor" /><circle cx="16" cy="14" r=".5" fill="currentColor" /><circle cx="8" cy="18" r=".5" fill="currentColor" /><circle cx="12" cy="18" r=".5" fill="currentColor" /><circle cx="16" cy="18" r=".5" fill="currentColor" />
    </svg>
  ),
  ruler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l4-4 14 14-4 4L2 8z" /><path d="M7.5 6.5l2 2m-1-5l2 2m1-1l2 2m1-1l2 2" />
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C22 5.8 17.5 2 12 2z" /><circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" /><circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" /><circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" /><circle cx="17" cy="11" r="1.5" fill="currentColor" />
    </svg>
  ),
  drama: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="10" r="7" /><path d="M7 8.5a.5.5 0 011 0m1 0a.5.5 0 011 0" /><path d="M6.5 12.5Q9 14.5 11.5 12.5" /><circle cx="16" cy="13" r="6" /><path d="M14.5 11.5a.5.5 0 011 0m1 0a.5.5 0 011 0" /><path d="M14 15q2-1.5 4 0" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  laptop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" /><path d="M2 20h20" />
    </svg>
  ),
  columns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h4v16H4zm6 0h4v16h-4zm6 0h4v16h-4z" />
    </svg>
  ),
  atom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  running: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="4" r="2" /><path d="M7 21l3-7 2.5 2V21m2-6l3.5-3.5-2.5-2.5L12 13l-2.5-2L7 13" />
    </svg>
  ),
  dna: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2q0 5 5 7t5 7M17 2q0 5-5 7t-5 7m0 6q0-5 5-7M17 22q0-5-5-7" /><path d="M7 8h10M7 16h10" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10m-6 10V4M6 20v-6" />
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6m-5 3h4M12 2a7 7 0 00-3 13.3V17h6v-1.7A7 7 0 0012 2z" />
    </svg>
  ),
};

export const CLASS_ICON_KEYS = Object.keys(icons);

export function ClassIcon({ name, size = 24, className = '' }) {
  const icon = icons[name] || icons.book;
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {icon}
    </span>
  );
}
