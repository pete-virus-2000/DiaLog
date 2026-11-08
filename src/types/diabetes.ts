/**
 * Typ-Definitionen für DiaLog (Typ 1 Diabetes Manager)
 * Optimiert für Samsung Galaxy S26 Ultra, Freestyle Libre 3 und Insulinpens (ICT/MDI)
 */

export type GlucoseUnit = 'mg/dl' | 'mmol/l';
export type CarbUnit = 'BE' | 'KE' | 'g_KH'; // BE = Broteinheit (meist 12g), KE = Kohlenhydrateinheit (10g), g_KH = Gramm

export type AppTheme = 'dark' | 'light' | 'oled' | 'ocean' | 'emerald' | 'contrast';
export type FontSizeSetting = 'normal' | 'large' | 'xl';

// Freestyle Libre 3 offizielle Trendpfeile
export type GlucoseTrend =
  | 'double_up'    // ⇈ / ⬆️ Stark steigend (> 2.0 mg/dl/min)
  | 'up'           // ↑ Steigend (1.0 bis 2.0 mg/dl/min)
  | 'slight_up'    // ↗ Leicht steigend
  | 'flat'         // → Stabil / gleichbleibend (< 1.0 mg/dl/min)
  | 'slight_down'  // ↘ Leicht fallend
  | 'down'         // ↓ Fallend (1.0 bis 2.0 mg/dl/min)
  | 'double_down'; // ⇊ / ⬇️ Stark fallend (> 2.0 mg/dl/min)

export type ActivityModifier =
  | 'normal'        // 100% Bolus
  | 'light_sport'   // z.B. Spaziergang/leichtes Training: -25%
  | 'intense_sport' // z.B. Joggen/Fahrrad: -50%
  | 'post_sport'    // Muskelauffülleffekt / Nachwirkung: -20%
  | 'illness'       // Infekt / Fieber / Stress: +25%
  | 'custom';

// Injektionsstellen für Insulinpen-Rotation (Lipohypertrophie-Schutz)
export type InjectionSite =
  | 'abdomen_top_left'     // Bauch links oben (Bolus)
  | 'abdomen_bottom_left'  // Bauch links unten (Bolus)
  | 'abdomen_top_right'    // Bauch rechts oben (Bolus)
  | 'abdomen_bottom_right' // Bauch rechts unten (Bolus)
  | 'thigh_left'           // Oberschenkel links (Basal)
  | 'thigh_right'          // Oberschenkel rechts (Basal)
  | 'buttock_left'         // Gesäß links
  | 'buttock_right';       // Gesäß rechts

export interface TimeSlotFactors {
  name: string;
  startHour: number; // e.g. 6
  endHour: number;   // e.g. 11
  factor: number;    // IE per CarbUnit (z.B. 1.5 IE / BE)
}

export interface EmergencyCard {
  fullName: string;
  birthDate: string;
  iceName: string;
  icePhone: string;
  bolusInsulinName: string; // z.B. Fiasp / NovoRapid / Humalog / Lyumjev
  basalInsulinName: string; // z.B. Tresiba / Toujeo / Lantus / Levemir
  diabetologistName: string;
  diabetologistPhone: string;
  allergiesNotes: string;
  pumpOrPen: 'Pen' | 'Pumpe (AID/Kombi)' | 'Pumpe (Standard)';
  sensorName: string; // z.B. Freestyle Libre 3
}

export interface BasalLogEntry {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  units: number;   // z.B. 18 IE
  brand: string;   // z.B. Tresiba
  injectionSite?: InjectionSite;
  notes?: string;
}

export interface UserDiabetesProfile {
  glucoseUnit: GlucoseUnit;
  carbUnit: CarbUnit;
  gramsPerBE: number; // 12g standard in DE, 10g in AT/CH
  targetGlucose: number; // z.B. 100 mg/dl oder 5.6 mmol/l
  targetGlucoseMax: number; // oberer Zielbereich, z.B. 140 mg/dl
  targetGlucoseMin: number; // unterer Zielbereich, z.B. 80 mg/dl
  correctionFactor: number; // ISF: um wie viel senkt 1 IE den BZ (in GlucoseUnit, z.B. 40 mg/dl oder 2.2 mmol/l)
  activeInsulinDurationHours: number; // Wirkdauer des Analoginsulins (z.B. 3.5 Stunden)
  defaultMealTimerMinutes: number; // Standard-Erinnerung nach Mahlzeit (z.B. 120 Min)
  factors: {
    morning: TimeSlotFactors;   // 06:00 - 11:00
    noon: TimeSlotFactors;      // 11:00 - 16:00
    evening: TimeSlotFactors;   // 16:00 - 22:00
    night: TimeSlotFactors;     // 22:00 - 06:00
  };

  // Insulinpen-Konfiguration (ICT / MDI)
  penStep: 0.5 | 1.0; // 0.5 IE (Junior/Halbeinheiten-Pen) oder 1.0 IE (Standard Erwachsenen-Pen)
  bolusPenBrand: string; // z.B. "Fiasp" oder "NovoRapid"
  basalPenBrand: string; // z.B. "Tresiba", "Lantus", "Toujeo"
  defaultBasalUnits: number; // z.B. 18 IE
  defaultBasalTime: string; // z.B. "22:00"
  lastBolusSite?: InjectionSite;
  lastBasalSite?: InjectionSite;

  // Freestyle Libre 3 Spezifika
  cgmSensorModel: 'Freestyle Libre 3' | 'Dexcom G7' | 'Sonstige';
  libreAlarmLow: number;  // Standard 70 mg/dl
  libreAlarmHigh: number; // Standard 240 mg/dl

  // UI & Design Preferences (optimiert für Galaxy S26 Ultra AMOLED)
  theme: AppTheme;
  fontSize: FontSizeSetting;
  compactMode: boolean;
  hapticFeedback: boolean;
  bottomNavEnabled: boolean; // Daumen-Navigation unten für große Bildschirme
  emergencyCard: EmergencyCard;
}

export interface FoodComponent {
  id: string;
  name: string;
  portionGrams: number;
  carbsGrams: number;
  sugarGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  note?: string;
}

export interface MealRecord {
  name: string;
  totalCarbsGrams: number;
  minCarbsGrams?: number;
  maxCarbsGrams?: number;
  hiddenCarbsWarning?: string;
  sugarGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  caloriesKcal?: number;
  items: FoodComponent[];
  photoUrl?: string;
  photos?: string[]; // Multiple photos of the meal (top view, side view, etc.)
  detectedReferenceNote?: string; // Note if banknote/card/coin was detected for scale
  source: 'manual' | 'photo_ai' | 'barcode' | 'preset' | 'favorite' | 'nutrition_label' | 'visual_guide' | 'difficult_dish';
  diabeticAdvice?: string;
  glycemicIndex?: 'niedrig' | 'mittel' | 'hoch';
  recommendedSEA?: number; // Empfohlener Spritz-Ess-Abstand in Minuten
  fpe?: {
    fpeCount: number; // Fett-Protein-Einheiten
    fpeCarbEquivalent: number; // BE/KE Äquivalent
    delayHours: number; // Empfohlene Verzögerung (z.B. 4-6h)
  };
}

export interface AIInjectionAdvice {
  headline: string;
  seaMinutes: number;
  seaAdvice: string;
  splitBolusRecommended: boolean;
  splitImmediateUnits?: number;
  splitDelayedUnits?: number;
  splitDelayMinutes?: number;
  splitExplanation?: string;
  recommendedSite: string;
  siteRotationReason?: string;
  penTechniqueTips: string[];
  trendWarning?: string;
  keyTakeaway: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  category: string;
  meal: MealRecord;
  createdAt: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  type: 'post_meal' | 'correction' | 'hypo_check' | 'basal' | 'sea_delay' | 'fpe_delay' | 'custom';
  targetTimestamp: number; // epoch ms
  totalDurationSeconds: number;
  createdAt: number;
  soundPlayed?: boolean;
}

export interface DiaryEntry {
  id: string;
  timestamp: number;
  glucose?: number; // gemessener Blutzucker in GlucoseUnit
  glucoseUnit: GlucoseUnit;
  trend?: GlucoseTrend;
  trendDeltaIE?: number;
  meal?: MealRecord;
  carbAmountInUnit: number; // BE, KE oder g_KH
  carbUnit: CarbUnit;
  calculatedMealInsulin: number; // IE
  calculatedCorrectionInsulin: number; // IE
  calculatedTotalInsulin: number; // IE
  roundedPenInsulin: number; // Exakt auf Pen-Schritte gerundet (z.B. 4.5 IE oder 5.0 IE)
  insulinOnBoardSubtracted: number; // IE
  injectedInsulin: number; // tatsächlich gespritzt
  injectionSite?: InjectionSite; // Einstichstelle
  activityModifier?: ActivityModifier;
  insulinType?: 'Normal/Analog' | 'Korrektur' | 'Basal' | 'Kombi';
  splitBolus?: {
    immediate: number;
    delayed: number;
    delayMinutes: number;
  };
  notes?: string;
  tags?: string[];
}

export interface FoodPreset {
  id: string;
  name: string;
  category: string;
  carbsPer100g: number;
  standardPortionGrams: number;
  standardPortionLabel: string;
  proteinPer100g?: number;
  fatPer100g?: number;
}
