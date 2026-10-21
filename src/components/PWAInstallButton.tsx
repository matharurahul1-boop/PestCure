import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'minimal';
  showLabel?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
  showLabel = true
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, return null
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
          variant === 'primary'
            ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20'
            : variant === 'outline'
            ? 'bg-white hover:bg-orange-50 border border-orange-200 text-orange-700'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
        } ${className}`}
        title="Install PestCure App on your device"
      >
        <Download className="w-4 h-4 shrink-0" />
        {showLabel && <span>Install App</span>}
      </button>
    );
  }

  // iOS Safari flow or generic fallback
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
          variant === 'primary'
            ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20'
            : variant === 'outline'
            ? 'bg-white hover:bg-orange-50 border border-orange-200 text-orange-700'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
        } ${className}`}
        title="Install PestCure as Mobile Web App"
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        {showLabel && <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>}
      </button>

      {/* iOS Safari & Android Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Install PestCure App</h3>
                  <p className="text-xs text-stone-500">Android &amp; iOS PWA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 text-xs text-stone-700 space-y-3">
              <p className="font-semibold text-orange-950">Follow these quick steps on your phone:</p>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">On iOS (Safari):</span> Tap the <strong className="inline-flex items-center gap-1 text-orange-700 font-bold"><Share2 className="w-3.5 h-3.5 inline" /> Share</strong> button in your bottom browser toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong className="inline-flex items-center gap-1 text-orange-700 font-bold"><PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">On Android (Chrome):</span> Tap the 3-dots menu <strong className="text-stone-900">&vellip;</strong> and select <strong className="text-emerald-700 font-bold">Install App / Add to Home screen</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Launches fullscreen with zero browser bars &amp; fast offline load.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
