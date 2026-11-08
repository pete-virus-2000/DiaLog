import React, { useState } from 'react';
import { Download, Smartphone, Check, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all active:scale-95 cursor-pointer"
        title="App auf Samsung Galaxy S26 Ultra installieren"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>App installieren</span>
      </button>
    );
  }

  // Guide fallback if prompt wasn't triggered automatically by browser
  return (
    <>
      <button
        onClick={() => setShowAndroidGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors"
        title="Zum Startbildschirm hinzufügen"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installieren</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Auf Galaxy S26 Ultra installieren</span>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Für das beste Vollbild-Erlebnis wie eine native App ohne störende Browser-Adressleiste:
            </p>

            <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
              <li>
                Tippe oben rechts in Chrome / Samsung Internet auf die <strong>drei Punkte (⋮)</strong>.
              </li>
              <li>
                Wähle <strong>"App installieren"</strong> oder <strong>"Zum Startbildschirm hinzufügen"</strong>.
              </li>
              <li>
                DiaLog öffnet sich ab sofort eigenständig im echten <strong>AMOLED-Vollbildmodus</strong>!
              </li>
            </ol>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-colors mt-2"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  );
};
