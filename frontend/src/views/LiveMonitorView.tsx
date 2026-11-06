import React, { useState } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { TELEMETRY_BASELINES, predictMachineFailure } from '../services/mlEngine';
import { 
  Play, 
  Pause, 
  Flame, 
  Activity, 
  Gauge, 
  RotateCw, 
  Zap, 
  Thermometer, 
  ChevronDown, 
  Radio, 
  Sparkles, 
  Info, 
  Sliders
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface LiveMonitorViewProps {
  machines: Machine[];
  selectedMachine: Machine;
  liveBuffer: SensorTelemetry[];
  onSelectMachine: (machineId: string) => void;
  onInjectAnomaly: (sensor: 'vibration' | 'pressure' | 'volt') => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  streamSpeed: number;
  onSetStreamSpeed: (speed: number) => void;
}

export const LiveMonitorView: React.FC<LiveMonitorViewProps> = ({
  machines,
  selectedMachine,
  liveBuffer,
  onSelectMachine,
  onInjectAnomaly,
  isStreaming,
  onToggleStreaming,
  streamSpeed,
  onSetStreamSpeed
}) => {
  const [selectedSensorTab, setSelectedSensorTab] = useState<'vibration' | 'temperature' | 'pressure' | 'rotate' | 'volt'>('vibration');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h'>('24h');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const latest = liveBuffer[liveBuffer.length - 1] || {
    timestamp: '00:00:00',
    volt: 170.8,
    rotate: 446.6,
    pressure: 100.9,
    vibration: 40.4,
    temperature: 71.5
  };

  const prediction = predictMachineFailure(selectedMachine.id, latest, selectedMachine.age);
  const statusTheme = getStatusTheme(selectedMachine.status);

  // Sensor Out-of-Bounds Checking against baseline ranges
  const isVibOut = latest.vibration > TELEMETRY_BASELINES.vibration.maxNorm || latest.vibration < TELEMETRY_BASELINES.vibration.minNorm;
  const isPressOut = latest.pressure > TELEMETRY_BASELINES.pressure.maxNorm || latest.pressure < TELEMETRY_BASELINES.pressure.minNorm;
  const isRotOut = latest.rotate > TELEMETRY_BASELINES.rotate.maxNorm || latest.rotate < TELEMETRY_BASELINES.rotate.minNorm;
  const isTempOut = latest.temperature > TELEMETRY_BASELINES.temperature.maxNorm || latest.temperature < TELEMETRY_BASELINES.temperature.minNorm;

  // Oscilloscope time range slice
  let displayData = liveBuffer;
  if (timeRange === '1h') displayData = liveBuffer.slice(-10);
  else if (timeRange === '6h') displayData = liveBuffer.slice(-20);
  else if (timeRange === '12h') displayData = liveBuffer.slice(-35);

  const baseline = TELEMETRY_BASELINES[selectedSensorTab];
  const chartValues = displayData.map(d => Number(d[selectedSensorTab]));
  const minVal = Math.min(...chartValues, baseline.minNorm * 0.9);
  const maxVal = Math.max(...chartValues, baseline.maxNorm * 1.1);
  const valRange = maxVal - minVal || 1;

  const svgWidth = 840;
  const svgHeight = 280;
  const padding = { top: 30, right: 35, bottom: 40, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (displayData.length <= 1) return padding.left;
    return padding.left + (index / (displayData.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    return padding.top + graphHeight - ((val - minVal) / valRange) * graphHeight;
  };

  const normYTop = Math.max(padding.top, getY(baseline.maxNorm));
  const normYBottom = Math.min(padding.top + graphHeight, getY(baseline.minNorm));
  const normBandHeight = Math.max(0, normYBottom - normYTop);
  const meanY = getY(baseline.mean);

  const pointsString = displayData
    .map((d, i) => `${getX(i)},${getY(Number(d[selectedSensorTab]))}`)
    .join(' ');

  const sensorThemeColors = {
    vibration: { stroke: '#7950E8', fill: 'rgba(121, 80, 232, 0.08)' },
    temperature: { stroke: '#DC5268', fill: 'rgba(220, 82, 104, 0.08)' },
    pressure: { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.08)' },
    rotate: { stroke: '#9258F5', fill: 'rgba(146, 88, 245, 0.08)' },
    volt: { stroke: '#159B70', fill: 'rgba(21, 155, 112, 0.08)' },
  };

  const activeColor = sensorThemeColors[selectedSensorTab];

  return (
    <div className="flex flex-col gap-7 pb-16 text-[#25213A] max-w-[1520px] mx-auto w-full">
      {/* 1. Header & Mandatory Data Attribution Banner */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0EBFF] border border-[#EAE6F2] flex items-center justify-center text-[#7950E8] flex-shrink-0 shadow-2xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-[#25213A] font-mono">
                Live Sensor Telemetry Oscilloscope
              </h1>
              {/* Strict Transparent Attribution Tag */}
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A] flex items-center gap-1 shadow-2xs">
                <Info className="w-3.5 h-3.5" /> Simulated Edge Demo Data (1.0 Hz Gateway)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#77748B]">
              Continuous multi-channel telemetry streams synchronized at edge sampling rate. All readings for this demonstration are simulated.
            </p>
          </div>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onToggleStreaming}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 shadow-xs ${
              isStreaming
                ? 'bg-white border-[#EAE6F2] text-[#25213A] hover:bg-[#FAF9FF]'
                : 'bg-[#159B70] border-[#159B70] text-white hover:bg-[#0f7a57]'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-4 h-4 text-[#7950E8]" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" /> Resume Stream
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-[#F7F6FC] p-1.5 rounded-xl border border-[#EAE6F2]">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => onSetStreamSpeed(spd)}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all font-semibold ${
                  streamSpeed === spd
                    ? 'bg-[#7950E8] text-white shadow-xs'
                    : 'text-[#77748B] hover:text-[#25213A]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Machine Switcher & Anomaly Injection Sandbox */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
            Active Asset:
          </label>
          <div className="relative">
            <select
              value={selectedMachine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="appearance-none bg-[#FAF9FF] border border-[#EAE6F2] text-[#25213A] font-bold text-xs sm:text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-[#7950E8] cursor-pointer transition-all shadow-2xs"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id}) — {m.status.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7950E8] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${
            selectedMachine.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268] border-[#F6B7C1]' :
            selectedMachine.status === 'warning' ? 'bg-[#FEF6E9] text-[#D99117] border-[#F7D59A]' :
            'bg-[#E8F7F2] text-[#159B70] border-[#A3E3CD]'
          }`}>
            Health: {selectedMachine.healthScore}%
          </span>
        </div>

        {/* Anomaly Injection Sandbox */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-[#77748B] font-medium mr-1 font-mono flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#7950E8]" /> Inject Anomaly:
          </span>
          <button
            onClick={() => onInjectAnomaly('vibration')}
            className="px-3.5 py-2 text-xs rounded-xl bg-[#FCEBED] hover:bg-[#FADDE1] border border-[#F6B7C1] text-[#DC5268] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Simulate sudden bearing harmonic spike"
          >
            <Flame className="w-3.5 h-3.5 text-[#DC5268]" /> Vibration Spike (+18 mm/s)
          </button>
          <button
            onClick={() => onInjectAnomaly('pressure')}
            className="px-3.5 py-2 text-xs rounded-xl bg-[#FEF6E9] hover:bg-[#FCEFD6] border border-[#F7D59A] text-[#D99117] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Simulate hydraulic line pressure drop"
          >
            <Gauge className="w-3.5 h-3.5 text-[#D99117]" /> Pressure Drop (-24 PSI)
          </button>
          <button
            onClick={() => onInjectAnomaly('volt')}
            className="px-3.5 py-2 text-xs rounded-xl bg-[#F0EBFF] hover:bg-[#EAE5FF] border border-[#EAE6F2] text-[#7950E8] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Simulate electrical voltage surge"
          >
            <Zap className="w-3.5 h-3.5 text-[#7950E8]" /> Voltage Surge (+26 V)
          </button>
        </div>
      </div>

      {/* 3. Essential Telemetry Cards (Spacious, Clean Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Vibration */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7950E8] flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-[#7950E8]" /> Vibration RMS
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isVibOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isVibOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-mono font-extrabold tabular-nums ${isVibOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                {latest.vibration}
              </span>
              <span className="text-xs text-[#77748B]">mm/s RMS</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1.5 font-mono">
              Envelope: {TELEMETRY_BASELINES.vibration.minNorm} – {TELEMETRY_BASELINES.vibration.maxNorm} mm/s
            </span>
          </div>
        </div>

        {/* 2. Temperature */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DC5268] flex items-center gap-2 font-mono">
                <Thermometer className="w-4 h-4 text-[#DC5268]" /> Operating Temp
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isTempOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isTempOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-mono font-extrabold tabular-nums ${isTempOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                {latest.temperature}
              </span>
              <span className="text-xs text-[#77748B]">°C</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1.5 font-mono">
              Envelope: {TELEMETRY_BASELINES.temperature.minNorm} – {TELEMETRY_BASELINES.temperature.maxNorm} °C
            </span>
          </div>
        </div>

        {/* 3. Hydraulic Pressure */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-2 font-mono">
                <Gauge className="w-4 h-4 text-[#3B82F6]" /> Hydraulic Line
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isPressOut ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isPressOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-extrabold text-[#25213A] tabular-nums">
                {latest.pressure}
              </span>
              <span className="text-xs text-[#77748B]">PSI</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1.5 font-mono">
              Envelope: {TELEMETRY_BASELINES.pressure.minNorm} – {TELEMETRY_BASELINES.pressure.maxNorm} PSI
            </span>
          </div>
        </div>

        {/* 4. Spindle Velocity */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9258F5] flex items-center gap-2 font-mono">
                <RotateCw className="w-4 h-4 text-[#9258F5]" /> Spindle Velocity
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isRotOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isRotOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-extrabold text-[#25213A] tabular-nums">
                {latest.rotate}
              </span>
              <span className="text-xs text-[#77748B]">RPM</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1.5 font-mono">
              Envelope: {TELEMETRY_BASELINES.rotate.minNorm} – {TELEMETRY_BASELINES.rotate.maxNorm} RPM
            </span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Sensor Deep Analysis Oscilloscope Chart (Clean & Spacious) */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F0EBFF] text-[#7950E8]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#25213A] text-sm sm:text-base">
                Multi-Sensor Oscilloscope Stream — {selectedMachine.name}
              </h3>
              <p className="text-xs text-[#77748B] font-mono mt-0.5">
                Calibrated Nominal Band: {baseline.minNorm} – {baseline.maxNorm} {baseline.unit}
              </p>
            </div>
          </div>

          {/* Sensor Tabs & Time Range Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
              {(['vibration', 'temperature', 'pressure', 'rotate', 'volt'] as const).map(s => {
                const isSelected = selectedSensorTab === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSensorTab(s)}
                    className={`px-3.5 py-1.5 text-xs rounded-lg transition-all capitalize font-semibold ${
                      isSelected
                        ? 'bg-white text-[#7950E8] font-bold shadow-xs border border-[#EAE6F2]'
                        : 'text-[#77748B] hover:text-[#25213A]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
              {(['1h', '6h', '12h', '24h'] as const).map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all font-mono font-medium ${
                    timeRange === tr
                      ? 'bg-[#7950E8] text-white font-bold shadow-xs'
                      : 'text-[#77748B] hover:text-[#25213A]'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Oscilloscope SVG Canvas on White Surface with High Legibility */}
        <div className="relative w-full overflow-hidden bg-white rounded-xl border border-[#EAE6F2] p-4">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Grid Lines */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={svgWidth - padding.right}
              y2={padding.top}
              stroke="#F0EBFF"
              strokeDasharray="3 3"
            />
            <line
              x1={padding.left}
              y1={meanY}
              x2={svgWidth - padding.right}
              y2={meanY}
              stroke="#EAE6F2"
              strokeDasharray="4 4"
            />
            <line
              x1={padding.left}
              y1={padding.top + graphHeight}
              x2={svgWidth - padding.right}
              y2={padding.top + graphHeight}
              stroke="#F0EBFF"
            />

            {/* Normal Operating Band */}
            <rect
              x={padding.left}
              y={normYTop}
              width={graphWidth}
              height={normBandHeight}
              fill="#E8F7F2"
              opacity="0.8"
            />

            {/* Shaded Area Under Line */}
            <polygon
              points={`${padding.left},${padding.top + graphHeight} ${pointsString} ${getX(displayData.length - 1)},${padding.top + graphHeight}`}
              fill={activeColor.fill}
            />

            {/* Main Polyline */}
            <polyline
              points={pointsString}
              fill="none"
              stroke={activeColor.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points and Tooltips */}
            {displayData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(Number(d[selectedSensorTab]));
              const isHovered = hoverIndex === i;
              const val = Number(d[selectedSensorTab]);
              const isPointAnomalous = val > baseline.maxNorm || val < baseline.minNorm;

              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : isPointAnomalous ? 4.5 : 3}
                    fill={isPointAnomalous ? '#DC5268' : activeColor.stroke}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all"
                  />

                  {isHovered && (
                    <g>
                      <rect
                        x={Math.max(padding.left, Math.min(cx - 50, svgWidth - padding.right - 100))}
                        y={Math.max(5, cy - 42)}
                        width="100"
                        height="34"
                        rx="6"
                        fill="#25213A"
                        opacity="0.95"
                      />
                      <text
                        x={Math.max(padding.left, Math.min(cx - 50, svgWidth - padding.right - 100)) + 50}
                        y={Math.max(5, cy - 42) + 15}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {val.toFixed(1)} {baseline.unit}
                      </text>
                      <text
                        x={Math.max(padding.left, Math.min(cx - 50, svgWidth - padding.right - 100)) + 50}
                        y={Math.max(5, cy - 42) + 27}
                        textAnchor="middle"
                        fill="#EAE5FF"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {d.timestamp ? d.timestamp.slice(-8) : ''}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
