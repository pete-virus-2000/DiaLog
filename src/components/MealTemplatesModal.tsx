import React, { useState } from 'react';
import {
  Star,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Utensils,
  Search,
  Sparkles,
} from 'lucide-react';
import { MealRecord, MealTemplate, UserDiabetesProfile } from '../types/diabetes';
import { carbsGramsToUnit } from '../utils/diabetesCalculations';

interface MealTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MealTemplate[];
  onSelectTemplate: (meal: MealRecord) => void;
  onDeleteTemplate: (id: string) => void;
  onAddTemplate: (name: string, category: string, meal: MealRecord) => void;
  currentMeal: MealRecord | null;
  profile: UserDiabetesProfile;
}

export const MealTemplatesModal: React.FC<MealTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
  onDeleteTemplate,
  onAddTemplate,
  currentMeal,
  profile,
}) => {
  const [search, setSearch] = useState('');
  const [showSaveCurrentForm, setShowSaveCurrentForm] = useState(false);
  const [templateName, setTemplateName] = useState(currentMeal ? currentMeal.name : '');
  const [templateCategory, setTemplateCategory] = useState('Favoriten');

  if (!isOpen) return null;

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMeal || !templateName.trim()) return;

    onAddTemplate(templateName.trim(), templateCategory, currentMeal);
    setShowSaveCurrentForm(false);
  };

  const carbUnitLabel = profile.carbUnit === 'g_KH' ? 'g KH' : profile.carbUnit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Mahlzeiten-Vorlagen &amp; Favoriten
              </h2>
              <p className="text-xs text-slate-400">Speichere und lade deine Standardmahlzeiten mit 1 Klick</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Option: Save current active meal as template */}
          {currentMeal && !showSaveCurrentForm && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-teal-300 block">Aktuelle Mahlzeit als Vorlage speichern:</span>
                <span className="text-slate-300 text-[11px]">
                  {currentMeal.name} ({currentMeal.totalCarbsGrams}g KH)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTemplateName(currentMeal.name);
                  setShowSaveCurrentForm(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Als Vorlage sichern</span>
              </button>
            </div>
          )}

          {showSaveCurrentForm && currentMeal && (
            <form onSubmit={handleSaveCurrentAsTemplate} className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 space-y-3 animate-fade-in">
              <h4 className="font-bold text-white">Neue Vorlage sichern</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Vorlagen-Name:</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-teal-500"
                    placeholder="z.B. Mein Standard-Frühstück"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Kategorie:</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                  >
                    <option value="Frühstück">Frühstück</option>
                    <option value="Mittagessen">Mittagessen</option>
                    <option value="Abendessen">Abendessen</option>
                    <option value="Snacks &amp; Süßes">Snacks &amp; Süßes</option>
                    <option value="Favoriten">Favoriten</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveCurrentForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Vorlage speichern
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Vorlagen durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Templates list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Keine Vorlagen gefunden.
              </div>
            ) : (
              filtered.map((tpl) => {
                const carbInUnit = carbsGramsToUnit(
                  tpl.meal.totalCarbsGrams,
                  profile.carbUnit,
                  profile.gramsPerBE
                );

                return (
                  <div
                    key={tpl.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{tpl.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {tpl.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-bold text-teal-400">{tpl.meal.totalCarbsGrams}g KH</span>
                        <span>(≈ {carbInUnit} {carbUnitLabel})</span>
                        {tpl.meal.fpe && (
                          <span className="text-amber-400">• {tpl.meal.fpe.fpeCount} FPE</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(tpl.meal);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-teal-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Laden</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1.5"
                        title="Vorlage löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
