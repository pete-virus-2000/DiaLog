import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, MainTabType } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { BolusCalculator } from './components/BolusCalculator';
import { BloodGlucoseChart } from './components/BloodGlucoseChart';
import { BasalPenTracker } from './components/BasalPenTracker';
import { FoodInputModal } from './components/FoodInputModal';
import { TimersManager } from './components/TimersManager';
import { FactorAssistant } from './components/FactorAssistant';
import { DiaryView } from './components/DiaryView';
import { FPECalculatorModal } from './components/FPECalculatorModal';
import { MealTemplatesModal } from './components/MealTemplatesModal';
import { EmergencyCardModal } from './components/EmergencyCardModal';
import { HypoHelperModal } from './components/HypoHelperModal';
import { SettingsModal } from './components/SettingsModal';
import { DifficultMealsView } from './components/DifficultMealsView';
import {
  ActiveTimer,
  AppTheme,
  BasalLogEntry,
  DiaryEntry,
  EmergencyCard,
  MealRecord,
  MealTemplate,
  UserDiabetesProfile,
} from './types/diabetes';
import {
  loadActiveTimers,
  loadBasalLog,
  loadDiaryEntries,
  loadMealTemplates,
  loadProfile,
  saveActiveTimers,
  saveBasalLog,
  saveDiaryEntries,
  saveMealTemplates,
  saveProfile,
} from './utils/storage';
import { calculateIOB } from './utils/diabetesCalculations';

export default function App() {
  // Global Profile State
  const [profile, setProfile] = useState<UserDiabetesProfile>(loadProfile);

  // Diary Entries
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(loadDiaryEntries);

  // Basal Pen Log
  const [basalLog, setBasalLog] = useState<BasalLogEntry[]>(loadBasalLog);

  // Active Timers
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>(loadActiveTimers);

  // Meal Templates / Favorites
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(loadMealTemplates);

  // Current Meal for Bolus Calculator
  const [currentMeal, setCurrentMeal] = useState<MealRecord | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTabType>('calculator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isFPEModalOpen, setIsFPEModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isHypoModalOpen, setIsHypoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Clock tick for IOB & timers
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Update theme helper
  const handleUpdateTheme = (newTheme: AppTheme) => {
    const updated = { ...profile, theme: newTheme };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleUpdateProfile = (newProfile: UserDiabetesProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const handleSaveEmergencyCard = (card: EmergencyCard) => {
    const updated = { ...profile, emergencyCard: card };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleAddDiaryEntry = (entry: DiaryEntry) => {
    const updated = [entry, ...diaryEntries];
    setDiaryEntries(updated);
    saveDiaryEntries(updated);
  };

  const handleDeleteDiaryEntry = (id: string) => {
    const updated = diaryEntries.filter((e) => e.id !== id);
    setDiaryEntries(updated);
    saveDiaryEntries(updated);
  };

  const handleImportDiaryEntries = (imported: DiaryEntry[]) => {
    setDiaryEntries(imported);
    saveDiaryEntries(imported);
  };

  const handleAddBasalEntry = (entry: BasalLogEntry) => {
    const updated = [entry, ...basalLog];
    setBasalLog(updated);
    saveBasalLog(updated);

    // Also add to main diary so the doctor sees it in the CSV / logbook!
    const diaryItem: DiaryEntry = {
      id: `diary-basal-${Date.now()}`,
      timestamp: entry.timestamp,
      glucoseUnit: profile.glucoseUnit,
      carbAmountInUnit: 0,
      carbUnit: profile.carbUnit,
      calculatedMealInsulin: 0,
      calculatedCorrectionInsulin: 0,
      calculatedTotalInsulin: entry.units,
      roundedPenInsulin: entry.units,
      insulinOnBoardSubtracted: 0,
      injectedInsulin: entry.units,
      injectionSite: entry.injectionSite,
      insulinType: 'Basal',
      notes: `${entry.brand} Basal-Injektion`,
      tags: ['Basal', 'Pen'],
    };
    handleAddDiaryEntry(diaryItem);
  };

  const handleAddTimer = (timer: ActiveTimer) => {
    const updated = [...activeTimers, timer];
    setActiveTimers(updated);
    saveActiveTimers(updated);
  };

  const handleRemoveTimer = (id: string) => {
    const updated = activeTimers.filter((t) => t.id !== id);
    setActiveTimers(updated);
    saveActiveTimers(updated);
  };

  const handleAddMealTemplate = (name: string, category: string, meal: MealRecord) => {
    const newTemplate: MealTemplate = {
      id: `template-${Date.now()}`,
      name,
      category,
      meal,
      createdAt: Date.now(),
    };
    const updated = [newTemplate, ...mealTemplates];
    setMealTemplates(updated);
    saveMealTemplates(updated);
  };

  const handleDeleteMealTemplate = (id: string) => {
    const updated = mealTemplates.filter((t) => t.id !== id);
    setMealTemplates(updated);
    saveMealTemplates(updated);
  };

  // Hypo 15-minute quick timer trigger
  const handleStartHypoTimer = () => {
    const timestamp = Date.now();
    const newTimer: ActiveTimer = {
      id: `timer-hypo-${timestamp}`,
      label: '🚨 Hypo-Check (15-Minuten-Regel)',
      type: 'hypo_check',
      targetTimestamp: timestamp + 15 * 60 * 1000,
      totalDurationSeconds: 15 * 60,
      createdAt: timestamp,
    };
    handleAddTimer(newTimer);
    setActiveTab('timers');
  };

  // FPE application into current meal
  const handleApplyFPE = (fpeCarbsGrams: number, delayMinutes: number, name: string) => {
    const updatedMeal: MealRecord = currentMeal || {
      name,
      totalCarbsGrams: fpeCarbsGrams,
      items: [{ id: `fpe-${Date.now()}`, name, portionGrams: 250, carbsGrams: fpeCarbsGrams }],
      source: 'manual',
    };

    updatedMeal.fpe = {
      fpeCount: Math.round((fpeCarbsGrams / profile.gramsPerBE) * 10) / 10,
      fpeCarbEquivalent: Math.round((fpeCarbsGrams / profile.gramsPerBE) * 10) / 10,
      delayHours: Math.round((delayMinutes / 60) * 10) / 10,
    };

    setCurrentMeal(updatedMeal);
    setActiveTab('calculator');
  };

  // Calculate current IOB
  const currentIOB = calculateIOB(diaryEntries, profile.activeInsulinDurationHours, now);

  const themeClass = `theme-${profile.theme}`;
  const fontClass = `font-size-${profile.fontSize}`;

  return (
    <div className={`min-h-screen ${themeClass} ${fontClass} flex font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200`}>
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTimers={activeTimers}
        iob={currentIOB}
        profile={profile}
        onUpdateTheme={handleUpdateTheme}
        onOpenHypoModal={() => setIsHypoModalOpen(true)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'} pb-14 lg:pb-0`}>
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          activeTimers={activeTimers}
          iob={currentIOB}
          glucoseUnit={profile.glucoseUnit}
          profile={profile}
          onUpdateTheme={handleUpdateTheme}
          onOpenHypoModal={() => setIsHypoModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Dynamic Main Body Content */}
        <main className={`flex-1 max-w-5xl w-full mx-auto px-3 sm:px-5 ${profile.compactMode ? 'py-3' : 'py-4 sm:py-5'}`}>
          {activeTab === 'calculator' && (
            <BolusCalculator
              profile={profile}
              diaryEntries={diaryEntries}
              onAddDiaryEntry={handleAddDiaryEntry}
              onAddTimer={handleAddTimer}
              onOpenFoodModal={() => setIsFoodModalOpen(true)}
              onOpenFPEModal={() => setIsFPEModalOpen(true)}
              onOpenFavoritesModal={() => setIsFavoritesModalOpen(true)}
              currentMeal={currentMeal}
              onClearMeal={() => setCurrentMeal(null)}
              onOpenHypoModal={() => setIsHypoModalOpen(true)}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'food_guide' && (
            <DifficultMealsView
              profile={profile}
              onSelectDish={(meal) => {
                setCurrentMeal(meal);
                setActiveTab('calculator');
              }}
            />
          )}

          {activeTab === 'chart' && (
            <BloodGlucoseChart
              entries={diaryEntries}
              profile={profile}
            />
          )}

          {activeTab === 'basal' && (
            <BasalPenTracker
              basalLog={basalLog}
              onAddBasalEntry={handleAddBasalEntry}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'timers' && (
            <TimersManager
              timers={activeTimers}
              onAddTimer={handleAddTimer}
              onRemoveTimer={handleRemoveTimer}
              onTimerCompleteAction={() => setActiveTab('calculator')}
            />
          )}

          {activeTab === 'factors' && (
            <FactorAssistant
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'diary' && (
            <DiaryView
              entries={diaryEntries}
              profile={profile}
              onDeleteEntry={handleDeleteDiaryEntry}
              onImportEntries={handleImportDiaryEntries}
            />
          )}

          {activeTab === 'fpe' && (
            <div className="py-4">
              <FPECalculatorModal
                isOpen={true}
                onClose={() => setActiveTab('calculator')}
                profile={profile}
                onApplyFPEToMeal={handleApplyFPE}
              />
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="py-4">
              <MealTemplatesModal
                isOpen={true}
                onClose={() => setActiveTab('calculator')}
                templates={mealTemplates}
                onSelectTemplate={(m) => {
                  setCurrentMeal(m);
                  setActiveTab('calculator');
                }}
                onDeleteTemplate={handleDeleteMealTemplate}
                onAddTemplate={handleAddMealTemplate}
                currentMeal={currentMeal}
                profile={profile}
              />
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="py-4">
              <EmergencyCardModal
                isOpen={true}
                onClose={() => setActiveTab('calculator')}
                profile={profile}
                onSaveCard={handleSaveEmergencyCard}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="py-4">
              <SettingsModal
                isOpen={true}
                onClose={() => setActiveTab('calculator')}
                profile={profile}
                onSaveProfile={handleUpdateProfile}
                onOpenEmergencyModal={() => setActiveTab('emergency')}
              />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Daumenzone für Galaxy S26 Ultra) */}
        {profile.bottomNavEnabled !== false && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeTimers={activeTimers}
            onOpenFoodModal={() => setIsFoodModalOpen(true)}
            hapticEnabled={profile.hapticFeedback}
          />
        )}

        {/* Food Input Modal (Photo / Barcode / Manual) */}
        <FoodInputModal
          isOpen={isFoodModalOpen}
          onClose={() => setIsFoodModalOpen(false)}
          onSaveMeal={(meal) => setCurrentMeal(meal)}
          profile={profile}
        />

        {/* FPE Calculator Modal (when triggered from calculator) */}
        {isFPEModalOpen && activeTab !== 'fpe' && (
          <FPECalculatorModal
            isOpen={isFPEModalOpen}
            onClose={() => setIsFPEModalOpen(false)}
            profile={profile}
            onApplyFPEToMeal={handleApplyFPE}
          />
        )}

        {/* Favorites / Templates Modal (when triggered from calculator) */}
        {isFavoritesModalOpen && activeTab !== 'favorites' && (
          <MealTemplatesModal
            isOpen={isFavoritesModalOpen}
            onClose={() => setIsFavoritesModalOpen(false)}
            templates={mealTemplates}
            onSelectTemplate={(m) => {
              setCurrentMeal(m);
              setIsFavoritesModalOpen(false);
            }}
            onDeleteTemplate={handleDeleteMealTemplate}
            onAddTemplate={handleAddMealTemplate}
            currentMeal={currentMeal}
            profile={profile}
          />
        )}

        {/* Emergency Modal (when triggered from elsewhere) */}
        {isEmergencyModalOpen && activeTab !== 'emergency' && (
          <EmergencyCardModal
            isOpen={isEmergencyModalOpen}
            onClose={() => setIsEmergencyModalOpen(false)}
            profile={profile}
            onSaveCard={handleSaveEmergencyCard}
          />
        )}

        {/* Hypo Helper Modal (15/15 Rule) */}
        <HypoHelperModal
          isOpen={isHypoModalOpen}
          onClose={() => setIsHypoModalOpen(false)}
          onStartHypoTimer={handleStartHypoTimer}
        />

        {/* Settings Modal (when triggered from header) */}
        {isSettingsModalOpen && activeTab !== 'settings' && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            profile={profile}
            onSaveProfile={handleUpdateProfile}
            onOpenEmergencyModal={() => {
              setIsSettingsModalOpen(false);
              setActiveTab('emergency');
            }}
          />
        )}

        {/* Medical Safety Disclaimer Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-3 px-4 text-center text-[11px] text-slate-500 mt-auto hidden lg:block">
          <div className="max-w-2xl mx-auto space-y-0.5">
            <p>
              DiaLog – Typ 1 Diabetes Suite • Optimiert für Freestyle Libre 3, Pen-Therapie &amp; Galaxy S26 Ultra.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
