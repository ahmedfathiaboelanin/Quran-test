interface BrandMarkProps {
  className?: string;
}

/** A mihrab-framed open book with an eight-point gilded star. */
export function BrandMark({ className = 'h-11 w-11' }: BrandMarkProps) {
  return (
    <span
      className={`relative inline-grid place-items-center overflow-hidden rounded-xl border border-amber-500/45 bg-[#12352b] shadow-[0_6px_18px_-8px_rgba(18,53,43,0.7)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
        <rect
          x="4.75"
          y="4.75"
          width="38.5"
          height="38.5"
          rx="3.5"
          stroke="#d8b46a"
          strokeOpacity="0.34"
          strokeWidth="0.8"
        />
        <path
          d="M24 7.2l1.85 4.75 4.75 1.85-4.75 1.85L24 20.4l-1.85-4.75-4.75-1.85 4.75-1.85L24 7.2Z"
          fill="#d8b46a"
        />
        <path
          d="M24 21.4c-3.1-1.9-7.1-2.35-11-1.3v15.2c3.9-1.05 7.9-0.6 11 1.3 3.1-1.9 7.1-2.35 11-1.3V20.1c-3.9-1.05-7.9-0.6-11 1.3Z"
          fill="#f7efdc"
          fillOpacity="0.94"
        />
        <path
          d="M24 21.4v15.2"
          stroke="#1f5442"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M17.2 25.6c2.2-0.55 4.4-0.4 6.2 0.5M30.8 25.6c-2.2-0.55-4.4-0.4-6.2 0.5"
          stroke="#b3832e"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </span>
  );
}
