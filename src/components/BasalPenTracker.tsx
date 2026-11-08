import React, { useState } from 'react';
import {
  Syringe,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  RotateCcw,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BasalLogEntry,
  InjectionSite,
  UserDiabetesProfile,
} from '../types/diabetes';
import {
  getNextRecommendedBasalSite,
  INJECTION_SITE_LABELS,
} from '../utils/diabetesCalculations';
import { playSuccessChime } from '../utils/audioAlert';

interface BasalPenTrackerProps {
  basalLog: BasalLogEntry[];
  onAddBasalEntry: (entry: BasalLogEntry) => void;
  profile: UserDiabetesProfile;
  onUpdateProfile: (updated: UserDiabetesProfile) => void;
}

export const BasalPenTracker: React.FC<BasalPenTrackerProps> = ({
  basalLog,
  onAddBasalEntry,
  profile,
  onUpdateProfile,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  // Find if basal was injected today
  const todaysBasal = basalLog.find((b) => b.dateStr === todayStr);

  // States
  const [units, setUnits] = useState<number>(profile.defaultBasalUnits || 18);
  const [selectedSite, setSelectedSite] = useState<InjectionSite>(
    getNextRecommendedBasalSite(profile.lastBasalSite)
  );
  const [notes, setNotes] = useState('');

  const nextRecommendedSite = getNextRecommendedBasalSite(profile.lastBasalSite);

  const handleInjectBasal = () => {
    // Haptic vibration on Galaxy S26 Ultra
    if (profile.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]);
    }

    const newEntry: BasalLogEntry = {
      id: `basal-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: todayStr,
      timeStr: currentTimeStr,
      units,
      brand: profile.basalPenBrand || 'Tresiba Pen',
      injectionSite: selectedSite,
      notes: notes.trim() || undefined,
    };

    onAddBasalEntry(newEntry);

    // Update last basal site in profile
    const updatedProfile: UserDiabetesProfile = {
      ...profile,
      lastBasalSite: selectedSite,
    };
    onUpdateProfile(updatedProfile);

    // Audio & Confetti
    playSuccessChime();
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#14b8a6', '#3b82f6'],
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Banner: Status Heute */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Syringe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Basal-Pen Tracker (Langzeitinsulin)
              </h2>
              <p className="text-xs text-slate-400">
                Optimiert für Pen-Therapie (Tresiba, Lantus, Toujeo, Levemir)
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
            {profile.basalPenBrand}
          </span>
        </div>

        {/* Big Today Status Hero */}
        {todaysBasal ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/30 border border-emerald-500/40 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                  Heute bereits gespritzt
                </span>
                <div className="text-lg font-black text-white">
                  {todaysBasal.units} IE um {todaysBasal.timeStr} Uhr
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Einstichstelle:{' '}
                  <span className="text-emerald-300 font-medium">
                    {todaysBasal.injectionSite
                      ? INJECTION_SITE_LABELS[todaysBasal.injectionSite]?.label
                      : 'Oberschenkel'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Erledigt ✓
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-950 border-2 border-amber-500/50 space-y-3 shadow-lg shadow-amber-950/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                  Status für heute ({new Date().toLocaleDateString('de-DE')}):
                </span>
                <div className="text-lg font-black text-white">
                  Heute noch NICHT als gespritzt markiert!
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Geplante Zielzeit: ca. {profile.defaultBasalTime || '22:00'} Uhr
                </div>
              </div>
            </div>

            {/* Quick Injection Action Card */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Dosis (Pen-Einheiten):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="80"
                    value={units}
                    onChange={(e) => setUnits(parseInt(e.target.value) || profile.defaultBasalUnits)}
                    className="w-24 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-black text-lg text-teal-300 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-400">IE</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Injektionsstelle:</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value as InjectionSite)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="thigh_left">Oberschenkel links</option>
                  <option value="thigh_right">Oberschenkel rechts</option>
                  <option value="buttock_left">Gesäß links</option>
                  <option value="buttock_right">Gesäß rechts</option>
                </select>
                <span className="text-[10px] text-teal-400 mt-0.5 block">
                  Empfehlung: {INJECTION_SITE_LABELS[nextRecommendedSite]?.label}
                </span>
              </div>

              <div className="sm:self-end">
                <button
                  type="button"
                  onClick={handleInjectBasal}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Jetzt {units} IE bestätigen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spritzstellen-Navigator & Lipodystrophie-Schutz */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Injektionsstellen-Rotation</h3>
              <p className="text-xs text-slate-400">Verhindert Verhärtungen &amp; Spritzhügel</p>
            </div>
          </div>
          <span className="text-xs text-teal-400 font-semibold">
            Nächste Empfehlung: {INJECTION_SITE_LABELS[nextRecommendedSite]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          {[
            { id: 'thigh_left' as InjectionSite, label: 'Oberschenkel links', type: 'Basal (langsam)' },
            { id: 'thigh_right' as InjectionSite, label: 'Oberschenkel rechts', type: 'Basal (langsam)' },
            { id: 'buttock_left' as InjectionSite, label: 'Gesäß links', type: 'Verzögert' },
            { id: 'buttock_right' as InjectionSite, label: 'Gesäß rechts', type: 'Verzögert' },
          ].map((site) => {
            const isLast = profile.lastBasalSite === site.id;
            const isRecommended = nextRecommendedSite === site.id;

            return (
              <div
                key={site.id}
                className={`p-3 rounded-xl border transition-all ${
                  isLast
                    ? 'bg-slate-950/80 border-slate-700 text-slate-400'
                    : isRecommended
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-bold">{site.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{site.type}</div>
                {isLast && (
                  <span className="text-[10px] text-slate-500 block mt-1">Zuletzt gespritzt</span>
                )}
                {isRecommended && (
                  <span className="text-[10px] text-teal-400 font-bold block mt-1">
                    ★ Nächste Spritzstelle
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historie der letzten 7 Tage */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center justify-between">
          <span>Basal-Historie (letzte Tage)</span>
          <span className="text-xs text-slate-400">{basalLog.length} Einträge</span>
        </h3>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {basalLog.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 font-bold">
                  {entry.units} IE
                </div>
                <div>
                  <div className="font-bold text-white">
                    {new Date(entry.timestamp).toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    um {entry.timeStr} Uhr
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {entry.brand} •{' '}
                    {entry.injectionSite ? INJECTION_SITE_LABELS[entry.injectionSite]?.label : 'Oberschenkel'}
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-emerald-400 font-semibold">
                Gespritzt ✓
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
