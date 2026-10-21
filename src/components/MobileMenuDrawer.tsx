import React from 'react';
import {
  X,
  FileSpreadsheet,
  CalendarCheck,
  Clock,
  Target,
  BarChart3,
  History,
  Printer,
  Shield,
  User,
  Plus,
  Users,
  CheckCircle2
} from 'lucide-react';
import { usePestCure, ActiveNavView } from '../context/PestCureContext';
import { PestCureLogo } from './PestCureLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTargetModal: () => void;
  onOpenExportModal: () => void;
  onOpenNewUserModal?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTargetModal,
  onOpenExportModal,
  onOpenNewUserModal
}) => {
  const {
    activeView,
    setActiveView,
    userRole,
    setUserRole,
    allMembers,
    activeMemberId,
    setActiveMemberId,
    overdueDailyEntries
  } = usePestCure();

  if (!isOpen) return null;

  const navItems: {
    id: ActiveNavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'weekly-sheet',
      label: 'Weekly Review Sheet',
      icon: FileSpreadsheet,
    },
    {
      id: 'daily-tracker',
      label: 'Daily Task & Calling Desk',
      icon: CalendarCheck,
    },
    {
      id: 'missed-logs',
      label: 'Overdue & Missed Days',
      icon: Clock,
      badge: overdueDailyEntries.length > 0 ? `${overdueDailyEntries.length}` : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'target-management',
      label: 'Target Baselines & Approval',
      icon: Target,
      adminOnly: true,
    },
    {
      id: 'analytics-filter',
      label: 'Period & Date Analytics',
      icon: BarChart3,
      adminOnly: true,
    },
    {
      id: 'audit-logs',
      label: 'Target Audit Logs',
      icon: History,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (userRole === 'member' && item.adminOnly) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-250">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <PestCureLogo collapsed={false} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Team Member
            </label>
            <div className="space-y-1.5">
              {allMembers.map((m) => {
                const isSelected = activeMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveMemberId(m.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-200 text-orange-950 font-bold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {m.role} &bull; {m.department}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          {onOpenNewUserModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewUserModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create New User Review Form</span>
            </button>
          )}

          {/* Navigation links */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Modules &amp; Sheets
            </label>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-orange-500 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* PWA Install Button */}
          <div className="pt-2">
            <PWAInstallButton className="w-full py-2.5 text-xs" variant="primary" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          {/* Export / Print */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenExportModal();
            }}
            className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / Export Sheet</span>
          </button>

          {/* Role switcher */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setUserRole('member')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                userRole === 'member'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Member</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole('admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                userRole === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
