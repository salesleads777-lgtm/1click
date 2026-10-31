import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Luxury Metallic Gold & Emerald Shield Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        {/* Real Gold Gradient Background with Embossed Gold Border */}
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-[2px] shadow-[0_4px_16px_rgba(217,119,6,0.28)]">
          <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center relative overflow-hidden">
            {/* Subtle inner gold foil sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-yellow-300/30" />
            
            {/* Interlocking Shield & Lightning Key in Rich Emerald & Real Gold */}
            <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 relative z-10" fill="none">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L4 5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5L12 2Z"
                fill="url(#emeraldGrad)"
                stroke="url(#goldGrad)"
                strokeWidth="1.5"
              />
              <path
                d="M13 6L9 12H13L11 18L16 11H12L13 6Z"
                fill="url(#goldGrad)"
                stroke="#ffffff"
                strokeWidth="0.6"
              />
            </svg>
          </div>
        </div>
        {/* Real Gold Pulse Dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-white shadow-sm ring-2 ring-emerald-500/30" />
      </div>

      {/* Typography: Rich Green with Real Gold Accent */}
      <div className="flex flex-col">
        <div className="flex items-center tracking-tight font-extrabold leading-none">
          <span className={`font-['Plus_Jakarta_Sans'] font-black text-emerald-950 ${textSizes[size]}`}>
            1CLICK
          </span>
          <span
            className={`font-['Plus_Jakarta_Sans'] font-black bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent ml-1 drop-shadow-sm ${textSizes[size]}`}
          >
            EXITS
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-800 to-emerald-900 text-amber-300 border border-amber-400/40">
            PRO
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-semibold text-emerald-800 tracking-wider uppercase mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Live Timeshare Exit Dispatch
          </span>
        )}
      </div>
    </div>
  );
};
