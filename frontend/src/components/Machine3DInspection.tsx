import React, { useState } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { 
  Layers, 
  Eye, 
  Flame, 
  Info, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface Machine3DInspectionProps {
  machine: Machine;
  telemetry: SensorTelemetry;
  selectedComponentKey: 'comp1' | 'comp2' | 'comp3' | 'comp4';
  onSelectComponent: (compKey: 'comp1' | 'comp2' | 'comp3' | 'comp4') => void;
  onToggleBlueprint?: () => void;
}

export const Machine3DInspection: React.FC<Machine3DInspectionProps> = ({
  machine,
  telemetry,
  selectedComponentKey,
  onSelectComponent,
  onToggleBlueprint
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'thermal' | 'blueprint'>('3d');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imgError, setImgError] = useState(false);

  const activeComp = machine.components[selectedComponentKey];
  const theme = getStatusTheme(machine.status);

  // Curated, verified high-resolution industrial machine imagery
  const machineImages: Record<string, string> = {
    'MACH-012': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', // High-precision CNC Machining Spindle
    'MACH-024': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80', // Hydraulic Press & Line
    'MACH-001': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80', // Precision Spindle Lathe
    'MACH-048': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80', // High-volume moulding cell
  };

  const primaryImage = machineImages[machine.id] || machineImages['MACH-012'];
  const fallbackImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';

  // Hotspot overlay positions on the 3D machine image
  const hotspots: Record<'comp1' | 'comp2' | 'comp3' | 'comp4', { top: string; left: string; label: string }> = {
    comp1: { top: '56%', left: '46%', label: 'COMP 1: Drive Shaft & Bearing' },
    comp2: { top: '38%', left: '30%', label: 'COMP 2: Hydraulic Seal & Manifold' },
    comp3: { top: '28%', left: '62%', label: 'COMP 3: Motor Stator Assembly' },
    comp4: { top: '72%', left: '68%', label: 'COMP 4: Cooling Shroud & Exchanger' }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-card flex flex-col gap-4">
      {/* Visualizer Top Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F3FF]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E1B4B]">
                3D Machine CAD Visualizer
              </span>
              <span className="text-[10px] font-mono font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#EDE9FE]">
                {machine.id}
              </span>
            </div>
            <span className="text-[10px] text-[#64748B]">
              Interactive Component Inspection & Thermal Telemetry Overlay
            </span>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5 bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE]">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              viewMode === '3d'
                ? 'bg-[#FFFFFF] text-[#7C3AED] shadow-xs border border-[#EDE9FE]'
                : 'text-[#64748B] hover:text-[#1E1B4B]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            <span>3D Photo</span>
          </button>

          <button
            onClick={() => setViewMode('thermal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              viewMode === 'thermal'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#DC2626]'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Thermal</span>
          </button>

          {onToggleBlueprint && (
            <button
              onClick={onToggleBlueprint}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-all flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Machine Inspection Frame */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-[#0E0B1A] rounded-xl overflow-hidden border border-[#EDE9FE] select-none group shadow-inner">
        {/* Background Grid Accent */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #A78BFA 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Machine Image */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imgError ? fallbackImage : primaryImage}
            alt={`${machine.name} 3D Machine Model`}
            className={`w-full h-full object-cover transition-all duration-500 ${
              viewMode === 'thermal'
                ? 'filter contrast-150 saturate-200 hue-rotate-180 brightness-90'
                : 'filter brightness-95'
            }`}
            onError={() => setImgError(true)}
          />
        </div>

        {/* Thermal Heat Map Gradient Overlay if Thermal Mode is active */}
        {viewMode === 'thermal' && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#DC2626]/40 via-[#F59E0B]/20 to-transparent pointer-events-none mix-blend-color-burn" />
        )}

        {/* Interactive Hotspots Overlaid on Machine Image */}
        {(['comp1', 'comp2', 'comp3', 'comp4'] as const).map(key => {
          const comp = machine.components[key];
          const isSelected = selectedComponentKey === key;
          const pos = hotspots[key];
          const isDegraded = comp.condition === 'degraded';
          const isFair = comp.condition === 'fair';

          const dotColor = isDegraded ? 'bg-[#DC2626]' : isFair ? 'bg-[#D97706]' : 'bg-[#059669]';
          const ringColor = isDegraded ? 'ring-[#DC2626]/50' : isFair ? 'ring-[#D97706]/50' : 'ring-[#059669]/50';

          return (
            <button
              key={key}
              onClick={() => onSelectComponent(key)}
              style={{ top: pos.top, left: pos.left }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group/btn transition-transform ${
                isSelected ? 'scale-125' : 'hover:scale-115'
              }`}
              title={`${pos.label}: ${comp.wearPercent}% Wear (${comp.condition.toUpperCase()})`}
            >
              <div className="relative flex items-center justify-center">
                {/* Pulsing Aura */}
                <span className={`absolute w-7 h-7 rounded-full ${dotColor} opacity-75 animate-ping`} />
                {/* Outer Ring */}
                <span className={`w-5 h-5 rounded-full ${dotColor} ring-4 ${ringColor} flex items-center justify-center shadow-lg border-2 border-white`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>

                {/* Hover / Active Badge Pill */}
                <div className={`absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shadow-lg transition-all pointer-events-none ${
                  isSelected
                    ? 'bg-[#1E1B4B] text-white border border-[#7C3AED] opacity-100'
                    : 'bg-[#1E1B4B]/90 text-[#E0E7FF] opacity-0 group-hover/btn:opacity-100'
                }`}>
                  {key.toUpperCase()} · {comp.wearPercent}% Wear
                </div>
              </div>
            </button>
          );
        })}

        {/* Top Left Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-[#0F0B1E]/80 backdrop-blur-md text-white text-[11px] font-mono font-semibold border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            3D Online Asset: {machine.name}
          </span>
          {viewMode === 'thermal' && (
            <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-[10px] font-mono font-bold uppercase animate-pulse">
              Thermal Hotspots Active
            </span>
          )}
        </div>

        {/* Bottom Floating Inspection Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#0F0B1E]/80 backdrop-blur-md p-1 rounded-xl border border-white/15 text-white">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 pointer-events-none text-[10px] text-white/80 font-mono bg-[#0F0B1E]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
          Click component hotspots to inspect sub-assemblies
        </div>
      </div>

      {/* Component Selector Tabs & Live Health Diagnostics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['comp1', 'comp2', 'comp3', 'comp4'] as const).map(key => {
          const comp = machine.components[key];
          const isSelected = selectedComponentKey === key;
          const isDegraded = comp.condition === 'degraded';
          const isFair = comp.condition === 'fair';

          const shortNames: Record<string, string> = {
            comp1: 'Drive Shaft & Bearing',
            comp2: 'Hydraulic Seal',
            comp3: 'Motor Stator',
            comp4: 'Cooling Shroud'
          };

          return (
            <button
              key={key}
              onClick={() => onSelectComponent(key)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-sm ring-1 ring-[#7C3AED]'
                  : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#BFDBFE] hover:bg-[#FAF9FD]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">
                  {key.toUpperCase()}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  isDegraded ? 'bg-[#DC2626]' : isFair ? 'bg-[#D97706]' : 'bg-[#059669]'
                }`} />
              </div>
              <div className="font-semibold text-xs text-[#1E1B4B] truncate">
                {shortNames[key]}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-[#64748B]">Wear:</span>
                <span className={`font-mono font-bold ${
                  isDegraded ? 'text-[#DC2626]' : isFair ? 'text-[#D97706]' : 'text-[#059669]'
                }`}>
                  {comp.wearPercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Component Quick Action Card */}
      <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
          <span className="text-[#1E1B4B]">
            <strong className="text-[#7C3AED]">{activeComp.name}:</strong> {
              activeComp.condition === 'degraded'
                ? 'Urgent servicing advised. Harmonic stress exceeds baseline.'
                : activeComp.condition === 'fair'
                ? 'Routine mechanical wear detected. Schedule lubrication.'
                : 'Assembly operating nominally within manufacturer tolerance.'
            }
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ml-2 flex-shrink-0 ${
          activeComp.condition === 'degraded'
            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
            : activeComp.condition === 'fair'
            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
            : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
        }`}>
          {activeComp.wearPercent}% Wear · {activeComp.condition}
        </span>
      </div>
    </div>
  );
};
