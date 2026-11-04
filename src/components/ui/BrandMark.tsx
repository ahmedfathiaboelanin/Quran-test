interface BrandMarkProps {
  className?: string;
}

/** A small geometric mihrab/book mark used as the app logo. */
export function BrandMark({ className = 'h-11 w-11' }: BrandMarkProps) {
  return (
    <span
      className={`relative inline-grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-900 shadow-lg shadow-teal-900/25 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
        <path
          d="M10 13.5c4.2-1.7 8.5-1.7 13.5 0v23c-4.9-1.8-9.2-1.8-13.5 0v-23Z"
          fill="#fef3c7"
          fillOpacity="0.95"
        />
        <path
          d="M38 13.5c-4.2-1.7-8.5-1.7-13.5 0v23c4.9-1.8 9.2-1.8 13.5 0v-23Z"
          fill="#fde68a"
          fillOpacity="0.85"
        />
        <path
          d="M24 13.5v23"
          stroke="#0f766e"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M27.5 7.5a4 4 0 0 0 5.2 4.1A4.5 4.5 0 1 1 27.5 7.5Z"
          fill="#fbbf24"
        />
        <circle cx="35.2" cy="10.2" r="1.15" fill="#fef3c7" />
      </svg>
    </span>
  );
}
