import React, { useState } from 'react';
import { Machine, SensorTelemetry, MachineEvent, PredictionResult } from '../types';
import { MachineEventTimeline } from '../components/MachineEventTimeline';
import { SensorChart } from '../components/SensorChart';
import { FailurePredictionCard } from '../components/FailurePredictionCard';
import { predictMachineFailure } from '../services/mlEngine';
import { 
  Activity, 
  ChevronDown, 
  Clock, 
  MapPin, 
  Cpu, 
  Thermometer, 
  Gauge, 
  Zap, 
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  Wrench
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
  onCreateWorkOrder: (task: string, notes: string) => void;
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
  const [activeComponentTab, setActiveComponentTab] = useState<string>('spindle');

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

  // Real physical components metadata from machine model
  const machineComponents = [
    {
      id: 'spindle',
      name: 'High-Precision Cutting Spindle',
      type: 'Primary Rotating Drive',
      status: isVibOut ? 'Attention' : 'Normal',
      statusColor: isVibOut ? 'text-[#DC5268] bg-[#FCEBED] border-[#F6B7C1]' : 'text-[#159B70] bg-[#E8F7F2] border-[#A3E3CD]',
      description: 'Houses the 24,000 RPM precision ceramic bearings and dynamic balanced toolholder shank.'
    },
    {
      id: 'hydraulic',
      name: 'Hydraulic Tool Clamping Unit',
      type: 'Fluid Pressure Manifold',
      status: isPressOut ? 'Attention' : 'Normal',
      statusColor: isPressOut ? 'text-[#D99117] bg-[#FEF6E9] border-[#F7D59A]' : 'text-[#159B70] bg-[#E8F7F2] border-[#A3E3CD]',
      description: 'Actuates dual drawbar pistons maintaining continuous 105 PSI clamping force during high-feed milling.'
    },
    {
      id: 'servomotor',
      name: 'Direct-Drive AC Servo Motor',
      type: 'Electrical Stator & Drive',
      status: 'Normal',
      statusColor: 'text-[#159B70] bg-[#E8F7F2] border-[#A3E3CD]',
      description: 'Synchronous permanent magnet stator delivering rated 45 kW with integrated feedback resolver.'
    },
    {
      id: 'cooling',
      name: 'Closed-Loop Chiller & Radiator',
      type: 'Thermal Regulation Jacket',
      status: isTempOut ? 'Attention' : 'Normal',
      statusColor: isTempOut ? 'text-[#DC5268] bg-[#FCEBED] border-[#F6B7C1]' : 'text-[#159B70] bg-[#E8F7F2] border-[#A3E3CD]',
      description: 'Circulates synthetic coolant through spindle stator channels to prevent thermal deflection.'
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 text-[#25213A] max-w-[1600px] mx-auto w-full">
      {/* 1. Top Machine Selector & Metadata Bar */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Machine Selection Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#77748B] block mb-1 font-mono">
              TARGET MACHINE:
            </label>
            <div className="relative">
              <select
                value={selectedMachine.id}
                onChange={(e) => onSelectMachine(e.target.value)}
                className="appearance-none bg-[#FAF9FF] border border-[#EAE6F2] text-[#25213A] font-bold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-[#7950E8] cursor-pointer w-full sm:w-64 transition-all shadow-xs"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#7950E8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="border-l border-[#EAE6F2] pl-4 hidden sm:block">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#25213A]">
                {selectedMachine.name}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F0EBFF] text-[#7950E8] border border-[#EAE6F2] font-bold">
                {selectedMachine.model}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#77748B] mt-1 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7950E8]" /> {selectedMachine.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#77748B]" /> Running: <strong className="text-[#25213A]">{selectedMachine.runningHours.toLocaleString()} hrs</strong>
              </span>
              <span>•</span>
              <span>Age: <strong className="text-[#25213A]">{selectedMachine.age} yrs</strong></span>
            </div>
          </div>
        </div>

        {/* Condition Metric & Circular Health Score */}
        <div className="flex items-center gap-5 self-end sm:self-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-[#EAE6F2] w-full lg:w-auto justify-between lg:justify-end">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#77748B] block font-mono">
              Equipment Health
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-mono font-extrabold text-[#25213A]">
                {selectedMachine.healthScore}%
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedMachine.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' :
                selectedMachine.status === 'warning' ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' :
                'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {selectedMachine.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-[#EAE6F2] relative flex items-center justify-center flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                className="text-[#F0EBFF]"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * selectedMachine.healthScore) / 100}
                className={
                  selectedMachine.healthScore >= 80 ? 'text-[#159B70]' :
                  selectedMachine.healthScore >= 60 ? 'text-[#D99117]' : 'text-[#DC5268]'
                }
              />
            </svg>
            <span className="text-[10px] font-mono font-bold text-[#25213A] absolute">
              {selectedMachine.healthScore}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Upper Section: High-Quality Static 3D Machine Image (7 cols) + Live Sensor Channels & Specs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): High-Quality Static 3D Machine Image */}
        <div className="lg:col-span-7 bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F2]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F0EBFF] text-[#7950E8]">
                <Cpu className="w-4 h-4 text-[#7950E8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#25213A]">
                  Industrial 3D Equipment Digital Twin
                </h3>
                <span className="text-[11px] text-[#77748B] font-mono">
                  {selectedMachine.name} • {selectedMachine.type || 'Precision Industrial Unit'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF9FF] text-[#7950E8] border border-[#EAE6F2]">
              {selectedMachine.id}
            </span>
          </div>

          {/* High-Resolution Static 3D Machine Visual */}
          <div className="relative w-full h-[320px] sm:h-[380px] rounded-xl overflow-hidden bg-gradient-to-b from-[#F7F6FC] to-[#FFFFFF] border border-[#EAE6F2] flex items-center justify-center p-3 group">
            <img 
              src="/machine-3d-model.jpg" 
              alt={`${selectedMachine.name} 3D Visual`} 
              className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                // Fallback to bundled asset if path issue occurs
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('hero.png')) {
                  target.src = '/hero.png';
                }
              }}
            />
            {/* Studio Watermark Badge */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#EAE6F2] text-[10px] font-mono font-semibold text-[#77748B] shadow-xs">
              Industrial Digital Twin • High-Precision 3D Render
            </div>
          </div>

          {/* Machine Sub-Assemblies Section (Based on genuine machine architecture) */}
          <div className="pt-2 border-t border-[#EAE6F2]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#25213A] uppercase font-mono tracking-wider">
                Machine Sub-Assemblies &amp; Subsystems
              </span>
              <span className="text-[11px] text-[#77748B] font-mono">
                {machineComponents.length} Key Subsystems
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {machineComponents.map(comp => (
                <div 
                  key={comp.id}
                  onClick={() => setActiveComponentTab(comp.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activeComponentTab === comp.id
                      ? 'bg-[#FAF9FF] border-[#7950E8] shadow-xs'
                      : 'bg-white border-[#EAE6F2] hover:border-[#7950E8]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#25213A] truncate">
                      {comp.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${comp.statusColor}`}>
                      {comp.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7950E8] font-mono block mb-1">
                    {comp.type}
                  </span>
                  <p className="text-[11px] text-[#77748B] line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Machine Specifications & Live Sensors */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Live Sensor Probes Deck */}
          <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="pb-2.5 border-b border-[#EAE6F2] flex items-center justify-between">
              <span className="text-xs font-bold text-[#25213A]">Current Sensor Readings</span>
              <span className="text-[10px] font-mono font-bold text-[#3B82F6] bg-[#EEF4FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
                1.0 Hz Ingress Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Vibration */}
              <div className="p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#77748B] font-mono uppercase flex items-center gap-1 font-semibold">
                    <Activity className="w-3 h-3 text-[#7950E8]" /> Vibration
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isVibOut ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#E8F7F2] text-[#159B70]'
                  }`}>
                    {isVibOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className={`text-lg font-mono font-bold ${isVibOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                  {currentTelemetry.vibration.toFixed(1)} <span className="text-xs font-normal text-[#77748B]">mm/s</span>
                </div>
                <span className="text-[10px] text-[#77748B] block mt-0.5 font-mono">Limit: 50.0 mm/s</span>
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#77748B] font-mono uppercase flex items-center gap-1 font-semibold">
                    <Thermometer className="w-3 h-3 text-[#DC5268]" /> Temp
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isTempOut ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#E8F7F2] text-[#159B70]'
                  }`}>
                    {isTempOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className={`text-lg font-mono font-bold ${isTempOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                  {currentTelemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-[#77748B]">°C</span>
                </div>
                <span className="text-[10px] text-[#77748B] block mt-0.5 font-mono">Limit: 84.0 °C</span>
              </div>

              {/* Pressure */}
              <div className="p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#77748B] font-mono uppercase flex items-center gap-1 font-semibold">
                    <Gauge className="w-3 h-3 text-[#3B82F6]" /> Pressure
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isPressOut ? 'bg-[#FEF6E9] text-[#D99117]' : 'bg-[#E8F7F2] text-[#159B70]'
                  }`}>
                    {isPressOut ? 'Out of Spec' : 'Normal'}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-[#25213A]">
                  {currentTelemetry.pressure.toFixed(1)} <span className="text-xs font-normal text-[#77748B]">PSI</span>
                </div>
                <span className="text-[10px] text-[#77748B] block mt-0.5 font-mono">Norm: 85 - 118</span>
              </div>

              {/* Speed */}
              <div className="p-3 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#77748B] font-mono uppercase flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3 text-[#7950E8]" /> Speed
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E8F7F2] text-[#159B70]">
                    Normal
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-[#25213A]">
                  {Math.round(currentTelemetry.rotate)} <span className="text-xs font-normal text-[#77748B]">RPM</span>
                </div>
                <span className="text-[10px] text-[#77748B] block mt-0.5 font-mono">Norm: 375 - 515</span>
              </div>
            </div>
          </div>

          {/* Machine Nameplate & Specifications Card */}
          <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="pb-2 border-b border-[#EAE6F2] flex items-center justify-between">
              <span className="text-xs font-bold text-[#25213A]">Essential Equipment Nameplate</span>
              <span className="text-[11px] font-mono font-bold text-[#7950E8]">{selectedMachine.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <span className="text-[10px] text-[#77748B] block font-mono">Operating Voltage</span>
                <span className="font-bold text-[#25213A] mt-0.5 block">{selectedMachine.specs.voltageRating}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <span className="text-[10px] text-[#77748B] block font-mono">Rated Motor Power</span>
                <span className="font-bold text-[#25213A] mt-0.5 block">{selectedMachine.specs.ratedPower}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <span className="text-[10px] text-[#77748B] block font-mono">Nominal Pressure</span>
                <span className="font-bold text-[#25213A] mt-0.5 block">{selectedMachine.specs.operatingPressure}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2]">
                <span className="text-[10px] text-[#77748B] block font-mono">Commissioned Date</span>
                <span className="font-bold text-[#25213A] mt-0.5 block">{selectedMachine.installedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lower Section: Full-Width Failure Prediction Card */}
      <div className="w-full">
        <FailurePredictionCard
          prediction={prediction}
          machine={selectedMachine}
          onCreateWorkOrder={onCreateWorkOrder}
        />
      </div>

      {/* 4. Full-Width Telemetry Trend Chart */}
      <div className="w-full">
        <SensorChart
          data={telemetryHistory}
          title={`${selectedMachine.name} (${selectedMachine.id}) — Telemetry Trend`}
        />
      </div>

      {/* 5. Machine Event Timeline */}
      <div className="w-full">
        <MachineEventTimeline
          events={events}
          machineId={selectedMachine.id}
          onAcknowledgeEvent={onAcknowledgeEvent}
        />
      </div>
    </div>
  );
};
