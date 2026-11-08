import {
  DiaryEntry,
  ActiveTimer,
  UserDiabetesProfile,
  MealTemplate,
  BasalLogEntry,
} from '../types/diabetes';

const PROFILE_KEY = 'dialog_diabetes_profile_v1';
const DIARY_KEY = 'dialog_diary_entries_v1';
const TIMERS_KEY = 'dialog_active_timers_v1';
const TEMPLATES_KEY = 'dialog_meal_templates_v1';
const BASAL_KEY = 'dialog_basal_log_v1';

export const DEFAULT_PROFILE: UserDiabetesProfile = {
  glucoseUnit: 'mg/dl',
  carbUnit: 'BE',
  gramsPerBE: 12,
  targetGlucose: 100,
  targetGlucoseMin: 80,
  targetGlucoseMax: 140,
  correctionFactor: 40, // 1 IE senkt um 40 mg/dl
  activeInsulinDurationHours: 3.5, // 3,5 Stunden Wirkdauer
  defaultMealTimerMinutes: 120, // 2 Stunden nach Mahlzeit
  factors: {
    morning: { name: 'Morgens', startHour: 6, endHour: 11, factor: 1.5 },
    noon: { name: 'Mittags', startHour: 11, endHour: 16, factor: 1.0 },
    evening: { name: 'Abends', startHour: 16, endHour: 22, factor: 1.2 },
    night: { name: 'Nachts', startHour: 22, endHour: 6, factor: 1.0 },
  },

  // Insulinpen-Settings (ICT/MDI)
  penStep: 0.5, // 0.5 IE für höchste Präzision oder 1.0 IE
  bolusPenBrand: 'Fiasp / NovoRapid Pen',
  basalPenBrand: 'Tresiba Pen',
  defaultBasalUnits: 18,
  defaultBasalTime: '22:00',
  lastBolusSite: 'abdomen_bottom_right',
  lastBasalSite: 'thigh_left',

  // Freestyle Libre 3
  cgmSensorModel: 'Freestyle Libre 3',
  libreAlarmLow: 70,
  libreAlarmHigh: 240,

  // UI & Design (optimiert für Galaxy S26 Ultra AMOLED)
  theme: 'dark',
  fontSize: 'normal',
  compactMode: false,
  hapticFeedback: true,
  bottomNavEnabled: true, // Daumenzone-Leiste unten aktiv
  emergencyCard: {
    fullName: 'Typ-1 Diabetiker',
    birthDate: '01.01.1990',
    iceName: 'Angehörige / Notfallkontakt',
    icePhone: '+49 170 1234567',
    bolusInsulinName: 'Fiasp / NovoRapid (Pen)',
    basalInsulinName: 'Tresiba (Pen 1x tgl. 22:00 Uhr)',
    diabetologistName: 'Diabetologische Schwerpunktpraxis',
    diabetologistPhone: '+49 89 123456',
    allergiesNotes: 'Sensor: Freestyle Libre 3. Bei schwerer Hypo: Baqsimi Nasenspray (3mg) & Notruf 112.',
    pumpOrPen: 'Pen',
    sensorName: 'Freestyle Libre 3',
  },
};

export function loadProfile(): UserDiabetesProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      emergencyCard: {
        ...DEFAULT_PROFILE.emergencyCard,
        ...(parsed.emergencyCard || {}),
      },
    };
  } catch (e) {
    console.error('Fehler beim Laden des Profils:', e);
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserDiabetesProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Fehler beim Speichern des Profils:', e);
  }
}

export function loadDiaryEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) {
      const sample = getInitialSampleEntries();
      saveDiaryEntries(sample);
      return sample;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Fehler beim Laden des Tagebuchs:', e);
    return [];
  }
}

export function saveDiaryEntries(entries: DiaryEntry[]): void {
  try {
    localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Fehler beim Speichern des Tagebuchs:', e);
  }
}

export function loadActiveTimers(): ActiveTimer[] {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Fehler beim Laden der Timer:', e);
    return [];
  }
}

export function saveActiveTimers(timers: ActiveTimer[]): void {
  try {
    localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
  } catch (e) {
    console.error('Fehler beim Speichern der Timer:', e);
  }
}

export function loadMealTemplates(): MealTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      const initialTemplates: MealTemplate[] = [
        {
          id: 'template-1',
          name: 'Mein Standard-Frühstück (Müsli & Banane)',
          category: 'Frühstück',
          createdAt: Date.now() - 86400000,
          meal: {
            name: 'Haferflocken-Müsli mit Banane',
            totalCarbsGrams: 48,
            source: 'favorite',
            items: [
              { id: '1', name: 'Haferflocken zart', portionGrams: 50, carbsGrams: 30 },
              { id: '2', name: 'Halbe Banane', portionGrams: 50, carbsGrams: 10 },
              { id: '3', name: 'Haferdrink', portionGrams: 120, carbsGrams: 8 },
            ],
            glycemicIndex: 'mittel',
          },
        },
        {
          id: 'template-2',
          name: 'Pizza Margherita (FPE-behaftet)',
          category: 'Abendessen',
          createdAt: Date.now() - 43200000,
          meal: {
            name: 'Pizza Margherita Restaurant',
            totalCarbsGrams: 85,
            fatGrams: 28,
            proteinGrams: 22,
            source: 'favorite',
            items: [
              { id: 'p1', name: 'Pizza Margherita normal', portionGrams: 350, carbsGrams: 85 },
            ],
            fpe: {
              fpeCount: 3.2,
              fpeCarbEquivalent: 3.2,
              delayHours: 5,
            },
            glycemicIndex: 'hoch',
            diabeticAdvice: 'Verzögerter Bolus empfohlen (Split 60% sofort, 40% nach 3 Stunden)',
          },
        },
      ];
      saveMealTemplates(initialTemplates);
      return initialTemplates;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Fehler beim Laden der Vorlagen:', e);
    return [];
  }
}

export function saveMealTemplates(templates: MealTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Fehler beim Speichern der Vorlagen:', e);
  }
}

export function loadBasalLog(): BasalLogEntry[] {
  try {
    const raw = localStorage.getItem(BASAL_KEY);
    if (!raw) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const initialBasal: BasalLogEntry[] = [
        {
          id: 'basal-yesterday',
          dateStr: yesterday,
          timeStr: '22:05',
          timestamp: Date.now() - 86400000 + 1000,
          units: 18,
          brand: 'Tresiba Pen',
          injectionSite: 'thigh_left',
        },
      ];
      saveBasalLog(initialBasal);
      return initialBasal;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Fehler beim Laden des Basal-Logs:', e);
    return [];
  }
}

export function saveBasalLog(entries: BasalLogEntry[]): void {
  try {
    localStorage.setItem(BASAL_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Fehler beim Speichern des Basal-Logs:', e);
  }
}

function getInitialSampleEntries(): DiaryEntry[] {
  const now = Date.now();
  const hour = 3600 * 1000;

  return [
    {
      id: 'sample-1',
      timestamp: now - 1.5 * hour,
      glucose: 138,
      glucoseUnit: 'mg/dl',
      trend: 'slight_up',
      meal: {
        name: 'Müsli mit Banane & Hafermilch',
        totalCarbsGrams: 52,
        sugarGrams: 16,
        proteinGrams: 11,
        fatGrams: 8,
        caloriesKcal: 360,
        source: 'manual',
        items: [
          { id: '1', name: 'Haferflocken', portionGrams: 50, carbsGrams: 30 },
          { id: '2', name: 'Banane', portionGrams: 60, carbsGrams: 12 },
          { id: '3', name: 'Haferdrink', portionGrams: 150, carbsGrams: 10 },
        ],
        glycemicIndex: 'mittel',
      },
      carbAmountInUnit: 4.3,
      carbUnit: 'BE',
      calculatedMealInsulin: 6.5,
      calculatedCorrectionInsulin: 0.9,
      calculatedTotalInsulin: 7.4,
      roundedPenInsulin: 7.5,
      insulinOnBoardSubtracted: 0,
      injectedInsulin: 7.5,
      injectionSite: 'abdomen_bottom_right',
      insulinType: 'Normal/Analog',
      notes: 'Morgens, vor der Arbeit',
      tags: ['Frühstück'],
    },
    {
      id: 'sample-2',
      timestamp: now - 14 * hour,
      glucose: 112,
      glucoseUnit: 'mg/dl',
      trend: 'flat',
      meal: {
        name: 'Vollkornbrot mit Käse & Gurke',
        totalCarbsGrams: 38,
        sugarGrams: 3,
        proteinGrams: 16,
        fatGrams: 14,
        caloriesKcal: 370,
        source: 'preset',
        items: [
          { id: '4', name: 'Vollkornbrot (2 Scheiben)', portionGrams: 100, carbsGrams: 38 },
        ],
        glycemicIndex: 'niedrig',
      },
      carbAmountInUnit: 3.2,
      carbUnit: 'BE',
      calculatedMealInsulin: 3.8,
      calculatedCorrectionInsulin: 0.3,
      calculatedTotalInsulin: 4.1,
      roundedPenInsulin: 4.0,
      insulinOnBoardSubtracted: 0,
      injectedInsulin: 4.0,
      injectionSite: 'abdomen_top_left',
      insulinType: 'Normal/Analog',
      notes: 'Abendbrot',
      tags: ['Abendessen'],
    },
    {
      id: 'sample-3',
      timestamp: now - 22 * hour,
      glucose: 95,
      glucoseUnit: 'mg/dl',
      trend: 'flat',
      meal: {
        name: 'Spaghetti Napoli mit Parmesan',
        totalCarbsGrams: 65,
        sugarGrams: 7,
        proteinGrams: 18,
        fatGrams: 12,
        caloriesKcal: 460,
        source: 'photo_ai',
        items: [
          { id: '5', name: 'Pasta gekocht', portionGrams: 220, carbsGrams: 60 },
          { id: '6', name: 'Tomatensauce', portionGrams: 100, carbsGrams: 5 },
        ],
        glycemicIndex: 'mittel',
      },
      carbAmountInUnit: 5.4,
      carbUnit: 'BE',
      calculatedMealInsulin: 5.4,
      calculatedCorrectionInsulin: 0,
      calculatedTotalInsulin: 5.4,
      roundedPenInsulin: 5.5,
      insulinOnBoardSubtracted: 0,
      injectedInsulin: 5.5,
      injectionSite: 'abdomen_bottom_left',
      insulinType: 'Normal/Analog',
      notes: 'Mittagspause',
      tags: ['Mittagessen'],
    },
  ];
}
