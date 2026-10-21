import React from 'react';

interface PestCureLogoProps {
  className?: string;
  showSubtitle?: boolean;
  collapsed?: boolean;
}

export const PestCureLogo: React.FC<PestCureLogoProps> = ({
  className = '',
  showSubtitle = true,
  collapsed = false
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Shield Logo from provided image */}
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/pestcure-logo.png"
          alt="Pest Cure Logo"
          className="h-10 w-auto object-contain drop-shadow-sm"
        />
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white leading-tight font-sans">
              Pest Cure
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[11px] text-stone-400 font-medium tracking-tight truncate">
              Operations & Performance
            </span>
          )}
        </div>
      )}
    </div>
  );
};

