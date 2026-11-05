import React, { useState } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { predictMachineFailure } from '../services/mlEngine';
import { 
  ChevronRight,
  GitCompare,
  Download,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Thermometer,
  Gauge,
  RotateCw,
  Zap
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface MachineComparisonViewProps {
  machines: Machine[];
  latestTelemetry: Record<string, SensorTelemetry>;
  onInspectMachine: (machineId: string) => void;
}

export const MachineComparisonView: React.FC<MachineComparisonViewProps> = ({
  machines,
  latestTelemetry,
  onInspectMachine
}) => {
  const [machineAId, setMachineAId] = useState<string>('MACH-012');
  const [machineBId, setMachineBId] = useState<string>('MACH-024');

  const machineA = machines.find(m => m.id === machineAId) || machines[0];
  const machineB = machines.find(m => m.id === machineBId) || machines[1];

  const telemA = latestTelemetry[machineA.id] || { volt: 170.8, rotate: 446.6, pressure: 100.9, vibration: 40.4, temperature: 71.5, timestamp: '' };
  const telemB = latestTelemetry[machineB.id] || { volt: 170.8, rotate: 446.6, pressure: 100.9, vibration: 40.4, temperature: 71.5, timestamp: '' };

  const predA = predictMachineFailure(machineA.id, telemA, machineA.age);
  const predB = predictMachineFailure(machineB.id, telemB, machineB.age);

  const themeA = getStatusTheme(machineA.status);
  const themeB = getStatusTheme(machineB.status);

  const handleExportComparison = () => {
    const content = 
`FactoryMind — Machine Comparison Report
Generated: ${new Date().toLocaleString()}

Parameter,Unit 1 (${machineA.id}),Unit 2 (${machineB.id})
Machine Name,"${machineA.name}","${machineB.name}"
Location,"${machineA.location}","${machineB.location}"
Operating Status,${machineA.status},${machineB.status}
Health Score,${machineA.healthScore}%,${machineB.healthScore}%
7-Day Projected Failure,"${predA.predictedFailure}","${predB.predictedFailure}"
Failure Probability,${predA.probability}%,${predB.probability}%
Operating Temperature,${telemA.temperature} °C,${telemB.temperature} °C
Shaft Vibration,${telemA.vibration} mm/s,${telemB.vibration} mm/s
Hydraulic Pressure,${telemA.pressure} PSI,${telemB.pressure} PSI
Rotational Speed,${telemA.rotate} RPM,${telemB.rotate} RPM
Supply Voltage,${telemA.volt} V,${telemB.volt} V`;

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet_comparison_${machineA.id}_vs_${machineB.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 pb-16 text-[#242139]">
      {/* 1. View Header & Dual Selectors */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-subtle">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6D55E8] flex items-center gap-1.5 mb-1 font-mono">
            <GitCompare className="w-3.5 h-3.5 text-[#6D55E8]" /> Side-by-Side Asset Benchmark
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#242139]">
            Fleet Comparison Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#77738C] mt-1 max-w-2xl leading-relaxed">
            Compare machine conditions, sensor drift, and 7-day predictive failure projections side-by-side to prioritize maintenance dispatch.
          </p>
        </div>

        {/* Dual Selectors & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FAF9FF] p-2 rounded-xl border border-[#EAE5FF]">
            <span className="text-xs text-[#77738C] font-mono">Unit 1:</span>
            <select
              value={machineAId}
              onChange={(e) => setMachineAId(e.target.value)}
              className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#6D55E8]"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-[#6D55E8] font-mono">VS</span>

          <div className="flex items-center gap-2 bg-[#FAF9FF] p-2 rounded-xl border border-[#EAE5FF]">
            <span className="text-xs text-[#77738C] font-mono">Unit 2:</span>
            <select
              value={machineBId}
              onChange={(e) => setMachineBId(e.target.value)}
              className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#6D55E8]"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportComparison}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#F3F0FF] text-[#242139] transition-all flex items-center gap-1.5 border border-[#EAE5FF] shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#6D55E8]" /> Export Report
          </button>
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Machine A Card */}
        <div className={`bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-subtle ${themeA.cardBorder}`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F0FF]">
            <div>
              <span className="text-xs font-mono font-bold text-[#6D55E8] block">{machineA.id}</span>
              <h3 className="text-base font-display font-bold text-[#242139]">{machineA.name}</h3>
              <span className="text-xs text-[#77738C]">{machineA.location}</span>
            </div>
            <button
              onClick={() => onInspectMachine(machineA.id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#6D55E8] text-[#6D55E8] hover:text-white border border-[#EAE5FF] transition-all flex items-center gap-1 shadow-sm"
            >
              Inspect <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Health Index */}
          <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF] flex justify-between items-center">
            <span className="text-xs text-[#77738C] font-mono">Condition Health Score:</span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold font-display text-[#242139]">{machineA.healthScore}%</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${themeA.badge}`}>
                {themeA.label}
              </span>
            </div>
          </div>

          {/* 7-Day ML Prediction */}
          <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
            <span className="text-[11px] text-[#77738C] uppercase tracking-wider block font-mono">7-Day Failure Projection:</span>
            <h4 className="text-sm font-semibold text-[#242139] mt-1">{predA.predictedFailure}</h4>
            <div className="flex justify-between items-center mt-2.5 text-xs">
              <span className="text-[#77738C]">Failure Probability:</span>
              <strong className={predA.probability > 50 ? 'text-[#DC5268] font-bold font-mono' : 'text-[#242139] font-mono'}>
                {predA.probability}% ({predA.calibratedRisk} Risk)
              </strong>
            </div>
          </div>

          {/* Telemetry Rows */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#DC5268]" /> Operating Temp:
              </span>
              <strong className={telemA.temperature > 84 ? 'text-[#DC5268] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemA.temperature} °C
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#6D55E8]" /> Shaft Vibration:
              </span>
              <strong className={telemA.vibration > 50 ? 'text-[#DC5268] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemA.vibration} mm/s
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" /> Hydraulic Pressure:
              </span>
              <strong className={telemA.pressure > 118 || telemA.pressure < 85 ? 'text-[#D99117] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemA.pressure} PSI
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-purple-600" /> Rotational Speed:
              </span>
              <strong className="text-[#242139] font-mono">{telemA.rotate} RPM</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#159B70]" /> Supply Voltage:
              </span>
              <strong className="text-[#242139] font-mono">{telemA.volt} V</strong>
            </div>
          </div>
        </div>

        {/* Machine B Card */}
        <div className={`bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-subtle ${themeB.cardBorder}`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F0FF]">
            <div>
              <span className="text-xs font-mono font-bold text-[#6D55E8] block">{machineB.id}</span>
              <h3 className="text-base font-display font-bold text-[#242139]">{machineB.name}</h3>
              <span className="text-xs text-[#77738C]">{machineB.location}</span>
            </div>
            <button
              onClick={() => onInspectMachine(machineB.id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#6D55E8] text-[#6D55E8] hover:text-white border border-[#EAE5FF] transition-all flex items-center gap-1 shadow-sm"
            >
              Inspect <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Health Index */}
          <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF] flex justify-between items-center">
            <span className="text-xs text-[#77738C] font-mono">Condition Health Score:</span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold font-display text-[#242139]">{machineB.healthScore}%</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${themeB.badge}`}>
                {themeB.label}
              </span>
            </div>
          </div>

          {/* 7-Day ML Prediction */}
          <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
            <span className="text-[11px] text-[#77738C] uppercase tracking-wider block font-mono">7-Day Failure Projection:</span>
            <h4 className="text-sm font-semibold text-[#242139] mt-1">{predB.predictedFailure}</h4>
            <div className="flex justify-between items-center mt-2.5 text-xs">
              <span className="text-[#77738C]">Failure Probability:</span>
              <strong className={predB.probability > 50 ? 'text-[#DC5268] font-bold font-mono' : 'text-[#242139] font-mono'}>
                {predB.probability}% ({predB.calibratedRisk} Risk)
              </strong>
            </div>
          </div>

          {/* Telemetry Rows */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#DC5268]" /> Operating Temp:
              </span>
              <strong className={telemB.temperature > 84 ? 'text-[#DC5268] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemB.temperature} °C
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#6D55E8]" /> Shaft Vibration:
              </span>
              <strong className={telemB.vibration > 50 ? 'text-[#DC5268] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemB.vibration} mm/s
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" /> Hydraulic Pressure:
              </span>
              <strong className={telemB.pressure > 118 || telemB.pressure < 85 ? 'text-[#D99117] font-mono font-bold' : 'text-[#242139] font-mono'}>
                {telemB.pressure} PSI
              </strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-purple-600" /> Rotational Speed:
              </span>
              <strong className="text-[#242139] font-mono">{telemB.rotate} RPM</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
              <span className="text-[#77738C] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#159B70]" /> Supply Voltage:
              </span>
              <strong className="text-[#242139] font-mono">{telemB.volt} V</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
