import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Info,
  Minus,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Syringe,
  Timer,
  Utensils,
  Zap,
  TrendingUp,
  Flame,
  PieChart,
  MapPin,
  BellRing,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ActiveTimer,
  ActivityModifier,
  DiaryEntry,
  GlucoseTrend,
  InjectionSite,
  MealRecord,
  UserDiabetesProfile,
} from '../types/diabetes';
import {
  calculateBolus,
  carbsGramsToUnit,
  getCurrentTimeFactor,
  getActivityMultiplier,
  getNextRecommendedBolusSite,
  INJECTION_SITE_LABELS,
  roundToPenStep,
} from '../utils/diabetesCalculations';
import { playSuccessChime } from '../utils/audioAlert';
import { AIInjectionAdvisorModal } from './AIInjectionAdvisorModal';

interface BolusCalculatorProps {
  profile: UserDiabetesProfile;
  diaryEntries: DiaryEntry[];
  onAddDiaryEntry: (entry: DiaryEntry) => void;
  onAddTimer: (timer: ActiveTimer) => void;
  onOpenFoodModal: () => void;
  onOpenFPEModal: () => void;
  onOpenFavoritesModal: () => void;
  currentMeal: MealRecord | null;
  onClearMeal: () => void;
  onOpenHypoModal: () => void;
  onUpdateProfile?: (updated: UserDiabetesProfile) => void;
}

export const BolusCalculator: React.FC<BolusCalculatorProps> = ({
  profile,
  diaryEntries,
  onAddDiaryEntry,
  onAddTimer,
  onOpenFoodModal,
  onOpenFPEModal,
  onOpenFavoritesModal,
  currentMeal,
  onClearMeal,
  onOpenHypoModal,
  onUpdateProfile,
}) => {
  // Blood glucose input
  const [glucoseInput, setGlucoseInput] = useState<string>('');
  const [trend, setTrend] = useState<GlucoseTrend>('flat');
  const [activityModifier, setActivityModifier] = useState<ActivityModifier>('normal');
  const [customFactor, setCustomFactor] = useState<number | undefined>(undefined);
  const [showFactorOverride, setShowFactorOverride] = useState(false);

  // Pen Injection Site Rotation
  const nextBolusSite = getNextRecommendedBolusSite(profile.lastBolusSite);
  const [selectedSite, setSelectedSite] = useState<InjectionSite>(nextBolusSite);

  // Injected insulin input (defaults to pen-rounded recommended)
  const penStep = profile.penStep || 0.5;
  const [injectedUnits, setInjectedUnits] = useState<number>(0);
  const [hasManuallyEditedUnits, setHasManuallyEditedUnits] = useState(false);

  // Options
  const [enablePostMealTimer, setEnablePostMealTimer] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(profile.defaultMealTimerMinutes || 120);
  const [notes, setNotes] = useState('');
  const [isSplitBolus, setIsSplitBolus] = useState(false);
  const [splitImmediatePercent, setSplitImmediatePercent] = useState(60);
  const [splitDelayMinutes, setSplitDelayMinutes] = useState(90);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);

  // Auto-enable split bolus if current meal has FPE recommendation
  useEffect(() => {
    if (currentMeal?.fpe && currentMeal.fpe.fpeCount >= 1) {
      setIsSplitBolus(true);
      setSplitImmediatePercent(50);
      setSplitDelayMinutes(currentMeal.fpe.delayHours * 60);
    }
  }, [currentMeal]);

  // Parse numerical glucose
  const numGlucose = glucoseInput.trim() ? parseFloat(glucoseInput.replace(',', '.')) : undefined;

  // Active time-of-day factor
  const timeFactorInfo = getCurrentTimeFactor(profile);
  const activeFactor = customFactor !== undefined ? customFactor : timeFactorInfo.factor;

  // Total carbs from meal or manual
  const totalCarbsGrams = currentMeal ? currentMeal.totalCarbsGrams : 0;
  const carbInUnit = carbsGramsToUnit(totalCarbsGrams, profile.carbUnit, profile.gramsPerBE);

  // Calculation result
  const calcResult = calculateBolus({
    currentGlucose: numGlucose,
    totalCarbsGrams,
    profile,
    activeEntries: diaryEntries,
    customFactor,
    trend,
    activityModifier,
  });

  // Keep injected units synced to pen-rounded recommendation if user hasn't overridden it
  useEffect(() => {
    if (!hasManuallyEditedUnits) {
      setInjectedUnits(calcResult.roundedPenInsulin);
    }
  }, [calcResult.roundedPenInsulin, hasManuallyEditedUnits]);

  // Blood Glucose status color
  const getGlucoseStatusColor = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'border-slate-700 text-slate-300';
    const hypoLimit = profile.libreAlarmLow || (profile.glucoseUnit === 'mg/dl' ? 70 : 3.9);
    const hyperLimit = profile.glucoseUnit === 'mg/dl' ? 180 : 10.0;
    const veryHigh = profile.libreAlarmHigh || (profile.glucoseUnit === 'mg/dl' ? 240 : 13.3);

    if (val < hypoLimit) return 'border-rose-500 bg-rose-500/10 text-rose-300';
    if (val > veryHigh) return 'border-purple-500 bg-purple-500/10 text-purple-300';
    if (val > hyperLimit) return 'border-amber-500 bg-amber-500/10 text-amber-300';
    return 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
  };

  const stepUnits = (delta: number) => {
    if (profile.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate?.([12]);
    }
    setHasManuallyEditedUnits(true);
    setInjectedUnits((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
  };

  // Spritz-Ess-Abstand Timer starten
  const startSEATimer = (customMinutes?: number) => {
    const seaMinutes = customMinutes !== undefined ? customMinutes : (calcResult.recommendedSEA || 15);
    const timestamp = Date.now();
    const seaTimer: ActiveTimer = {
      id: `timer-sea-${timestamp}`,
      label: `🍽️ Spritz-Ess-Abstand (${seaMinutes} Min.) abgelaufen - Jetzt essen!`,
      type: 'sea_delay',
      targetTimestamp: timestamp + seaMinutes * 60 * 1000,
      totalDurationSeconds: seaMinutes * 60,
      createdAt: timestamp,
    };
    onAddTimer(seaTimer);
    if (profile.hapticFeedback && 'vibrate' in navigator) navigator.vibrate?.([20]);
  };

  // Submit injection & create diary entry + timer
  const handleSaveInjection = () => {
    if (profile.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate?.([25, 40, 25]);
    }

    const entryId = `entry-${Date.now()}`;
    const timestamp = Date.now();

    const newEntry: DiaryEntry = {
      id: entryId,
      timestamp,
      glucose: numGlucose,
      glucoseUnit: profile.glucoseUnit,
      trend: trend !== 'flat' ? trend : undefined,
      trendDeltaIE: calcResult.trendAdjustmentIE,
      meal: currentMeal || undefined,
      carbAmountInUnit: carbInUnit,
      carbUnit: profile.carbUnit,
      calculatedMealInsulin: calcResult.mealInsulin,
      calculatedCorrectionInsulin: calcResult.correctionInsulin,
      calculatedTotalInsulin: calcResult.recommendedTotalInsulin,
      roundedPenInsulin: calcResult.roundedPenInsulin,
      insulinOnBoardSubtracted: calcResult.iob,
      injectedInsulin: injectedUnits,
      injectionSite: selectedSite,
      activityModifier: activityModifier !== 'normal' ? activityModifier : undefined,
      insulinType: currentMeal ? 'Normal/Analog' : 'Korrektur',
      splitBolus: isSplitBolus
        ? {
            immediate: roundToPenStep((injectedUnits * splitImmediatePercent) / 100, penStep),
            delayed: roundToPenStep((injectedUnits * (100 - splitImmediatePercent)) / 100, penStep),
            delayMinutes: splitDelayMinutes,
          }
        : undefined,
      notes: notes.trim() || undefined,
      tags: [
        ...(currentMeal ? [currentMeal.name.slice(0, 20)] : ['Korrektur']),
        ...(activityModifier !== 'normal' ? [activityModifier] : []),
      ],
    };

    onAddDiaryEntry(newEntry);

    // Update last bolus injection site in profile
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        lastBolusSite: selectedSite,
      });
    }

    // Create post-meal reminder timer if checked
    if (enablePostMealTimer && timerMinutes > 0) {
      const targetTime = timestamp + timerMinutes * 60 * 1000;
      const newTimer: ActiveTimer = {
        id: `timer-${Date.now()}`,
        label: currentMeal ? `BZ messen nach: ${currentMeal.name}` : 'BZ Kontrollmessung',
        type: 'post_meal',
        targetTimestamp: targetTime,
        totalDurationSeconds: timerMinutes * 60,
        createdAt: timestamp,
      };
      onAddTimer(newTimer);
    }

    // If split bolus: add timer for second injection
    if (isSplitBolus && splitDelayMinutes > 0) {
      const delayTargetTime = timestamp + splitDelayMinutes * 60 * 1000;
      const delayedDose = roundToPenStep((injectedUnits * (100 - splitImmediatePercent)) / 100, penStep);
      const splitTimer: ActiveTimer = {
        id: `timer-split-${Date.now()}`,
        label: `💉 Verzögerter Bolus spritzen (${delayedDose} IE mit Pen)`,
        type: 'fpe_delay',
        targetTimestamp: delayTargetTime,
        totalDurationSeconds: splitDelayMinutes * 60,
        createdAt: timestamp,
      };
      onAddTimer(splitTimer);
    }

    // Play chime & confetti
    playSuccessChime();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#14b8a6', '#06b6d4', '#10b981'],
    });

    // Reset inputs
    setGlucoseInput('');
    setNotes('');
    onClearMeal();
    setHasManuallyEditedUnits(false);
    setTrend('flat');
    setActivityModifier('normal');
  };

  const carbUnitLabel = profile.carbUnit === 'g_KH' ? 'g KH' : profile.carbUnit;

  // Freestyle Libre 3 offizielle Trendpfeile
  const libre3Trends: { value: GlucoseTrend; symbol: string; label: string }[] = [
    { value: 'double_up', symbol: '⬆️', label: 'Stark steigend (>2 mg/dl/min)' },
    { value: 'slight_up', symbol: '↗️', label: 'Steigend (1–2 mg/dl/min)' },
    { value: 'flat', symbol: '➡️', label: 'Gleichbleibend (<1 mg/dl/min)' },
    { value: 'slight_down', symbol: '↘️', label: 'Fallend (1–2 mg/dl/min)' },
    { value: 'double_down', symbol: '⬇️', label: 'Stark fallend (>2 mg/dl/min)' },
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      {/* Hypo Warning Banner */}
      {calcResult.isHypo && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/40 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-sm sm:text-base text-white">
              🚨 Freestyle Libre 3 Alarm: Niedriger Glukosewert ({numGlucose} {profile.glucoseUnit})
            </h4>
            <p className="text-xs text-rose-200 mt-1">
              Vor dem Spritzen bitte sofort schnelle Kohlenhydrate (z.B. 4 Traubenzucker / 150ml Saft) einnehmen und
              15 Minuten warten.
            </p>
            <button
              onClick={onOpenHypoModal}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-500 text-slate-950 font-bold text-xs hover:bg-rose-400 transition-colors"
            >
              Hypo-Soforthilfe öffnen
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: 1. Freestyle Libre 3 BZ & Trend + 2. Mahlzeit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* CARD 1: Freestyle Libre 3 Wert & Trendpfeile */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <label htmlFor="glucose-input" className="font-bold text-sm text-white block">
                  Freestyle Libre 3 Wert
                </label>
                <span className="text-[10px] text-teal-400 font-medium">Echtzeit-Sensor Glukose</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              Ziel: <strong className="text-slate-200">{profile.targetGlucose} {profile.glucoseUnit}</strong>
            </div>
          </div>

          <div className="relative">
            <input
              id="glucose-input"
              type="text"
              inputMode="decimal"
              placeholder={`z.B. ${profile.glucoseUnit === 'mg/dl' ? '135' : '7.5'}`}
              value={glucoseInput}
              onChange={(e) => setGlucoseInput(e.target.value)}
              className={`w-full text-3xl sm:text-4xl font-black px-4 py-3 rounded-xl bg-slate-950 border-2 focus:outline-none transition-all ${getGlucoseStatusColor(
                numGlucose
              )}`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
              {profile.glucoseUnit}
            </div>
          </div>

          {/* Freestyle Libre 3 Trend-Pfeile */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Libre 3 Trendpfeil:</span>
              <span className="font-bold text-teal-400">
                {libre3Trends.find((t) => t.value === trend)?.label}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {libre3Trends.map((btn) => (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => {
                    if (profile.hapticFeedback && 'vibrate' in navigator) navigator.vibrate?.([10]);
                    setTrend(btn.value);
                  }}
                  className={`py-2 rounded-xl text-center font-bold text-base transition-all border ${
                    trend === btn.value
                      ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-md shadow-teal-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                  title={btn.label}
                >
                  {btn.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Spritz-Ess-Abstand (SEA) Empfehlung */}
          {calcResult.recommendedSEA > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/30 flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Spritz-Ess-Abstand (SEA):</span>
                <span className="font-bold text-teal-400">
                  {calcResult.recommendedSEA} Min. Vorlaufzeit
                </span>
                <span className="text-[10px] text-slate-500 block">{calcResult.seaReason}</span>
              </div>
              <button
                type="button"
                onClick={() => startSEATimer()}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500 text-teal-400 hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
                title="SEA-Timer starten"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Timer</span>
              </button>
            </div>
          )}
        </div>

        {/* CARD 2: Mahlzeit & Kohlenhydrate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Utensils className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Mahlzeit &amp; Kohlenhydrate</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenFavoritesModal}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs border border-slate-700 transition-colors"
                  title="Aus Vorlagen &amp; Favoriten laden"
                >
                  <Star className="w-4 h-4" />
                </button>
                {currentMeal && (
                  <button
                    onClick={onClearMeal}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </div>

            {currentMeal ? (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-teal-500/30 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{currentMeal.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentMeal.items.length} {currentMeal.items.length === 1 ? 'Komponente' : 'Komponenten'}
                      {currentMeal.minCarbsGrams && currentMeal.maxCarbsGrams && (
                        <span className="text-teal-300 ml-1.5 font-mono text-[11px]">
                          (Spanne: {currentMeal.minCarbsGrams}–{currentMeal.maxCarbsGrams}g)
                        </span>
                      )}
                      {currentMeal.fpe && (
                        <span className="text-amber-400 ml-1.5 font-semibold">
                          • {currentMeal.fpe.fpeCount} FPE
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-teal-400">{currentMeal.totalCarbsGrams}g KH</div>
                    <div className="text-xs font-semibold text-slate-300">
                      = {carbInUnit} {carbUnitLabel}
                    </div>
                  </div>
                </div>

                {currentMeal.hiddenCarbsWarning && (
                  <p className="text-[11px] text-amber-200 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                    ⚠️ <span className="font-bold text-amber-300">Versteckte KH:</span> {currentMeal.hiddenCarbsWarning}
                  </p>
                )}

                {currentMeal.diabeticAdvice && (
                  <p className="text-[11px] text-cyan-200/90 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
                    💡 {currentMeal.diabeticAdvice}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <span>Noch keine Mahlzeit erfasst</span>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onOpenFavoritesModal}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Favoriten</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenFPEModal}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  >
                    <PieChart className="w-3.5 h-3.5 text-amber-400" />
                    <span>FPE Pizza-Rechner</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenFoodModal}
            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>
              {currentMeal
                ? 'Mahlzeit anpassen / weitere Speisen scannen'
                : 'Nahrung erfassen (Foto, Nährwert-Scan, Spickzettel, Schätzer)'}
            </span>
          </button>
        </div>
      </div>

      {/* CARD 3: Sport & Krankheitsmodus */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Aktivität &amp; Verfassung:</span>
          </span>
          <span className="text-xs font-bold text-teal-400">
            {getActivityMultiplier(activityModifier).label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          {[
            { id: 'normal' as ActivityModifier, label: 'Normal' },
            { id: 'light_sport' as ActivityModifier, label: 'Leichter Sport (-25%)' },
            { id: 'intense_sport' as ActivityModifier, label: 'Intensiver Sport (-50%)' },
            { id: 'post_sport' as ActivityModifier, label: 'Nachwirkung (-20%)' },
            { id: 'illness' as ActivityModifier, label: 'Krank / Stress (+25%)' },
          ].map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                if (profile.hapticFeedback && 'vibrate' in navigator) navigator.vibrate?.([10]);
                setActivityModifier(act.id);
              }}
              className={`py-2 px-2 rounded-lg text-center font-bold text-[11px] transition-all border ${
                activityModifier === act.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Injection Advisor Trigger Banner */}
      <div
        onClick={() => setIsAIAdvisorOpen(true)}
        className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/20 via-cyan-500/15 to-slate-900 border border-teal-500/40 hover:border-teal-400/80 shadow-xl flex items-center justify-between gap-3 transition-all cursor-pointer group select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/25 text-teal-400 group-hover:scale-105 transition-transform border border-teal-500/40 shrink-0">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">KI-Spritz-Berater (Gemini 3.8)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                Tipps
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Empfehlungen zu SEA-Vorlaufzeit, Dosisaufteilung (Split-Bolus) &amp; Pen-Nadeldynamik
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsAIAdvisorOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
        >
          <span>Tipps ansehen</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CARD 4: Berechnungs-Transparenz & Pen-Klicks */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-300 font-medium">
              Zeitfenster:{' '}
              <strong className="text-white">
                {timeFactorInfo.slotName} ({timeFactorInfo.timeRange})
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Faktor: <strong className="text-teal-400 font-bold">{activeFactor} IE / {carbUnitLabel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowFactorOverride(!showFactorOverride)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded bg-slate-800/60"
            >
              <span>Anpassen</span>
              {showFactorOverride ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Optional factor override */}
        {showFactorOverride && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <span className="text-slate-300">Manueller Faktor für diese Mahlzeit:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={activeFactor}
                onChange={(e) => setCustomFactor(parseFloat(e.target.value) || timeFactorInfo.factor)}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center font-bold text-teal-400 focus:outline-none"
              />
              <span className="text-slate-400">IE / {carbUnitLabel}</span>
              {customFactor !== undefined && (
                <button
                  onClick={() => setCustomFactor(undefined)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transparent Calculation Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Meal Bolus */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Mahlzeitenbolus</span>
              <Utensils className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-lg font-black text-white mt-1">
              +{calcResult.mealInsulin} <span className="text-xs font-normal text-slate-400">IE</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {carbInUnit} {carbUnitLabel} × {activeFactor}
            </div>
          </div>

          {/* 2. Correction Bolus & Libre 3 Trend */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Korrektur + Trend</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-black mt-1 text-white">
              {calcResult.correctionInsulin + calcResult.trendAdjustmentIE >= 0
                ? `+${Math.round((calcResult.correctionInsulin + calcResult.trendAdjustmentIE) * 10) / 10}`
                : `${Math.round((calcResult.correctionInsulin + calcResult.trendAdjustmentIE) * 10) / 10}`}{' '}
              <span className="text-xs font-normal text-slate-400">IE</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {calcResult.trendAdjustmentIE !== 0
                ? `Trend: ${calcResult.trendAdjustmentIE > 0 ? '+' : ''}${calcResult.trendAdjustmentIE} IE`
                : 'Trend: stabil'}
            </div>
          </div>

          {/* 3. IOB Deduction */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Aktives IOB</span>
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-400 mt-1">
              -{calcResult.iob} <span className="text-xs font-normal text-slate-400">IE</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Hypo-Schutz</div>
          </div>

          {/* 4. Recommended Result for Insulinpen */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-950/60 to-slate-950 border border-teal-500/40">
            <div className="text-teal-300 font-semibold flex items-center justify-between">
              <span>Pen-Empfehlung</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl font-black text-teal-300 mt-1">
              {calcResult.roundedPenInsulin}{' '}
              <span className="text-xs font-normal text-teal-400/80">IE</span>
            </div>
            <div className="text-[10px] text-teal-400/80 mt-0.5">
              {penStep === 0.5
                ? `≈ ${Math.round(calcResult.roundedPenInsulin * 2)} Klicks (0.5 IE Pen)`
                : `≈ ${Math.round(calcResult.roundedPenInsulin)} Klicks (1.0 IE Pen)`}
            </div>
          </div>
        </div>

        {calcResult.advice && (
          <div className="text-xs text-slate-300 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/80">
            {calcResult.advice}
          </div>
        )}
      </div>

      {/* CARD 5: Pen-Dosis einstellen & Einstichstelle wählen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Syringe className="w-5 h-5 text-teal-400" />
              <span>Insulinpen-Einstellung</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pen-Schritte: {penStep} IE • Pen: {profile.bolusPenBrand}
            </p>
          </div>

          {/* Stepper Input with Pen-Step (0.5 or 1.0 IE) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepUnits(-penStep)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700 active:scale-95"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="relative">
              <input
                type="number"
                step={penStep}
                min="0"
                max="50"
                value={injectedUnits}
                onChange={(e) => {
                  setHasManuallyEditedUnits(true);
                  setInjectedUnits(Math.max(0, parseFloat(e.target.value) || 0));
                }}
                className="w-32 text-center text-3xl font-black py-2.5 px-2 rounded-xl bg-slate-950 border-2 border-teal-500 text-teal-300 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                IE
              </span>
            </div>

            <button
              type="button"
              onClick={() => stepUnits(penStep)}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700 active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Einstichstellen-Rotation für Bolus */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Injektionsstelle (Rotation für schnelles Mahlzeiteninsulin):</span>
            </span>
            <span className="text-[11px] text-teal-400 font-semibold">
              Empfehlung: {INJECTION_SITE_LABELS[nextBolusSite]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(['abdomen_top_left', 'abdomen_top_right', 'abdomen_bottom_right', 'abdomen_bottom_left'] as InjectionSite[]).map(
              (site) => {
                const isSelected = selectedSite === site;
                const isNext = nextBolusSite === site;

                return (
                  <button
                    key={site}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : isNext
                        ? 'bg-slate-950 border-teal-500/50 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">{INJECTION_SITE_LABELS[site].label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {isNext ? '★ Nächste Rotation' : 'Bauchbereich'}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Split Bolus Option */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isSplitBolus}
              onChange={(e) => setIsSplitBolus(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 w-4 h-4"
            />
            <span>Verzögerter Bolus / Split-Bolus (z.B. Pizza, Burger, fettige Speisen)</span>
          </label>

          {isSplitBolus && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">1. Pen-Injektion (sofort):</span>
                <span className="font-bold text-teal-400">
                  {roundToPenStep((injectedUnits * splitImmediatePercent) / 100, penStep)} IE ({splitImmediatePercent}%)
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={splitImmediatePercent}
                onChange={(e) => setSplitImmediatePercent(parseInt(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex items-center justify-between text-slate-400">
                <span>2. Injektion: {roundToPenStep((injectedUnits * (100 - splitImmediatePercent)) / 100, penStep)} IE</span>
                <select
                  value={splitDelayMinutes}
                  onChange={(e) => setSplitDelayMinutes(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                >
                  <option value={60}>in 60 Minuten (1h)</option>
                  <option value={90}>in 90 Minuten (1,5h)</option>
                  <option value={120}>in 120 Minuten (2h)</option>
                  <option value={180}>in 180 Minuten (3h)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Reminder Settings checkbox */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePostMealTimer}
              onChange={(e) => setEnablePostMealTimer(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 w-4 h-4"
            />
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Erinnerungs-Timer starten: Blutzucker nach Mahlzeit messen</span>
          </label>

          {enablePostMealTimer && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setTimerMinutes(90)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  timerMinutes === 90
                    ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                1,5 h
              </button>
              <button
                type="button"
                onClick={() => setTimerMinutes(120)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  timerMinutes === 120
                    ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                2,0 h
              </button>
              <button
                type="button"
                onClick={() => setTimerMinutes(180)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  timerMinutes === 180
                    ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                3,0 h
              </button>
            </div>
          )}
        </div>

        {/* Optional Notes */}
        <div>
          <input
            type="text"
            placeholder="Optionale Notiz (z.B. Vor dem Joggen, Restaurantbesuch, Stress)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSaveInjection}
          disabled={injectedUnits === 0 && !currentMeal && !numGlucose}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-teal-500/25 disabled:opacity-40 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>
            {injectedUnits > 0
              ? `${injectedUnits} IE mit Pen spritzen & protokollieren`
              : 'Eintrag im Tagebuch speichern'}
          </span>
        </button>
      </div>

      {/* AI Injection Advisor Modal */}
      {isAIAdvisorOpen && (
        <AIInjectionAdvisorModal
          isOpen={isAIAdvisorOpen}
          onClose={() => setIsAIAdvisorOpen(false)}
          profile={profile}
          currentGlucose={numGlucose || profile.targetGlucose}
          glucoseUnit={profile.glucoseUnit}
          trend={trend}
          currentMeal={currentMeal}
          carbAmountInUnit={carbInUnit}
          calculatedBolus={calcResult.roundedPenInsulin}
          iob={calcResult.iob}
          activityModifier={activityModifier}
          onApplySplitBolus={(immediate, delayed, delayMin) => {
            setIsSplitBolus(true);
            setInjectedUnits(immediate + delayed);
            setSplitImmediatePercent(Math.round((immediate / (immediate + delayed)) * 100));
            setSplitDelayMinutes(delayMin);
          }}
          onStartSEATimer={(minutes) => startSEATimer(minutes)}
          onSelectSite={(site) => setSelectedSite(site)}
        />
      )}
    </div>
  );
};
