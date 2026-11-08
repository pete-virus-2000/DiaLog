import React from 'react';
import {
  Utensils,
  TrendingUp,
  Syringe,
  Bell,
  BookOpen,
  Camera,
  Plus,
} from 'lucide-react';
import { MainTabType } from './Sidebar';
import { ActiveTimer } from '../types/diabetes';

interface BottomNavProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  activeTimers: ActiveTimer[];
  onOpenFoodModal: () => void;
  hapticEnabled?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeTimers,
  onOpenFoodModal,
  hapticEnabled,
}) => {
  const runningTimersCount = activeTimers.filter((t) => t.targetTimestamp > Date.now()).length;

  const handleTabClick = (tab: MainTabType) => {
    if (hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate?.([10]);
    }
    setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* 1. Bolus */}
        <button
          onClick={() => handleTabClick('calculator')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'calculator'
              ? 'text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className={`w-5 h-5 ${activeTab === 'calculator' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Bolus</span>
        </button>

        {/* 2. Kurve */}
        <button
          onClick={() => handleTabClick('chart')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'chart'
              ? 'text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${activeTab === 'chart' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Kurve</span>
        </button>

        {/* 3. Center Action: Camera / Food Scan */}
        <button
          onClick={() => {
            if (hapticEnabled && 'vibrate' in navigator) navigator.vibrate?.([15]);
            onOpenFoodModal();
          }}
          className="flex flex-col items-center justify-center -mt-5 p-3 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-black shadow-lg shadow-teal-500/30 active:scale-95 transition-transform"
          title="Nahrung erfassen (Foto/Barcode)"
          aria-label="Foto & Barcode Scanner"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* 4. Basal-Pen */}
        <button
          onClick={() => handleTabClick('basal' as MainTabType)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === ('basal' as MainTabType)
              ? 'text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Syringe className={`w-5 h-5 ${activeTab === ('basal' as MainTabType) ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Basal-Pen</span>
        </button>

        {/* 5. Tagebuch */}
        <button
          onClick={() => handleTabClick('diary')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
            activeTab === 'diary'
              ? 'text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'diary' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Tagebuch</span>
          {runningTimersCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>
    </nav>
  );
};
