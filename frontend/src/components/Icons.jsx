export function Icon({ name, size = 24, className = '' }) {
  const lineProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
    focusable: 'false',
  }

  switch (name) {
    case 'search':
      return (
        <svg {...lineProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...lineProps}>
          <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'new-chat':
      return (
        <svg {...lineProps}>
          <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
          <path d="m16.5 3.5 4 4L12 16H8v-4z" />
        </svg>
      )
    case 'info':
      return (
        <svg {...lineProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'back':
      return (
        <svg {...lineProps}>
          <path d="M20 12H5" />
          <path d="m11 6-6 6 6 6" />
        </svg>
      )
    case 'smiley':
      return (
        <svg {...lineProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
          <circle cx="9" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...lineProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'send':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.2 2-12.2 2z" />
        </svg>
      )
    case 'checks':
      return (
        <svg {...lineProps} strokeWidth="2.2">
          <path d="m2 12.5 4 4L14 8" />
          <path d="m10 16.5 1 1L21 7.5" />
        </svg>
      )
    case 'document':
      return (
        <svg {...lineProps}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
      )
    case 'download':
      return (
        <svg {...lineProps}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...lineProps}>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      )
    case 'close':
      return (
        <svg {...lineProps}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )
    case 'trace':
      return (
        <svg {...lineProps}>
          <path d="M3 12h4l2.5-6 4 12L16 12h5" />
          <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="21" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...lineProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'terminal':
      return (
        <svg {...lineProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m7 9 3 3-3 3" />
          <path d="M13 15h4" />
        </svg>
      )
    case 'database':
      return (
        <svg {...lineProps}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...lineProps}>
          <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
          <path d="M19 15.5 19.7 18l2.3.8-2.3.7-.7 2.5-.7-2.5-2.3-.7 2.3-.8z" />
          <path d="M5 16v3" />
          <path d="M3.5 17.5h3" />
        </svg>
      )
    default:
      return null
  }
}
