import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-stone-900/95 text-white px-4 py-2.5 text-xs font-semibold shadow-xl border border-stone-800 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Changes saved locally and will sync when reconnected.</span>
    </div>
  );
};
