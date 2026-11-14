import { useId } from 'react'

export default function BotAvatar({ size = 49, online = false, className = '' }) {
  const id = useId().replace(/:/g, '')
  const gradiente = `bot-gradient-${id}`

  return (
    <span
      className={`avatar bot-avatar ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" role="img" aria-label="Chatbot LLM">
        <defs>
          <linearGradient id={gradiente} x1="8" y1="4" x2="56" y2="60">
            <stop offset="0" stopColor="#25d366" />
            <stop offset="0.55" stopColor="#00a884" />
            <stop offset="1" stopColor="#007a63" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill={`url(#${gradiente})`} />
        <path
          d="M32 13v5"
          stroke="#e7fff8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="32" cy="11" r="2.5" fill="#e7fff8" />
        <rect
          x="15"
          y="21"
          width="34"
          height="27"
          rx="8"
          fill="#f5fffc"
        />
        <rect x="11" y="28" width="4" height="10" rx="2" fill="#d8fff3" />
        <rect x="49" y="28" width="4" height="10" rx="2" fill="#d8fff3" />
        <circle cx="25.5" cy="32.5" r="2.6" fill="#008069" />
        <circle cx="38.5" cy="32.5" r="2.6" fill="#008069" />
        <path
          d="M26 39.5c1.7 1.7 4 2.6 6 2.6s4.3-.9 6-2.6"
          fill="none"
          stroke="#008069"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {online && <span className="online-dot" />}
    </span>
  )
}
