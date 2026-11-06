import React, { useState } from 'react';
import { SensorTelemetry } from '../types';
import { TELEMETRY_BASELINES } from '../services/mlEngine';
import { Activity, AlertCircle } from 'lucide-react';

interface SensorChartProps {
  data: SensorTelemetry[];
  activeSensor?: 'vibration' | 'pressure' | 'rotate' | 'volt' | 'temperature';
  onSensorChange?: (sensor: 'vibration' | 'pressure' | 'rotate' | 'volt' | 'temperature') => void;
  title?: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({
  data,
  activeSensor: initialSensor = 'vibration',
  onSensorChange,
  title
}) => {
  const [selectedSensor, setSelectedSensor] = useState<'vibration' | 'pressure' | 'rotate' | 'volt' | 'temperature'>(initialSensor);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h'>('24h');

  const handleSelectSensor = (s: 'vibration' | 'pressure' | 'rotate' | 'volt' | 'temperature') => {
    setSelectedSensor(s);
    onSensorChange?.(s);
  };

  // Slice data based on selected time window
  let displayData = data;
  if (timeRange === '1h') displayData = data.slice(-4);
  else if (timeRange === '6h') displayData = data.slice(-8);
  else if (timeRange === '12h') displayData = data.slice(-14);

  const baseline = TELEMETRY_BASELINES[selectedSensor];
  const values = displayData.map(d => d[selectedSensor]);
  const minVal = Math.min(...values, baseline.minNorm * 0.9);
  const maxVal = Math.max(...values, baseline.maxNorm * 1.1);
  const valRange = maxVal - minVal || 1;

  // Compute SVG dimensions & coordinates
  const svgWidth = 800;
  const svgHeight = 250;
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

  // Normal Operating Range Band (Shaded)
  const normYTop = Math.max(padding.top, getY(baseline.maxNorm));
  const normYBottom = Math.min(padding.top + graphHeight, getY(baseline.minNorm));
  const normBandHeight = Math.max(0, normYBottom - normYTop);

  // Mean line
  const meanY = getY(baseline.mean);

  // Line points string
  const pointsString = displayData
    .map((d, i) => `${getX(i)},${getY(d[selectedSensor])}`)
    .join(' ');

  // Current metric stats
  const currentVal = values[values.length - 1] ?? 0;
  const isAbove = currentVal > baseline.maxNorm;
  const isBelow = currentVal < baseline.minNorm;
  const isAnomalous = isAbove || isBelow;

  // Sensor palette for light mode (minimal purple + soft blue)
  const sensorColors = {
    vibration: { stroke: '#7055E8', fill: 'rgba(112, 85, 232, 0.08)', badge: 'text-[#7055E8]' },
    pressure: { stroke: '#5689D8', fill: 'rgba(86, 137, 216, 0.08)', badge: 'text-[#5689D8]' },
    rotate: { stroke: '#9785F2', fill: 'rgba(151, 133, 242, 0.08)', badge: 'text-[#9785F2]' },
    volt: { stroke: '#159B70', fill: 'rgba(21, 155, 112, 0.08)', badge: 'text-[#159B70]' },
    temperature: { stroke: '#DC5268', fill: 'rgba(220, 82, 104, 0.08)', badge: 'text-[#DC5268]' },
  };

  const currentColor = sensorColors[selectedSensor];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E9E5F5] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F2F0FF] text-[#7055E8]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#24213B] text-sm sm:text-base">
              {title || 'Sensor Trend Analysis'}
            </h3>
            <p className="text-[11px] text-[#77758D] flex items-center gap-2 mt-0.5 font-mono">
              <span>Baseline: {baseline.minNorm} – {baseline.maxNorm} {baseline.unit}</span>
              {isAnomalous && (
                <span className="flex items-center gap-1 text-[#DC5268] font-semibold bg-[#FCEBED] px-1.5 py-0.2 rounded-full border border-[#F6B7C1]">
                  <AlertCircle className="w-3 h-3" /> Out of Spec
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Sensor Selector Pills */}
        <div className="flex items-center gap-1 bg-[#FAF9FF] p-1 rounded-xl border border-[#E9E5F5]">
          {(['vibration', 'temperature', 'pressure', 'rotate', 'volt'] as const).map(s => {
            const isSelected = selectedSensor === s;
            return (
              <button
                key={s}
                onClick={() => handleSelectSensor(s)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all capitalize font-medium ${
                  isSelected
                    ? 'bg-[#FFFFFF] text-[#7055E8] font-bold shadow-sm border border-[#E9E5F5]'
                    : 'text-[#77758D] hover:text-[#24213B]'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Time range controls */}
        <div className="flex items-center gap-1 bg-[#FAF9FF] p-1 rounded-xl border border-[#E9E5F5]">
          {(['1h', '6h', '12h', '24h'] as const).map(tr => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-mono font-medium ${
                timeRange === tr
                  ? 'bg-[#7055E8] text-white font-bold shadow-sm'
                  : 'text-[#77758D] hover:text-[#24213B]'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full overflow-hidden bg-[#FAF9FF] rounded-xl border border-[#E9E5F5] p-2">
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
            stroke="#E9E5F5"
            strokeDasharray="3 3"
          />
          <line
            x1={padding.left}
            y1={meanY}
            x2={svgWidth - padding.right}
            y2={meanY}
            stroke="#E8E2FF"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + graphHeight}
            stroke="#E9E5F5"
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

          {/* Trend Area Fill */}
          <polygon
            points={`${padding.left},${padding.top + graphHeight} ${pointsString} ${getX(displayData.length - 1)},${padding.top + graphHeight}`}
            fill={currentColor.fill}
          />

          {/* Main Trend Line */}
          <polyline
            points={pointsString}
            fill="none"
            stroke={currentColor.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {displayData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d[selectedSensor]);
            const isHovered = hoverIndex === i;
            const val = d[selectedSensor];
            const isPointAnomalous = val > baseline.maxNorm || val < baseline.minNorm;

            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : isPointAnomalous ? 4.5 : 3}
                  fill={isPointAnomalous ? '#DC5268' : currentColor.stroke}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Hover Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.max(padding.left, Math.min(cx - 50, svgWidth - padding.right - 100))}
                      y={Math.max(5, cy - 42)}
                      width="100"
                      height="34"
                      rx="6"
                      fill="#24213B"
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
                      fill="#E8E2FF"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {d.timestamp.slice(-8)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
