import React, { useState } from 'react';
import { Machine, SensorTelemetry, MachineEvent, PredictionResult } from '../types';
import { Machine3DInspection } from '../components/Machine3DInspection';
import { MachineComponentBlueprint } from '../components/MachineComponentBlueprint';
import { SensorChart } from '../components/SensorChart';
import { FailurePredictionCard } from '../components/FailurePredictionCard';
import { MachineEventTimeline } from '../components/MachineEventTimeline';
import { predictMachineFailure } from '../services/mlEngine';
import { 
  Activity, 
  Gauge, 
  Zap, 
  RotateCw, 
  Thermometer, 
  MapPin, 
  ChevronDown,
  Clock,
  Layers,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface MachineIntelligenceViewProps {
  machines: Machine[];
  selectedMachine: Machine;
  telemetryHistory: SensorTelemetry[];
  currentTelemetry: SensorTelemetry;
  events: MachineEvent[];
  onSelectMachine: (machineId: string) => void;
  onAcknowledgeEvent: (eventId: string) => void;
  onCreateWorkOrder?: (title: string, action: string) => void;
}

export const MachineIntelligenceView: React.FC<MachineIntelligenceViewProps> = ({
  machines,
  selectedMachine,
  telemetryHistory,
  currentTelemetry,
  events,
  onSelectMachine,
  onAcknowledgeEvent,
  onCreateWorkOrder
}) => {
  const [selectedComponent, setSelectedComponent] = useState<'comp1' | 'comp2' | 'comp3' | 'comp4'>('comp1');
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint'>('3d');

  // Compute live prediction based on current machine telemetry and age
  const prediction: PredictionResult = predictMachineFailure(
    selectedMachine.id,
    currentTelemetry,
    selectedMachine.age
  );

  const statusTheme = getStatusTheme(selectedMachine.status);

  // Sensor tolerance checks
  const isVibOut = currentTelemetry.vibration > 50;
  const isTempOut = currentTelemetry.temperature > 84;
  const isPressOut = currentTelemetry.pressure > 118 || currentTelemetry.pressure < 85;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 text-[#1E1B4B]">
      {/* 1. Top Machine Selector & Metadata Bar */}
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Machine Selection Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 font-mono">
              SELECT MACHINE:
            </label>
            <div className="relative">
              <select
                value={selectedMachine.id}
                onChange={(e) => onSelectMachine(e.target.value)}
                className="appearance-none bg-[#FAF9FD] border border-[#EDE9FE] text-[#1E1B4B] font-semibold text-xs sm:text-sm rounded-xl px-3.5 py-2 pr-9 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] cursor-pointer w-full sm:w-64 transition-all shadow-xs"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#7C3AED] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="border-l border-[#F5F3FF] pl-4 hidden sm:block">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold text-[#1E1B4B]">
                {selectedMachine.name}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE] font-bold">
                {selectedMachine.model}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C3AED]" /> {selectedMachine.location}
              </span>
              <span>•</span>
              <span>Running: <strong className="text-[#1E1B4B] font-mono">{selectedMachine.runningHours.toLocaleString()}</strong> hrs</span>
              <span>•</span>
              <span>Age: <strong className="text-[#1E1B4B] font-mono">{selectedMachine.age}</strong> yrs</span>
            </div>
          </div>
        </div>

        {/* Machine Condition & Overall Health Dial */}
        <div className="flex items-center gap-4 bg-[#FAF9FD] p-3 sm:p-3.5 rounded-xl border border-[#EDE9FE] self-start lg:self-auto shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] block font-mono">
              FLEET CONDITION
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-display font-bold text-[#1E1B4B] tabular-nums">
                {selectedMachine.healthScore}%
              </span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${statusTheme.badge}`}>
                {statusTheme.label}
              </span>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full border-2 border-[#EDE9FE] relative flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-[#F5F3FF]"
              />
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={94}
                strokeDashoffset={94 - (94 * selectedMachine.healthScore) / 100}
                className={
                  selectedMachine.healthScore >= 80 ? 'text-[#059669]' :
                  selectedMachine.healthScore >= 60 ? 'text-[#D97706]' : 'text-[#DC2626]'
                }
              />
            </svg>
            <span className="text-[10px] font-mono font-bold text-[#1E1B4B] absolute">
              {selectedMachine.healthScore}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Balanced Upper Section: Compact 3D Visual (7 cols) + Live Sensor Channels & Specs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Compact 3D Machine Inspection or 2D Blueprint */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {viewMode === '3d' ? (
            <Machine3DInspection
              machine={selectedMachine}
              telemetry={currentTelemetry}
              selectedComponentKey={selectedComponent}
              onSelectComponent={(k) => setSelectedComponent(k)}
              onToggleBlueprint={() => setViewMode('blueprint')}
            />
          ) : (
            <MachineComponentBlueprint
              machine={selectedMachine}
              telemetry={currentTelemetry}
              selectedComponentKey={selectedComponent}
              onSelectComponent={(k) => setSelectedComponent(k)}
              onToggle3D={() => setViewMode('3d')}
            />
          )}
        </div>

        {/* Right Column (5 cols): Machine Specifications & Live Sensors */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Live Sensor Probes Deck */}
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-card flex flex-col gap-3">
            <div className="pb-2.5 border-b border-[#F5F3FF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E1B4B]">Live Telemetry Probes</span>
              <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                1.0 Hz Gateway Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Vibration */}
              <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#64748B] font-mono uppercase flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#7C3AED]" /> Vibration
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isVibOut ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'
                  }`}>
                    {isVibOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className={`text-lg font-mono font-bold ${isVibOut ? 'text-[#DC2626]' : 'text-[#1E1B4B]'}`}>
                  {currentTelemetry.vibration.toFixed(1)} <span className="text-xs font-normal text-[#64748B]">mm/s</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">Limit: 50.0</span>
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#64748B] font-mono uppercase flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-[#DC2626]" /> Temperature
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isTempOut ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'
                  }`}>
                    {isTempOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className={`text-lg font-mono font-bold ${isTempOut ? 'text-[#DC2626]' : 'text-[#1E1B4B]'}`}>
                  {currentTelemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-[#64748B]">°C</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">Limit: 84.0</span>
              </div>

              {/* Pressure */}
              <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#64748B] font-mono uppercase flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-[#2563EB]" /> Pressure
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isPressOut ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#ECFDF5] text-[#059669]'
                  }`}>
                    {isPressOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-[#1E1B4B]">
                  {currentTelemetry.pressure.toFixed(1)} <span className="text-xs font-normal text-[#64748B]">PSI</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">Limit: 85 – 118</span>
              </div>

              {/* Rotation */}
              <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#64748B] font-mono uppercase flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-[#7C3AED]" /> Speed
                  </span>
                  <span className="text-[9px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded-full">
                    Normal
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-[#1E1B4B]">
                  {Math.round(currentTelemetry.rotate)} <span className="text-xs font-normal text-[#64748B]">RPM</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">Limit: 375 – 515</span>
              </div>
            </div>
          </div>

          {/* Machine Identity & Specifications Card */}
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-card flex flex-col gap-3">
            <div className="pb-2 border-b border-[#F5F3FF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E1B4B]">Specifications & Nameplate</span>
              <span className="text-[11px] font-mono font-bold text-[#7C3AED]">{selectedMachine.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <span className="text-[10px] text-[#64748B] block font-mono">Operating Voltage</span>
                <span className="font-semibold text-[#1E1B4B]">{selectedMachine.specs.voltageRating}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <span className="text-[10px] text-[#64748B] block font-mono">Motor Power</span>
                <span className="font-semibold text-[#1E1B4B]">{selectedMachine.specs.ratedPower}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <span className="text-[10px] text-[#64748B] block font-mono">Nominal Pressure</span>
                <span className="font-semibold text-[#1E1B4B]">{selectedMachine.specs.operatingPressure}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF9FD] border border-[#EDE9FE]">
                <span className="text-[10px] text-[#64748B] block font-mono">Commissioned</span>
                <span className="font-semibold text-[#1E1B4B]">{selectedMachine.installedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lower Section: Failure Prediction & Sensor Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6">
          <FailurePredictionCard
            prediction={prediction}
            machine={selectedMachine}
            onCreateWorkOrder={onCreateWorkOrder}
          />
        </div>

        <div className="lg:col-span-6">
          <SensorChart
            data={telemetryHistory}
            title={`${selectedMachine.name} (${selectedMachine.id}) — Telemetry Trend`}
          />
        </div>
      </div>

      {/* 4. Machine Event Timeline */}
      <MachineEventTimeline
        events={events}
        machineId={selectedMachine.id}
        onAcknowledgeEvent={onAcknowledgeEvent}
      />
    </div>
  );
};
