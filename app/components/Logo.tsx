'use client'

export function BlackbirdLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Hummingbird SVG */}
      <svg
        viewBox="0 0 200 200"
        className="w-16 h-16 dark:drop-shadow-[0_0_15px_rgba(212,165,116,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hummingbird outline */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Body */}
          <ellipse cx="100" cy="110" rx="16" ry="24" className="text-primary dark:text-accent fill-primary/10 dark:fill-accent/10" />
          
          {/* Head */}
          <circle cx="100" cy="80" r="12" className="text-primary dark:text-accent" />
          
          {/* Beak */}
          <line x1="109" y1="80" x2="125" y2="75" />
          
          {/* Eye */}
          <circle cx="104" cy="77" r="2" fill="currentColor" />
          
          {/* Wing 1 - upper */}
          <path d="M 92 95 Q 70 85 65 105 Q 68 108 85 100" className="text-primary dark:text-accent" />
          
          {/* Wing 2 - lower */}
          <path d="M 92 115 Q 68 125 70 145 Q 75 142 90 130" className="text-primary dark:text-accent" />
          
          {/* Tail feathers */}
          <path d="M 85 130 Q 80 145 75 155" />
          <path d="M 100 135 Q 100 150 98 160" />
          <path d="M 115 130 Q 120 145 125 155" />
        </g>
      </svg>

      {/* Text Logo */}
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-wider text-primary dark:text-accent">
          BLACKBIRD
        </h1>
        <p className="text-xs font-light tracking-[0.15em] text-muted-foreground dark:text-muted-foreground">
          TATTOO & ART STUDIO
        </p>
      </div>
    </div>
  )
}

export function BlackbirdLogoSmall({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 50 50"
        className="w-8 h-8 dark:drop-shadow-[0_0_10px_rgba(212,165,116,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="25" cy="27" rx="4" ry="6" className="text-primary dark:text-accent fill-primary/10 dark:fill-accent/10" />
          <circle cx="25" cy="20" r="3" className="text-primary dark:text-accent" />
          <line x1="27" y1="20" x2="31" y2="18" />
          <circle cx="26" cy="19" r="0.5" fill="currentColor" />
          <path d="M 23 23 Q 18 20 16 26 Q 18 27 21 24" className="text-primary dark:text-accent" />
          <path d="M 23 29 Q 18 31 19 36 Q 22 35 23 32" className="text-primary dark:text-accent" />
        </g>
      </svg>
      <span className="font-bold text-sm tracking-wide text-primary dark:text-accent">BB</span>
    </div>
  )
}
