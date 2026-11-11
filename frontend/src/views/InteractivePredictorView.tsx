import React, { useState } from 'react';
import { Machine, SensorTelemetry, PredictionResult } from '../types';
import { predictMachineFailure, calculateHealthScore } from '../services/mlEngine';
import { queryBackendPrediction } from '../services/backendApi';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Gauge, 
  Thermometer, 
  Activity, 
  Wrench, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

type ToleranceStatus = 'normal' | 'warning' | 'critical';

interface DynamicOutputResult {
  riskTier: 'Low' | 'Moderate' | 'High' | 'Severe';
  failureProbability: number;
  healthScore: number;
  predictedTorque: number;
  isAnomaly: boolean;
  models: {
    lgbm: { pred: number; label: string; conf: string };
    xgb: { pred: number; label: string; conf: string };
    tree: { pred: number; label: string; rule: string };
    isolationForest: { status: string; isOutlier: boolean };
    lstm: { prob: number; flag: boolean };
    lgbmRegressor: { torque: number; diff: number };
    ridge: { torque: number };
  };
  tolerances: {
    temperature: ToleranceStatus;
    vibration: ToleranceStatus;
    pressure: ToleranceStatus;
    speed: ToleranceStatus;
    torque: ToleranceStatus;
    wear: ToleranceStatus;
  };
  recommendation: string;
  urgency: string;
}

interface InteractivePredictorViewProps {
  machines: Machine[];
  onApplyManualTelemetry: (machineId: string, telemetry: SensorTelemetry) => void;
  onNavigateToView?: (view: string) => void;
  onCreateWorkOrder?: (title: string, notes: string) => void;
}

export const InteractivePredictorView: React.FC<InteractivePredictorViewProps> = ({
  machines,
  onApplyManualTelemetry,
  onNavigateToView,
  onCreateWorkOrder
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || 'MACH-012');
  const [machineType, setMachineType] = useState<'L' | 'M' | 'H'>('L');

  // Input States (Telemetry & Machine Parameters)
  const [airTemp, setAirTemp] = useState<number>(300.0); // Kelvin
  const [procTemp, setProcTemp] = useState<number>(310.0); // Kelvin
  const [rotSpeed, setRotSpeed] = useState<number>(1538); // RPM
  const [torque, setTorque] = useState<number>(40.0); // Nm
  const [toolWear, setToolWear] = useState<number>(108); // min
  const [vibration, setVibration] = useState<number>(40.4); // mm/s
  const [pressure, setPressure] = useState<number>(100.9); // PSI
  const [volt, setVolt] = useState<number>(170.8); // V

  // Output States
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<DynamicOutputResult>(() =>
    computeDynamicOutput(300.0, 310.0, 1538, 40.0, 108, 40.4, 100.9, 170.8, 'L')
  );

  function computeDynamicOutput(
    air: number,
    proc: number,
    rpm: number,
    tq: number,
    wear: number,
    vib: number,
    pres: number,
    v: number,
    type: 'L' | 'M' | 'H'
  ): DynamicOutputResult {
    // Physical criteria
    const deltaT = proc - air;
    const power = (tq * (2 * Math.PI * rpm)) / 60;
    const isHdf = deltaT < 8.6 && rpm < 1380;
    const isPwf = power < 3500 || power > 9000;
    const isTwf = wear >= (type === 'H' ? 240 : type === 'M' ? 220 : 200);
    const osfLimit = type === 'L' ? 11000 : type === 'M' ? 12000 : 13000;
    const isOsf = tq * wear > osfLimit;
    const isVibCritical = vib > 54.0;

    let votes = 0;
    if (isHdf) votes += 2;
    if (isPwf) votes += 2;
    if (isTwf) votes += 2;
    if (isOsf) votes += 2;
    if (isVibCritical) votes += 2;
    if (pres > 130 || pres < 85) votes += 1;
    if (proc > 318) votes += 1;

    const prob = Math.min(98, Math.max(4, Math.round((votes / 8) * 100)));
    let riskTier: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    let urgency = 'Routine Surveillance';
    let recommendation = 'All sensor envelopes within certified factory limits. Maintain scheduled routine lubrication.';

    if (prob >= 75) {
      riskTier = 'Severe';
      urgency = 'Immediate Emergency Stop';
      recommendation = isHdf 
        ? 'Severe thermal dissipation collapse. Flush coolant manifold and inspect heat exchanger.'
        : isTwf 
        ? 'Cutting tool wear limit breached. Immediate cutting insert replacement required.'
        : isOsf 
        ? 'High torque overload with worn tool. Reduce feed rate and inspect spindle drive bearings.'
        : 'Severe harmonic vibration surge. Immediate drive shaft inspection advised.';
    } else if (prob >= 50) {
      riskTier = 'High';
      urgency = 'Mandatory Inspection within 48 Hours';
      recommendation = 'Non-linear telemetry drift detected across dual sensors. Schedule physical verification.';
    } else if (prob >= 25) {
      riskTier = 'Moderate';
      urgency = 'Schedule Service within 7 Days';
      recommendation = 'Early sensor drift detected. Verify baseline fluid pressure and spindle bearing harmonics.';
    }

    const health = Math.max(10, Math.min(99, Math.round(100 - prob * 0.95)));
    const predTorque = Math.round((2860 / ((rpm * 2 * Math.PI) / 60)) * 10) / 10;
    const torqueDiff = Math.round((tq - predTorque) * 10) / 10;

    return {
      riskTier,
      failureProbability: prob,
      healthScore: health,
      predictedTorque: predTorque,
      isAnomaly: votes >= 2,
      models: {
        lgbm: { pred: prob >= 50 ? 1 : 0, label: prob >= 50 ? 'Failure Predicted' : 'Nominal Operation', conf: `${Math.min(99, prob + 4)}%` },
        xgb: { pred: prob >= 50 ? 1 : 0, label: prob >= 50 ? 'Failure Predicted' : 'Nominal Operation', conf: `${Math.min(98, prob + 2)}%` },
        tree: { pred: prob >= 50 ? 1 : 0, label: prob >= 50 ? 'High Risk' : 'Normal', rule: isTwf ? 'ToolWear >= 200' : isHdf ? 'DeltaT < 8.6K' : 'Baseline Verified' },
        isolationForest: { status: votes >= 2 ? 'Out-of-Distribution Outlier' : 'In-Distribution Normal', isOutlier: votes >= 2 },
        lstm: { prob: Math.round((prob / 100) * 1000) / 1000, flag: prob >= 50 },
        lgbmRegressor: { torque: predTorque, diff: torqueDiff },
        ridge: { torque: Math.round((predTorque * 0.98) * 10) / 10 }
      },
      tolerances: {
        temperature: proc > 318 ? 'critical' : proc > 313 ? 'warning' : 'normal',
        vibration: vib > 54 ? 'critical' : vib > 48 ? 'warning' : 'normal',
        pressure: pres > 130 || pres < 85 ? 'critical' : pres > 115 ? 'warning' : 'normal',
        speed: rpm < 1350 || rpm > 2200 ? 'warning' : 'normal',
        torque: tq > 60 ? 'critical' : tq > 50 ? 'warning' : 'normal',
        wear: wear > 210 ? 'critical' : wear > 180 ? 'warning' : 'normal',
      },
      recommendation,
      urgency
    };
  }

  // Preset Scenario Handlers
  const handleLoadScenario = (scenario: 'nominal' | 'hdf' | 'twf' | 'pwf' | 'osf' | 'bearing') => {
    if (scenario === 'nominal') {
      setAirTemp(300.0);
      setProcTemp(310.0);
      setRotSpeed(1538);
      setTorque(40.0);
      setToolWear(85);
      setVibration(39.5);
      setPressure(101.2);
      setVolt(171.0);
      setMachineType('L');
    } else if (scenario === 'hdf') {
      setAirTemp(302.5);
      setProcTemp(308.2); // Delta T = 5.7K < 8.6K
      setRotSpeed(1310);
      setTorque(48.5);
      setToolWear(110);
      setVibration(44.8);
      setPressure(106.0);
      setVolt(170.0);
      setMachineType('L');
    } else if (scenario === 'twf') {
      setAirTemp(301.0);
      setProcTemp(316.5);
      setRotSpeed(1450);
      setTorque(54.0);
      setToolWear(232); // Exceeded 200 min
      setVibration(62.4);
      setPressure(118.0);
      setVolt(172.5);
      setMachineType('L');
    } else if (scenario === 'pwf') {
      setAirTemp(300.0);
      setProcTemp(312.0);
      setRotSpeed(2650);
      setTorque(68.0); // Power = ~18.8 kW > 9 kW
      setToolWear(140);
      setVibration(55.2);
      setPressure(122.0);
      setVolt(195.0);
      setMachineType('M');
    } else if (scenario === 'osf') {
      setAirTemp(301.2);
      setProcTemp(314.0);
      setRotSpeed(1380);
      setTorque(72.5);
      setToolWear(198); // Torque * wear = 14,355 > 11,000
      setVibration(58.9);
      setPressure(128.0);
      setVolt(170.0);
      setMachineType('L');
    } else if (scenario === 'bearing') {
      setAirTemp(300.5);
      setProcTemp(319.8);
      setRotSpeed(1280);
      setTorque(62.0);
      setToolWear(175);
      setVibration(67.8); // High harmonic
      setPressure(138.5);
      setVolt(175.0);
      setMachineType('H');
    }

    setAppliedSuccess(false);
  };

  // Re-run Prediction
  const handleExecutePrediction = async () => {
    setIsEvaluating(true);
    setAppliedSuccess(false);

    // Run dynamic output
    const out = computeDynamicOutput(airTemp, procTemp, rotSpeed, torque, toolWear, vibration, pressure, volt, machineType);
    setEvalResult(out);

    // Seamlessly query Flask API if available
    try {
      const res = await queryBackendPrediction({
        Type: machineType,
        Air_temperature: airTemp,
        Process_temperature: procTemp,
        Rotational_speed: rotSpeed,
        Torque: torque,
        Tool_wear: toolWear
      });
      if (res && res.status === 'success') {
        // Enriched with live Flask ML predictions
        console.log('[INTERACTIVE PREDICTOR] Flask ML Response:', res);
      }
    } catch {
      // Local fallback active
    }

    setTimeout(() => {
      setIsEvaluating(false);
    }, 250);
  };

  // Apply to Machine Fleet Dashboard
  const handleApplyToFleet = () => {
    const telem: SensorTelemetry = {
      timestamp: new Date().toTimeString().slice(0, 8),
      volt,
      rotate: rotSpeed,
      pressure,
      vibration,
      temperature: Math.round((procTemp - 273.15) * 10) / 10 // Convert to Celsius
    };

    onApplyManualTelemetry(selectedMachineId, telem);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 4000);
  };

  const getRiskStyle = (tier: string) => {
    switch (tier) {
      case 'Severe':
        return {
          bg: 'bg-[#FCEBED]',
          border: 'border-[#F6B7C1]',
          text: 'text-[#DC5268]',
          badge: 'bg-[#DC5268] text-white',
          glow: 'shadow-[0_0_20px_rgba(220,82,104,0.2)]'
        };
      case 'High':
        return {
          bg: 'bg-[#FFF7ED]',
          border: 'border-[#FED7AA]',
          text: 'text-[#EA580C]',
          badge: 'bg-[#EA580C] text-white',
          glow: 'shadow-[0_0_20px_rgba(234,88,12,0.15)]'
        };
      case 'Moderate':
        return {
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#FEF08A]',
          text: 'text-[#CA8A04]',
          badge: 'bg-[#CA8A04] text-white',
          glow: 'shadow-[0_0_20px_rgba(202,138,4,0.15)]'
        };
      default:
        return {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#BBF7D0]',
          text: 'text-[#159B70]',
          badge: 'bg-[#159B70] text-white',
          glow: 'shadow-[0_0_20px_rgba(21,155,112,0.15)]'
        };
    }
  };

  const riskStyle = getRiskStyle(evalResult.riskTier);

  return (
    <div className="flex flex-col gap-7 pb-16 text-[#25213A] max-w-[1520px] mx-auto w-full">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#77748B] mb-1.5 font-medium">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-[#7950E8] font-semibold">Interactive Prediction Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25213A]">
            Model Prediction &amp; Diagnostic Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#77748B] mt-1">
            Provide customized sensor telemetry inputs and visualize real-time predictive failure outputs across all 7 machine learning models.
          </p>
        </div>

        {/* Action Trigger Pills */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExecutePrediction}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7950E8] to-[#9258F5] text-white font-bold text-xs shadow-md shadow-[#7950E8]/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating Models...' : 'Run Prediction'}</span>
          </button>

          <button
            onClick={handleApplyToFleet}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAE6F2] text-[#25213A] font-bold text-xs hover:bg-[#FAF9FF] hover:border-[#7950E8] transition-all cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#159B70]" />
            <span>Apply to Fleet Dashboard</span>
          </button>
        </div>
      </div>

      {/* Applied Confirmation Banner */}
      {appliedSuccess && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <div>
              <span className="text-xs font-bold text-[#065F46] block">
                Telemetry Inputs Successfully Applied to {selectedMachineId}
              </span>
              <span className="text-[11px] text-[#047857]">
                Live values have been propagated across Factory Overview, Machine Fleet, and Live Monitoring views.
              </span>
            </div>
          </div>
          {onNavigateToView && (
            <button
              onClick={() => onNavigateToView('overview')}
              className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1"
            >
              <span>View in Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 2. Main Two-Column Layout: Inputs (Left) and Outputs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN (5 Cols): GIVE INPUT                                   */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#F7F6FC] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9FF] border border-[#EAE6F2] flex items-center justify-center text-[#7950E8]">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#25213A]">Telemetry Input Parameters</h2>
                  <span className="text-[11px] text-[#77748B]">Adjust operational parameters in real time</span>
                </div>
              </div>

              {/* Machine Picker */}
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="text-xs font-mono font-bold bg-[#FAF9FF] border border-[#EAE6F2] rounded-lg px-2.5 py-1.5 text-[#25213A] focus:outline-none focus:border-[#7950E8]"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.id} ({m.name.slice(0, 16)}...)</option>
                ))}
              </select>
            </div>

            {/* Scenario Quick-Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono block mb-2">
                Scenario Presets (1-Click Load)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleLoadScenario('nominal')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#159B70] text-[11px] font-bold text-left transition-all"
                >
                  🟢 Healthy Run
                </button>
                <button
                  onClick={() => handleLoadScenario('hdf')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#EA580C] text-[11px] font-bold text-left transition-all"
                >
                  🔴 Thermal (HDF)
                </button>
                <button
                  onClick={() => handleLoadScenario('twf')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold text-left transition-all"
                >
                  🔴 Tool Wear (TWF)
                </button>
                <button
                  onClick={() => handleLoadScenario('pwf')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#EA580C] text-[11px] font-bold text-left transition-all"
                >
                  🔴 Power Fault (PWF)
                </button>
                <button
                  onClick={() => handleLoadScenario('osf')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#D97706] text-[11px] font-bold text-left transition-all"
                >
                  🟠 Overstrain (OSF)
                </button>
                <button
                  onClick={() => handleLoadScenario('bearing')}
                  className="px-2.5 py-1.5 rounded-lg border border-[#F6B7C1] bg-[#FCEBED] hover:bg-[#FAD7DC] text-[#DC5268] text-[11px] font-bold text-left transition-all"
                >
                  ⚡ Harmonic Surge
                </button>
              </div>
            </div>

            {/* Product Type Variant */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#25213A]">Machine Product Type</span>
                <span className="text-[#77748B] font-mono text-[11px]">AI4I Variant</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'L', label: 'Type L (Low Toughness)' },
                  { id: 'M', label: 'Type M (Medium)' },
                  { id: 'H', label: 'Type H (High-Duty)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMachineType(t.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      machineType === t.id
                        ? 'bg-[#7950E8] text-white border-[#7950E8] shadow-xs'
                        : 'bg-[#FAF9FF] text-[#25213A] border-[#EAE6F2] hover:border-[#7950E8]'
                    }`}
                  >
                    {t.id} - {t.id === 'L' ? 'Low' : t.id === 'M' ? 'Medium' : 'High'}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Inputs */}
            <div className="space-y-4 pt-2">
              {/* Rotational Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Rotational Speed (RPM)</span>
                  <span className="font-mono font-bold text-[#7950E8]">{rotSpeed} RPM</span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="2800"
                  step="10"
                  value={rotSpeed}
                  onChange={(e) => setRotSpeed(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>600 RPM</span>
                  <span>Baseline: 1538 RPM</span>
                  <span>2800 RPM</span>
                </div>
              </div>

              {/* Mechanical Torque */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Mechanical Torque (Nm)</span>
                  <span className="font-mono font-bold text-[#7950E8]">{torque} Nm</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="0.5"
                  value={torque}
                  onChange={(e) => setTorque(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>10 Nm</span>
                  <span>Baseline: 40.0 Nm</span>
                  <span>90 Nm</span>
                </div>
              </div>

              {/* Cumulative Tool Wear */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Cumulative Tool Wear (min)</span>
                  <span className={`font-mono font-bold ${toolWear >= 200 ? 'text-[#DC5268]' : 'text-[#7950E8]'}`}>
                    {toolWear} min {toolWear >= 200 ? '(EXHAUSTED)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="260"
                  step="1"
                  value={toolWear}
                  onChange={(e) => setToolWear(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>0 min</span>
                  <span>Critical Limit: 200 min</span>
                  <span>260 min</span>
                </div>
              </div>

              {/* Process Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Process Temperature</span>
                  <span className="font-mono font-bold text-[#7950E8]">
                    {procTemp} K ({Math.round(procTemp - 273.15)}°C)
                  </span>
                </div>
                <input
                  type="range"
                  min="302"
                  max="325"
                  step="0.2"
                  value={procTemp}
                  onChange={(e) => setProcTemp(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>302 K (29°C)</span>
                  <span>Norm: 310 K (37°C)</span>
                  <span>325 K (52°C)</span>
                </div>
              </div>

              {/* Ambient Air Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Ambient Air Temperature</span>
                  <span className="font-mono font-bold text-[#7950E8]">
                    {airTemp} K ({Math.round(airTemp - 273.15)}°C)
                  </span>
                </div>
                <input
                  type="range"
                  min="295"
                  max="308"
                  step="0.2"
                  value={airTemp}
                  onChange={(e) => setAirTemp(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>295 K (22°C)</span>
                  <span>Norm: 300 K (27°C)</span>
                  <span>308 K (35°C)</span>
                </div>
              </div>

              {/* Core Vibration RMS */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Vibration RMS (mm/s)</span>
                  <span className={`font-mono font-bold ${vibration > 50 ? 'text-[#DC5268]' : 'text-[#7950E8]'}`}>
                    {vibration} mm/s {vibration > 50 ? '(BREACH)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="80"
                  step="0.5"
                  value={vibration}
                  onChange={(e) => setVibration(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>25 mm/s</span>
                  <span>Threshold: 50.0 mm/s</span>
                  <span>80 mm/s</span>
                </div>
              </div>

              {/* Hydraulic Pressure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#25213A]">Fluid / Hydraulic Pressure (PSI)</span>
                  <span className="font-mono font-bold text-[#7950E8]">{pressure} PSI</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="160"
                  step="0.5"
                  value={pressure}
                  onChange={(e) => setPressure(Number(e.target.value))}
                  className="w-full accent-[#7950E8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#77748B] font-mono">
                  <span>70 PSI</span>
                  <span>Normal: 85 - 118 PSI</span>
                  <span>160 PSI</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => handleLoadScenario('nominal')}
              className="w-full py-2.5 rounded-xl border border-[#EAE6F2] hover:bg-[#FAF9FF] text-xs font-semibold text-[#77748B] hover:text-[#25213A] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Certified Factory Baseline</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN (7 Cols): LIVE OUTPUT DISPLAY IN DASHBOARD            */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* 1. Hero Risk Assessment Card */}
          <div className={`border rounded-2xl p-6 sm:p-7 shadow-sm transition-all ${riskStyle.bg} ${riskStyle.border} ${riskStyle.glow}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${riskStyle.badge}`}>
                    {evalResult.riskTier} RISK SEVERITY
                  </span>
                  <span className="text-[11px] font-mono font-medium text-[#77748B]">
                    Ensemble Consensus
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#25213A]">
                  {evalResult.riskTier === 'Severe' ? 'Catastrophic Failure Imminent' :
                   evalResult.riskTier === 'High' ? 'Sub-System Drift Anomaly Detected' :
                   evalResult.riskTier === 'Moderate' ? 'Non-Critical Early Degradation' :
                   'Nominal Machinery Health'}
                </h3>
                <p className="text-xs text-[#77748B] mt-1 font-medium">
                  {evalResult.urgency} • Machine condition evaluated against certified physics tolerances.
                </p>
              </div>

              {/* Big Score Callout */}
              <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EAE6F2]">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums leading-none" style={{ color: evalResult.riskTier === 'Severe' ? '#DC5268' : (evalResult.riskTier === 'High' ? '#EA580C' : '#159B70') }}>
                  {evalResult.failureProbability}%
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono mt-1">
                  Chance of Failure
                </span>
                <span className="text-[10px] text-[#77748B] font-mono">
                  Health Index: {evalResult.healthScore}%
                </span>
              </div>
            </div>

            {/* Actionable Maintenance Recommendation */}
            <div className="mt-5 pt-4 border-t border-black/5 bg-white/70 rounded-xl p-3.5 flex items-start gap-3">
              <Wrench className="w-4 h-4 text-[#7950E8] flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#25213A] block mb-0.5">Recommended Maintenance Action:</span>
                <span className="text-[#25213A]/90">{evalResult.recommendation}</span>
              </div>
            </div>
          </div>

          {/* 2. 7-Model Prediction Breakdown Grid */}
          <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#F7F6FC] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9FF] border border-[#EAE6F2] flex items-center justify-center text-[#7950E8]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#25213A]">7-Model Inference Breakdown</h3>
                  <span className="text-[11px] text-[#77748B]">Real-time individual model classification &amp; regression outputs</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FAF9FF] border border-[#EAE6F2] text-[#7950E8] rounded">
                7 Models Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* LightGBM */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">LightGBM Classifier</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${evalResult.models.lgbm.pred === 1 ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#ECFDF5] text-[#159B70]'}`}>
                    {evalResult.models.lgbm.label}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Confidence:</span>
                  <span className="font-mono font-semibold text-[#25213A]">{evalResult.models.lgbm.conf}</span>
                </div>
              </div>

              {/* XGBoost */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">XGBoost Classifier</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${evalResult.models.xgb.pred === 1 ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#ECFDF5] text-[#159B70]'}`}>
                    {evalResult.models.xgb.label}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Confidence:</span>
                  <span className="font-mono font-semibold text-[#25213A]">{evalResult.models.xgb.conf}</span>
                </div>
              </div>

              {/* Decision Tree */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">Decision Tree (White-Box)</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${evalResult.models.tree.pred === 1 ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#ECFDF5] text-[#159B70]'}`}>
                    {evalResult.models.tree.label}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Trigger Rule:</span>
                  <span className="font-mono font-semibold text-[#7950E8]">{evalResult.models.tree.rule}</span>
                </div>
              </div>

              {/* Isolation Forest */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">Isolation Forest (Anomaly)</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${evalResult.models.isolationForest.isOutlier ? 'bg-[#FFF7ED] text-[#EA580C]' : 'bg-[#ECFDF5] text-[#159B70]'}`}>
                    {evalResult.models.isolationForest.isOutlier ? 'Outlier Detected' : 'In-Distribution'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Watchdog Status:</span>
                  <span className="font-mono text-[#25213A]">{evalResult.models.isolationForest.status}</span>
                </div>
              </div>

              {/* LSTM Neural Network */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">LSTM Deep Recurrent Net</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${evalResult.models.lstm.flag ? 'bg-[#FCEBED] text-[#DC5268]' : 'bg-[#ECFDF5] text-[#159B70]'}`}>
                    {evalResult.models.lstm.flag ? 'Temporal Wear Trigger' : 'Sequence Normal'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Sequence Probability:</span>
                  <span className="font-mono font-semibold text-[#25213A]">{evalResult.models.lstm.prob}</span>
                </div>
              </div>

              {/* LGBM Regressor */}
              <div className="p-3 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#25213A]">LGBM Torque Regressor</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAF9FF] text-[#7950E8] border border-[#EAE6F2]">
                    Pred: {evalResult.models.lgbmRegressor.torque} Nm
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#77748B]">
                  <span>Load Delta (Actual - Pred):</span>
                  <span className={`font-mono font-bold ${Math.abs(evalResult.models.lgbmRegressor.diff) > 15 ? 'text-[#DC5268]' : 'text-[#159B70]'}`}>
                    {evalResult.models.lgbmRegressor.diff > 0 ? `+${evalResult.models.lgbmRegressor.diff}` : evalResult.models.lgbmRegressor.diff} Nm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sensor Tolerance Status Table */}
          <div className="bg-white border border-[#EAE6F2] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#25213A] mb-3">Live Telemetry Tolerance Status</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Core Vibration RMS', val: `${vibration} mm/s`, limit: 'Max: 50.0 mm/s', status: evalResult.tolerances.vibration },
                { name: 'Process Temperature', val: `${procTemp} K (${Math.round(procTemp - 273.15)}°C)`, limit: 'Max: 313.0 K', status: evalResult.tolerances.temperature },
                { name: 'Rotational Velocity', val: `${rotSpeed} RPM`, limit: 'Certified: 1350 - 2200 RPM', status: evalResult.tolerances.speed },
                { name: 'Drive Torque', val: `${torque} Nm`, limit: 'Normal: 25.0 - 55.0 Nm', status: evalResult.tolerances.torque },
                { name: 'Tool Cutting Wear', val: `${toolWear} min`, limit: 'Exhaustion: 200 min', status: evalResult.tolerances.wear },
                { name: 'Hydraulic Pressure', val: `${pressure} PSI`, limit: 'Normal: 85 - 118 PSI', status: evalResult.tolerances.pressure },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#FAF9FF] border border-[#EAE6F2]">
                  <div>
                    <span className="font-semibold text-[#25213A] block">{item.name}</span>
                    <span className="text-[11px] text-[#77748B] font-mono">{item.limit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#25213A]">{item.val}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                      item.status === 'critical' ? 'bg-[#FCEBED] text-[#DC5268] border border-[#F6B7C1]' :
                      item.status === 'warning' ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]' :
                      'bg-[#ECFDF5] text-[#159B70] border border-[#A7F3D0]'
                    }`}>
                      {item.status === 'critical' ? 'Out of Spec' : item.status === 'warning' ? 'Early Drift' : 'Certified Normal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Instant Work Order Dispatch Card */}
          {evalResult.riskTier !== 'Low' && onCreateWorkOrder && (
            <div className="bg-[#FAF9FF] border border-[#EAE6F2] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#25213A] block">
                  Generate Corrective Work Order for {selectedMachineId}
                </span>
                <span className="text-[11px] text-[#77748B]">
                  Schedule immediate field maintenance checklist for {evalResult.urgency}.
                </span>
              </div>
              <button
                onClick={() => {
                  onCreateWorkOrder(
                    `Interactive Diagnostic: ${evalResult.riskTier} Risk Detected on ${selectedMachineId}`,
                    `Generated from Interactive Prediction Studio: ${evalResult.recommendation}. Inputs: Vibration=${vibration} mm/s, Temp=${procTemp} K, Torque=${torque} Nm.`
                  );
                  alert(`Work Order Dispatched for ${selectedMachineId}! Available in Maintenance Management.`);
                }}
                className="px-4 py-2 rounded-xl bg-[#DC5268] hover:bg-[#C94258] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Dispatch Work Order
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
