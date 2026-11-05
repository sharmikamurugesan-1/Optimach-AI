import React from 'react';
import { Machine, SensorTelemetry, PredictionResult } from '../types';
import { FailurePredictionCard } from '../components/FailurePredictionCard';
import { predictMachineFailure } from '../services/mlEngine';
import { 
  ChevronDown, 
  History, 
  Calendar,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface FailurePredictionViewProps {
  machines: Machine[];
  selectedMachine: Machine;
  latestTelemetry: SensorTelemetry;
  onSelectMachine: (machineId: string) => void;
  onCreateWorkOrder: (task: string, notes: string) => void;
}

export const FailurePredictionView: React.FC<FailurePredictionViewProps> = ({
  machines,
  selectedMachine,
  latestTelemetry,
  onSelectMachine,
  onCreateWorkOrder
}) => {
  const prediction: PredictionResult = predictMachineFailure(
    selectedMachine.id,
    latestTelemetry,
    selectedMachine.age
  );

  // Historical predictions log
  const historicalPredictions = [
    {
      date: '2026-11-04 08:00',
      predictedFailure: prediction.predictedFailure,
      probability: prediction.probability,
      risk: prediction.calibratedRisk,
      action: 'Work Order Generated',
      modelVer: 'PdM-LightGBM v2.4'
    },
    {
      date: '2026-11-03 18:00',
      predictedFailure: selectedMachine.id === 'MACH-012' ? 'Component 1 — Bearing Spall & Severe Vibration' : 'Normal Operating Status',
      probability: selectedMachine.id === 'MACH-012' ? 76 : 8,
      risk: selectedMachine.id === 'MACH-012' ? 'High' : 'Low',
      action: selectedMachine.id === 'MACH-012' ? 'Vibration spectrum logged' : 'Routine audit',
      modelVer: 'PdM-LightGBM v2.4'
    },
    {
      date: '2026-11-02 12:00',
      predictedFailure: selectedMachine.id === 'MACH-012' ? 'Component 1 — Bearing Early Wear' : 'Normal Operating Status',
      probability: selectedMachine.id === 'MACH-012' ? 62 : 6,
      risk: selectedMachine.id === 'MACH-012' ? 'High' : 'Low',
      action: 'Lubrication applied',
      modelVer: 'PdM-LightGBM v2.4'
    },
    {
      date: '2026-11-01 06:00',
      predictedFailure: 'Normal Operating Status',
      probability: 12,
      risk: 'Low',
      action: 'Shift handover check',
      modelVer: 'PdM-LightGBM v2.4'
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-16 text-[#242139]">
      {/* 1. View Header & Machine Selector */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-subtle">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6D55E8] flex items-center gap-1.5 mb-1 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#6D55E8]" /> Predictive Maintenance Horizon: 7 Days
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#242139]">
            Failure Predictions & Evidence Report
          </h1>
          <p className="text-xs sm:text-sm text-[#77738C] mt-1 max-w-2xl leading-relaxed">
            Calibrated multi-sensor classification projecting component fatigue risks over a 7-day operating window to drive informed maintenance intervention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#77738C] font-mono">
            Machine:
          </label>
          <div className="relative">
            <select
              value={selectedMachine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="appearance-none bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] font-semibold text-xs rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-[#6D55E8] cursor-pointer transition-all shadow-sm"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6D55E8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Main ML Failure Assessment Report Card */}
      <FailurePredictionCard
        prediction={prediction}
        machine={selectedMachine}
        onCreateWorkOrder={onCreateWorkOrder}
      />

      {/* 3. Historical Prediction Log for Selected Machine */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col gap-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F0FF]">
          <div>
            <h3 className="font-display font-bold text-[#242139] text-base flex items-center gap-2">
              <History className="w-4 h-4 text-[#6D55E8]" />
              Historical Prediction Log ({selectedMachine.name})
            </h3>
            <p className="text-xs text-[#77738C] mt-0.5">
              Previous daily failure probability assessments logged by the trained classifier pipeline.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#6D55E8] bg-[#F3F0FF] px-2.5 py-1 rounded-full border border-[#EAE5FF]">
            LightGBM v2.4
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#EAE5FF]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FF] text-[#77738C] uppercase text-[10px] tracking-wider border-b border-[#EAE5FF] font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Assessment Timestamp</th>
                <th className="py-3 px-4 font-semibold">Projected Failure Mode</th>
                <th className="py-3 px-4 font-semibold">Risk Classification</th>
                <th className="py-3 px-4 font-semibold">Failure Probability</th>
                <th className="py-3 px-4 font-semibold">Model Pipeline</th>
                <th className="py-3 px-4 font-semibold text-right">Maintenance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5FF] bg-[#FFFFFF]">
              {historicalPredictions.map((h, i) => (
                <tr key={i} className="hover:bg-[#FAF9FF] transition-colors">
                  <td className="py-3.5 px-4 text-[#77738C] flex items-center gap-2 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#6D55E8]" /> {h.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#242139] text-xs">
                    {h.predictedFailure}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      h.risk === 'Severe' || h.risk === 'High' ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' :
                      h.risk === 'Moderate' ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' :
                      'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
                    }`}>
                      {h.risk}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#242139]">
                    {h.probability}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#77738C]">
                    {h.modelVer}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#6D55E8] font-medium">
                    {h.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
