import {
  ActivityModifier,
  CarbUnit,
  DiaryEntry,
  GlucoseTrend,
  GlucoseUnit,
  InjectionSite,
  UserDiabetesProfile,
} from '../types/diabetes';

// Standardumrechnung: 1 mmol/l = 18.018 mg/dl
export const MG_DL_PER_MMOL_L = 18.018;

/**
 * Konvertiert Blutzuckerwert zwischen Einheiten
 */
export function convertGlucose(
  value: number,
  from: GlucoseUnit,
  to: GlucoseUnit
): number {
  if (from === to) return value;
  if (from === 'mg/dl' && to === 'mmol/l') {
    return Math.round((value / MG_DL_PER_MMOL_L) * 10) / 10;
  }
  if (from === 'mmol/l' && to === 'mg/dl') {
    return Math.round(value * MG_DL_PER_MMOL_L);
  }
  return value;
}

/**
 * Rechnet Gramm Kohlenhydrate in die gewählte Einheit des Nutzers um
 */
export function carbsGramsToUnit(
  grams: number,
  unit: CarbUnit,
  gramsPerBE: number = 12
): number {
  if (grams <= 0) return 0;
  if (unit === 'g_KH') {
    return Math.round(grams * 10) / 10;
  }
  if (unit === 'BE') {
    return Math.round((grams / gramsPerBE) * 10) / 10;
  }
  if (unit === 'KE') {
    return Math.round((grams / 10) * 10) / 10;
  }
  return grams;
}

/**
 * Rechnet eine Einheit (BE, KE, g KH) zurück in Gramm Kohlenhydrate
 */
export function unitToCarbsGrams(
  value: number,
  unit: CarbUnit,
  gramsPerBE: number = 12
): number {
  if (value <= 0) return 0;
  if (unit === 'g_KH') return value;
  if (unit === 'BE') return value * gramsPerBE;
  if (unit === 'KE') return value * 10;
  return value;
}

/**
 * Rundet die berechnete Dosis exakt auf die Klick-Schritte des Insulinpens (0.5 IE oder 1.0 IE)
 */
export function roundToPenStep(units: number, penStep: 0.5 | 1.0 = 0.5): number {
  if (units <= 0) return 0;
  if (penStep === 0.5) {
    return Math.round(units * 2) / 2;
  }
  return Math.round(units);
}

/**
 * Ermittelt den aktuellen Mahlzeitenfaktor basierend auf der Uhrzeit
 */
export function getCurrentTimeFactor(
  profile: UserDiabetesProfile,
  date: Date = new Date()
): { factor: number; slotName: string; timeRange: string } {
  const currentHour = date.getHours();

  if (currentHour >= 6 && currentHour < 11) {
    return {
      factor: profile.factors.morning.factor,
      slotName: 'Morgens',
      timeRange: '06:00 - 11:00 Uhr',
    };
  } else if (currentHour >= 11 && currentHour < 16) {
    return {
      factor: profile.factors.noon.factor,
      slotName: 'Mittags',
      timeRange: '11:00 - 16:00 Uhr',
    };
  } else if (currentHour >= 16 && currentHour < 22) {
    return {
      factor: profile.factors.evening.factor,
      slotName: 'Abends',
      timeRange: '16:00 - 22:00 Uhr',
    };
  } else {
    return {
      factor: profile.factors.night.factor,
      slotName: 'Nachts',
      timeRange: '22:00 - 06:00 Uhr',
    };
  }
}

/**
 * Berechnet den empfohlenen Spritz-Ess-Abstand (SEA) für Insulinpens
 * Verhindert hohe postprandiale Blutzuckerspitzen
 */
export function calculateSEA(
  currentGlucose: number | undefined,
  targetGlucose: number,
  glucoseUnit: GlucoseUnit,
  glycemicIndex: 'niedrig' | 'mittel' | 'hoch' = 'mittel'
): { minutes: number; reason: string } {
  if (currentGlucose === undefined || currentGlucose <= 0) {
    return { minutes: 10, reason: 'Standard-Spritz-Ess-Abstand bei Mahlzeiten' };
  }

  const diff = currentGlucose - targetGlucose;
  const isMgDl = glucoseUnit === 'mg/dl';
  const diffMgDl = isMgDl ? diff : diff * 18.018;

  if (diffMgDl < -20) {
    // Bei niedrigem BZ (< 80 mg/dl): KEIN SEA, sofort essen oder erst danach spritzen!
    return {
      minutes: 0,
      reason: 'Blutzucker niedrig: Sofort essen, kein Spritz-Ess-Abstand!',
    };
  } else if (diffMgDl > 80) {
    // Sehr hoch (> 180 mg/dl)
    return {
      minutes: 25,
      reason: 'Blutzucker stark erhöht: 25 Min. warten, bis das Insulin anflutet.',
    };
  } else if (diffMgDl > 40) {
    // Leicht erhöht (140 - 180 mg/dl)
    return {
      minutes: 15,
      reason: 'Blutzucker leicht erhöht: 15 Min. Spritz-Ess-Abstand empfohlen.',
    };
  } else {
    // Im Zielbereich
    const baseMinutes = glycemicIndex === 'hoch' ? 15 : 10;
    return {
      minutes: baseMinutes,
      reason:
        glycemicIndex === 'hoch'
          ? 'Schnelle Kohlenhydrate: 15 Min. Vorlaufzeit empfohlen.'
          : 'Blutzucker im Zielbereich: 10 Min. SEA optimal.',
    };
  }
}

/**
 * Rotiert Injektionsstellen (Schutz vor Lipodystrophie / Spritzhügeln)
 */
export const INJECTION_SITE_LABELS: Record<InjectionSite, { label: string; area: 'Bauch' | 'Bein' | 'Gesäß'; sub: string }> = {
  abdomen_top_left: { label: 'Bauch links oben', area: 'Bauch', sub: 'Schnellste Resorption (Bolus)' },
  abdomen_top_right: { label: 'Bauch rechts oben', area: 'Bauch', sub: 'Schnellste Resorption (Bolus)' },
  abdomen_bottom_right: { label: 'Bauch rechts unten', area: 'Bauch', sub: 'Schnellste Resorption (Bolus)' },
  abdomen_bottom_left: { label: 'Bauch links unten', area: 'Bauch', sub: 'Schnellste Resorption (Bolus)' },
  thigh_left: { label: 'Oberschenkel links', area: 'Bein', sub: 'Langsame Resorption (Basal)' },
  thigh_right: { label: 'Oberschenkel rechts', area: 'Bein', sub: 'Langsame Resorption (Basal)' },
  buttock_left: { label: 'Gesäß links', area: 'Gesäß', sub: 'Verzögerte Resorption' },
  buttock_right: { label: 'Gesäß rechts', area: 'Gesäß', sub: 'Verzögerte Resorption' },
};

export function getNextRecommendedBolusSite(lastSite?: InjectionSite): InjectionSite {
  const bolusCycle: InjectionSite[] = [
    'abdomen_top_left',
    'abdomen_top_right',
    'abdomen_bottom_right',
    'abdomen_bottom_left',
  ];
  if (!lastSite || !bolusCycle.includes(lastSite)) return 'abdomen_top_left';
  const idx = bolusCycle.indexOf(lastSite);
  return bolusCycle[(idx + 1) % bolusCycle.length];
}

export function getNextRecommendedBasalSite(lastSite?: InjectionSite): InjectionSite {
  return lastSite === 'thigh_left' ? 'thigh_right' : 'thigh_left';
}

/**
 * Freestyle Libre 3 Trend-Pfeil Anpassung
 */
export function getTrendDeltaIE(trend?: GlucoseTrend, isf: number = 40): number {
  if (!trend || trend === 'flat') return 0;

  const factor = isf > 0 ? 40 / isf : 1;

  switch (trend) {
    case 'double_up':
      return Math.round(1.5 * factor * 10) / 10;
    case 'up':
      return Math.round(1.0 * factor * 10) / 10;
    case 'slight_up':
      return Math.round(0.5 * factor * 10) / 10;
    case 'slight_down':
      return Math.round(-0.5 * factor * 10) / 10;
    case 'down':
      return Math.round(-1.0 * factor * 10) / 10;
    case 'double_down':
      return Math.round(-1.5 * factor * 10) / 10;
    default:
      return 0;
  }
}

/**
 * Aktivitäts-Multiplikator
 */
export function getActivityMultiplier(modifier: ActivityModifier): {
  multiplier: number;
  label: string;
  description: string;
} {
  switch (modifier) {
    case 'light_sport':
      return {
        multiplier: 0.75,
        label: 'Leichter Sport (-25%)',
        description: 'Spaziergang, leichtes Radfahren oder Yoga',
      };
    case 'intense_sport':
      return {
        multiplier: 0.5,
        label: 'Intensiver Sport (-50%)',
        description: 'Joggen, Fußball, HIIT oder Kraftsport',
      };
    case 'post_sport':
      return {
        multiplier: 0.8,
        label: 'Nachwirkung Sport (-20%)',
        description: 'Muskelauffülleffekt nach dem Training',
      };
    case 'illness':
      return {
        multiplier: 1.25,
        label: 'Infekt / Krankheit (+25%)',
        description: 'Fieber, Erkältung oder starker Stress',
      };
    case 'normal':
    default:
      return {
        multiplier: 1.0,
        label: 'Normal (100%)',
        description: 'Normale Alltagsaktivität',
      };
  }
}

/**
 * Berechnet das noch aktive Insulin (Insulin on Board - IOB)
 */
export function calculateIOB(
  entries: DiaryEntry[],
  activeDurationHours: number,
  nowTimestamp: number = Date.now()
): number {
  const activeDurationMs = activeDurationHours * 60 * 60 * 1000;
  let totalIOB = 0;

  for (const entry of entries) {
    const elapsedMs = nowTimestamp - entry.timestamp;
    if (elapsedMs > 0 && elapsedMs < activeDurationMs && entry.injectedInsulin > 0) {
      const remainingFraction = 1 - elapsedMs / activeDurationMs;
      totalIOB += entry.injectedInsulin * remainingFraction;
    }
  }

  return Math.round(totalIOB * 10) / 10;
}

/**
 * Haupt-Bolusberechnung für Typ-1-Diabetes
 */
export interface BolusCalculationResult {
  mealInsulin: number;
  correctionInsulin: number;
  trendAdjustmentIE: number;
  rawTotalInsulin: number;
  iob: number;
  recommendedTotalInsulin: number;
  roundedPenInsulin: number; // Exakter Klick-Wert für den Insulinpen
  currentGlucose: number | null;
  targetGlucose: number;
  glucoseDiff: number | null;
  isHypo: boolean;
  isHyper: boolean;
  advice: string;
  recommendedSEA: number;
  seaReason: string;
}

export function calculateBolus(params: {
  currentGlucose?: number;
  totalCarbsGrams: number;
  profile: UserDiabetesProfile;
  activeEntries: DiaryEntry[];
  customFactor?: number;
  trend?: GlucoseTrend;
  activityModifier?: ActivityModifier;
}): BolusCalculationResult {
  const {
    currentGlucose,
    totalCarbsGrams,
    profile,
    activeEntries,
    customFactor,
    trend = 'flat',
    activityModifier = 'normal',
  } = params;

  // 1. Kohlenhydrate in gewählte Einheit umrechnen
  const carbInUnit = carbsGramsToUnit(totalCarbsGrams, profile.carbUnit, profile.gramsPerBE);

  // 2. Mahlzeitenfaktor bestimmen
  const timeFactor = customFactor !== undefined ? customFactor : getCurrentTimeFactor(profile).factor;
  let mealInsulin = carbInUnit * timeFactor;

  // Aktivitäts-Multiplikator anwenden
  const activity = getActivityMultiplier(activityModifier);
  mealInsulin = mealInsulin * activity.multiplier;
  mealInsulin = Math.round(mealInsulin * 10) / 10;

  // 3. Korrektur berechnen
  let correctionInsulin = 0;
  let glucoseDiff: number | null = null;
  let isHypo = false;
  let isHyper = false;

  const hypoThreshold = profile.glucoseUnit === 'mg/dl' ? 70 : 3.9;
  const hyperThreshold = profile.glucoseUnit === 'mg/dl' ? 200 : 11.1;

  if (currentGlucose !== undefined && currentGlucose > 0) {
    glucoseDiff = Math.round((currentGlucose - profile.targetGlucose) * 10) / 10;

    if (currentGlucose < hypoThreshold) {
      isHypo = true;
    } else if (currentGlucose > hyperThreshold) {
      isHyper = true;
    }

    if (profile.correctionFactor > 0) {
      correctionInsulin = Math.round((glucoseDiff / profile.correctionFactor) * 10) / 10;
    }
  }

  // 4. Freestyle Libre 3 Trend Anpassung
  const trendAdjustmentIE = getTrendDeltaIE(trend, profile.correctionFactor);

  // 5. IOB ermitteln
  const iob = calculateIOB(activeEntries, profile.activeInsulinDurationHours);

  // 6. Gesamtsumme
  let rawTotal = mealInsulin + correctionInsulin + trendAdjustmentIE;
  let recommended = rawTotal - iob;

  if (isHypo) {
    recommended = Math.max(0, mealInsulin * 0.6);
  } else {
    recommended = Math.max(0, Math.round(recommended * 10) / 10);
  }

  // Rundung auf echte Insulinpen-Schritte (0.5 oder 1.0 IE)
  const roundedPenInsulin = roundToPenStep(recommended, profile.penStep || 0.5);

  // Spritz-Ess-Abstand (SEA)
  const sea = calculateSEA(currentGlucose, profile.targetGlucose, profile.glucoseUnit);

  // Empfehlungstext
  let advice = '';
  if (isHypo) {
    advice = '⚠️ ACHTUNG: Hypoglykämie! Vor dem Spritzen zuerst schnelle Kohlenhydrate einnehmen und 15 Min. warten!';
  } else if (isHyper) {
    advice = '⚠️ Blutzucker stark erhöht. Prüfe ggf. Ketone und trinke reichlich Wasser. Korrekturbolus beachten.';
  } else if (activityModifier !== 'normal') {
    advice = `🏃 Aktivitätsanpassung aktiv: ${activity.label} berücksichtigt.`;
  } else if (iob > 1.0) {
    advice = `ℹ️ Es sind noch ca. ${iob} IE aktives Insulin vorhanden (IOB). Dieses wurde abgezogen, um Insulin-Stacking zu verhindern.`;
  } else {
    advice = 'Blutzucker und Mahlzeit sind abgestimmt.';
  }

  return {
    mealInsulin,
    correctionInsulin,
    trendAdjustmentIE,
    rawTotalInsulin: rawTotal,
    iob,
    recommendedTotalInsulin: recommended,
    roundedPenInsulin,
    currentGlucose: currentGlucose ?? null,
    targetGlucose: profile.targetGlucose,
    glucoseDiff,
    isHypo,
    isHyper,
    advice,
    recommendedSEA: sea.minutes,
    seaReason: sea.reason,
  };
}

/**
 * FPE Warschauer Formel
 */
export function calculateFPE(fatGrams: number, proteinGrams: number): {
  fpeCount: number;
  kcalFromFatAndProtein: number;
  delayHours: number;
  advice: string;
} {
  const kcal = Math.round(fatGrams * 9 + proteinGrams * 4);
  const fpeCount = Math.round((kcal / 100) * 10) / 10;

  let delayHours = 3;
  if (fpeCount >= 3) {
    delayHours = 6;
  } else if (fpeCount >= 2) {
    delayHours = 5;
  } else if (fpeCount >= 1) {
    delayHours = 4;
  }

  let advice = '';
  if (fpeCount >= 1) {
    advice = `Diese Mahlzeit enthält ${fpeCount} FPE (ca. ${kcal} kcal aus Fett & Eiweiß). Gib den FPE-Bolus als verzögerten Bolus über ${delayHours} Stunden ab.`;
  } else {
    advice = 'Geringer Fett- und Eiweißanteil. Ein Standardbolus ist ausreichend.';
  }

  return {
    fpeCount,
    kcalFromFatAndProtein: kcal,
    delayHours,
    advice,
  };
}

/**
 * Faktor-Assistent
 */
export interface FactorAdjustmentAdvice {
  oldFactor: number;
  newRecommendedFactor: number;
  deltaIE: number;
  explanation: string;
  adjustmentPercentage: number;
}

export function calculateFactorAdjustment(params: {
  preMealGlucose: number;
  postMealGlucose: number;
  targetGlucose: number;
  carbsInUnit: number;
  injectedMealInsulin: number;
  currentFactor: number;
  correctionFactor: number;
  carbUnit: CarbUnit;
  glucoseUnit: GlucoseUnit;
}): FactorAdjustmentAdvice {
  const {
    preMealGlucose,
    postMealGlucose,
    targetGlucose,
    carbsInUnit,
    injectedMealInsulin,
    currentFactor,
    correctionFactor,
    carbUnit,
    glucoseUnit,
  } = params;

  if (carbsInUnit <= 0 || correctionFactor <= 0) {
    return {
      oldFactor: currentFactor,
      newRecommendedFactor: currentFactor,
      deltaIE: 0,
      explanation: 'Bitte gib mindestens die aufgenommenen Kohlenhydrate und den Korrekturfaktor an.',
      adjustmentPercentage: 0,
    };
  }

  const diffFromTarget = postMealGlucose - targetGlucose;
  const deltaIE = Math.round((diffFromTarget / correctionFactor) * 10) / 10;
  const totalNeededInsulin = Math.max(0, injectedMealInsulin + deltaIE);
  const rawNewFactor = totalNeededInsulin / carbsInUnit;
  const safeNewFactor = Math.round(rawNewFactor * 100) / 100;

  const unitLabel = carbUnit === 'g_KH' ? '10g KH' : carbUnit;
  const adjustmentPercentage = Math.round(((safeNewFactor - currentFactor) / currentFactor) * 100);

  let explanation = '';
  if (Math.abs(diffFromTarget) < (glucoseUnit === 'mg/dl' ? 25 : 1.4)) {
    explanation = `Dein Blutzucker 2h nach dem Essen (${postMealGlucose} ${glucoseUnit}) war nah am Zielbereich (${targetGlucose} ${glucoseUnit}). Dein aktueller Faktor von ${currentFactor} IE / ${unitLabel} ist optimal eingestellt!`;
  } else if (diffFromTarget > 0) {
    explanation = `Dein BZ lag ${diffFromTarget} ${glucoseUnit} über dem Zielwert. Es fehlten rechnerisch ca. ${deltaIE} IE Insulin. Für die nächste vergleichbare Mahlzeit wird ein erhöhter Faktor von ca. ${safeNewFactor} IE / ${unitLabel} (+${adjustmentPercentage}%) vorgeschlagen.`;
  } else {
    explanation = `Dein BZ lag ${Math.abs(diffFromTarget)} ${glucoseUnit} unter dem Zielwert. Du hattest rechnerisch ca. ${Math.abs(deltaIE)} IE zu viel Insulin gespritzt. Ein reduzierter Faktor von ca. ${safeNewFactor} IE / ${unitLabel} (${adjustmentPercentage}%) wird empfohlen.`;
  }

  return {
    oldFactor: currentFactor,
    newRecommendedFactor: safeNewFactor,
    deltaIE,
    explanation,
    adjustmentPercentage,
  };
}

/**
 * Nathan-Formel HbA1c
 */
export function estimateHbA1c(avgGlucoseMgDl: number): number {
  if (avgGlucoseMgDl <= 0) return 0;
  const hba1c = (avgGlucoseMgDl + 46.7) / 28.7;
  return Math.round(hba1c * 10) / 10;
}
