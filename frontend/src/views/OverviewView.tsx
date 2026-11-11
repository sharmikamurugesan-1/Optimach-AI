import React, { useState } from 'react';
import { Machine, MachineEvent, SensorTelemetry } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

interface OverviewViewProps {
  machines: Machine[];
  latestTelemetry: Record<string, SensorTelemetry>;
  events: MachineEvent[];
  isSimulatedStream?: boolean;
  onSelectMachine: (machineId: string) => void;
  onNavigateToView: (view: string) => void;
  onAcknowledgeEvent?: (eventId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  machines,
  events,
  onSelectMachine,
  onNavigateToView,
  onAcknowledgeEvent
}) => {
  const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'routine'>('all');
  const [timeWindow, setTimeWindow] = useState<'24h' | 'shift' | '7d'>('24h');

  // KPI calculations
  const totalMachines = machines.length;
  const normalCount = machines.filter(m => m.status === 'normal').length;
  const warningCount = machines.filter(m => m.status === 'warning').length;
  const criticalCount = machines.filter(m => m.status === 'critical').length;

  // Dynamic Bay Health Calculations
  const bayAMachines = machines.filter(m => m.location.includes('Bay A'));
  const bayBMachines = machines.filter(m => m.location.includes('Bay B'));
  const bayCMachines = machines.filter(m => !m.location.includes('Bay A') && !m.location.includes('Bay B'));

  const rawBayA = bayAMachines.length ? Math.round(bayAMachines.reduce((acc, m) => acc + m.healthScore, 0) / bayAMachines.length) : 88;
  const rawBayB = bayBMachines.length ? Math.round(bayBMachines.reduce((acc, m) => acc + m.healthScore, 0) / bayBMachines.length) : 74;
  const rawBayC = bayCMachines.length ? Math.round(bayCMachines.reduce((acc, m) => acc + m.healthScore, 0) / bayCMachines.length) : 92;

  // Time Window modifier
  const windowShift = timeWindow === 'shift' ? -2 : (timeWindow === '7d' ? 3 : 0);
  const bayAHealth = Math.min(100, Math.max(20, rawBayA + windowShift));
  const bayBHealth = Math.min(100, Math.max(20, rawBayB + (timeWindow === 'shift' ? -4 : (timeWindow === '7d' ? 2 : 0))));
  const bayCHealth = Math.min(100, Math.max(20, rawBayC + (timeWindow === 'shift' ? 1 : (timeWindow === '7d' ? 1 : 0))));

  const dynamicFleetAvg = Math.round((bayAHealth + bayBHealth + bayCHealth) / 3);

  // Dynamic Gateway Reliability based on stream & active critical machines
  const dynamicReliability = (99.8 - (criticalCount > 0 ? 0.2 : 0) + (timeWindow === '7d' ? 0.1 : 0)).toFixed(1);

  const getHealthColor = (score: number) => {
    if (score >= 80) return { text: 'text-[#159B70]', bg: 'bg-[#159B70]' };
    if (score >= 60) return { text: 'text-[#D99117]', bg: 'bg-[#D99117]' };
    return { text: 'text-[#DC5268]', bg: 'bg-[#DC5268]' };
  };

  // Filtered Events
  const filteredEvents = events.filter(e => {
    if (activityFilter === 'critical') return e.severity === 'critical';
    if (activityFilter === 'routine') return e.severity !== 'critical';
    return true;
  });

  const handleInspect = (machineId: string) => {
    onSelectMachine(machineId);
    onNavigateToView('machines');
  };

  return (
    <div className="flex flex-col gap-7 pb-16 text-[#25213A] max-w-[1520px] mx-auto w-full">
      {/* 1. Breadcrumbs & Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#77748B] mb-1.5 font-medium">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-[#7950E8] font-semibold">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25213A]">
            Factory Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#77748B] mt-1">
            Real-time equipment surveillance and predictive health intelligence across plant bays.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#EEF4FF] border border-[#DBEAFE] text-xs font-semibold text-[#3B82F6] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>Live Stream Active</span>
          </div>

          <button
            onClick={() => onNavigateToView('live')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAE6F2] hover:border-[#7950E8] text-[#7950E8] text-xs font-bold transition-all shadow-xs hover:bg-[#F0EBFF]"
          >
            <Activity className="w-3.5 h-3.5 text-[#7950E8]" />
            <span>Open Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Total Machines */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[175px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                TOTAL MACHINES
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#3B82F6] border border-[#DBEAFE]">
                100% Online
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#25213A] tabular-nums font-mono mt-1">
              {totalMachines}
            </div>
            <p className="text-xs text-[#77748B] mt-1.5 font-medium">
              Across 3 Factory Bays
            </p>
          </div>

          {/* Mini purple bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-5 pt-2 border-t border-[#F7F6FC]">
            {[55, 75, 60, 85, 95, 80, 70, 100].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#7950E8] to-[#9258F5] rounded-t-sm" 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 2: Healthy Fleet */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[175px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                HEALTHY FLEET
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]">
                50% Nominal
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#25213A] tabular-nums font-mono mt-1">
              {normalCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1.5 font-medium">
              Within baseline tolerance
            </p>
          </div>

          {/* Mini green bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-5 pt-2 border-t border-[#F7F6FC]">
            {[90, 85, 95, 92, 88, 96, 90, 94].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-[#159B70] rounded-t-sm opacity-85" 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: Needs Attention */}
        <div className="bg-white border-2 border-[#F7D59A] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[175px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                NEEDS ATTENTION
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]">
                Early Drift
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#D99117] tabular-nums font-mono mt-1">
              {warningCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1.5 font-medium">
              Hydraulic &amp; thermal variance
            </p>
          </div>

          {/* Mini amber bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-5 pt-2 border-t border-[#F7F6FC]">
            {[30, 45, 40, 60, 55, 68, 72, 70].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-[#D99117] rounded-t-sm opacity-85" 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 4: Critical Machines */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[175px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                CRITICAL MACHINES
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]">
                Immediate Action
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#DC5268] tabular-nums font-mono mt-1">
              {criticalCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1.5 font-medium">
              High harmonic vibration risk
            </p>
          </div>

          {/* Mini red bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-5 pt-2 border-t border-[#F7F6FC]">
            {[35, 40, 50, 65, 70, 85, 90, 95].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-[#DC5268] rounded-t-sm opacity-90" 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Row 2: Fleet Operating Health (7 cols) + Priority Alerts (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fleet Operating Health & Reliability */}
        <div className="lg:col-span-7 bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1.5">
              <h2 className="text-base sm:text-lg font-bold text-[#25213A]">
                Fleet Operating Health &amp; Reliability
              </h2>
              {/* Time window selector pills */}
              <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2] self-start sm:self-auto">
                <button
                  onClick={() => setTimeWindow('24h')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    timeWindow === '24h'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  Last 24 Hours
                </button>
                <button
                  onClick={() => setTimeWindow('shift')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    timeWindow === 'shift'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  Current Shift
                </button>
                <button
                  onClick={() => setTimeWindow('7d')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    timeWindow === '7d'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  7 Days
                </button>
              </div>
            </div>

            <p className="text-xs text-[#77748B] mb-6">
              Aggregate telemetry variance and condition trends across production lines.
            </p>

            {/* Inner Health Progress Meter Container (Dynamic Real-Time) */}
            <div className="bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl p-5 sm:p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE6F2]">
                <span className="text-xs font-bold text-[#25213A] font-mono">
                  Health Index by Production Bay <span className="text-[#77748B] font-normal">({dynamicFleetAvg}% Fleet Avg)</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EEF4FF] text-[#3B82F6] border border-[#DBEAFE]">
                  {dynamicReliability}% Gateway Reliability
                </span>
              </div>

              {/* Bay A */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#25213A]">
                      Bay A — Press &amp; Precision Stamping
                    </span>
                    <span className="text-[10px] text-[#77748B] font-mono bg-white px-1.5 py-0.5 rounded border border-[#EAE6F2]">
                      {bayAMachines.length} Units
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${getHealthColor(bayAHealth).text}`}>{bayAHealth}%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className={`${getHealthColor(bayAHealth).bg} h-full rounded-full transition-all duration-700`} style={{ width: `${bayAHealth}%` }} />
                </div>
              </div>

              {/* Bay B */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#25213A]">
                      Bay B — Heavy CNC Milling Line
                    </span>
                    <span className="text-[10px] text-[#77748B] font-mono bg-white px-1.5 py-0.5 rounded border border-[#EAE6F2]">
                      {bayBMachines.length} Units
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${getHealthColor(bayBHealth).text}`}>{bayBHealth}%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className={`${getHealthColor(bayBHealth).bg} h-full rounded-full transition-all duration-700`} style={{ width: `${bayBHealth}%` }} />
                </div>
              </div>

              {/* Bay C */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#25213A]">
                      Bay C — Rotary &amp; Lathe Cells
                    </span>
                    <span className="text-[10px] text-[#77748B] font-mono bg-white px-1.5 py-0.5 rounded border border-[#EAE6F2]">
                      {bayCMachines.length} Units
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${getHealthColor(bayCHealth).text}`}>{bayCHealth}%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className={`${getHealthColor(bayCHealth).bg} h-full rounded-full transition-all duration-700`} style={{ width: `${bayCHealth}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Priority Alerts */}
        <div className="lg:col-span-5 bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FCEBED] border border-[#F6B7C1] flex items-center justify-center text-[#DC5268]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#25213A]">
                  Priority Alerts
                </h2>
              </div>
              <button 
                onClick={() => onNavigateToView('predictions')}
                className="text-xs font-semibold text-[#7950E8] hover:text-[#5630A8] transition-colors"
              >
                View All &gt;
              </button>
            </div>

            {/* Alert Cards with Spacious Padding */}
            <div className="space-y-3.5">
              {/* Alert 1 */}
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#25213A]">
                    MACH-012
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DC5268] text-white">
                    Critical
                  </span>
                </div>
                <p className="text-xs text-[#25213A]/90 font-medium leading-relaxed">
                  Bearing vibration: 53.7 mm/s (exceeds 50 mm/s threshold).
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => handleInspect('MACH-012')}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-[#FECACA] hover:border-[#DC5268] text-[#DC5268] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Inspect Machine</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#25213A]">
                    MACH-024
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D99117] text-white">
                    Needs Attention
                  </span>
                </div>
                <p className="text-xs text-[#25213A]/90 font-medium leading-relaxed">
                  Hydraulic pressure variance: 78.2 PSI.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => handleInspect('MACH-024')}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-[#FDE68A] hover:border-[#D99117] text-[#D99117] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Inspect Machine</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row 3: Recent Activity (7 cols) + AI Predictive Insight (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-7 bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#25213A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7950E8]" /> Recent Activity
                </h2>
                <p className="text-xs text-[#77748B] mt-1">
                  Latest telemetry anomalies, inspections, and maintenance events.
                </p>
              </div>

              {/* Activity filter buttons */}
              <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2] self-start sm:self-auto">
                <button
                  onClick={() => setActivityFilter('all')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    activityFilter === 'all'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActivityFilter('critical')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    activityFilter === 'critical'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  Critical
                </button>
                <button
                  onClick={() => setActivityFilter('routine')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    activityFilter === 'routine'
                      ? 'bg-[#7950E8] text-white shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  Routine
                </button>
              </div>
            </div>

            {/* Event list */}
            <div className="divide-y divide-[#F7F6FC] mt-4">
              {filteredEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-1 last:pb-1">
                  <div className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      evt.severity === 'critical' ? 'bg-[#DC5268]' :
                      evt.severity === 'warning' ? 'bg-[#D99117]' : 'bg-[#159B70]'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInspect(evt.machineId)}
                          className="font-mono text-xs font-bold text-[#7950E8] hover:underline"
                        >
                          {evt.machineId}
                        </button>
                        <span className="text-xs font-bold text-[#25213A]">{evt.title}</span>
                      </div>
                      <p className="text-xs text-[#77748B] mt-0.5 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[10px] font-mono text-[#77748B]">{evt.timestamp}</span>
                    {!evt.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeEvent?.(evt.id)}
                        className="p-1.5 rounded-lg hover:bg-[#F0EBFF] text-[#7950E8] transition-colors"
                        title="Acknowledge Alert"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI PREDICTIVE INSIGHT (Purple Gradient Card) */}
        <div className="lg:col-span-5 rounded-2xl p-7 bg-gradient-to-br from-[#7950E8] via-[#8555F5] to-[#5630A8] text-white shadow-lg flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#D8B4FE]" />
              <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-[#D8B4FE]">
                AI PREDICTIVE INSIGHT
              </span>
            </div>

            <h3 className="text-lg font-bold tracking-tight text-white mb-2 leading-snug">
              Spindle Bearing Harmonic Drift on MACH-012
            </h3>

            <p className="text-xs text-[#EAE5FF] leading-relaxed mb-6 font-normal">
              Gradient boosted ensemble flagged high harmonic vibration (&gt;54 mm/s) coupled with 84.1°C thermal buildup. Machine has entered early mechanical wear state with an estimated 7-day failure horizon.
            </p>
          </div>

          <button
            onClick={() => {
              onSelectMachine('MACH-012');
              onNavigateToView('predictions');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-[#7950E8] font-bold text-xs hover:bg-[#FAF9FF] transition-all flex items-center justify-center gap-2 shadow-md shadow-black/10"
          >
            <span>View ML Diagnostic Analysis</span>
            <ArrowUpRight className="w-4 h-4 text-[#7950E8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
