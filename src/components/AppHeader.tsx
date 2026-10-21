import React from 'react';
import {
  Search,
  Bell,
  Sun,
  User,
  Shield,
  Calendar,
  Plus,
  Printer
} from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';

interface AppHeaderProps {
  onOpenTargetModal: () => void;
  onOpenExportModal?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenTargetModal,
  onOpenExportModal
}) => {
  const {
    userRole,
    setUserRole,
    allMembers,
    activeMemberId,
    setActiveMemberId,
    member,
    activeSheetId,
    setActiveSheetId,
    allSheets,
    createNewWeeklyCycle
  } = usePestCure();

  const memberInitials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Left Side: Page Title & Welcome Subtitle matching reference */}
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Performance
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Welcome back, {member.name.split(' ')[0]}
          </p>
        </div>

        {/* Center: Search Bar & Period Selector */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, address, client..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50/80 hover:bg-stone-100/80 focus:bg-white border border-stone-200/80 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
            />
          </div>

          {/* Review Cycle Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 shrink-0 text-xs text-stone-700">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={activeSheetId}
              onChange={(e) => setActiveSheetId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer pr-1"
              title="Select review cycle"
            >
              {allSheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cycleLabel} {s.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Quick Action Icons, Member Switcher & Profile Card */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export / Print Icon Button */}
          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Print / Export Review Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Minimal Sun / Theme Icon */}
          <button
            type="button"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Theme Settings"
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* Minimal Bell Notification with dot */}
          <div className="relative">
            <button
              type="button"
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="w-2 h-2 rounded-full bg-[#ea580c] absolute top-1.5 right-1.5 ring-2 ring-white" />
          </div>

          <div className="h-5 w-px bg-stone-200 mx-1 hidden sm:block" />

          {/* Employee Switcher */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={activeMemberId}
              onChange={(e) => setActiveMemberId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer pr-1"
              title="Switch employee sheet"
            >
              {allMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department})
                </option>
              ))}
            </select>
          </div>

          {/* User Profile Avatar Pill matching screenshot "HS Tech Support Admin" */}
          <div className="flex items-center gap-2 pl-1.5 py-1 pr-2.5 rounded-xl hover:bg-stone-50 border border-stone-200/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {memberInitials}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <div className="text-xs font-bold text-stone-900">
                {member.name}
              </div>
              <div className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
                <span>{userRole === 'admin' ? 'Admin' : 'Member'}</span>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => setUserRole(userRole === 'admin' ? 'member' : 'admin')}
                  className="text-[#ea580c] hover:underline font-semibold cursor-pointer"
                  title="Toggle Admin / Member Role"
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

