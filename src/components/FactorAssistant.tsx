import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Save,
  RotateCcw,
} from 'lucide-react';
import { UserDiabetesProfile, TimeSlotFactors } from '../types/diabetes';
import { calculateFactorAdjustment } from '../utils/diabetesCalculations';

interface FactorAssistantProps {
  profile: UserDiabetesProfile;
  onUpdateProfile: (updated: UserDiabetesProfile) => void;
}

export const FactorAssistant: React.FC<FactorAssistantProps> = ({
  profile,
  onUpdateProfile,
}) => {
  // Assistant inputs
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'noon' | 'evening' | 'night'>('morning');
  const [preMealBZ, setPreMealBZ] = useState<string>('110');
  const [postMealBZ, setPostMealBZ] = useState<string>('190');
  const [carbsConsumed, setCarbsConsumed] = useState<string>('4.0');
  const [injectedInsulin, setInjectedInsulin] = useState<string>('6.0');
  const [hasAppliedSuccess, setHasAppliedSuccess] = useState(false);

  // Manual Profile Factors Edit state
  const [factorsState, setFactorsState] = useState({ ...profile.factors });
  const [correctionFactor, setCorrectionFactor] = useState(profile.correctionFactor);
  const [targetGlucose, setTargetGlucose] = useState(profile.targetGlucose);
  const [hasSavedManual, setHasSavedManual] = useState(false);

  // Current slot info
  const slotData = profile.factors[selectedSlot];

  // Run adjustment math
  const numPre = parseFloat(preMealBZ) || profile.targetGlucose;
  const numPost = parseFloat(postMealBZ) || 0;
  const numCarbs = parseFloat(carbsConsumed) || 0;
  const numInjected = parseFloat(injectedInsulin) || 0;

  const carbUnitLabel = profile.carbUnit === 'g_KH' ? '10g KH' : profile.carbUnit;

  const adjustment = calculateFactorAdjustment({
    preMealGlucose: numPre,
    postMealGlucose: numPost,
    targetGlucose: profile.targetGlucose,
    carbsInUnit: numCarbs,
    injectedMealInsulin: numInjected,
    currentFactor: slotData.factor,
    correctionFactor: profile.correctionFactor,
    carbUnit: profile.carbUnit,
    glucoseUnit: profile.glucoseUnit,
  });

  // Apply assistant recommendation
  const applyRecommendedFactor = () => {
    const updated: UserDiabetesProfile = {
      ...profile,
      factors: {
        ...profile.factors,
        [selectedSlot]: {
          ...profile.factors[selectedSlot],
          factor: adjustment.newRecommendedFactor,
        },
      },
    };
    onUpdateProfile(updated);
    setFactorsState(updated.factors);
    setHasAppliedSuccess(true);
    setTimeout(() => setHasAppliedSuccess(false), 3500);
  };

  // Save manual factors
  const saveManualFactors = () => {
    const updated: UserDiabetesProfile = {
      ...profile,
      factors: factorsState,
      correctionFactor,
      targetGlucose,
    };
    onUpdateProfile(updated);
    setHasSavedManual(true);
    setTimeout(() => setHasSavedManual(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* SECTION 1: Der Interaktive Korrektur-Assistent */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Faktor-Korrektur-Assistent (Insulin : Kohlenhydrate)
              </h2>
              <p className="text-xs text-slate-400">
                Passe dein Insulin-zu-Kohlenhydrat-Verhältnis an, wenn dein Blutzucker nach Mahlzeiten abweicht
              </p>
            </div>
          </div>
        </div>

        {/* Slot selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Für welche Tageszeit möchtest du das Verhältnis korrigieren?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(['morning', 'noon', 'evening', 'night'] as const).map((slotKey) => {
              const item = profile.factors[slotKey];
              const isSelected = selectedSlot === slotKey;
              return (
                <button
                  key={slotKey}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slotKey);
                    setHasAppliedSuccess(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="text-white font-semibold">{item.name}</div>
                  <div className="text-[11px] text-teal-400 mt-1">
                    {item.factor} IE / {carbUnitLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs for assistant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-slate-400 font-medium">1. BZ vor der Mahlzeit:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={preMealBZ}
                onChange={(e) => setPreMealBZ(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-slate-400 font-bold">{profile.glucoseUnit}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-slate-400 font-medium">2. Gegessene Kohlenhydrate:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={carbsConsumed}
                onChange={(e) => setCarbsConsumed(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-slate-400 font-bold">{carbUnitLabel}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-slate-400 font-medium">3. Gespitzte Einheiten (IE):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={injectedInsulin}
                onChange={(e) => setInjectedInsulin(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-slate-400 font-bold">IE</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <label className="text-slate-400 font-medium">4. BZ 2–3 Stunden nach Mahlzeit:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={postMealBZ}
                onChange={(e) => setPostMealBZ(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-slate-400 font-bold">{profile.glucoseUnit}</span>
            </div>
          </div>
        </div>

        {/* Calculation Result & Recommendation Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Analyse &amp; Empfehlung
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Aktueller Faktor:</span>
              <span className="font-bold text-white">
                {adjustment.oldFactor} IE / {carbUnitLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Neuer empfohlener Faktor:</div>
              <div className="text-2xl font-black text-teal-300 mt-0.5">
                {adjustment.newRecommendedFactor} IE / {carbUnitLabel}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adjustment.adjustmentPercentage > 0 ? (
                <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{adjustment.adjustmentPercentage}%</span>
                </div>
              ) : adjustment.adjustmentPercentage < 0 ? (
                <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{adjustment.adjustmentPercentage}%</span>
                </div>
              ) : (
                <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Optimal
                </div>
              )}

              <button
                type="button"
                onClick={applyRecommendedFactor}
                disabled={adjustment.newRecommendedFactor === adjustment.oldFactor}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Für '{profile.factors[selectedSlot].name}' übernehmen</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {adjustment.explanation}
          </p>

          {hasAppliedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Der neue Faktor wurde erfolgreich in dein Profil übernommen!</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Direkte Übersicht & Feineinstellung aller Faktoren */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Profil-Faktoren Übersicht</h3>
              <p className="text-xs text-slate-400">
                Passe alle 4 Tageszeiten und den Korrekturfaktor manuell an
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={saveManualFactors}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Faktoren speichern</span>
          </button>
        </div>

        {hasSavedManual && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Alle Faktoren wurden gespeichert.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(['morning', 'noon', 'evening', 'night'] as const).map((key) => {
            const item = factorsState[key];
            return (
              <div key={key} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <span className="text-slate-400 text-[11px]">
                    {item.startHour}:00 - {item.endHour}:00 Uhr
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Faktor:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={item.factor}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || item.factor;
                        setFactorsState((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], factor: val },
                        }));
                      }}
                      className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-teal-400 text-sm focus:outline-none"
                    />
                    <span className="text-slate-400 font-semibold">IE / {carbUnitLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Korrekturfaktor & Zielwert */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Korrekturfaktor (ISF)</div>
              <div className="text-[11px] text-slate-400">1 IE senkt den BZ um:</div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step={profile.glucoseUnit === 'mg/dl' ? 5 : 0.2}
                min="1"
                value={correctionFactor}
                onChange={(e) => setCorrectionFactor(parseFloat(e.target.value) || 40)}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-amber-400 text-sm focus:outline-none"
              />
              <span className="text-slate-400 font-semibold">{profile.glucoseUnit}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Ziel-Blutzucker</div>
              <div className="text-[11px] text-slate-400">Gewünschter Richtwert:</div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step={profile.glucoseUnit === 'mg/dl' ? 5 : 0.2}
                min="50"
                value={targetGlucose}
                onChange={(e) => setTargetGlucose(parseFloat(e.target.value) || 100)}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-emerald-400 text-sm focus:outline-none"
              />
              <span className="text-slate-400 font-semibold">{profile.glucoseUnit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
