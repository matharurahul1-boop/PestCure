import React from 'react';
import {
  FileSpreadsheet,
  CalendarCheck,
  BarChart3,
  Target,
  History,
  Printer,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Clock,
  Plus,
  Users,
  UserPlus
} from 'lucide-react';
import { PestCureLogo } from './PestCureLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { usePestCure, ActiveNavView } from '../context/PestCureContext';

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenTargetModal: () => void;
  onOpenExportModal: () => void;
  onOpenNewUserModal?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  setCollapsed,
  onOpenTargetModal,
  onOpenExportModal,
  onOpenNewUserModal
}) => {
  const {
    activeView,
    setActiveView,
    userRole,
    setUserRole,
    member,
    allMembers,
    activeMemberId,
    setActiveMemberId,
    overdueDailyEntries
  } = usePestCure();

  // Pest Cure Operations Navigation Items
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
      icon: FileSpreadsheet
    },
    {
      id: 'daily-tracker',
      label: 'Daily Task & Calling',
      icon: CalendarCheck
    },
    {
      id: 'missed-logs',
      label: 'Overdue & Missed Days',
      icon: Clock,
      badge: overdueDailyEntries.length > 0 ? `${overdueDailyEntries.length}` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      id: 'target-management',
      label: 'Target Baselines & Approval',
      icon: Target,
      adminOnly: true
    },
    {
      id: 'analytics-filter',
      label: 'Period & Date Analytics',
      icon: BarChart3,
      adminOnly: true
    },
    {
      id: 'audit-logs',
      label: 'Target Audit Logs',
      icon: History,
      adminOnly: true
    }
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (userRole === 'member' && item.adminOnly) return false;
    return true;
  });

  return (
    <aside
      id="app-main-sidebar"
      className={`relative bg-[#141416] text-stone-300 border-r border-[#26262a] flex flex-col justify-between shrink-0 transition-all duration-300 select-none z-40 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Floating Orange Collapse/Expand Toggle Button on sidebar edge */}
      <button
        type="button"
        id="sidebar-collapse-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center shadow-md shadow-black/40 transition-transform duration-200 hover:scale-110 cursor-pointer z-50 border-2 border-[#141416]"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </button>

      {/* Top Section: Logo, Employee Switcher & Quick Action */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#26262a]/60">
          <PestCureLogo collapsed={collapsed} />
        </div>

        {/* Employee Switcher */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 px-1">
              Active Employee Sheet
            </label>
            <div className="relative">
              <select
                value={activeMemberId}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="w-full bg-[#1c1c20] hover:bg-[#232328] border border-[#2c2c32] text-stone-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none"
              >
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#1c1c20] text-stone-100 py-1">
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
              <Users className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {onOpenNewUserModal && (
              <button
                type="button"
                onClick={onOpenNewUserModal}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 text-[11px] font-bold transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New User Review Form</span>
              </button>
            )}
          </div>
        )}

        {collapsed && onOpenNewUserModal && (
          <div className="p-2 flex justify-center">
            <button
              type="button"
              onClick={onOpenNewUserModal}
              className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 transition-all cursor-pointer"
              title="Create Review Form for New Employee"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Operations Navigation Menu */}
        <nav className="px-2 pt-2 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#27272a] text-[#f97316] font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-[#1e1e22]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#f97316]' : 'text-stone-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded border ${
                          item.badgeColor || 'bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: PWA Install, Role Toggle & Print Export */}
      <div className="p-3 border-t border-[#26262a]/80 space-y-2">
        {/* PWA Install Button */}
        {!collapsed ? (
          <PWAInstallButton className="w-full py-2 px-3 text-xs" variant="primary" />
        ) : (
          <PWAInstallButton className="w-full p-2.5" variant="primary" showLabel={false} />
        )}

        {/* Export / Print Button */}
        <button
          type="button"
          onClick={onOpenExportModal}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#1c1c20] hover:bg-[#242429] border border-[#2c2c32] text-stone-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer ${
            collapsed ? 'p-2.5' : 'py-2 px-3'
          }`}
          title="Print / Export Review Sheet"
        >
          <Printer className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {!collapsed && <span>Print / Export Sheet</span>}
        </button>

        {/* Role Switcher Pill */}
        {!collapsed ? (
          <div className="flex items-center justify-between bg-[#1a1a1e] border border-[#27272c] rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setUserRole('member')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                userRole === 'member'
                  ? 'bg-[#27272a] text-[#f97316] font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
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
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setUserRole(userRole === 'admin' ? 'member' : 'admin')}
            className="w-full p-2.5 rounded-xl bg-[#1c1c20] text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
            title={`Role: ${userRole === 'admin' ? 'Admin' : 'Member'} (Click to toggle)`}
          >
            {userRole === 'admin' ? (
              <Shield className="w-4 h-4 text-amber-400" />
            ) : (
              <User className="w-4 h-4 text-stone-400" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

