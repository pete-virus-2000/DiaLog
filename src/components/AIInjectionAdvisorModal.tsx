import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Syringe,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Loader2,
  X,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Info,
  Send,
} from 'lucide-react';
import {
  ActiveTimer,
  ActivityModifier,
  AIInjectionAdvice,
  GlucoseTrend,
  GlucoseUnit,
  InjectionSite,
  MealRecord,
  UserDiabetesProfile,
} from '../types/diabetes';
import { roundToPenStep } from '../utils/diabetesCalculations';

interface AIInjectionAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserDiabetesProfile;
  currentGlucose: number;
  glucoseUnit: GlucoseUnit;
  trend: GlucoseTrend;
  currentMeal: MealRecord | null;
  carbAmountInUnit: number;
  calculatedBolus: number;
  iob: number;
  activityModifier: ActivityModifier;
  onApplySplitBolus: (immediateUnits: number, delayedUnits: number, delayMinutes: number) => void;
  onStartSEATimer: (minutes: number) => void;
  onSelectSite: (site: InjectionSite) => void;
}

export const AIInjectionAdvisorModal: React.FC<AIInjectionAdvisorModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentGlucose,
  glucoseUnit,
  trend,
  currentMeal,
  carbAmountInUnit,
  calculatedBolus,
  iob,
  activityModifier,
  onApplySplitBolus,
  onStartSEATimer,
  onSelectSite,
}) => {
  const [advice, setAdvice] = useState<AIInjectionAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  // Fetch advice when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAdvice();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Morgen / Frühstück';
    if (hour >= 11 && hour < 15) return 'Mittagessen';
    if (hour >= 15 && hour < 18) return 'Nachmittag';
    if (hour >= 18 && hour < 22) return 'Abendessen';
    return 'Spätabend / Nacht';
  };

  const fetchAdvice = async (customQuestion?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-injection-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glucose: currentGlucose,
          glucoseUnit,
          trend,
          mealName: currentMeal?.name || 'Mahlzeit / Snack',
          carbsGrams: currentMeal?.totalCarbsGrams || 0,
          carbUnit: profile.carbUnit,
          carbUnitAmount: carbAmountInUnit,
          calculatedBolus,
          penStep: profile.penStep,
          iob,
          timeOfDay: getTimeOfDay(),
          lastInjectionSite: profile.lastBolusSite || 'abdomen_top_left',
          activityModifier,
          userQuestion: customQuestion || userQuestion,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Fehler beim Laden der Spritz-Tipps');
      }

      setAdvice(data);
      if (customQuestion) {
        setUserQuestion('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Die KI-Spritz-Tipps konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
      setIsAskingFollowUp(false);
    }
  };

  const handleApplySplit = () => {
    if (!advice?.splitBolusRecommended || !advice.splitImmediateUnits || !advice.splitDelayedUnits) return;
    onApplySplitBolus(advice.splitImmediateUnits, advice.splitDelayedUnits, advice.splitDelayMinutes || 120);
    onClose();
  };

  const handleApplySEA = () => {
    if (!advice) return;
    onStartSEATimer(advice.seaMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>KI-Spritz-Berater</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  Gemini 3.8
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalisierte Tipps zu Spritzzeitpunkt, Dosisaufteilung &amp; Pen-Handhabung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Patient Situation Overview Bar */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Situation:</span>
              <span className="font-bold text-white">
                {currentGlucose} {glucoseUnit}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-teal-300">
                Pfeil: {trend}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Mahlzeit:</span>
              <span className="font-bold text-teal-400">
                {currentMeal?.totalCarbsGrams || 0}g KH ({carbAmountInUnit} {profile.carbUnit})
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-bold text-cyan-400">Dosis: {calculatedBolus} IE</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
              <p className="text-sm font-semibold text-slate-300">
                Analysiere BZ-Trend, Mahlzeitzusammensetzung &amp; Pen-Therapie...
              </p>
              <p className="text-xs text-slate-500">Prüfe SEA, FPE-Verzögerung und Nadeldynamik</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchAdvice()}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Wiederholen</span>
              </button>
            </div>
          ) : advice ? (
            <div className="space-y-3.5">
              {/* Headline Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-slate-900 border border-teal-500/30 shadow-md">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{advice.headline}</h3>
                    <p className="text-xs text-teal-200/90 mt-0.5">{advice.keyTakeaway}</p>
                  </div>
                </div>
              </div>

              {/* Trend & Safety Warning if present */}
              {advice.trendWarning && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">CGM &amp; Sicherheitshinweis: </span>
                    {advice.trendWarning}
                  </div>
                </div>
              )}

              {/* CARD 1: Spritz-Ess-Abstand (SEA) */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Spritz-Ess-Abstand (SEA)
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold">
                    {advice.seaMinutes > 0
                      ? `${advice.seaMinutes} Min. Vorlauf`
                      : advice.seaMinutes === 0
                      ? 'Sofort zum ersten Bissen'
                      : `${Math.abs(advice.seaMinutes)} Min. NACH dem Essen`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{advice.seaAdvice}</p>
                {advice.seaMinutes > 0 && (
                  <button
                    type="button"
                    onClick={handleApplySEA}
                    className="mt-1 w-full py-2 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>SEA-Timer ({advice.seaMinutes} Min.) jetzt stellen</span>
                  </button>
                )}
              </div>

              {/* CARD 2: Split-Bolus / Dosisaufteilung */}
              {advice.splitBolusRecommended && advice.splitImmediateUnits && advice.splitDelayedUnits ? (
                <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Dosis-Aufteilung empfohlen (Split-Bolus mit Pen)
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      Fett / Eiweiß
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{advice.splitExplanation}</p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 uppercase block">1. Pen-Dosis (Sofort):</span>
                      <span className="text-base font-extrabold text-teal-400">
                        {advice.splitImmediateUnits} IE
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 uppercase block">
                        2. Pen-Dosis (nach {Math.round((advice.splitDelayMinutes || 120) / 60)}h):
                      </span>
                      <span className="text-base font-extrabold text-amber-400">
                        {advice.splitDelayedUnits} IE
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplySplit}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Split-Bolus in Rechner übernehmen &amp; Timer planen</span>
                  </button>
                </div>
              ) : null}

              {/* CARD 3: Einstichstelle & Pen-Technik */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Einstichstelle &amp; Nadeldynamik
                  </h4>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Empfohlene Körperstelle:</span>
                    <span className="font-bold text-teal-400">{advice.recommendedSite}</span>
                  </div>
                  {advice.siteRotationReason && (
                    <span className="text-[10px] text-slate-400 max-w-[55%] text-right">
                      {advice.siteRotationReason}
                    </span>
                  )}
                </div>

                {/* Technique checklist */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Pen-Regeln für diese Injektion:
                  </span>
                  {advice.penTechniqueTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Follow-up Question */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Noch eine Frage zur Spritze oder Mahlzeit?</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="z.B. 'Ich gehe gleich spazieren' oder 'Mein BZ fällt gerade stark'"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && userQuestion.trim() && fetchAdvice(userQuestion)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    disabled={!userQuestion.trim() || isLoading}
                    onClick={() => fetchAdvice(userQuestion)}
                    className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs disabled:opacity-40 flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Fragen</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fetchAdvice()}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Neu berechnen</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-md shadow-teal-500/20"
          >
            Fertig / Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
