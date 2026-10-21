export type CycleDayKey = 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'mon';

export const CYCLE_DAYS_ORDER: CycleDayKey[] = ['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon'];

export const DAY_METADATA: Record<CycleDayKey, { label: string; full: string; dayIndex: number }> = {
  tue: { label: 'Tue', full: 'Tuesday', dayIndex: 2 },
  wed: { label: 'Wed', full: 'Wednesday', dayIndex: 3 },
  thu: { label: 'Thu', full: 'Thursday', dayIndex: 4 },
  fri: { label: 'Fri', full: 'Friday', dayIndex: 5 },
  sat: { label: 'Sat', full: 'Saturday', dayIndex: 6 },
  sun: { label: 'Sun', full: 'Sunday', dayIndex: 0 },
  mon: { label: 'Mon', full: 'Monday', dayIndex: 1 }
};

/**
 * Get current day of week key based on real browser/system date.
 */
export function getCurrentDayKey(): CycleDayKey {
  const dayNum = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const map: Record<number, CycleDayKey> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat'
  };
  return map[dayNum] || 'wed';
}

export type DayEntryState = 
  | 'today_active'      // Today: Open for data entry
  | 'past_completed'   // Past day: filled (>0) and recorded
  | 'past_missed'      // Past day: missed (=0) and frozen
  | 'future_locked'    // Future day: locked until the day arrives
  | 'admin_unlocked';  // Unlocked manually by admin

/**
 * Compute the freeze/edit state for a given day in the weekly review sheet.
 */
export function computeDayEntryState(
  dayKey: CycleDayKey,
  value: number,
  isExplicitlyLocked: boolean,
  isExplicitlyUnlocked: boolean,
  userRole: 'admin' | 'member',
  simulatedTodayKey?: CycleDayKey
): {
  state: DayEntryState;
  isEditable: boolean;
  statusLabel: string;
  badgeClass: string;
} {
  const currentTodayKey = simulatedTodayKey || getCurrentDayKey();
  const currentIdx = CYCLE_DAYS_ORDER.indexOf(currentTodayKey);
  const targetIdx = CYCLE_DAYS_ORDER.indexOf(dayKey);

  // Admin always has edit rights unless explicitly locked
  if (userRole === 'admin') {
    if (isExplicitlyLocked) {
      return {
        state: 'past_completed',
        isEditable: false,
        statusLabel: 'Locked',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300'
      };
    }
    return {
      state: 'admin_unlocked',
      isEditable: true,
      statusLabel: targetIdx === currentIdx ? 'Today (Admin)' : 'Admin Editable',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  // If Admin granted an unlock for this specific item/day
  if (isExplicitlyUnlocked) {
    return {
      state: 'admin_unlocked',
      isEditable: true,
      statusLabel: 'Unlocked by Admin',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
    };
  }

  // If explicitly locked
  if (isExplicitlyLocked) {
    return {
      state: 'past_completed',
      isEditable: false,
      statusLabel: 'Saved & Locked',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  }

  // 1. TODAY: Open for entry
  if (targetIdx === currentIdx) {
    return {
      state: 'today_active',
      isEditable: true,
      statusLabel: 'Today (Active)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-extrabold'
    };
  }

  // 2. PAST DAYS:
  if (targetIdx < currentIdx) {
    if (value > 0) {
      return {
        state: 'past_completed',
        isEditable: false,
        statusLabel: 'Recorded',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    } else {
      // Unfilled past day = FROZEN & MISSED
      return {
        state: 'past_missed',
        isEditable: false,
        statusLabel: 'Frozen (Missed Day)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
      };
    }
  }

  // 3. FUTURE DAYS:
  return {
    state: 'future_locked',
    isEditable: false,
    statusLabel: 'Upcoming (Locked)',
    badgeClass: 'bg-slate-50 text-slate-400 border-slate-200'
  };
}
