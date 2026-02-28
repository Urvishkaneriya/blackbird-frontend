'use client';

import Image from 'next/image';

const lightLogo = '/logo_light.png';
const darkLogo = '/logo_dark.png';

export function BlackbirdLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Image
        src={lightLogo}
        alt="Blackbird logo"
        width={105}
        height={105}
        priority
        className="block h-auto w-full max-w-[105px] object-contain dark:hidden"
      />
      <Image
        src={darkLogo}
        alt="Blackbird logo"
        width={100}
        height={100}
        priority
        className="hidden h-auto w-full max-w-[100px] object-contain dark:block"
      />

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
  );
}

export function BlackbirdLogoSmall({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={lightLogo}
        alt="Blackbird logo"
        width={44}
        height={44}
        className="h-9 w-9 object-contain dark:hidden"
      />
      <Image
        src={darkLogo}
        alt="Blackbird logo"
        width={44}
        height={44}
        className="hidden h-9 w-9 object-contain dark:block"
      />
    </div>
  );
}
