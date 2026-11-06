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
  Clock, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
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
  const isVoltOut = latest.volt > TELEMETRY_BASELINES.volt.maxNorm || latest.volt < TELEMETRY_BASELINES.volt.minNorm;
  const isTempOut = latest.temperature > TELEMETRY_BASELINES.temperature.maxNorm || latest.temperature < TELEMETRY_BASELINES.temperature.minNorm;

  // Mini sparkline renderer for individual channel cards
  const renderSparkline = (
    key: keyof SensorTelemetry,
    color: string,
    minNorm: number,
    maxNorm: number
  ) => {
    const points = liveBuffer.slice(-28);
    if (points.length < 2) return null;

    const values = points.map(p => Number(p[key]));
    const min = Math.min(...values, minNorm * 0.95);
    const max = Math.max(...values, maxNorm * 1.05);
    const range = max - min || 1;

    const width = 280;
    const height = 60;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((Number(p[key]) - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const normYTop = Math.max(0, height - ((maxNorm - min) / range) * height);
    const normYBottom = Math.min(height, height - ((minNorm - min) / range) * height);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14 overflow-visible select-none">
        {/* Shaded Normal Range Band */}
        <rect
          x="0"
          y={normYTop}
          width={width}
          height={Math.max(0, normYBottom - normYTop)}
          fill="#159B70"
          fillOpacity="0.1"
        />
        {/* Upper bound dashed line */}
        <line x1="0" y1={normYTop} x2={width} y2={normYTop} stroke="#159B70" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        {/* Telemetry polyline */}
        <polyline
          points={coords}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current point pulsing dot */}
        {points.length > 0 && (
          <circle
            cx={width}
            cy={height - ((values[values.length - 1] - min) / range) * height}
            r="4"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            className="animate-pulse"
          />
        )}
      </svg>
    );
  };

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
  const svgHeight = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
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

  // Dynamic anomaly events based on live status
  const anomalyEvents = [
    {
      sensor: 'Vibration',
      value: `${latest.vibration} mm/s`,
      status: isVibOut ? 'Out of Spec' : 'Normal',
      severity: isVibOut ? 'critical' : 'nominal',
      detail: isVibOut ? 'Spindle harmonic amplitude exceeds 50 mm/s baseline limit.' : 'Within certified ISO 10816 vibration severity envelope.',
      time: 'Live'
    },
    {
      sensor: 'Temperature',
      value: `${latest.temperature} °C`,
      status: isTempOut ? 'Out of Spec' : 'Normal',
      severity: isTempOut ? 'critical' : 'nominal',
      detail: isTempOut ? 'Cooling jacket temperature drift above 84.0°C operating threshold.' : 'Steady-state heat dissipation within thermal envelope.',
      time: 'Live'
    },
    {
      sensor: 'Hydraulic Pressure',
      value: `${latest.pressure} PSI`,
      status: isPressOut ? 'Out of Spec' : 'Normal',
      severity: isPressOut ? 'warning' : 'nominal',
      detail: isPressOut ? 'Manifold pressure outside certified 85 - 118 PSI clamping range.' : 'Continuous steady pressure delivered to hydraulic toolholder.',
      time: 'Live'
    },
    {
      sensor: 'Spindle Velocity',
      value: `${latest.rotate} RPM`,
      status: isRotOut ? 'Out of Spec' : 'Normal',
      severity: isRotOut ? 'warning' : 'nominal',
      detail: isRotOut ? 'Motor feedback resolver detected angular speed deviation.' : 'Synchronous velocity maintained under active machining load.',
      time: 'Live'
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 text-[#25213A] max-w-[1600px] mx-auto w-full">
      {/* 1. Header & Mandatory Data Attribution Banner */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#F0EBFF] border border-[#EAE6F2] flex items-center justify-center text-[#7950E8] flex-shrink-0 shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#25213A] font-mono">
                Live Sensor Telemetry Oscilloscope
              </h2>
              {/* Strict Transparent Attribution Tag */}
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A] flex items-center gap-1 shadow-2xs">
                <Info className="w-3 h-3" /> Simulated Edge Demo Data (1.0 Hz Gateway)
              </span>
            </div>
            <p className="text-xs text-[#77748B]">
              Continuous multi-channel telemetry streams synchronized at edge sampling rate. All readings for this demonstration are simulated.
            </p>
          </div>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onToggleStreaming}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-xs ${
              isStreaming
                ? 'bg-white border-[#EAE6F2] text-[#25213A] hover:bg-[#FAF9FF]'
                : 'bg-[#159B70] border-[#159B70] text-white hover:bg-[#0f7a57]'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-4 h-4 text-[#7950E8]" /> Pause Feed
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" /> Resume Feed
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => onSetStreamSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all font-semibold ${
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
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono">
            Active Asset:
          </label>
          <div className="relative">
            <select
              value={selectedMachine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="appearance-none bg-[#FAF9FF] border border-[#EAE6F2] text-[#25213A] font-semibold text-xs rounded-xl px-3.5 py-2 pr-9 focus:outline-none focus:border-[#7950E8] cursor-pointer transition-all shadow-xs"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id}) — {m.status.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7950E8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
            selectedMachine.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268] border-[#F6B7C1]' :
            selectedMachine.status === 'warning' ? 'bg-[#FEF6E9] text-[#D99117] border-[#F7D59A]' :
            'bg-[#E8F7F2] text-[#159B70] border-[#A3E3CD]'
          }`}>
            Health: {selectedMachine.healthScore}%
          </span>
        </div>

        {/* Anomaly Injection Sandbox */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#77748B] font-medium mr-1 font-mono flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#7950E8]" /> Inject Anomaly:
          </span>
          <button
            onClick={() => onInjectAnomaly('vibration')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FCEBED] hover:bg-[#FADDE1] border border-[#F6B7C1] text-[#DC5268] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title="Simulate sudden bearing harmonic spike"
          >
            <Flame className="w-3.5 h-3.5 text-[#DC5268]" /> Vibration Spike (+18 mm/s)
          </button>
          <button
            onClick={() => onInjectAnomaly('pressure')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FEF6E9] hover:bg-[#FCEFD6] border border-[#F7D59A] text-[#D99117] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title="Simulate hydraulic line pressure drop"
          >
            <Gauge className="w-3.5 h-3.5 text-[#D99117]" /> Pressure Drop (-24 PSI)
          </button>
          <button
            onClick={() => onInjectAnomaly('volt')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#F0EBFF] hover:bg-[#EAE5FF] border border-[#EAE6F2] text-[#7950E8] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
            title="Simulate electrical voltage surge"
          >
            <Zap className="w-3.5 h-3.5 text-[#7950E8]" /> Voltage Surge (+26 V)
          </button>
        </div>
      </div>

      {/* 3. Five Real-Time Sensor Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* 1. Vibration Channel */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
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
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-bold tabular-nums ${isVibOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                {latest.vibration}
              </span>
              <span className="text-xs text-[#77748B]">mm/s RMS</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1 font-mono">
              Envelope: {TELEMETRY_BASELINES.vibration.minNorm} – {TELEMETRY_BASELINES.vibration.maxNorm} mm/s
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F7F6FC]">
            {renderSparkline('vibration', '#7950E8', TELEMETRY_BASELINES.vibration.minNorm, TELEMETRY_BASELINES.vibration.maxNorm)}
          </div>
        </div>

        {/* 2. Temperature Channel */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
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
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-bold tabular-nums ${isTempOut ? 'text-[#DC5268]' : 'text-[#25213A]'}`}>
                {latest.temperature}
              </span>
              <span className="text-xs text-[#77748B]">°C</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1 font-mono">
              Envelope: {TELEMETRY_BASELINES.temperature.minNorm} – {TELEMETRY_BASELINES.temperature.maxNorm} °C
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F7F6FC]">
            {renderSparkline('temperature', '#DC5268', TELEMETRY_BASELINES.temperature.minNorm, TELEMETRY_BASELINES.temperature.maxNorm)}
          </div>
        </div>

        {/* 3. Fluid Pressure Channel */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-2 font-mono">
                <Gauge className="w-4 h-4 text-[#3B82F6]" /> Hydraulic Pressure
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isPressOut ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isPressOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#25213A] tabular-nums">
                {latest.pressure}
              </span>
              <span className="text-xs text-[#77748B]">PSI</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1 font-mono">
              Envelope: {TELEMETRY_BASELINES.pressure.minNorm} – {TELEMETRY_BASELINES.pressure.maxNorm} PSI
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F7F6FC]">
            {renderSparkline('pressure', '#3B82F6', TELEMETRY_BASELINES.pressure.minNorm, TELEMETRY_BASELINES.pressure.maxNorm)}
          </div>
        </div>

        {/* 4. Rotational Speed Channel */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
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
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#25213A] tabular-nums">
                {latest.rotate}
              </span>
              <span className="text-xs text-[#77748B]">RPM</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1 font-mono">
              Envelope: {TELEMETRY_BASELINES.rotate.minNorm} – {TELEMETRY_BASELINES.rotate.maxNorm} RPM
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F7F6FC]">
            {renderSparkline('rotate', '#9258F5', TELEMETRY_BASELINES.rotate.minNorm, TELEMETRY_BASELINES.rotate.maxNorm)}
          </div>
        </div>

        {/* 5. Supply Voltage Channel */}
        <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#159B70] flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-[#159B70]" /> Line Voltage
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isVoltOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isVoltOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#25213A] tabular-nums">
                {latest.volt}
              </span>
              <span className="text-xs text-[#77748B]">V</span>
            </div>
            <span className="text-xs text-[#77748B] block mt-1 font-mono">
              Envelope: {TELEMETRY_BASELINES.volt.minNorm} – {TELEMETRY_BASELINES.volt.maxNorm} V
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F7F6FC]">
            {renderSparkline('volt', '#159B70', TELEMETRY_BASELINES.volt.minNorm, TELEMETRY_BASELINES.volt.maxNorm)}
          </div>
        </div>

        {/* 6. Real-Time PdM Diagnostic Assessment */}
        <div className="bg-[#FAF9FF] border border-[#EAE6F2] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7950E8] flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#7950E8]" /> Edge PdM Assessment
              </span>
              <span className="text-[11px] text-[#77748B] font-mono">Horizon: 7d</span>
            </div>
            <h4 className="text-sm font-bold text-[#25213A] mt-1 line-clamp-2">
              {prediction.predictedFailure}
            </h4>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-mono font-bold text-[#25213A]">
                {prediction.probability}%
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                prediction.calibratedRisk === 'Severe' ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' :
                prediction.calibratedRisk === 'High' ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' : 
                'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {prediction.calibratedRisk} Risk
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EAE6F2] text-xs text-[#77748B] flex items-center justify-between">
            <span>Asset: <strong className="text-[#7950E8] font-mono">{selectedMachine.id}</strong></span>
            <span className="text-[#159B70] font-semibold">{statusTheme.label}</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Sensor Deep Analysis Oscilloscope Chart */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F0EBFF] text-[#7950E8]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#25213A] text-sm sm:text-base">
                Multi-Sensor Oscilloscope Stream — {selectedMachine.name}
              </h3>
              <p className="text-[11px] text-[#77748B] font-mono mt-0.5">
                Calibrated Nominal Band: {baseline.minNorm} – {baseline.maxNorm} {baseline.unit}
              </p>
            </div>
          </div>

          {/* Sensor Tabs */}
          <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
            {(['vibration', 'temperature', 'pressure', 'rotate', 'volt'] as const).map(s => {
              const isSelected = selectedSensorTab === s;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSensorTab(s)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all capitalize font-medium ${
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

          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-[#F7F6FC] p-1 rounded-xl border border-[#EAE6F2]">
            {(['1h', '6h', '12h', '24h'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all font-mono font-medium ${
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

        {/* Oscilloscope SVG Canvas on White Surface */}
        <div className="relative w-full overflow-hidden bg-white rounded-xl border border-[#EAE6F2] p-2">
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

      {/* 5. Live Anomaly & Diagnostic Event Log */}
      <div className="bg-white border border-[#EAE6F2] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F2] mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#7950E8]" />
            <h3 className="text-sm font-bold text-[#25213A]">
              Live Sensor Diagnostic Event Log — {selectedMachine.id}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#77748B]">
            Real-time threshold surveillance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {anomalyEvents.map((evt, idx) => (
            <div 
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                evt.severity === 'critical' ? 'bg-[#FEF2F2] border-[#FECACA]' :
                evt.severity === 'warning' ? 'bg-[#FFFBEB] border-[#FDE68A]' :
                'bg-[#FAF9FF] border-[#EAE6F2]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-[#25213A]">{evt.sensor}</span>
                  <span className="font-mono text-xs font-bold text-[#7950E8]">{evt.value}</span>
                </div>
                <p className="text-xs text-[#77748B] leading-relaxed">
                  {evt.detail}
                </p>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                evt.severity === 'critical' ? 'bg-[#DC5268] text-white' :
                evt.severity === 'warning' ? 'bg-[#D99117] text-white' :
                'bg-[#159B70] text-white'
              }`}>
                {evt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
