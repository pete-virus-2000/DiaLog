import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Download,
  Upload,
  Printer,
  Trash2,
  Search,
  Activity,
  Utensils,
  Syringe,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  MapPin,
} from 'lucide-react';
import { DiaryEntry, GlucoseUnit, UserDiabetesProfile } from '../types/diabetes';
import { estimateHbA1c, carbsGramsToUnit, INJECTION_SITE_LABELS } from '../utils/diabetesCalculations';
import { parseLibreViewCSV } from '../utils/libreViewParser';

interface DiaryViewProps {
  entries: DiaryEntry[];
  profile: UserDiabetesProfile;
  onDeleteEntry: (id: string) => void;
  onImportEntries: (entries: DiaryEntry[]) => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  entries,
  profile,
  onDeleteEntry,
  onImportEntries,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | 'all'>('7days');
  const [searchTerm, setSearchTerm] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;

    return entries
      .filter((e) => {
        if (filterPeriod === 'today') {
          return now - e.timestamp < oneDay;
        } else if (filterPeriod === '7days') {
          return now - e.timestamp < 7 * oneDay;
        }
        return true;
      })
      .filter((e) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const mealMatch = e.meal?.name.toLowerCase().includes(q);
        const notesMatch = e.notes?.toLowerCase().includes(q);
        const tagsMatch = e.tags?.some((t) => t.toLowerCase().includes(q));
        return mealMatch || notesMatch || tagsMatch;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, filterPeriod, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const glucoseEntries = filteredEntries.filter((e) => e.glucose !== undefined && e.glucose > 0);
    const count = glucoseEntries.length;

    if (count === 0) {
      return {
        avgGlucose: 0,
        inRangePercent: 0,
        hba1c: 0,
        totalCarbsGrams: filteredEntries.reduce((sum, e) => sum + (e.meal?.totalCarbsGrams || 0), 0),
        totalInsulin: Math.round(filteredEntries.reduce((sum, e) => sum + (e.injectedInsulin || 0), 0) * 10) / 10,
      };
    }

    const minTarget = profile.targetGlucoseMin;
    const maxTarget = profile.targetGlucoseMax;

    let inRangeCount = 0;
    let sumGlucoseMgDl = 0;

    glucoseEntries.forEach((e) => {
      const g = e.glucose!;
      if (g >= minTarget && g <= maxTarget) {
        inRangeCount++;
      }
      const valMgDl = profile.glucoseUnit === 'mg/dl' ? g : g * 18.018;
      sumGlucoseMgDl += valMgDl;
    });

    const avg = Math.round((glucoseEntries.reduce((s, e) => s + e.glucose!, 0) / count) * 10) / 10;
    const avgMgDl = sumGlucoseMgDl / count;
    const inRangePct = Math.round((inRangeCount / count) * 100);
    const estimatedA1c = estimateHbA1c(avgMgDl);

    const totalCarbs = filteredEntries.reduce((sum, e) => sum + (e.meal?.totalCarbsGrams || 0), 0);
    const totalInsulin = Math.round(filteredEntries.reduce((sum, e) => sum + (e.injectedInsulin || 0), 0) * 10) / 10;

    return {
      avgGlucose: avg,
      inRangePercent: inRangePct,
      hba1c: estimatedA1c,
      totalCarbsGrams: Math.round(totalCarbs),
      totalInsulin,
    };
  }, [filteredEntries, profile]);

  // Export as JSON
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DiaLog_Diabetes_Tagebuch_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as CSV
  const exportCSV = () => {
    const headers = [
      'Datum',
      'Uhrzeit',
      `Glukose (${profile.glucoseUnit})`,
      'Freestyle Libre 3 Trend',
      'Mahlzeit',
      'Kohlenhydrate (g)',
      `Kohlenhydrate (${profile.carbUnit})`,
      'Gespritztes Insulin (IE)',
      'Berechnetes Insulin (IE)',
      'Injektionsstelle',
      'Notizen',
    ];

    const rows = entries.map((e) => {
      const d = new Date(e.timestamp);
      const dateStr = d.toLocaleDateString('de-DE');
      const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      return [
        `"${dateStr}"`,
        `"${timeStr}"`,
        e.glucose || '',
        `"${e.trend || ''}"`,
        `"${(e.meal?.name || '').replace(/"/g, '""')}"`,
        e.meal?.totalCarbsGrams || 0,
        e.carbAmountInUnit || 0,
        e.injectedInsulin || 0,
        e.calculatedTotalInsulin || 0,
        `"${e.injectionSite ? INJECTION_SITE_LABELS[e.injectionSite]?.label : ''}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DiaLog_Libre3_Tagebuch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // File import supporting JSON and LibreView CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        if (file.name.endsWith('.csv') || text.includes(';') || text.includes(',')) {
          // Parse as LibreView CSV
          const { entries: imported, totalParsed, dateRange } = parseLibreViewCSV(text, profile.glucoseUnit);
          onImportEntries([...imported, ...entries]);
          setImportMessage(`${totalParsed} Freestyle Libre 3 Einträge erfolgreich importiert (${dateRange})!`);
          setTimeout(() => setImportMessage(null), 5000);
        } else {
          // Parse as JSON
          const imported = JSON.parse(text);
          if (Array.isArray(imported)) {
            onImportEntries(imported);
            setImportMessage(`${imported.length} Einträge aus Backup importiert!`);
            setTimeout(() => setImportMessage(null), 4000);
          }
        }
      } catch (err: any) {
        alert(`Fehler beim Import: ${err.message || 'Ungültiges Dateiformat'}`);
      }
    };
    reader.readAsText(file);
  };

  const carbUnitLabel = profile.carbUnit === 'g_KH' ? 'g KH' : profile.carbUnit;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* SECTION 1: Summary Statistics Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" />
              <span>Diabetes-Tagebuch &amp; Verlauf</span>
            </h2>
            <p className="text-xs text-slate-400">
              Dokumentation von Freestyle Libre 3 Werten, Mahlzeiten &amp; Pen-Injektionen
            </p>
          </div>

          {/* Export & Import Tools */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="p-2 rounded-xl bg-teal-500/15 hover:bg-teal-500 text-teal-300 hover:text-slate-950 text-xs font-semibold flex items-center gap-1.5 border border-teal-500/30 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
              <span>LibreView / CSV Import</span>
            </label>

            <button
              onClick={exportCSV}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="CSV für Excel oder Diabetologen exportieren"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            <button
              onClick={exportJSON}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              title="Backup als JSON speichern"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              title="Tagebuch drucken"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {importMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400">Time in Range</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {stats.inRangePercent}%
            </div>
            <span className="text-[10px] text-slate-500">Ziel: 70–180 {profile.glucoseUnit}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400">Ø Glukose</span>
            <div className="text-xl font-black text-white mt-1">
              {stats.avgGlucose || '-'}{' '}
              <span className="text-xs font-normal text-slate-400">{profile.glucoseUnit}</span>
            </div>
            <span className="text-[10px] text-teal-400 font-semibold">
              ≈ {stats.hba1c ? `${stats.hba1c}% GMI/HbA1c` : 'Keine BZ-Daten'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400">Kohlenhydrate</span>
            <div className="text-xl font-black text-teal-400 mt-1">
              {stats.totalCarbsGrams} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
            <span className="text-[10px] text-slate-500">
              ≈ {carbsGramsToUnit(stats.totalCarbsGrams, profile.carbUnit, profile.gramsPerBE)}{' '}
              {carbUnitLabel}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400">Gesamt-Insulin</span>
            <div className="text-xl font-black text-cyan-400 mt-1">
              {stats.totalInsulin} <span className="text-xs font-normal text-slate-400">IE</span>
            </div>
            <span className="text-[10px] text-slate-500">im gewählten Zeitraum</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterPeriod('today')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === 'today'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => setFilterPeriod('7days')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === '7days'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Letzte 7 Tage
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === 'all'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Alle ({entries.length})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tagebuch durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: List of Diary Entries */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm">
            Keine Einträge für diesen Zeitraum gefunden.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const dateObj = new Date(entry.timestamp);
            const dateLabel = dateObj.toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            });
            const timeLabel = dateObj.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isHypo = entry.glucose && entry.glucose < (profile.glucoseUnit === 'mg/dl' ? 70 : 3.9);
            const isHyper = entry.glucose && entry.glucose > (profile.glucoseUnit === 'mg/dl' ? 180 : 10.0);

            return (
              <div
                key={entry.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all text-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{timeLabel} Uhr</span>
                    <span className="text-slate-500 text-[11px]">• {dateLabel}</span>
                    {entry.trend && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-bold border border-slate-700 text-[10px]">
                        Libre 3 Trend: {entry.trend}
                      </span>
                    )}
                    {entry.meal?.source === 'photo_ai' && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold">
                        KI-Foto
                      </span>
                    )}
                    {entry.meal?.source === 'barcode' && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                        Barcode
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                    title="Eintrag löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Entry content: BZ + Meal + Insulin */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Blutzucker */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">
                        Freestyle Libre 3 Glukose
                      </span>
                      {entry.glucose ? (
                        <div
                          className={`font-black text-base ${
                            isHypo ? 'text-rose-400' : isHyper ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {entry.glucose}{' '}
                          <span className="text-[11px] font-medium text-slate-400">
                            {entry.glucoseUnit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Nicht gemessen</span>
                      )}
                    </div>
                    {entry.glucose && (
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isHypo ? 'bg-rose-500' : isHyper ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    )}
                  </div>

                  {/* Mahlzeit & Kohlenhydrate */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Mahlzeit
                    </span>
                    <div className="font-bold text-slate-200 truncate mt-0.5">
                      {entry.meal?.name || 'Keine Mahlzeit'}
                    </div>
                    {entry.meal && (
                      <div className="text-[11px] text-teal-400 font-semibold">
                        {entry.meal.totalCarbsGrams}g KH ({entry.carbAmountInUnit} {carbUnitLabel})
                      </div>
                    )}
                  </div>

                  {/* Pen-Insulin & Spritzstelle */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">
                        Pen-Injektion
                      </span>
                      <div className="font-black text-base text-cyan-300">
                        {entry.injectedInsulin} <span className="text-[11px] font-normal text-slate-400">IE</span>
                      </div>
                      {entry.injectionSite && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          📍 {INJECTION_SITE_LABELS[entry.injectionSite]?.label}
                        </span>
                      )}
                    </div>
                    <Syringe className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                </div>

                {/* Notes or Split-Bolus details */}
                {(entry.notes || entry.splitBolus) && (
                  <div className="pt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                    {entry.splitBolus && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        ⏱️ Split: {entry.splitBolus.immediate} IE sofort / {entry.splitBolus.delayed} IE in{' '}
                        {entry.splitBolus.delayMinutes}m
                      </span>
                    )}
                    {entry.notes && <span className="italic">"{entry.notes}"</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
