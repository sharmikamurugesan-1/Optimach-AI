import React, { useState } from 'react';
import { Machine, MachineEvent, SensorTelemetry } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  Search, 
  Sparkles, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
  Layers,
  LayoutGrid,
  List
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
  latestTelemetry,
  events,
  onSelectMachine,
  onNavigateToView,
  onAcknowledgeEvent
}) => {
  const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'routine'>('all');
  const [timeWindow, setTimeWindow] = useState<'24h' | 'shift' | '7d'>('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // KPI calculations
  const totalMachines = machines.length;
  const normalCount = machines.filter(m => m.status === 'normal').length;
  const warningCount = machines.filter(m => m.status === 'warning').length;
  const criticalCount = machines.filter(m => m.status === 'critical').length;

  // Filtered Events
  const filteredEvents = events.filter(e => {
    if (activityFilter === 'critical') return e.severity === 'critical';
    if (activityFilter === 'routine') return e.severity !== 'critical';
    return true;
  });

  // Filtered Machine List for Fleet Directory
  const filteredMachines = machines.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInspect = (machineId: string) => {
    onSelectMachine(machineId);
    onNavigateToView('machines');
  };

  return (
    <div className="flex flex-col gap-6 pb-16 text-[#25213A] max-w-[1600px] mx-auto w-full">
      {/* 1. Breadcrumbs & Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#77748B] mb-1 font-medium">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-[#7950E8] font-semibold">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25213A]">
            Factory Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#77748B] mt-0.5">
            Real-time equipment surveillance and predictive health intelligence across plant bays.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF4FF] border border-[#DBEAFE] text-xs font-semibold text-[#3B82F6] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>Live Stream Active</span>
          </div>

          <button
            onClick={() => onNavigateToView('live')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EAE6F2] hover:border-[#7950E8] text-[#7950E8] text-xs font-bold transition-all shadow-xs hover:bg-[#F0EBFF]"
          >
            <Activity className="w-3.5 h-3.5 text-[#7950E8]" />
            <span>Open Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Total Machines */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                TOTAL MACHINES
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#3B82F6] border border-[#DBEAFE]">
                100% Online
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#25213A] tabular-nums font-mono">
              {totalMachines}
            </div>
            <p className="text-xs text-[#77748B] mt-1 font-medium">
              Across 3 Factory Bays
            </p>
          </div>

          {/* Mini purple bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-4 pt-2 border-t border-[#F7F6FC]">
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
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                HEALTHY FLEET
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]">
                50% Nominal
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#25213A] tabular-nums font-mono">
              {normalCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1 font-medium">
              Within baseline tolerance
            </p>
          </div>

          {/* Mini green bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-4 pt-2 border-t border-[#F7F6FC]">
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
        <div className="bg-white border-2 border-[#F7D59A] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                NEEDS ATTENTION
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]">
                Early Drift
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#D99117] tabular-nums font-mono">
              {warningCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1 font-medium">
              Hydraulic &amp; thermal variance
            </p>
          </div>

          {/* Mini amber bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-4 pt-2 border-t border-[#F7F6FC]">
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
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
                CRITICAL MACHINES
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]">
                Immediate Action
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#DC5268] tabular-nums font-mono">
              {criticalCount}
            </div>
            <p className="text-xs text-[#77748B] mt-1 font-medium">
              High harmonic vibration risk
            </p>
          </div>

          {/* Mini red bar sparkline */}
          <div className="flex items-end gap-1.5 h-7 mt-4 pt-2 border-t border-[#F7F6FC]">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Fleet Operating Health & Reliability */}
        <div className="lg:col-span-7 bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <h2 className="text-base font-bold text-[#25213A]">
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

            <p className="text-xs text-[#77748B] mb-5">
              Aggregate telemetry variance and condition trends across production lines.
            </p>

            {/* Inner Health Progress Meter Container */}
            <div className="bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F2]">
                <span className="text-xs font-bold text-[#25213A] font-mono">
                  Health Index by Production Bay <span className="text-[#77748B] font-normal">(74% Fleet Avg)</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EEF4FF] text-[#3B82F6] border border-[#DBEAFE]">
                  99.8% Gateway Reliability
                </span>
              </div>

              {/* Bay A */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">
                    Bay A — Press &amp; Precision Stamping
                  </span>
                  <span className="font-mono font-bold text-[#159B70]">88%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#159B70] h-full rounded-full transition-all duration-700" style={{ width: '88%' }} />
                </div>
              </div>

              {/* Bay B */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">
                    Bay B — Heavy CNC Milling Line
                  </span>
                  <span className="font-mono font-bold text-[#DC5268]">74%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#DC5268] h-full rounded-full transition-all duration-700" style={{ width: '74%' }} />
                </div>
              </div>

              {/* Bay C */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">
                    Bay C — Rotary &amp; Lathe Cells
                  </span>
                  <span className="font-mono font-bold text-[#159B70]">92%</span>
                </div>
                <div className="w-full bg-[#EAE6F2] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#159B70] h-full rounded-full transition-all duration-700" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Priority Alerts */}
        <div className="lg:col-span-5 bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FCEBED] border border-[#F6B7C1] flex items-center justify-center text-[#DC5268]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-[#25213A]">
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

            {/* Alert Cards */}
            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 flex flex-col gap-2">
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
                    className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#FECACA] hover:border-[#DC5268] text-[#DC5268] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Inspect Machine</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 flex flex-col gap-2">
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
                    className="w-full py-1.5 px-3 rounded-lg bg-white border border-[#FDE68A] hover:border-[#D99117] text-[#D99117] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-7 bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <div>
                <h2 className="text-base font-bold text-[#25213A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7950E8]" /> Recent Activity
                </h2>
                <p className="text-xs text-[#77748B] mt-0.5">
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
                <div key={evt.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
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
                        <span className="text-[11px] font-bold text-[#25213A]">{evt.title}</span>
                      </div>
                      <p className="text-xs text-[#77748B] mt-0.5 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-[#77748B]">{evt.timestamp}</span>
                    {!evt.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeEvent?.(evt.id)}
                        className="p-1 rounded hover:bg-[#F0EBFF] text-[#7950E8] transition-colors"
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
        <div className="lg:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-[#7950E8] via-[#8555F5] to-[#5630A8] text-white shadow-lg flex flex-col justify-between">
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

      {/* 5. Machine Fleet Directory (Searchable Asset Grid) */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#25213A]">Machine Fleet Directory</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F0EBFF] text-[#7950E8] border border-[#EAE6F2]">
                {totalMachines} Assets
              </span>
            </div>
            <p className="text-xs text-[#77748B] mt-0.5">
              Select any machine to view physical components, sensor telemetry, and failure predictions.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#77748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search machine ID, bay, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl focus:outline-none focus:border-[#7950E8] w-52 sm:w-60 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
              {['all', 'normal', 'warning', 'critical'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-white text-[#7950E8] shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  {st === 'normal' ? 'Normal' : st === 'warning' ? 'Warning' : st === 'critical' ? 'Critical' : 'All'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#7950E8] shadow-xs' : 'text-[#77748B]'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-[#7950E8] shadow-xs' : 'text-[#77748B]'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMachines.map(m => {
              const tel = latestTelemetry[m.id];
              return (
                <div
                  key={m.id}
                  onClick={() => handleInspect(m.id)}
                  className="p-4 rounded-xl border border-[#EAE6F2] hover:border-[#7950E8] hover:shadow-md transition-all cursor-pointer bg-[#FAF9FF] hover:bg-white group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#7950E8] group-hover:underline">
                      {m.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      m.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' :
                      m.status === 'warning' ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' :
                      'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
                    }`}>
                      {m.status === 'normal' ? 'Healthy' : m.status === 'warning' ? 'Needs Attention' : 'Critical'}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-[#25213A] truncate mb-0.5">
                    {m.name}
                  </h3>
                  <span className="text-[10px] text-[#77748B] block mb-3 font-mono">
                    {m.location}
                  </span>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-white border border-[#EAE6F2] text-center mb-3">
                    <div>
                      <span className="text-[9px] text-[#77748B] uppercase block">Vibration</span>
                      <span className={`text-xs font-mono font-bold ${
                        (tel?.vibration ?? 0) > 50 ? 'text-[#DC5268]' : 'text-[#25213A]'
                      }`}>
                        {tel?.vibration ?? '--'} mm/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#77748B] uppercase block">Temperature</span>
                      <span className={`text-xs font-mono font-bold ${
                        (tel?.temperature ?? 0) > 80 ? 'text-[#DC5268]' : 'text-[#25213A]'
                      }`}>
                        {tel?.temperature ?? '--'} °C
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EAE6F2]">
                    <div>
                      <span className="text-[10px] text-[#77748B]">Health Score</span>
                      <div className="font-mono font-bold text-xs text-[#25213A]">{m.healthScore}%</div>
                    </div>
                    <span className="text-[11px] font-bold text-[#7950E8] group-hover:translate-x-0.5 transition-transform flex items-center">
                      View Details &gt;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#EAE6F2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FF] text-[#77748B] uppercase font-mono text-[10px] border-b border-[#EAE6F2]">
                <tr>
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Machine Name</th>
                  <th className="py-2.5 px-3">Location Bay</th>
                  <th className="py-2.5 px-3">Vibration</th>
                  <th className="py-2.5 px-3">Temperature</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Condition Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6F2]">
                {filteredMachines.map(m => {
                  const tel = latestTelemetry[m.id];
                  return (
                    <tr key={m.id} className="hover:bg-[#FAF9FF] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#7950E8]">{m.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#25213A]">{m.name}</td>
                      <td className="py-2.5 px-3 text-[#77748B] font-mono">{m.location}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={(tel?.vibration ?? 0) > 50 ? 'text-[#DC5268]' : 'text-[#25213A]'}>
                          {tel?.vibration ?? '--'} mm/s
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={(tel?.temperature ?? 0) > 80 ? 'text-[#DC5268]' : 'text-[#25213A]'}>
                          {tel?.temperature ?? '--'} °C
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#25213A]">{m.healthScore}%</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268]' :
                          m.status === 'warning' ? 'bg-[#FEF6E9] text-[#D99117]' :
                          'bg-[#E8F7F2] text-[#159B70]'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleInspect(m.id)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#EAE6F2] hover:border-[#7950E8] text-[#7950E8] font-bold transition-all shadow-xs"
                        >
                          Inspect &gt;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
