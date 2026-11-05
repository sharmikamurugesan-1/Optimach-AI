import React from 'react';
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

  // Sensor Out-of-Bounds Checking
  const isVibOut = latest.vibration > TELEMETRY_BASELINES.vibration.maxNorm || latest.vibration < TELEMETRY_BASELINES.vibration.minNorm;
  const isPressOut = latest.pressure > TELEMETRY_BASELINES.pressure.maxNorm || latest.pressure < TELEMETRY_BASELINES.pressure.minNorm;
  const isRotOut = latest.rotate > TELEMETRY_BASELINES.rotate.maxNorm || latest.rotate < TELEMETRY_BASELINES.rotate.minNorm;
  const isVoltOut = latest.volt > TELEMETRY_BASELINES.volt.maxNorm || latest.volt < TELEMETRY_BASELINES.volt.minNorm;
  const isTempOut = latest.temperature > TELEMETRY_BASELINES.temperature.maxNorm || latest.temperature < TELEMETRY_BASELINES.temperature.minNorm;

  // Mini sparkline renderer for light mode
  const renderSparkline = (
    key: keyof SensorTelemetry,
    color: string,
    minNorm: number,
    maxNorm: number
  ) => {
    const points = liveBuffer.slice(-30);
    if (points.length < 2) return null;

    const values = points.map(p => Number(p[key]));
    const min = Math.min(...values, minNorm * 0.95);
    const max = Math.max(...values, maxNorm * 1.05);
    const range = max - min || 1;

    const width = 280;
    const height = 65;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((Number(p[key]) - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const normYTop = Math.max(0, height - ((maxNorm - min) / range) * height);
    const normYBottom = Math.min(height, height - ((minNorm - min) / range) * height);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible select-none">
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
        {/* Current point dot */}
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

  return (
    <div className="flex flex-col gap-8 pb-16 text-[#242139]">
      {/* 1. Top Banner: Data Source Transparency & Stream Controls */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] border border-[#EAE5FF] flex items-center justify-center text-[#6D55E8] flex-shrink-0 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#242139] font-mono">
                Live Sensor Telemetry Oscilloscope
              </span>
              {/* Mandatory Persistent Data Source Indicator */}
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A] flex items-center gap-1">
                <Info className="w-3 h-3" /> Simulated Demonstration Feed
              </span>
            </div>
            <p className="text-xs text-[#77738C]">
              Continuous 1.0 Hz vibration, thermal, pressure, and electrical channel telemetry.
            </p>
          </div>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleStreaming}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-sm ${
              isStreaming
                ? 'bg-[#FFFFFF] border-[#EAE5FF] text-[#242139] hover:bg-[#FAF9FF]'
                : 'bg-[#159B70] border-[#159B70] text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-4 h-4 text-[#6D55E8]" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" /> Resume Stream
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-[#FAF9FF] p-1 rounded-xl border border-[#EAE5FF]">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => onSetStreamSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                  streamSpeed === spd
                    ? 'bg-[#6D55E8] text-white font-bold shadow-sm'
                    : 'text-[#77738C] hover:text-[#242139]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Machine Switcher & Fault Injection Sandbox */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#77738C] font-mono">
            Selected Machine:
          </label>
          <div className="relative">
            <select
              value={selectedMachine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="appearance-none bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] font-semibold text-xs rounded-xl px-3.5 py-2 pr-9 focus:outline-none focus:border-[#6D55E8] cursor-pointer transition-all shadow-sm"
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

        {/* Anomaly Injection Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#77738C] font-medium mr-1 font-mono">
            Inject Anomaly:
          </span>
          <button
            onClick={() => onInjectAnomaly('vibration')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FCEBED] hover:bg-[#FADDE1] border border-[#F6B7C1] text-[#DC5268] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Simulate sudden bearing vibration spike"
          >
            <Flame className="w-3.5 h-3.5 text-[#DC5268]" /> Vibration Spike (+18 mm/s)
          </button>
          <button
            onClick={() => onInjectAnomaly('pressure')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#FEF6E9] hover:bg-[#FCEFD6] border border-[#F7D59A] text-[#D99117] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Simulate hydraulic pressure loss"
          >
            <Gauge className="w-3.5 h-3.5 text-[#D99117]" /> Pressure Drop (-24 PSI)
          </button>
          <button
            onClick={() => onInjectAnomaly('volt')}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#F3F0FF] hover:bg-[#EAE5FF] border border-[#EAE5FF] text-[#6D55E8] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Simulate electrical voltage surge"
          >
            <Zap className="w-3.5 h-3.5 text-[#6D55E8]" /> Voltage Surge (+26 V)
          </button>
        </div>
      </div>

      {/* 3. Five Real-Time Sensor Channel Oscilloscope Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Vibration Channel */}
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6D55E8] flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-[#6D55E8]" /> Vibration RMS
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isVibOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isVibOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-bold tabular-nums ${isVibOut ? 'text-[#DC5268]' : 'text-[#242139]'}`}>
                {latest.vibration}
              </span>
              <span className="text-xs text-[#77738C]">mm/s RMS</span>
            </div>
            <span className="text-xs text-[#77738C] block mt-1 font-mono">
              Standard: {TELEMETRY_BASELINES.vibration.minNorm} – {TELEMETRY_BASELINES.vibration.maxNorm} mm/s
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F0FF]">
            {renderSparkline('vibration', '#6D55E8', TELEMETRY_BASELINES.vibration.minNorm, TELEMETRY_BASELINES.vibration.maxNorm)}
          </div>
        </div>

        {/* 2. Temperature Channel */}
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DC5268] flex items-center gap-2 font-mono">
                <Thermometer className="w-4 h-4 text-[#DC5268]" /> Operating Temp
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isTempOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isTempOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-bold tabular-nums ${isTempOut ? 'text-[#DC5268]' : 'text-[#242139]'}`}>
                {latest.temperature}
              </span>
              <span className="text-xs text-[#77738C]">°C</span>
            </div>
            <span className="text-xs text-[#77738C] block mt-1 font-mono">
              Standard: {TELEMETRY_BASELINES.temperature.minNorm} – {TELEMETRY_BASELINES.temperature.maxNorm} °C
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F0FF]">
            {renderSparkline('temperature', '#DC5268', TELEMETRY_BASELINES.temperature.minNorm, TELEMETRY_BASELINES.temperature.maxNorm)}
          </div>
        </div>

        {/* 3. Fluid Pressure Channel */}
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 flex items-center gap-2 font-mono">
                <Gauge className="w-4 h-4 text-sky-600" /> Hydraulic Pressure
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isPressOut ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isPressOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#242139] tabular-nums">
                {latest.pressure}
              </span>
              <span className="text-xs text-[#77738C]">PSI</span>
            </div>
            <span className="text-xs text-[#77738C] block mt-1 font-mono">
              Standard: {TELEMETRY_BASELINES.pressure.minNorm} – {TELEMETRY_BASELINES.pressure.maxNorm} PSI
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F0FF]">
            {renderSparkline('pressure', '#0284C7', TELEMETRY_BASELINES.pressure.minNorm, TELEMETRY_BASELINES.pressure.maxNorm)}
          </div>
        </div>

        {/* 4. Rotational Speed Channel */}
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-2 font-mono">
                <RotateCw className="w-4 h-4 text-purple-600" /> Rotational Velocity
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isRotOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isRotOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#242139] tabular-nums">
                {latest.rotate}
              </span>
              <span className="text-xs text-[#77738C]">RPM</span>
            </div>
            <span className="text-xs text-[#77738C] block mt-1 font-mono">
              Standard: {TELEMETRY_BASELINES.rotate.minNorm} – {TELEMETRY_BASELINES.rotate.maxNorm} RPM
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F0FF]">
            {renderSparkline('rotate', '#7C3AED', TELEMETRY_BASELINES.rotate.minNorm, TELEMETRY_BASELINES.rotate.maxNorm)}
          </div>
        </div>

        {/* 5. Supply Voltage Channel */}
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-emerald-600" /> Supply Voltage
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isVoltOut ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' : 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]'
              }`}>
                {isVoltOut ? 'Out of Spec' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#242139] tabular-nums">
                {latest.volt}
              </span>
              <span className="text-xs text-[#77738C]">V</span>
            </div>
            <span className="text-xs text-[#77738C] block mt-1 font-mono">
              Standard: {TELEMETRY_BASELINES.volt.minNorm} – {TELEMETRY_BASELINES.volt.maxNorm} V
            </span>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F0FF]">
            {renderSparkline('volt', '#159B70', TELEMETRY_BASELINES.volt.minNorm, TELEMETRY_BASELINES.volt.maxNorm)}
          </div>
        </div>

        {/* 6. Live Condition Assessment Card */}
        <div className="bg-gradient-to-br from-[#F4F1FF] to-[#FAF9FF] border border-[#EAE5FF] rounded-2xl p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D55E8] flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#6D55E8]" /> Edge PdM Assessment
              </span>
              <span className="text-[11px] text-[#77738C] font-mono">Horizon: 7d</span>
            </div>
            <h4 className="text-sm font-semibold text-[#242139] mt-1 line-clamp-2">
              {prediction.predictedFailure}
            </h4>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-mono font-bold text-[#242139]">
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

          <div className="mt-4 pt-3 border-t border-[#EAE5FF] text-xs text-[#77738C] flex items-center justify-between">
            <span>Asset: <strong className="text-[#6D55E8] font-mono">{selectedMachine.id}</strong></span>
            <span className="text-[#159B70] font-semibold">{statusTheme.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
