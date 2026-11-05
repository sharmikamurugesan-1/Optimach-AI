import React, { useState } from 'react';
import { Machine, MachineEvent, SensorTelemetry } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Cpu, 
  Search, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert, 
  Activity, 
  Sparkles,
  LayoutGrid,
  List,
  Layers,
  Thermometer,
  Wrench,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface OverviewViewProps {
  machines: Machine[];
  events: MachineEvent[];
  latestTelemetry: Record<string, SensorTelemetry>;
  isSimulatedStream: boolean;
  onSelectMachine: (machineId: string) => void;
  onNavigateToView: (viewId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  machines,
  events,
  latestTelemetry,
  onSelectMachine,
  onNavigateToView
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [timeRange, setTimeRange] = useState<'24h' | 'shift' | 'week'>('24h');
  const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'routine'>('all');

  // Filter machines
  const filteredMachines = machines.filter(m => {
    const matchesSearch = 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.type && m.type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fleet counts
  const totalCount = machines.length;
  const normalCount = machines.filter(m => m.status === 'normal').length;
  const warningCount = machines.filter(m => m.status === 'warning').length;
  const criticalCount = machines.filter(m => m.status === 'critical').length;
  const avgHealth = Math.round(machines.reduce((acc, m) => acc + m.healthScore, 0) / (totalCount || 1));

  // Priority machines
  const priorityMachines = machines.filter(m => m.status === 'critical' || m.status === 'warning');

  // Filtered recent events
  const filteredEvents = events.filter(e => {
    if (activityFilter === 'critical') return e.severity === 'critical';
    if (activityFilter === 'routine') return e.severity === 'info';
    return true;
  }).slice(0, 5);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 text-[#1E1B4B]">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] mb-1">
            <span>Home</span>
            <span>&rsaquo;</span>
            <span className="text-[#7C3AED] font-semibold">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1E1B4B] tracking-tight">
            Factory Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time equipment surveillance and predictive health intelligence across plant bays.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            Live Stream Active
          </span>
          <button
            onClick={() => onNavigateToView('live')}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F3FF] border border-[#EDE9FE] text-[#7C3AED] text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. Four Essential Fleet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Machines */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all cursor-pointer relative overflow-hidden group shadow-card flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/15'
              : 'border-[#EDE9FE] hover:border-[#DDD6FE]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-mono">
              TOTAL MACHINES
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              100% Online
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#1E1B4B] tracking-tight">
              {totalCount}
            </div>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Across 3 Factory Bays
            </span>
          </div>

          {/* Mini Gradient Bar Sparkline */}
          <div className="pt-3 border-t border-[#F5F3FF] flex items-end gap-1.5 h-8">
            {[40, 65, 55, 80, 70, 90, 85, 100].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#EDE9FE] to-[#7C3AED] rounded-t-sm transition-all group-hover:opacity-90"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 2: Healthy Machines */}
        <div 
          onClick={() => setStatusFilter('normal')}
          className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all cursor-pointer relative overflow-hidden group shadow-card flex flex-col justify-between ${
            statusFilter === 'normal'
              ? 'border-[#059669] ring-2 ring-[#059669]/15'
              : 'border-[#EDE9FE] hover:border-[#A7F3D0]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-mono">
              HEALTHY FLEET
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              {Math.round((normalCount / (totalCount || 1)) * 100)}% Nominal
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#059669] tracking-tight">
              {normalCount}
            </div>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Within baseline tolerance
            </span>
          </div>

          {/* Mini Mint-to-Blue Bar Sparkline */}
          <div className="pt-3 border-t border-[#F5F3FF] flex items-end gap-1.5 h-8">
            {[50, 70, 85, 90, 80, 95, 90, 100].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#D1FAE5] to-[#059669] rounded-t-sm transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 3: Machines Needing Attention */}
        <div 
          onClick={() => setStatusFilter('warning')}
          className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all cursor-pointer relative overflow-hidden group shadow-card flex flex-col justify-between ${
            statusFilter === 'warning'
              ? 'border-[#D97706] ring-2 ring-[#D97706]/15'
              : 'border-[#EDE9FE] hover:border-[#FDE68A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-mono">
              NEEDS ATTENTION
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              Early Drift
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#D97706] tracking-tight">
              {warningCount}
            </div>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Hydraulic & thermal variance
            </span>
          </div>

          {/* Mini Amber Bar Sparkline */}
          <div className="pt-3 border-t border-[#F5F3FF] flex items-end gap-1.5 h-8">
            {[30, 45, 60, 50, 65, 75, 70, 85].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#FEF3C7] to-[#D97706] rounded-t-sm transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 4: Critical Machines */}
        <div 
          onClick={() => setStatusFilter('critical')}
          className={`p-5 rounded-2xl bg-[#FFFFFF] border transition-all cursor-pointer relative overflow-hidden group shadow-card flex flex-col justify-between ${
            statusFilter === 'critical'
              ? 'border-[#DC2626] ring-2 ring-[#DC2626]/15'
              : 'border-[#EDE9FE] hover:border-[#FECACA]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] font-mono">
              CRITICAL MACHINES
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
              Immediate Action
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#DC2626] tracking-tight">
              {criticalCount}
            </div>
            <span className="text-xs text-[#64748B] block mt-0.5">
              High harmonic vibration risk
            </span>
          </div>

          {/* Mini Red Bar Sparkline */}
          <div className="pt-3 border-t border-[#F5F3FF] flex items-end gap-1.5 h-8">
            {[60, 75, 55, 85, 70, 95, 80, 100].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#FEE2E2] to-[#DC2626] rounded-t-sm transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Balanced 2-Column Section (8 cols Left / 4 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Fleet Reliability & Recent Activity */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card: Fleet Performance & Operating Health */}
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F3FF]">
              <div>
                <h3 className="font-display font-bold text-base text-[#1E1B4B]">
                  Fleet Operating Health & Reliability
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Aggregate telemetry variance and condition trends across production lines.
                </p>
              </div>

              {/* Timeframe selector pills */}
              <div className="flex items-center gap-1 bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE] self-start sm:self-auto">
                {(['24h', 'shift', 'week'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      timeRange === t
                        ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs border border-[#EDE9FE]'
                        : 'text-[#64748B] hover:text-[#1E1B4B]'
                    }`}
                  >
                    {t === '24h' ? 'Last 24 Hours' : t === 'shift' ? 'Current Shift' : '7 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stylized Clean Visual Representation */}
            <div className="bg-[#FAF9FD] rounded-xl p-4 sm:p-5 border border-[#EDE9FE]">
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1E1B4B]">Health Index by Production Bay</span>
                  <span className="text-[11px] text-[#64748B]">({avgHealth}% Fleet Avg)</span>
                </div>
                <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  99.8% Gateway Reliability
                </span>
              </div>

              {/* Bay Progress Rows */}
              <div className="space-y-3">
                {[
                  { bay: 'Bay A — Press & Precision Stamping', health: 88, status: 'Normal', color: '#059669', bg: '#D1FAE5' },
                  { bay: 'Bay B — Heavy CNC Milling Line', health: 74, status: 'Attention', color: '#DC2626', bg: '#FEE2E2' },
                  { bay: 'Bay C — Rotary & Lathe Cells', health: 92, status: 'Normal', color: '#059669', bg: '#D1FAE5' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#1E1B4B] w-64 truncate">{item.bay}</span>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#EDE9FE] overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${item.health}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[#1E1B4B] w-10 text-right">{item.health}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Recent Operational Activity */}
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F3FF]">
              <div>
                <h3 className="font-display font-bold text-base text-[#1E1B4B]">
                  Recent Activity
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Latest telemetry anomalies, inspections, and maintenance events.
                </p>
              </div>

              {/* Activity filter buttons */}
              <div className="flex items-center gap-1 bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE]">
                {(['all', 'critical', 'routine'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivityFilter(tab)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activityFilter === tab
                        ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs border border-[#EDE9FE]'
                        : 'text-[#64748B] hover:text-[#1E1B4B]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Event list */}
            <div className="space-y-2.5">
              {filteredEvents.map(evt => {
                const isCrit = evt.severity === 'critical';
                const isWarn = evt.severity === 'warning';

                return (
                  <div 
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE] hover:border-[#DDD6FE] transition-all flex items-center justify-between gap-4 text-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCrit ? 'bg-[#FEF2F2] text-[#DC2626]' :
                        isWarn ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        {isCrit ? <AlertCircle className="w-4 h-4" /> :
                         isWarn ? <AlertTriangle className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#7C3AED]">{evt.machineId}</span>
                          <span className="font-semibold text-[#1E1B4B] truncate">{evt.title}</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">{evt.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCrit ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
                        isWarn ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
                        'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                      }`}>
                        {evt.code}
                      </span>

                      <button
                        onClick={() => {
                          onSelectMachine(evt.machineId);
                          onNavigateToView('machines');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE] font-semibold text-[11px] transition-all flex items-center gap-1 shadow-xs"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Priority Alerts, AI Insights, & Bay Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Priority Alerts */}
          {priorityMachines.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 shadow-card flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F3FF]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                  <span className="font-display font-bold text-sm text-[#1E1B4B]">
                    Priority Alerts
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToView('predictions')}
                  className="text-[11px] font-semibold text-[#7C3AED] hover:underline"
                >
                  View All &rsaquo;
                </button>
              </div>

              <div className="space-y-2.5">
                {priorityMachines.slice(0, 2).map(m => {
                  const theme = getStatusTheme(m.status);
                  const telem = latestTelemetry[m.id];
                  const isCrit = m.status === 'critical';

                  return (
                    <div 
                      key={m.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCrit ? 'bg-[#FEF2F2]/60 border-[#FECACA]' : 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-[#1E1B4B]">{m.id}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${theme.badge}`}>
                          {theme.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mb-2 leading-snug">
                        {m.id === 'MACH-012'
                          ? `Bearing vibration: ${telem?.vibration || 58.4} mm/s (exceeds 50 mm/s threshold).`
                          : `Hydraulic pressure variance: ${telem?.pressure || 128} PSI.`}
                      </p>
                      <button
                        onClick={() => {
                          onSelectMachine(m.id);
                          onNavigateToView('machines');
                        }}
                        className="w-full py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FAF9FD] text-[#1E1B4B] text-[11px] font-semibold border border-[#EDE9FE] shadow-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Inspect Machine</span>
                        <ArrowUpRight className="w-3 h-3 text-[#7C3AED]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Insights Card (Vibrant Purple Card matching reference image) */}
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] rounded-2xl p-5 text-white shadow-elevated flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  AI Predictive Insight
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                Bearing Degradation Detected on MACH-012
              </h4>
              <p className="text-xs text-purple-100/90 mt-1.5 leading-relaxed">
                Persistent 4x harmonic vibrations indicate early stage bearing spalling. Scheduling preventive lubrication or spindle inspection within 48h will avert unplanned cell outage.
              </p>
            </div>

            <button
              onClick={() => {
                onSelectMachine('MACH-012');
                onNavigateToView('predictions');
              }}
              className="w-full py-2 rounded-xl bg-white hover:bg-purple-50 text-[#7C3AED] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Take Preventive Action</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Production Bay Health Summary */}
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 shadow-card flex flex-col gap-3">
            <span className="text-xs font-bold text-[#1E1B4B]">
              Bay Location Status
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span className="font-medium text-[#1E1B4B]">Bay A (Assembly)</span>
                </div>
                <span className="font-mono font-bold text-[#059669]">88%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-medium text-[#1E1B4B]">Bay B (Machining)</span>
                </div>
                <span className="font-mono font-bold text-[#DC2626]">74%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span className="font-medium text-[#1E1B4B]">Bay C (Turning)</span>
                </div>
                <span className="font-mono font-bold text-[#059669]">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Machine Fleet Directory */}
      <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-5">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F5F3FF]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#1E1B4B]">
                Machine Fleet Directory
              </h2>
              <span className="text-xs font-mono bg-[#F5F3FF] text-[#7C3AED] px-2.5 py-0.5 rounded-full border border-[#EDE9FE] font-bold">
                {filteredMachines.length} Assets
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select any machine to view physical components, sensor telemetry, and failure predictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search machine ID, bay, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#FAF9FD] border border-[#EDE9FE] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#1E1B4B] placeholder-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] w-52 sm:w-60 transition-all"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE]">
              {(['all', 'normal', 'warning', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === s
                      ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs border border-[#EDE9FE]'
                      : 'text-[#64748B] hover:text-[#1E1B4B]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs' : 'text-[#64748B]'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs' : 'text-[#64748B]'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Fleet Cards or Table */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMachines.map(machine => {
              const theme = getStatusTheme(machine.status);
              const telem = latestTelemetry[machine.id];

              return (
                <div
                  key={machine.id}
                  onClick={() => {
                    onSelectMachine(machine.id);
                    onNavigateToView('machines');
                  }}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] hover:shadow-card rounded-2xl p-4.5 flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-[#7C3AED]">
                        {machine.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                        {theme.label}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors truncate">
                      {machine.name}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5 mb-3">
                      <MapPin className="w-3 h-3 text-[#94A3B8]" />
                      <span className="truncate">{machine.location}</span>
                    </div>

                    {/* Sensor stats */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE] text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Vibration</span>
                        <span className={`font-mono font-bold ${
                          (telem?.vibration || 0) > 50 ? 'text-[#DC2626]' : 'text-[#1E1B4B]'
                        }`}>
                          {telem?.vibration?.toFixed(1) || 40.0} mm/s
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Temperature</span>
                        <span className="font-mono font-bold text-[#1E1B4B]">
                          {telem?.temperature?.toFixed(1) || 70.0} °C
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F5F3FF] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Health Score</span>
                      <span className="font-mono font-bold text-sm text-[#1E1B4B]">
                        {machine.healthScore}%
                      </span>
                    </div>

                    <span className="text-[#7C3AED] font-semibold text-[11px] group-hover:underline flex items-center gap-0.5">
                      View Details &rsaquo;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FD] text-[#64748B] uppercase font-mono text-[10px] border-b border-[#EDE9FE]">
                <tr>
                  <th className="py-2.5 px-3">Asset ID & Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">Vibration</th>
                  <th className="py-2.5 px-3">Temperature</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F3FF]">
                {filteredMachines.map(m => {
                  const theme = getStatusTheme(m.status);
                  const telem = latestTelemetry[m.id];
                  return (
                    <tr 
                      key={m.id}
                      onClick={() => {
                        onSelectMachine(m.id);
                        onNavigateToView('machines');
                      }}
                      className="hover:bg-[#FAF9FD] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1E1B4B]">{m.name}</div>
                        <div className="text-[11px] font-mono text-[#7C3AED]">{m.id}</div>
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">{m.location}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                          {theme.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1E1B4B]">{m.healthScore}%</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={(telem?.vibration || 0) > 50 ? 'text-[#DC2626] font-bold' : 'text-[#1E1B4B]'}>
                          {telem?.vibration?.toFixed(1) || 40.0} mm/s
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#1E1B4B]">
                        {telem?.temperature?.toFixed(1) || 70.0} °C
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMachine(m.id);
                            onNavigateToView('machines');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] font-semibold text-[11px] transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
