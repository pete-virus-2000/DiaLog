import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Calendar,
  Info,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
} from 'lucide-react';
import { DiaryEntry, GlucoseUnit, UserDiabetesProfile } from '../types/diabetes';
import { estimateHbA1c } from '../utils/diabetesCalculations';

interface BloodGlucoseChartProps {
  entries: DiaryEntry[];
  profile: UserDiabetesProfile;
}

export const BloodGlucoseChart: React.FC<BloodGlucoseChartProps> = ({
  entries,
  profile,
}) => {
  const [rangeHours, setRangeHours] = useState<24 | 48 | 168>(24); // 24h, 48h, 7 Tage (168h)
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const now = Date.now();
  const startTime = now - rangeHours * 3600 * 1000;

  // Filter entries in timeframe having a glucose reading
  const chartData = useMemo(() => {
    return entries
      .filter((e) => e.timestamp >= startTime && e.glucose !== undefined && e.glucose > 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [entries, startTime]);

  // Statistics for this timeframe
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        tir: 0,
        tbr: 0, // Time below range (< 70)
        tar: 0, // Time above range (> 180)
        sd: 0,  // Standard deviation
        cv: 0,  // Coefficient of variation
        gmi: 0,
      };
    }

    const values = chartData.map((e) => e.glucose!);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const hypoLimit = profile.glucoseUnit === 'mg/dl' ? 70 : 3.9;
    const hyperLimit = profile.glucoseUnit === 'mg/dl' ? 180 : 10.0;

    let inRange = 0;
    let belowRange = 0;
    let aboveRange = 0;

    values.forEach((v) => {
      if (v < hypoLimit) belowRange++;
      else if (v > hyperLimit) aboveRange++;
      else inRange++;
    });

    const tir = Math.round((inRange / values.length) * 100);
    const tbr = Math.round((belowRange / values.length) * 100);
    const tar = Math.round((aboveRange / values.length) * 100);

    // Standard deviation
    const variance =
      values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
    const sd = Math.round(Math.sqrt(variance) * 10) / 10;
    const cv = avg > 0 ? Math.round((sd / avg) * 100) : 0; // Target %CV < 36%

    // GMI / HbA1c
    const avgMgDl = profile.glucoseUnit === 'mg/dl' ? avg : avg * 18.018;
    const gmi = estimateHbA1c(avgMgDl);

    return {
      count: values.length,
      avg,
      min,
      max,
      tir,
      tbr,
      tar,
      sd,
      cv,
      gmi,
    };
  }, [chartData, profile]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Y-Scale boundaries
  const yMin = profile.glucoseUnit === 'mg/dl' ? 40 : 2.2;
  const yMax = profile.glucoseUnit === 'mg/dl' ? 300 : 16.6;

  const targetMin = profile.targetGlucoseMin; // z.B. 80
  const targetMax = profile.targetGlucoseMax; // z.B. 140
  const hypoLine = profile.glucoseUnit === 'mg/dl' ? 70 : 3.9;
  const hyperLine = profile.glucoseUnit === 'mg/dl' ? 180 : 10.0;

  const scaleX = (timestamp: number) => {
    const ratio = (timestamp - startTime) / (now - startTime);
    return padding.left + ratio * graphWidth;
  };

  const scaleY = (glucose: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, glucose));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return padding.top + (1 - ratio) * graphHeight;
  };

  // Build path for points
  const points = chartData.map((d) => ({
    x: scaleX(d.timestamp),
    y: scaleY(d.glucose!),
    entry: d,
  }));

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              <span>Blutzuckerverlauf &amp; CGM-Kurve</span>
            </h2>
            <p className="text-xs text-slate-400">
              Visualisierung deiner Glukosewerte mit Zielbereichsband ({profile.targetGlucoseMin}–{profile.targetGlucoseMax} {profile.glucoseUnit})
            </p>
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setRangeHours(24)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                rangeHours === 24 ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              24 Std.
            </button>
            <button
              onClick={() => setRangeHours(48)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                rangeHours === 48 ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              48 Std.
            </button>
            <button
              onClick={() => setRangeHours(168)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                rangeHours === 168 ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Tage
            </button>
          </div>
        </div>

        {/* 4 Clinical Diabetes Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 font-medium">Time in Range (TIR)</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{stats.tir}%</div>
            <span className="text-[10px] text-slate-500">Ziel: &gt; 70%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 font-medium">Ø Glukose (GMI)</span>
            <div className="text-xl font-black text-white mt-0.5">
              {stats.avg || '-'}{' '}
              <span className="text-xs font-normal text-slate-400">{profile.glucoseUnit}</span>
            </div>
            <span className="text-[10px] text-teal-400 font-semibold">
              ≈ {stats.gmi ? `${stats.gmi}% HbA1c` : 'Keine Daten'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 font-medium">Variabilität (%CV)</span>
            <div className={`text-xl font-black mt-0.5 ${stats.cv <= 36 ? 'text-teal-400' : 'text-amber-400'}`}>
              {stats.cv}%
            </div>
            <span className="text-[10px] text-slate-500">
              {stats.cv <= 36 ? 'Stabil (Ziel ≤ 36%)' : 'Erhöhte Schwankung'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 font-medium">Hypo / Hyper</span>
            <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-2">
              <span className="text-rose-400">{stats.tbr}% Tief</span>
              <span>•</span>
              <span className="text-amber-400">{stats.tar}% Hoch</span>
            </div>
            <span className="text-[10px] text-slate-500">Ziel TBR &lt; 4%</span>
          </div>
        </div>

        {/* SVG Graph View */}
        <div className="relative bg-slate-950 rounded-xl p-2 border border-slate-800 overflow-x-auto">
          {chartData.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Keine Blutzuckerwerte im gewählten Zeitraum vorhanden.
            </div>
          ) : (
            <div className="min-w-[600px]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
                <defs>
                  {/* Target green band gradient */}
                  <linearGradient id="targetBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                  </linearGradient>

                  {/* Curve gradient */}
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>

                {/* Target Range Band (e.g. 70 - 180 or profile limits) */}
                <rect
                  x={padding.left}
                  y={scaleY(hyperLine)}
                  width={graphWidth}
                  height={Math.max(0, scaleY(hypoLine) - scaleY(hyperLine))}
                  fill="url(#targetBandGrad)"
                />

                {/* Target Band Guidelines */}
                <line
                  x1={padding.left}
                  y1={scaleY(hyperLine)}
                  x2={svgWidth - padding.right}
                  y2={scaleY(hyperLine)}
                  stroke="#eab308"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />
                <line
                  x1={padding.left}
                  y1={scaleY(hypoLine)}
                  x2={svgWidth - padding.right}
                  y2={scaleY(hypoLine)}
                  stroke="#f43f5e"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />

                {/* Horizontal Y-Labels */}
                <text
                  x={padding.left - 8}
                  y={scaleY(hyperLine) + 3}
                  textAnchor="end"
                  fill="#eab308"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {hyperLine}
                </text>
                <text
                  x={padding.left - 8}
                  y={scaleY(hypoLine) + 3}
                  textAnchor="end"
                  fill="#f43f5e"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {hypoLine}
                </text>
                <text
                  x={padding.left - 8}
                  y={scaleY(profile.targetGlucose) + 3}
                  textAnchor="end"
                  fill="#10b981"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {profile.targetGlucose}
                </text>

                {/* The main connecting glucose curve line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#curveGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, idx) => {
                  const val = p.entry.glucose!;
                  const isHypo = val < hypoLine;
                  const isHyper = val > hyperLine;
                  const color = isHypo ? '#f43f5e' : isHyper ? '#eab308' : '#14b8a6';

                  return (
                    <g key={p.entry.id} className="cursor-pointer">
                      {/* Outer pulse circle on hover */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint?.id === p.entry.id ? 9 : 5}
                        fill={color}
                        stroke="#0f172a"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint(p.entry)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Meal indicator if present */}
                      {p.entry.meal && (
                        <g transform={`translate(${p.x - 6}, ${padding.top - 18})`}>
                          <circle cx="6" cy="6" r="8" fill="#0f766e" stroke="#14b8a6" strokeWidth="1" />
                          <text x="6" y="9.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                            🍽️
                          </text>
                        </g>
                      )}

                      {/* Injected insulin indicator if present */}
                      {p.entry.injectedInsulin > 0 && (
                        <g transform={`translate(${p.x - 6}, ${svgHeight - padding.bottom + 6})`}>
                          <circle cx="6" cy="6" r="8" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
                          <text x="6" y="9.5" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
                            💉
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* X Axis Time Marks */}
                <line
                  x1={padding.left}
                  y1={svgHeight - padding.bottom}
                  x2={svgWidth - padding.right}
                  y2={svgHeight - padding.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                />
              </svg>

              {/* Tooltip for Hovered Reading */}
              {hoveredPoint && (
                <div className="absolute top-4 right-4 p-3 bg-slate-900 border border-teal-500 rounded-xl shadow-xl text-xs z-10 space-y-1 animate-fade-in pointer-events-none">
                  <div className="font-bold text-white">
                    {new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr
                    <span className="text-slate-400 font-normal ml-2">
                      ({new Date(hoveredPoint.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })})
                    </span>
                  </div>
                  <div className="text-base font-black text-teal-400">
                    {hoveredPoint.glucose} {hoveredPoint.glucoseUnit}
                  </div>
                  {hoveredPoint.meal && (
                    <div className="text-slate-300">
                      🍽️ {hoveredPoint.meal.name} ({hoveredPoint.meal.totalCarbsGrams}g KH)
                    </div>
                  )}
                  {hoveredPoint.injectedInsulin > 0 && (
                    <div className="text-cyan-300">
                      💉 {hoveredPoint.injectedInsulin} IE gespritzt
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
