import React, { useState } from 'react';
import {
  IdCard,
  X,
  Printer,
  PhoneCall,
  AlertTriangle,
  HeartPulse,
  Save,
  CheckCircle,
  User,
  ShieldAlert,
} from 'lucide-react';
import { EmergencyCard, UserDiabetesProfile } from '../types/diabetes';

interface EmergencyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserDiabetesProfile;
  onSaveCard: (card: EmergencyCard) => void;
}

export const EmergencyCardModal: React.FC<EmergencyCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveCard,
}) => {
  const [card, setCard] = useState<EmergencyCard>({ ...profile.emergencyCard });
  const [isEditing, setIsEditing] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCard(card);
    setIsEditing(false);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500 text-slate-950 font-black">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Digitaler Diabetes-Notfallausweis (ICE)
              </h2>
              <p className="text-xs text-rose-300">Für Ersthelfer, Notärzte &amp; Angehörige</p>
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
          {saveNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Notfallausweis erfolgreich aktualisiert!</span>
            </div>
          )}

          {/* Printable Emergency Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-rose-950/20 border-2 border-rose-500/50 space-y-3.5 shadow-xl relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-rose-500 text-slate-950 inline-block mb-1">
                  Typ 1 Diabetes Notfall-Pass
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{card.fullName}</h3>
                <p className="text-[11px] text-slate-400">Geburtsdatum: {card.birthDate}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Therapieform:</span>
                <span className="text-xs font-bold text-teal-400">{card.pumpOrPen}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{card.sensorName}</span>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] text-rose-400 uppercase font-black flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Notfallkontakt (ICE - In Case of Emergency):</span>
              </span>
              <div className="font-bold text-white text-sm">{card.iceName}</div>
              <a
                href={`tel:${card.icePhone}`}
                className="text-xs font-mono font-bold text-teal-400 hover:underline block"
              >
                📞 {card.icePhone}
              </a>
            </div>

            {/* Insulins in use */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Mahlzeiten-Insulin:</span>
                <span className="font-bold text-cyan-300">{card.bolusInsulinName}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Basal-Insulin:</span>
                <span className="font-bold text-cyan-300">{card.basalInsulinName}</span>
              </div>
            </div>

            {/* Diabetologist */}
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className="text-slate-400 block text-[10px]">Behandelnder Diabetologe / Praxis:</span>
              <strong>{card.diabetologistName}</strong> • {card.diabetologistPhone}
            </div>

            {/* Immediate First Aid Instructions */}
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-1.5">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>WICHTIGE ERSTHELFER-HINWEISE BEI BEWUSSTLOSIGKEIT:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                <li>Sofort Notruf <strong>112</strong> alarmieren &amp; "Diabetiker bewusstlos" melden.</li>
                <li><strong>KEIN</strong> Insulin spritzen! Keine Nahrung/Flüssigkeit in den Mund geben.</li>
                <li>Stabile Seitenlage einnehmen.</li>
                <li>Baqsimi Nasenspray (3 mg) in ein Nasenloch verabreichen (falls vorhanden).</li>
              </ul>
            </div>
          </div>

          {/* Edit Form Toggle */}
          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-teal-400 hover:underline"
            >
              {isEditing ? 'Bearbeitung schließen' : 'Daten des Notfallausweises bearbeiten'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Notfallausweis drucken</span>
            </button>
          </div>

          {/* Form for Editing */}
          {isEditing && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in text-xs">
              <h4 className="font-bold text-white text-sm">Angaben anpassen</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Vollständiger Name:</label>
                  <input
                    type="text"
                    value={card.fullName}
                    onChange={(e) => setCard({ ...card, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Geburtsdatum:</label>
                  <input
                    type="text"
                    value={card.birthDate}
                    onChange={(e) => setCard({ ...card, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">ICE-Kontakt Name &amp; Rolle:</label>
                  <input
                    type="text"
                    value={card.iceName}
                    onChange={(e) => setCard({ ...card, iceName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ICE-Telefonnummer:</label>
                  <input
                    type="text"
                    value={card.icePhone}
                    onChange={(e) => setCard({ ...card, icePhone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Mahlzeiteninsulin (Bolus):</label>
                  <input
                    type="text"
                    value={card.bolusInsulinName}
                    onChange={(e) => setCard({ ...card, bolusInsulinName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Basalinsulin (Langzeit):</label>
                  <input
                    type="text"
                    value={card.basalInsulinName}
                    onChange={(e) => setCard({ ...card, basalInsulinName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Diabetologe / Praxis:</label>
                  <input
                    type="text"
                    value={card.diabetologistName}
                    onChange={(e) => setCard({ ...card, diabetologistName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Praxis-Telefon:</label>
                  <input
                    type="text"
                    value={card.diabetologistPhone}
                    onChange={(e) => setCard({ ...card, diabetologistPhone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
