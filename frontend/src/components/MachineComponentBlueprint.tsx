import React, { useState } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { 
  Eye, 
  Layers, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Activity, 
  Thermometer, 
  Gauge, 
  RotateCw,
  Box
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface MachineComponentBlueprintProps {
  machine: Machine;
  telemetry: SensorTelemetry;
  selectedComponentKey?: 'comp1' | 'comp2' | 'comp3' | 'comp4';
  onSelectComponent?: (compKey: 'comp1' | 'comp2' | 'comp3' | 'comp4') => void;
  onToggle3D?: () => void;
}

export const MachineComponentBlueprint: React.FC<MachineComponentBlueprintProps> = ({
  machine,
  telemetry,
  selectedComponentKey = 'comp1',
  onSelectComponent,
  onToggle3D
}) => {
  const [activePart, setActivePart] = useState<'comp1' | 'comp2' | 'comp3' | 'comp4'>(selectedComponentKey);
  const [stressView, setStressView] = useState(false);

  const handleSelect = (key: 'comp1' | 'comp2' | 'comp3' | 'comp4') => {
    setActivePart(key);
    onSelectComponent?.(key);
  };

  const activeComp = machine.components[activePart];
  const statusTheme = getStatusTheme(machine.status);

  // Status color helper
  const getCompColor = (condition: 'good' | 'fair' | 'degraded') => {
    if (condition === 'degraded') return '#DC5268';
    if (condition === 'fair') return '#D99117';
    return '#159B70';
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 shadow-subtle flex flex-col gap-6">
      {/* Blueprint Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F3F0FF]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] text-[#6D55E8] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-[#242139] text-base">
                Equipment Sub-Assembly Blueprint & Diagnostics
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusTheme.badge}`}>
                {statusTheme.label}
              </span>
            </div>
            <p className="text-xs text-[#77738C] mt-0.5">
              Interactive mechanical schematic of {machine.name} ({machine.id}) · Click sub-assemblies to inspect wear rates.
            </p>
          </div>
        </div>

        {/* Diagnostic Mode Toggle */}
        <div className="flex items-center gap-2">
          {onToggle3D && (
            <button
              onClick={onToggle3D}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F3F0FF] hover:bg-[#EAE5FF] text-[#6D55E8] transition-all flex items-center gap-1.5 border border-[#EAE5FF]"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Model View</span>
            </button>
          )}

          <button
            onClick={() => setStressView(!stressView)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
              stressView
                ? 'bg-[#FCEBED] border-[#F6B7C1] text-[#DC5268]'
                : 'bg-[#FAF9FF] border-[#EAE5FF] text-[#77738C] hover:text-[#242139]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{stressView ? 'Thermal & Stress: Active' : 'Thermal & Stress Overlay'}</span>
          </button>
        </div>
      </div>

      {/* 2D Schematic Visualization & Detailed Component Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Industrial Blueprint Schematic (7 cols) */}
        <div className="lg:col-span-7 bg-[#FAF9FF] border border-[#EAE5FF] rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[360px]">
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #EAE5FF 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Blueprint SVG */}
          <svg viewBox="0 0 600 320" className="w-full max-w-lg h-auto relative z-10 drop-shadow-sm select-none">
            {/* Centerline Axis */}
            <line x1="40" y1="160" x2="560" y2="160" stroke="#D6CEFB" strokeWidth="1" strokeDasharray="6 3" />

            {/* Sub-Assembly 4: Rear Radiator & Cooling Shroud */}
            <g 
              onClick={() => handleSelect('comp4')}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <rect
                x="60"
                y="90"
                width="80"
                height="140"
                rx="6"
                fill={stressView && machine.components.comp4.condition === 'degraded' ? '#DC5268' : activePart === 'comp4' ? '#F3F0FF' : '#FFFFFF'}
                stroke={activePart === 'comp4' ? '#6D55E8' : '#D6CEFB'}
                strokeWidth={activePart === 'comp4' ? '2.5' : '1.5'}
              />
              {/* Radiator Cooling Fins */}
              <line x1="80" y1="100" x2="80" y2="220" stroke="#D6CEFB" strokeWidth="1.5" />
              <line x1="100" y1="100" x2="100" y2="220" stroke="#D6CEFB" strokeWidth="1.5" />
              <line x1="120" y1="100" x2="120" y2="220" stroke="#D6CEFB" strokeWidth="1.5" />
              <text x="100" y="250" textAnchor="middle" fill="#77738C" fontSize="10" fontFamily="IBM Plex Mono">Cooling</text>
            </g>

            {/* Sub-Assembly 3: Motor Stator Windings Core */}
            <g 
              onClick={() => handleSelect('comp3')}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <rect
                x="160"
                y="80"
                width="140"
                height="160"
                rx="8"
                fill={stressView && machine.components.comp3.condition === 'degraded' ? '#DC5268' : activePart === 'comp3' ? '#F3F0FF' : '#FFFFFF'}
                stroke={activePart === 'comp3' ? '#6D55E8' : '#D6CEFB'}
                strokeWidth={activePart === 'comp3' ? '2.5' : '1.5'}
              />
              {/* Motor Stator Windings Lines */}
              <rect x="180" y="100" width="100" height="120" rx="4" fill="#F4F1FF" stroke="#EAE5FF" strokeWidth="1" />
              <circle cx="230" cy="160" r="30" fill="none" stroke="#6D55E8" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="230" y="260" textAnchor="middle" fill="#77738C" fontSize="10" fontFamily="IBM Plex Mono">Stator Core</text>
            </g>

            {/* Sub-Assembly 2: Hydraulic Seal & Manifold */}
            <g 
              onClick={() => handleSelect('comp2')}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <rect
                x="320"
                y="100"
                width="70"
                height="120"
                rx="6"
                fill={stressView && machine.components.comp2.condition === 'degraded' ? '#DC5268' : activePart === 'comp2' ? '#F3F0FF' : '#FFFFFF'}
                stroke={activePart === 'comp2' ? '#6D55E8' : '#D6CEFB'}
                strokeWidth={activePart === 'comp2' ? '2.5' : '1.5'}
              />
              {/* Fluid Manifold Ports */}
              <circle cx="355" cy="130" r="10" fill="#E8F7F2" stroke="#159B70" strokeWidth="1.5" />
              <circle cx="355" cy="190" r="10" fill="#E8F7F2" stroke="#159B70" strokeWidth="1.5" />
              <text x="355" y="250" textAnchor="middle" fill="#77738C" fontSize="10" fontFamily="IBM Plex Mono">Manifold</text>
            </g>

            {/* Sub-Assembly 1: Drive Bearings & Shaft Spindle */}
            <g 
              onClick={() => handleSelect('comp1')}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              {/* Shaft Body */}
              <rect
                x="410"
                y="120"
                width="140"
                height="80"
                rx="4"
                fill={stressView && machine.components.comp1.condition === 'degraded' ? '#DC5268' : activePart === 'comp1' ? '#F3F0FF' : '#FFFFFF'}
                stroke={activePart === 'comp1' ? '#6D55E8' : '#D6CEFB'}
                strokeWidth={activePart === 'comp1' ? '2.5' : '1.5'}
              />
              {/* Dual Bearing Races */}
              <rect x="425" y="110" width="22" height="100" rx="3" fill="#EAE5FF" stroke="#6D55E8" strokeWidth="1.5" />
              <rect x="500" y="110" width="22" height="100" rx="3" fill="#EAE5FF" stroke="#6D55E8" strokeWidth="1.5" />
              <text x="480" y="240" textAnchor="middle" fill="#77738C" fontSize="10" fontFamily="IBM Plex Mono">Drive Bearings</text>
            </g>
          </svg>
        </div>

        {/* Right: Component Detail Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#FAF9FF] border border-[#EAE5FF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#6D55E8]">
                {activePart.toUpperCase()} · Sub-Assembly
              </span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: `${getCompColor(activeComp.condition)}15`,
                  color: getCompColor(activeComp.condition),
                  border: `1px solid ${getCompColor(activeComp.condition)}40`
                }}
              >
                {activeComp.condition.toUpperCase()}
              </span>
            </div>

            <h4 className="text-base font-display font-bold text-[#242139] mb-1">
              {activeComp.name}
            </h4>

            <p className="text-xs text-[#77738C] leading-relaxed mb-4">
              {activeComp.condition === 'degraded'
                ? 'Elevated bearing harmonic chatter recorded. Spalling fatigue detected on outboard drive races.'
                : activeComp.condition === 'fair'
                ? 'Minor operational drift detected within allowable manufacturing tolerance.'
                : 'Assembly operating strictly within optimal calibration bounds.'}
            </p>

            {/* Wear Progress Gauge */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-[#77738C]">Cumulative Wear Rate</span>
                <span className="font-mono font-bold text-[#242139]">{activeComp.wearPercent}%</span>
              </div>
              <div className="w-full bg-[#EAE5FF] h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${activeComp.wearPercent}%`,
                    backgroundColor: getCompColor(activeComp.condition)
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#EAE5FF] text-xs text-[#77738C]">
              <Wrench className="w-4 h-4 text-[#6D55E8]" />
              <span>Inspection Interval: Every 500 operating hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
