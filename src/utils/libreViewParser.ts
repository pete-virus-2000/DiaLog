import { DiaryEntry, GlucoseUnit } from '../types/diabetes';

/**
 * Parst exportierte CSV-Dateien aus Abbott LibreView / Freestyle Libre 3
 */
export function parseLibreViewCSV(csvContent: string, defaultUnit: GlucoseUnit = 'mg/dl'): {
  entries: DiaryEntry[];
  totalParsed: number;
  dateRange: string;
} {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Die CSV-Datei enthält keine Datenzeilen.');
  }

  // Find header row (usually line 1 or line 2)
  let headerIndex = -1;
  let delimiter = ';';

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (l.includes(';') || l.includes(',')) {
      if (l.toLowerCase().includes('zeit') || l.toLowerCase().includes('time') || l.toLowerCase().includes('glukose') || l.toLowerCase().includes('glucose')) {
        headerIndex = i;
        delimiter = l.includes(';') ? ';' : ',';
        break;
      }
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
    delimiter = lines[0].includes(';') ? ';' : ',';
  }

  const headerCols = lines[headerIndex]
    .split(delimiter)
    .map((c) => c.replace(/"/g, '').trim().toLowerCase());

  // Find column indices
  // German LibreView headers:
  // "Gerätezeitstempel", "Aufzeichnungstyp", "Glukosewert-Verlauf mg/dL", "Glukose-Scan mg/dL", "Nicht numerische Schnelle Kohlenhydrate", "Schnell wirkendes Insulin (Einheiten)"
  const timeIdx = headerCols.findIndex(
    (c) => c.includes('zeit') || c.includes('time') || c.includes('datum') || c.includes('date')
  );
  const glucoseHistIdx = headerCols.findIndex(
    (c) => (c.includes('glukose') || c.includes('glucose')) && (c.includes('verlauf') || c.includes('historic'))
  );
  const glucoseScanIdx = headerCols.findIndex(
    (c) => (c.includes('glukose') || c.includes('glucose')) && (c.includes('scan') || !c.includes('verlauf'))
  );
  const carbsIdx = headerCols.findIndex(
    (c) => c.includes('kohlenhydrat') || c.includes('carb')
  );
  const insulinIdx = headerCols.findIndex(
    (c) => c.includes('insulin') || c.includes('bolus')
  );

  const parsedEntries: DiaryEntry[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = rawLine.split(delimiter).map((c) => c.replace(/"/g, '').trim());

    // Extract Timestamp
    let timestamp = Date.now();
    const timeStr = cols[timeIdx] || '';
    if (timeStr) {
      // Formats: DD.MM.YYYY HH:MM or YYYY-MM-DD HH:MM
      if (timeStr.includes('.')) {
        const parts = timeStr.split(' ');
        const dateParts = parts[0].split('.');
        if (dateParts.length === 3) {
          const formatted = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}T${parts[1] || '12:00'}:00`;
          const parsedMs = Date.parse(formatted);
          if (!isNaN(parsedMs)) timestamp = parsedMs;
        }
      } else {
        const parsedMs = Date.parse(timeStr);
        if (!isNaN(parsedMs)) timestamp = parsedMs;
      }
    }

    // Extract Glucose
    let rawGlucose: number | undefined;
    const scanVal = glucoseScanIdx !== -1 ? parseFloat(cols[glucoseScanIdx].replace(',', '.')) : NaN;
    const histVal = glucoseHistIdx !== -1 ? parseFloat(cols[glucoseHistIdx].replace(',', '.')) : NaN;

    if (!isNaN(scanVal) && scanVal > 0) {
      rawGlucose = scanVal;
    } else if (!isNaN(histVal) && histVal > 0) {
      rawGlucose = histVal;
    }

    // Extract Carbs
    let carbs = 0;
    if (carbsIdx !== -1) {
      const c = parseFloat(cols[carbsIdx].replace(',', '.'));
      if (!isNaN(c) && c > 0) carbs = c;
    }

    // Extract Insulin
    let insulin = 0;
    if (insulinIdx !== -1) {
      const ins = parseFloat(cols[insulinIdx].replace(',', '.'));
      if (!isNaN(ins) && ins > 0) insulin = ins;
    }

    if (rawGlucose !== undefined || carbs > 0 || insulin > 0) {
      parsedEntries.push({
        id: `libreview-${timestamp}-${i}`,
        timestamp,
        glucose: rawGlucose,
        glucoseUnit: defaultUnit,
        carbAmountInUnit: Math.round((carbs / 12) * 10) / 10,
        carbUnit: 'BE',
        calculatedMealInsulin: 0,
        calculatedCorrectionInsulin: 0,
        calculatedTotalInsulin: insulin,
        roundedPenInsulin: insulin,
        insulinOnBoardSubtracted: 0,
        injectedInsulin: insulin,
        meal: carbs > 0
          ? {
              name: 'Freestyle Libre Eintrag',
              totalCarbsGrams: carbs,
              items: [{ id: `c-${i}`, name: 'Kohlenhydrate', portionGrams: carbs, carbsGrams: carbs }],
              source: 'manual',
            }
          : undefined,
        tags: ['LibreView'],
      });
    }
  }

  // Sort by timestamp descending
  parsedEntries.sort((a, b) => b.timestamp - a.timestamp);

  const dateRange = parsedEntries.length > 0
    ? `${new Date(parsedEntries[parsedEntries.length - 1].timestamp).toLocaleDateString('de-DE')} bis ${new Date(parsedEntries[0].timestamp).toLocaleDateString('de-DE')}`
    : 'Keine';

  return {
    entries: parsedEntries,
    totalParsed: parsedEntries.length,
    dateRange,
  };
}
