import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  AlertTriangle,
  Info,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { DIFFICULT_MEALS_DATABASE, DifficultDish } from '../data/difficultMealsGuide';
import { MealRecord, UserDiabetesProfile } from '../types/diabetes';
import { carbsGramsToUnit } from '../utils/diabetesCalculations';

interface DifficultMealsViewProps {
  profile: UserDiabetesProfile;
  onSelectDish: (meal: MealRecord) => void;
}

export const DifficultMealsView: React.FC<DifficultMealsViewProps> = ({
  profile,
  onSelectDish,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [expandedId, setExpandedId] = useState<string | null>('diff_doener_fladenbrot');

  const categories = [
    'Alle',
    'Imbiss & Fast Food',
    'Asiatisch & Wok',
    'Italienisch & Pizza',
    'Hausmannskost & Deftig',
    'Bäckerei & Café',
    'International',
  ];

  const filteredDishes = DIFFICULT_MEALS_DATABASE.filter((dish) => {
    const matchesCat = selectedCategory === 'Alle' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(search.toLowerCase()) ||
      dish.hiddenCarbsExplanation.toLowerCase().includes(search.toLowerCase()) ||
      dish.diabeticTrap.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyDish = (dish: DifficultDish) => {
    const meal: MealRecord = {
      name: dish.name,
      totalCarbsGrams: dish.typicalCarbsGrams,
      minCarbsGrams: dish.carbRange.min,
      maxCarbsGrams: dish.carbRange.max,
      hiddenCarbsWarning: dish.hiddenCarbsExplanation,
      source: 'difficult_dish',
      glycemicIndex: dish.glycemicIndex,
      diabeticAdvice: `${dish.diabeticTrap} Empfehlung: ${dish.recommendedStrategy}`,
      items: dish.components.map((c, i) => ({
        id: `diff-${Date.now()}-${i}`,
        name: c.name,
        portionGrams: c.portionGrams,
        carbsGrams: c.carbsGrams,
        note: c.note,
      })),
    };
    onSelectDish(meal);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Spickzettel für schwer einzuschätzende Mahlzeiten
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Speziell entwickelt für Gerichte, bei denen Typ-1-Diabetiker am häufigsten fehlschätzen:
              Versteckte Zucker in Soßen, Teigmengen bei Döner &amp; Fladenbrot, Panaden und der berüchtigte
              Pizza-Effekt (Fett-Protein-Verzögerung).
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Categories */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Gericht oder Zutat suchen (z.B. Döner, Wok, Panade, Franzbrötchen, Pizza)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Cards */}
      <div className="space-y-3">
        {filteredDishes.map((dish) => {
          const isExpanded = expandedId === dish.id;
          const carbUnitVal = carbsGramsToUnit(dish.typicalCarbsGrams, profile.carbUnit, profile.gramsPerBE);

          return (
            <div
              key={dish.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-xl overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : dish.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white">{dish.name}</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                      {dish.typicalCarbsGrams}g KH ({carbUnitVal} {profile.carbUnit === 'g_KH' ? 'g' : profile.carbUnit})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Spanne: {dish.carbRange.min}–{dish.carbRange.max}g
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {dish.hiddenCarbsExplanation}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyDish(dish);
                    }}
                    className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">In Bolus-Rechner</span>
                    <span className="sm:hidden">Bolus</span>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-white"
                    title={isExpanded ? 'Einklappen' : 'Details anzeigen'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detailed breakdown */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-3 text-xs">
                  {/* Where are hidden carbs */}
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25 text-amber-200">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
                      <Search className="w-3.5 h-3.5" />
                      <span>Wo verstecken sich die Kohlenhydrate?</span>
                    </div>
                    <p className="leading-relaxed">{dish.hiddenCarbsExplanation}</p>
                  </div>

                  {/* Diabetic trap */}
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/25 text-rose-200">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Typ-1-Tücke (BZ-Verlauf &amp; Fett-Verzögerung):</span>
                    </div>
                    <p className="leading-relaxed">{dish.diabeticTrap}</p>
                  </div>

                  {/* Clinical Strategy */}
                  <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/25 text-teal-200">
                    <div className="font-bold text-teal-300 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Empfohlene Spritz- &amp; Bolus-Strategie:</span>
                    </div>
                    <p className="leading-relaxed">{dish.recommendedStrategy}</p>
                  </div>

                  {/* Components */}
                  <div>
                    <h5 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-1.5">
                      Zutaten &amp; Portionszerlegung ({dish.typicalPortionGrams}g Portion):
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dish.components.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-200 block">{comp.name}</span>
                            {comp.note && <span className="text-[10px] text-slate-400">{comp.note}</span>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-bold text-teal-400 font-mono">{comp.carbsGrams}g KH</span>
                            <span className="text-[10px] text-slate-400 block">({comp.portionGrams}g)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleApplyDish(dish)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Gericht mit {dish.typicalCarbsGrams}g KH in Bolus-Rechner übernehmen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
