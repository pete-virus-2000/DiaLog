import React from 'react';
import {
  ShieldAlert,
  X,
  Clock,
  CheckCircle,
  PhoneCall,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { ActiveTimer } from '../types/diabetes';

interface HypoHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartHypoTimer: () => void;
}

export const HypoHelperModal: React.FC<HypoHelperModalProps> = ({
  isOpen,
  onClose,
  onStartHypoTimer,
}) => {
  if (!isOpen) return null;

  const handleTakeCarbsAndStartTimer = () => {
    onStartHypoTimer();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500 text-slate-950 font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Hypoglykämie Soforthilfe (Unterzuckerung)
              </h2>
              <p className="text-xs text-rose-300">Goldstandard: Die 15-15-Regel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Step 1: 15g fast carbs */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Schritt 1: Sofort 15 bis 20g schnelle Kohlenhydrate</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Keine Schokolade oder fettige Snacks (Fett verzögert die Aufnahme!). Wähle eins von diesen:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                🍬 <strong>4 Täfelchen Traubenzucker</strong> (ca. 15g KH)
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                🧃 <strong>1 Glas (150–200 ml) Apfelsaft</strong> oder Limonade
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                🥤 <strong>1 Glas klassische Coca-Cola</strong> (nicht Zero/Light!)
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                🧴 <strong>1 Tube Flüssigtraubenzucker</strong> (z.B. Jubin)
              </div>
            </div>
          </div>

          {/* Step 2: 15 minutes timer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-extrabold text-sm uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Schritt 2: 15 Minuten Pause &amp; Nachmessung</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Körperliche Ruhe bewahren. Nach exakt 15 Minuten den Blutzucker erneut kontrollieren. Liegt er immer noch unter 70 mg/dl (3.9 mmol/l), nochmals 15g schnelle KH einnehmen.
            </p>
          </div>

          {/* Emergency Box */}
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Notfall bei schwerer Bewusstlosigkeit / Krampfanfall:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Sofort Notruf <strong>112</strong> wählen!</li>
              <li>Niemals Getränke oder Nahrung in den Mund einflößen (Erstickungsgefahr!).</li>
              <li>Glukagon-Nasenspray (Baqsimi) oder Glukagon-Spritze verabreichen.</li>
              <li>Stabile Seitenlage herstellen und Atemwege freihalten.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
          >
            Schließen
          </button>

          <button
            type="button"
            onClick={handleTakeCarbsAndStartTimer}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>15g KH eingenommen &amp; 15-Min-Timer starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
