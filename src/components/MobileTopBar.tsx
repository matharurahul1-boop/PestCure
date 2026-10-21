import React from 'react';
import { Menu, Shield, User, Users } from 'lucide-react';
import { usePestCure } from '../context/PestCureContext';
import { PestCureLogo } from './PestCureLogo';

interface MobileTopBarProps {
  onOpenMenu: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenMenu }) => {
  const {
    activeMemberId,
    setActiveMemberId,
    allMembers,
    userRole,
    setUserRole,
    member
  } = usePestCure();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <PestCureLogo collapsed={true} />
        <div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
            Pest<span className="text-orange-600">Cure</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium leading-none block">
            Ops Sheet
          </span>
        </div>
      </div>

      {/* Member Switcher & Menu */}
      <div className="flex items-center gap-1.5">
        {/* Quick Member Switcher */}
        <div className="relative">
          <select
            value={activeMemberId}
            onChange={(e) => setActiveMemberId(e.target.value)}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80 rounded-xl pl-2.5 pr-6 py-1.5 appearance-none focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.split(' ')[0]} ({m.role.includes('Executive') ? 'CC' : m.role.includes('Tender') ? 'Tenders' : 'BD'})
              </option>
            ))}
          </select>
          <Users className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Role toggle button */}
        <button
          type="button"
          onClick={() => setUserRole(userRole === 'admin' ? 'member' : 'admin')}
          className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
            userRole === 'admin'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title={`Switch Role (Current: ${userRole})`}
        >
          {userRole === 'admin' ? (
            <Shield className="w-4 h-4 text-amber-600" />
          ) : (
            <User className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Menu Hamburger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer ml-0.5"
          aria-label="Open Menu"
        >
          <Menu className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};
