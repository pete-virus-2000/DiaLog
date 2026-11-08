import React, { useState } from 'react';
import {
  PieChart,
  X,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { calculateFPE } from '../utils/diabetesCalculations';
import { MealRecord, UserDiabetesProfile } from '../types/diabetes';

interface FPECalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserDiabetesProfile;
  onApplyFPEToMeal?: (fpeCarbsEquivalent: number, delayMinutes: number, name: string) => void;
}

export const FPECalculatorModal: React.FC<FPECalculatorModalProps> = ({
  isOpen,
  onClose,
  profile,
  onApplyFPEToMeal,
}) => {
  const [fatInput, setFatInput] = useState<string>('30');
  const [proteinInput, setProteinInput] = useState<string>('25');
  const [dishName, setDishName] = useState<string>('Pizza Margherita / Burger');

  if (!isOpen) return null;

  const fat = parseFloat(fatInput) || 0;
  const protein = parseFloat(proteinInput) || 0;

  const fpeResult = calculateFPE(fat, protein);
  // In typical German diabetes education, 1 FPE corresponds to approx. 1 BE (or 10g KH/1 KE)
  const carbEquivalentGrams = Math.round(fpeResult.fpeCount * profile.gramsPerBE);

  // Quick preset foods for FPE
  const presets = [
    { name: '1 ganze Pizza Margherita', fat: 32, protein: 24 },
    { name: 'Cheeseburger mit Pommes', fat: 42, protein: 30 },
    { name: 'Rumpsteak mit Kräuterbutter', fat: 28, protein: 45 },
    { name: 'Käsespätzle mit Röstzwiebeln', fat: 35, protein: 20 },
  ];

  const handleApply = () => {
    if (onApplyFPEToMeal) {
      onApplyFPEToMeal(carbEquivalentGrams, fpeResult.delayHours * 60, dishName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                FPE-Rechner (Fett-Protein-Einheiten)
              </h2>
              <p className="text-xs text-slate-400">Warschauer Formel für Pizza, Burger, Fleisch &amp; Käse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Quick Explanation */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Info className="w-4 h-4" />
              <span>Warum FPE für Typ 1 Diabetiker wichtig sind:</span>
            </div>
            <p className="text-[11px] text-cyan-200/90">
              Fett und Eiweiß erhöhen den Blutzucker nicht sofort, sondern verzögert nach <strong>3 bis 8 Stunden</strong>.
              100 kcal aus Fett (9 kcal/g) und Eiweiß (4 kcal/g) entsprechen <strong>1 FPE</strong>.
            </p>
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Typische FPE-Mahlzeiten:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setDishName(preset.name);
                    setFatInput(preset.fat.toString());
                    setProteinInput(preset.protein.toString());
                  }}
                  className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="font-semibold text-slate-200 truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {preset.fat}g Fett • {preset.protein}g Protein
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Mahlzeit / Beschreibung:</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Fettgehalt (Gramm):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={fatInput}
                    onChange={(e) => setFatInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-slate-400">g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">× 9 kcal = {Math.round(fat * 9)} kcal</span>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Proteingehalt (Gramm):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proteinInput}
                    onChange={(e) => setProteinInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-slate-400">g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">× 4 kcal = {Math.round(protein * 4)} kcal</span>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                Berechnungsergebnis:
              </span>
              <span className="text-slate-400 text-[11px]">
                Gesamt: {fpeResult.kcalFromFatAndProtein} kcal aus Fett &amp; Eiweiß
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Fett-Protein-Einheiten:</span>
                <div className="text-2xl font-black text-amber-400 mt-0.5">
                  {fpeResult.fpeCount} <span className="text-xs font-normal text-slate-400">FPE</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  ≈ {fpeResult.fpeCount} {profile.carbUnit} Äquivalent
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Empfohlene Verzögerung:</span>
                <div className="text-2xl font-black text-cyan-400 mt-0.5">
                  {fpeResult.delayHours} <span className="text-xs font-normal text-slate-400">Stunden</span>
                </div>
                <span className="text-[10px] text-slate-500">Verzögerter Bolus / Split</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              💡 {fpeResult.advice}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Schließen
          </button>

          {onApplyFPEToMeal && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>In Mahlzeit &amp; Split-Bolus übernehmen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
