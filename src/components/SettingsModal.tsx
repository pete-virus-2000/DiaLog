import React, { useState } from 'react';
import {
  Settings,
  X,
  CheckCircle,
  Save,
  RotateCcw,
  Sliders,
  HelpCircle,
  Sun,
  Moon,
  Palette,
  Type,
  Eye,
  Smartphone,
  IdCard,
  Syringe,
  Activity,
} from 'lucide-react';
import {
  AppTheme,
  CarbUnit,
  FontSizeSetting,
  GlucoseUnit,
  UserDiabetesProfile,
} from '../types/diabetes';
import { convertGlucose } from '../utils/diabetesCalculations';
import { DEFAULT_PROFILE } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserDiabetesProfile;
  onSaveProfile: (profile: UserDiabetesProfile) => void;
  onOpenEmergencyModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onOpenEmergencyModal,
}) => {
  const [formData, setFormData] = useState<UserDiabetesProfile>({ ...profile });
  const [activeSubTab, setActiveSubTab] = useState<'pen_libre' | 'appearance' | 'medical' | 'factors'>('pen_libre');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGlucoseUnitChange = (newUnit: GlucoseUnit) => {
    if (newUnit === formData.glucoseUnit) return;
    const oldUnit = formData.glucoseUnit;

    const newTarget = convertGlucose(formData.targetGlucose, oldUnit, newUnit);
    const newMin = convertGlucose(formData.targetGlucoseMin, oldUnit, newUnit);
    const newMax = convertGlucose(formData.targetGlucoseMax, oldUnit, newUnit);
    const newISF =
      newUnit === 'mmol/l'
        ? Math.round((formData.correctionFactor / 18.018) * 10) / 10
        : Math.round(formData.correctionFactor * 18.018);

    setFormData((prev) => ({
      ...prev,
      glucoseUnit: newUnit,
      targetGlucose: newTarget,
      targetGlucoseMin: newMin,
      targetGlucoseMax: newMax,
      correctionFactor: newISF,
    }));
  };

  const handleSave = () => {
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Möchtest du alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      setFormData({ ...DEFAULT_PROFILE });
    }
  };

  const themesList: { id: AppTheme; name: string; desc: string; preview: string }[] = [
    { id: 'dark', name: 'Dunkel (Slate)', desc: 'Modern & augenschonend', preview: 'bg-slate-900 border-slate-700 text-teal-400' },
    { id: 'oled', name: 'OLED Schwarz (Galaxy)', desc: 'Reines Schwarz, spart Akku', preview: 'bg-black border-zinc-800 text-teal-300' },
    { id: 'light', name: 'Hell (Medical)', desc: 'Klar bei Sonnenlicht', preview: 'bg-white border-slate-300 text-teal-600' },
    { id: 'ocean', name: 'Ozean Tiefblau', desc: 'Beruhigendes Marineblau', preview: 'bg-blue-950 border-blue-800 text-cyan-300' },
    { id: 'emerald', name: 'Smaragd Wald', desc: 'Natürliches Waldgrün', preview: 'bg-emerald-950 border-emerald-800 text-emerald-300' },
    { id: 'contrast', name: 'Hochkontrast', desc: 'Barrierefrei für Sehbehinderte', preview: 'bg-black border-yellow-400 text-yellow-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">App-Einstellungen &amp; Therapie</h2>
              <p className="text-xs text-slate-400">Insulinpen-Schritte, Freestyle Libre 3 und Optik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-1 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('pen_libre')}
            className={`py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeSubTab === 'pen_libre'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>Pens &amp; Libre 3</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('appearance')}
            className={`py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeSubTab === 'appearance'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Optik &amp; Themes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('medical')}
            className={`py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeSubTab === 'medical'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Zielbereich &amp; ISF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('factors')}
            className={`py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              activeSubTab === 'factors'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <IdCard className="w-4 h-4" />
            <span>Notfall-Ausweis</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* TAB 1: PENS & FREESTYLE LIBRE 3 */}
          {activeSubTab === 'pen_libre' && (
            <div className="space-y-4">
              {/* Insulinpen Dosierschritte */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Syringe className="w-4 h-4" />
                  <span>Insulinpen-Konfiguration (ICT / MDI)</span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Klick-Schritte deines Bolus-Pens:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, penStep: 0.5 })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        formData.penStep === 0.5
                          ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="font-bold">0.5 IE Schritte</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Halbeinheiten (z.B. NovoPen Echo, Pendiq)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, penStep: 1.0 })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        formData.penStep === 1.0
                          ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="font-bold">1.0 IE Schritte</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ganze Einheiten (Standard Erwachsenen-Pen)
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Mahlzeitenpen (Bolus):</label>
                    <input
                      type="text"
                      value={formData.bolusPenBrand}
                      onChange={(e) => setFormData({ ...formData, bolusPenBrand: e.target.value })}
                      placeholder="z.B. Fiasp / NovoRapid"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Langzeitpen (Basal):</label>
                    <input
                      type="text"
                      value={formData.basalPenBrand}
                      onChange={(e) => setFormData({ ...formData, basalPenBrand: e.target.value })}
                      placeholder="z.B. Tresiba / Lantus"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Standard Basaldosis:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={formData.defaultBasalUnits}
                        onChange={(e) =>
                          setFormData({ ...formData, defaultBasalUnits: parseInt(e.target.value) || 18 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <span className="text-slate-400 font-bold">IE</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Basal-Uhrzeit (Standard):</label>
                    <input
                      type="time"
                      value={formData.defaultBasalTime}
                      onChange={(e) => setFormData({ ...formData, defaultBasalTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Freestyle Libre 3 Einstellungen */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Freestyle Libre 3 Einstellungen</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1">Niedriger Glukose-Alarm:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={formData.libreAlarmLow}
                        onChange={(e) =>
                          setFormData({ ...formData, libreAlarmLow: parseInt(e.target.value) || 70 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-rose-400 font-black"
                      />
                      <span className="text-slate-400">{formData.glucoseUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Hoher Glukose-Alarm:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={formData.libreAlarmHigh}
                        onChange={(e) =>
                          setFormData({ ...formData, libreAlarmHigh: parseInt(e.target.value) || 240 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-black"
                      />
                      <span className="text-slate-400">{formData.glucoseUnit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE (Optik, Themes, Schriftgröße) */}
          {activeSubTab === 'appearance' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-300 font-bold text-sm block flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-teal-400" />
                  <span>Farbschema &amp; Theme (inkl. OLED Tiefschwarz für Galaxy S26 Ultra):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {themesList.map((t) => {
                    const isSelected = formData.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: t.id })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500/10 shadow-md shadow-teal-500/20'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">{t.name}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border ${t.preview}`}></span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Selector */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-teal-400" />
                  <span>Schriftgröße &amp; Skalierung:</span>
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'normal' as FontSizeSetting, label: 'Normal (100%)', sample: 'Textgröße' },
                    { id: 'large' as FontSizeSetting, label: 'Groß (115%)', sample: 'Textgröße' },
                    { id: 'xl' as FontSizeSetting, label: 'Sehr groß (130%)', sample: 'Textgröße' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, fontSize: f.id })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        formData.fontSize === f.id
                          ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs">{f.label}</div>
                      <div className={`mt-1 font-semibold ${f.id === 'xl' ? 'text-sm' : f.id === 'large' ? 'text-xs' : 'text-[11px]'}`}>
                        {f.sample}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Mode Toggles */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Daumenzone-Navigationsleiste unten</span>
                    <span className="text-[11px] text-slate-400">
                      Ergonomisch für Einhandbedienung auf dem Galaxy S26 Ultra
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.bottomNavEnabled}
                    onChange={(e) => setFormData({ ...formData, bottomNavEnabled: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Haptisches Feedback (Vibration)</span>
                    <span className="text-[11px] text-slate-400">
                      Dezente Vibration bei Pen-Klicks &amp; Injektionen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hapticFeedback}
                    onChange={(e) => setFormData({ ...formData, hapticFeedback: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Kompakter Layoutmodus</span>
                    <span className="text-[11px] text-slate-400">
                      Reduzierte Abstände für maximale Informationsdichte
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.compactMode}
                    onChange={(e) => setFormData({ ...formData, compactMode: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL SETTINGS */}
          {activeSubTab === 'medical' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">Einheiten</h3>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Blutzuckereinheit:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGlucoseUnitChange('mg/dl')}
                      className={`py-2 px-3 rounded-lg border font-bold transition-all ${
                        formData.glucoseUnit === 'mg/dl'
                          ? 'bg-teal-500 text-slate-950 border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      mg/dl (Standard DE / AT)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGlucoseUnitChange('mmol/l')}
                      className={`py-2 px-3 rounded-lg border font-bold transition-all ${
                        formData.glucoseUnit === 'mmol/l'
                          ? 'bg-teal-500 text-slate-950 border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      mmol/l (CH / Ostdeutschland)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Kohlenhydrateinheit:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, carbUnit: 'BE' })}
                      className={`py-2 px-2 rounded-lg border font-bold text-center transition-all ${
                        formData.carbUnit === 'BE'
                          ? 'bg-teal-500 text-slate-950 border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      BE (Broteinheiten)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, carbUnit: 'KE' })}
                      className={`py-2 px-2 rounded-lg border font-bold text-center transition-all ${
                        formData.carbUnit === 'KE'
                          ? 'bg-teal-500 text-slate-950 border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      KE / KHE (10g KH)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, carbUnit: 'g_KH' })}
                      className={`py-2 px-2 rounded-lg border font-bold text-center transition-all ${
                        formData.carbUnit === 'g_KH'
                          ? 'bg-teal-500 text-slate-950 border-teal-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      g KH (Gramm)
                    </button>
                  </div>
                </div>

                {formData.carbUnit === 'BE' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Gramm Kohlenhydrate pro 1 BE:</span>
                    <select
                      value={formData.gramsPerBE}
                      onChange={(e) => setFormData({ ...formData, gramsPerBE: parseInt(e.target.value) })}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-bold"
                    >
                      <option value={12}>12 Gramm (Deutschland Standard)</option>
                      <option value={10}>10 Gramm (Österreich / Schweiz)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Zielbereich */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">Grenzwerte &amp; Korrekturfaktor (ISF)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Ziel-Blutzucker:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step={formData.glucoseUnit === 'mg/dl' ? 1 : 0.1}
                        value={formData.targetGlucose}
                        onChange={(e) => setFormData({ ...formData, targetGlucose: parseFloat(e.target.value) || 100 })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <span className="text-slate-400">{formData.glucoseUnit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Korrekturfaktor (ISF):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step={formData.glucoseUnit === 'mg/dl' ? 1 : 0.1}
                        value={formData.correctionFactor}
                        onChange={(e) => setFormData({ ...formData, correctionFactor: parseFloat(e.target.value) || 40 })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <span className="text-slate-400">{formData.glucoseUnit}/IE</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Zielbereich Min (Hypo-Grenze):</label>
                    <input
                      type="number"
                      value={formData.targetGlucoseMin}
                      onChange={(e) => setFormData({ ...formData, targetGlucoseMin: parseFloat(e.target.value) || 80 })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Zielbereich Max:</label>
                    <input
                      type="number"
                      value={formData.targetGlucoseMax}
                      onChange={(e) => setFormData({ ...formData, targetGlucoseMax: parseFloat(e.target.value) || 140 })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FACTORS & EMERGENCY */}
          {activeSubTab === 'factors' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm">Insulin-Wirkdauer &amp; Timer</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">
                      Wirkdauer Analoginsulin (für IOB):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        max="6"
                        value={formData.activeInsulinDurationHours}
                        onChange={(e) =>
                          setFormData({ ...formData, activeInsulinDurationHours: parseFloat(e.target.value) || 3.5 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <span className="text-slate-400">Stunden</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">
                      Standard Mahlzeiten-Timer:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="15"
                        min="30"
                        max="240"
                        value={formData.defaultMealTimerMinutes}
                        onChange={(e) =>
                          setFormData({ ...formData, defaultMealTimerMinutes: parseInt(e.target.value) || 120 })
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                      <span className="text-slate-400">Minuten</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Card Shortcut */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-rose-300 block flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 text-rose-400" />
                    <span>Diabetes-Notfallausweis (ICE)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Notfallkontakt, Ersthelfer-Instruktionen &amp; Insulinarten
                  </span>
                </div>
                {onOpenEmergencyModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEmergencyModal();
                    }}
                    className="px-3 py-1.5 bg-rose-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-rose-400 transition-colors"
                  >
                    Öffnen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zurücksetzen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Einstellungen speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
