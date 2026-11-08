import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Volume2,
  Syringe,
  ShieldAlert,
  Play,
  Pause,
} from 'lucide-react';
import { ActiveTimer } from '../types/diabetes';
import { playGentleReminderSound, playAlertChime } from '../utils/audioAlert';

interface TimersManagerProps {
  timers: ActiveTimer[];
  onAddTimer: (timer: ActiveTimer) => void;
  onRemoveTimer: (id: string) => void;
  onTimerCompleteAction?: () => void;
}

export const TimersManager: React.FC<TimersManagerProps> = ({
  timers,
  onAddTimer,
  onRemoveTimer,
  onTimerCompleteAction,
}) => {
  const [now, setNow] = useState(Date.now());
  const [customLabel, setCustomLabel] = useState('');
  const [customMinutes, setCustomMinutes] = useState('120');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if any timer expired and trigger sound once
  useEffect(() => {
    timers.forEach((timer) => {
      const remaining = timer.targetTimestamp - now;
      if (remaining <= 0 && remaining > -10000 && !timer.soundPlayed) {
        if (timer.type === 'hypo_check') {
          playAlertChime();
        } else {
          playGentleReminderSound();
        }
        timer.soundPlayed = true;

        // Try Web Notification API if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('DiaLog Erinnerung', {
            body: `${timer.label}: Zeit den Blutzucker zu messen!`,
            icon: '/favicon.ico',
          });
        }
      }
    });
  }, [now, timers]);

  // Request browser notification permission if not yet decided
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const addPresetTimer = (label: string, minutes: number, type: ActiveTimer['type']) => {
    const timestamp = Date.now();
    const newTimer: ActiveTimer = {
      id: `timer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      label,
      type,
      targetTimestamp: timestamp + minutes * 60 * 1000,
      totalDurationSeconds: minutes * 60,
      createdAt: timestamp,
    };
    onAddTimer(newTimer);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins <= 0) return;

    addPresetTimer(customLabel.trim() || 'Blutzucker messen', mins, 'custom');
    setCustomLabel('');
    setShowAddCustom(false);
  };

  const formatRemaining = (ms: number) => {
    if (ms <= 0) return '00:00 - FÄLLIG!';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Banner & Fast Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              <span>Blutzucker- &amp; Insulin-Erinnerungen</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatische Timer nach Mahlzeiten, Korrekturbolus oder Hypoglykämie
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playGentleReminderSound()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Signalton testen"
            >
              <Volume2 className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Ton testen</span>
            </button>
            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Eigener Timer</span>
            </button>
          </div>
        </div>

        {/* Custom Timer Drawer */}
        {showAddCustom && (
          <form onSubmit={handleAddCustom} className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/30 space-y-3 animate-fade-in text-xs">
            <h4 className="font-bold text-white">Neuen Timer erstellen</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Erinnerungstext (z.B. BZ nach Pizza / vor dem Sport)"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-center font-bold focus:outline-none focus:border-teal-500"
                />
                <span className="text-slate-400">Minuten</span>
                <button
                  type="submit"
                  className="ml-auto px-3 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Starten
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Quick-Start Preset Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Schnellstart-Timer:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => addPresetTimer('Postprandiale BZ-Messung (2h)', 120, 'post_meal')}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-teal-500/40"
            >
              <div className="font-bold text-slate-200">🍽️ Nach Mahlzeit</div>
              <div className="text-[11px] text-teal-400 font-semibold mt-0.5">+2 Stunden</div>
            </button>

            <button
              onClick={() => addPresetTimer('Früher BZ-Check (1,5h)', 90, 'post_meal')}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-teal-500/40"
            >
              <div className="font-bold text-slate-200">⚡ Schneller Check</div>
              <div className="text-[11px] text-teal-400 font-semibold mt-0.5">+1,5 Stunden</div>
            </button>

            <button
              onClick={() => addPresetTimer('Korrektur-Kontrolle (2h)', 120, 'correction')}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-teal-500/40"
            >
              <div className="font-bold text-slate-200">🩹 Korrektur-Check</div>
              <div className="text-[11px] text-amber-400 font-semibold mt-0.5">+2 Stunden</div>
            </button>

            <button
              onClick={() => addPresetTimer('🚨 Hypo-Kontrolle (15-Minuten-Regel)', 15, 'hypo_check')}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all"
            >
              <div className="font-bold text-rose-300">🚨 Hypo-Check</div>
              <div className="text-[11px] text-rose-400 font-semibold mt-0.5">+15 Minuten</div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Timers List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
          <span>Laufende &amp; Fällige Timer ({timers.length})</span>
          {timers.length > 0 && (
            <button
              onClick={requestNotificationPermission}
              className="text-xs text-teal-400 hover:underline"
            >
              Browser-Benachrichtigungen erlauben
            </button>
          )}
        </h3>

        {timers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">Zurzeit sind keine Timer aktiv</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sobald du im Bolusrechner eine Mahlzeit oder ein Insulinprotokoll speicherst, wird auf Wunsch automatisch ein 2-Stunden-Timer für die Kontrollmessung gestartet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {timers.map((timer) => {
              const remainingMs = timer.targetTimestamp - now;
              const isExpired = remainingMs <= 0;
              const elapsedSeconds = (now - timer.createdAt) / 1000;
              const progressPercent = Math.min(
                100,
                Math.max(0, (elapsedSeconds / timer.totalDurationSeconds) * 100)
              );

              return (
                <div
                  key={timer.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isExpired
                      ? 'bg-rose-500/15 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-950/40'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpired
                            ? 'bg-rose-500 text-slate-950 font-black'
                            : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        }`}
                      >
                        {isExpired ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{timer.label}</div>
                        <div className="text-xs text-slate-400">
                          {isExpired
                            ? 'Messung jetzt fällig!'
                            : `Fällig um: ${new Date(timer.targetTimestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} Uhr`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`font-mono font-black text-base sm:text-lg ${
                            isExpired ? 'text-rose-400' : 'text-teal-400'
                          }`}
                        >
                          {formatRemaining(remainingMs)}
                        </div>
                      </div>

                      {isExpired && onTimerCompleteAction && (
                        <button
                          type="button"
                          onClick={() => {
                            onTimerCompleteAction();
                            onRemoveTimer(timer.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-md shadow-teal-500/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Jetzt BZ messen</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveTimer(timer.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Timer entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!isExpired && (
                    <div className="mt-3 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
