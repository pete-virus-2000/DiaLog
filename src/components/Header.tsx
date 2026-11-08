import React from 'react';
import {
  Activity,
  Bell,
  Clock,
  Menu,
  Moon,
  Settings,
  ShieldAlert,
  Sun,
  TrendingUp,
  Smartphone,
} from 'lucide-react';
import { ActiveTimer, AppTheme, GlucoseUnit, UserDiabetesProfile } from '../types/diabetes';
import { MainTabType } from './Sidebar';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: MainTabType;
  activeTimers: ActiveTimer[];
  iob: number;
  glucoseUnit: GlucoseUnit;
  profile: UserDiabetesProfile;
  onUpdateTheme: (theme: AppTheme) => void;
  onOpenHypoModal: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeTab,
  activeTimers,
  iob,
  glucoseUnit,
  profile,
  onUpdateTheme,
  onOpenHypoModal,
  onOpenSettings,
}) => {
  const runningTimersCount = activeTimers.filter((t) => t.targetTimestamp > Date.now()).length;

  const tabTitles: Record<MainTabType, string> = {
    calculator: 'Bolus & Mahlzeit',
    food_guide: 'Mahlzeiten-Spickzettel',
    chart: 'Libre 3 Verlauf & Kurve',
    basal: 'Basal-Pen Tracker',
    timers: 'Erinnerungen & Timer',
    factors: 'Faktor-Korrektur',
    diary: 'Tagebuch & Export',
    fpe: 'FPE-Rechner',
    favorites: 'Meine Mahlzeiten',
    emergency: 'Notfall-Ausweis',
    settings: 'Einstellungen & Optik',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5">
        {/* Left: Sidebar Toggle & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors shrink-0"
            title="Seitenleiste ein-/ausblenden"
            aria-label="Menü öffnen"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white hidden xs:inline">
                DiaLog
              </span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="text-xs sm:text-sm font-bold text-teal-400 truncate">
                {tabTitles[activeTab]}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Badges & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {iob > 0 && (
            <div
              title="Aktives Insulin (Insulin on Board) aus früheren Injektionen"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>IOB: {iob} IE</span>
            </div>
          )}

          {runningTimersCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
            >
              <Clock className="w-3 h-3 text-amber-400 animate-spin-slow" />
              <span>{runningTimersCount} aktiv</span>
            </div>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Quick theme toggle */}
          <button
            onClick={() => onUpdateTheme(profile.theme === 'oled' ? 'dark' : profile.theme === 'dark' ? 'light' : 'oled')}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={`Aktuelles Theme: ${profile.theme} (Klicken zum Wechseln)`}
          >
            {profile.theme === 'light' ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : profile.theme === 'oled' ? (
              <Sun className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Hypo Emergency Button */}
          <button
            onClick={onOpenHypoModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all text-xs font-bold shadow-sm"
            title="Hypoglykämie Soforthilfe (15/15-Regel)"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Hypo-Hilfe</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Einstellungen, Pen &amp; Libre 3"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
