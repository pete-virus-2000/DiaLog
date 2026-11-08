import React from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  IdCard,
  Moon,
  PieChart,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
  Star,
  Sun,
  Utensils,
  X,
  Zap,
  TrendingUp,
  Syringe,
} from 'lucide-react';
import { ActiveTimer, AppTheme, UserDiabetesProfile } from '../types/diabetes';

export type MainTabType =
  | 'calculator'
  | 'chart'
  | 'food_guide'
  | 'basal'
  | 'timers'
  | 'factors'
  | 'diary'
  | 'fpe'
  | 'favorites'
  | 'emergency'
  | 'settings';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  activeTimers: ActiveTimer[];
  iob: number;
  profile: UserDiabetesProfile;
  onUpdateTheme: (theme: AppTheme) => void;
  onOpenHypoModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  setActiveTab,
  activeTimers,
  iob,
  profile,
  onUpdateTheme,
  onOpenHypoModal,
}) => {
  const runningTimersCount = activeTimers.filter((t) => t.targetTimestamp > Date.now()).length;

  const navItems = [
    {
      id: 'calculator' as MainTabType,
      label: 'Bolus & Mahlzeit',
      icon: Utensils,
      badge: null,
      desc: 'Insulin- & Mahlzeitenrechner',
    },
    {
      id: 'food_guide' as MainTabType,
      label: 'Mahlzeiten-Spickzettel',
      icon: BookOpen,
      badge: 'Spickzettel',
      desc: 'Döner, Pizza, Asia, Panade & Co.',
    },
    {
      id: 'chart' as MainTabType,
      label: 'BZ-Verlauf & Kurve',
      icon: TrendingUp,
      badge: 'Libre 3',
      desc: 'Tageskurve & TIR-Zielbereich',
    },
    {
      id: 'basal' as MainTabType,
      label: 'Basal-Pen Tracker',
      icon: Syringe,
      badge: 'Pen',
      desc: 'Langzeitinsulin & Spritzstellen',
    },
    {
      id: 'timers' as MainTabType,
      label: 'Erinnerungen & Timer',
      icon: Bell,
      badge: runningTimersCount > 0 ? `${runningTimersCount}` : null,
      desc: 'Mess- & SEA-Timer',
    },
    {
      id: 'factors' as MainTabType,
      label: 'Faktor-Korrektur',
      icon: Sliders,
      badge: null,
      desc: 'Insulin-Kohlenhydrat-Verhältnis',
    },
    {
      id: 'diary' as MainTabType,
      label: 'Tagebuch & Export',
      icon: BookOpen,
      badge: null,
      desc: 'LibreView Import, CSV & Log',
    },
    {
      id: 'fpe' as MainTabType,
      label: 'FPE-Rechner',
      icon: PieChart,
      badge: 'Fett/Eiweiß',
      desc: 'Warschauer Formel für Pizza & Co.',
    },
    {
      id: 'favorites' as MainTabType,
      label: 'Mahlzeiten-Vorlagen',
      icon: Star,
      badge: null,
      desc: 'Gespeicherte Lieblingsessen',
    },
    {
      id: 'emergency' as MainTabType,
      label: 'Notfall-Ausweis',
      icon: IdCard,
      badge: null,
      desc: 'Ersthelfer-Pass & ICE-Kontakt',
    },
    {
      id: 'settings' as MainTabType,
      label: 'Einstellungen & Optik',
      icon: Settings,
      badge: null,
      desc: 'Pen-Schritte, Themes & Profil',
    },
  ];

  const handleSelectTab = (tab: MainTabType) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl shrink-0">
              <Activity className="w-6 h-6 text-slate-950" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white">DiaLog</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    Typ 1
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Freestyle Libre 3 &amp; Pen Suite
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isOpen ? 'Seitenleiste einklappen' : 'Seitenleiste ausklappen'}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 hidden lg:block" />}
            <span className="lg:hidden">
              <X className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Live IOB & Emergency Status Card */}
        {isOpen && (
          <div className="px-3 pt-3 space-y-2 shrink-0">
            {iob > 0 && (
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="font-semibold">Aktives Insulin (IOB)</span>
                </div>
                <span className="font-black text-cyan-300 text-sm">{iob} IE</span>
              </div>
            )}

            <button
              onClick={onOpenHypoModal}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Hypo-Soforthilfe</span>
              </div>
              <span className="text-[10px] bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
                15/15
              </span>
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />

                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isActive
                              ? 'bg-slate-950 text-teal-300'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] block truncate ${
                        isActive ? 'text-slate-900/80 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Quick Theme Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          {isOpen ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Theme:</span>
                <span className="font-semibold text-teal-400 capitalize">{profile.theme}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['dark', 'light', 'oled', 'ocean'] as AppTheme[]).map((thm) => (
                  <button
                    key={thm}
                    type="button"
                    onClick={() => onUpdateTheme(thm)}
                    className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-all ${
                      profile.theme === thm
                        ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {thm === 'dark' ? 'Dark' : thm === 'light' ? 'Light' : thm === 'oled' ? 'OLED' : 'Ozean'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => onUpdateTheme(profile.theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Theme wechseln"
            >
              {profile.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
