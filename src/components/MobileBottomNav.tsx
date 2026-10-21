import React from 'react';
import { FileSpreadsheet, CalendarCheck, Clock, Target, Menu } from 'lucide-react';
import { usePestCure, ActiveNavView } from '../context/PestCureContext';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { activeView, setActiveView, overdueDailyEntries, userRole } = usePestCure();

  const navButtons: {
    id: ActiveNavView | 'menu';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    onClick?: () => void;
  }[] = [
    {
      id: 'weekly-sheet',
      label: 'Weekly',
      icon: FileSpreadsheet,
    },
    {
      id: 'daily-tracker',
      label: 'Daily Desk',
      icon: CalendarCheck,
    },
    {
      id: 'missed-logs',
      label: 'Overdue',
      icon: Clock,
      badge: overdueDailyEntries.length > 0 ? overdueDailyEntries.length : undefined,
    },
    {
      id: userRole === 'admin' ? 'target-management' : 'analytics-filter',
      label: userRole === 'admin' ? 'Targets' : 'Analytics',
      icon: Target,
    },
    {
      id: 'menu',
      label: 'More',
      icon: Menu,
      onClick: onOpenMenu,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 flex items-center justify-around shadow-lg pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      {navButtons.map((btn) => {
        const Icon = btn.icon;
        const isActive = activeView === btn.id;

        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => {
              if (btn.onClick) {
                btn.onClick();
              } else if (btn.id !== 'menu') {
                setActiveView(btn.id as ActiveNavView);
              }
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative flex-1 cursor-pointer ${
              isActive
                ? 'text-orange-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {btn.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-mono-code font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {btn.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{btn.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
