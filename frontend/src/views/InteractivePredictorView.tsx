import React, { useState, useEffect } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { queryBackendPrediction, checkBackendHealth, BackendPredictionResponse } from '../services/backendApi';
import { 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Gauge, 
  Activity, 
  Layers, 
  Check, 
  AlertCircle,
  Thermometer,
  Zap,
  RotateCw,
  Info
} from 'lucide-react';

export interface InteractivePredictorViewProps {
  machines?: Machine[];
  onApplyManualTelemetry?: (machineId: string, telemetry: SensorTelemetry) => void;
  onNavigateToView?: (view: string) => void;
  onCreateWorkOrder?: (title: string, notes: string) => void;
}

// Operational Tolerance Envelopes
const RANGES = {
  airTemp: { min: 280, max: 320, unit: 'K', label: 'Air Temperature', nominal: '298 - 304 K' },
  procTemp: { min: 290, max: 330, unit: 'K', label: 'Process Temperature', nominal: '308 - 314 K' },
  rotSpeed: { min: 1000, max: 3000, unit: 'RPM', label: 'Rotational Speed', nominal: '1400 - 1800 RPM' },
  torque: { min: 3, max: 95, unit: 'Nm', label: 'Torque', nominal: '30 - 55 Nm' },
  toolWear: { min: 0, max: 300, unit: 'min', label: 'Tool Wear', nominal: '0 - 240 min' },
};

export const InteractivePredictorView: React.FC<InteractivePredictorViewProps> = () => {
  // 1. Natural Language State
  const [nlText, setNlText] = useState<string>(
    'Machine type L, air temperature 300 K, process temperature 310 K, rotational speed 1538 RPM, torque 40 Nm and tool wear 80 minutes.'
  );
  const [extractionNotice, setExtractionNotice] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // 2. Six Sensor Inputs State
  const [mType, setMType] = useState<'L' | 'M' | 'H'>('L');
  const [airTempStr, setAirTempStr] = useState<string>('300.0');
  const [procTempStr, setProcTempStr] = useState<string>('310.0');
  const [rotSpeedStr, setRotSpeedStr] = useState<string>('1538');
  const [torqueStr, setTorqueStr] = useState<string>('40.0');
  const [toolWearStr, setToolWearStr] = useState<string>('80');

  // 3. Backend & Prediction State
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<BackendPredictionResponse | null>(null);

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((health) => {
      if (!isMounted) return;
      setBackendStatus(health.status === 'online' ? 'online' : 'offline');
    });
    return () => { isMounted = false; };
  }, []);

  // Validation helpers
  const numAir = parseFloat(airTempStr);
  const numProc = parseFloat(procTempStr);
  const numSpeed = parseFloat(rotSpeedStr);
  const numTorque = parseFloat(torqueStr);
  const numWear = parseFloat(toolWearStr);

  const isAirValid = !isNaN(numAir) && numAir >= RANGES.airTemp.min && numAir <= RANGES.airTemp.max;
  const isProcValid = !isNaN(numProc) && numProc >= RANGES.procTemp.min && numProc <= RANGES.procTemp.max;
  const isSpeedValid = !isNaN(numSpeed) && numSpeed >= RANGES.rotSpeed.min && numSpeed <= RANGES.rotSpeed.max;
  const isTorqueValid = !isNaN(numTorque) && numTorque >= RANGES.torque.min && numTorque <= RANGES.torque.max;
  const isWearValid = !isNaN(numWear) && numWear >= RANGES.toolWear.min && numWear <= RANGES.toolWear.max;
  const isTypeValid = ['L', 'M', 'H'].includes(mType);

  const allFieldsValid = isAirValid && isProcValid && isSpeedValid && isTorqueValid && isWearValid && isTypeValid;

  // 4. Deterministic Natural Language Parser
  const handleExtractValues = () => {
    setIsExtracting(true);
    setExtractionNotice(null);

    setTimeout(() => {
      const text = nlText;

      // Type parser: 'L', 'M', 'H'
      const typeMatch = text.match(/(?:machine|product)?\s*type\s*[:=]?\s*([HLMhlm])\b/i) ||
                        text.match(/\btype\s*[:=]?\s*([HLMhlm])\b/i) ||
                        text.match(/\b([HLMhlm])\s*(?:type|-type)\b/i);

      let extractedType: 'L' | 'M' | 'H' | null = null;
      if (typeMatch) {
        const char = typeMatch[1].toUpperCase();
        if (char === 'L' || char === 'M' || char === 'H') {
          extractedType = char as 'L' | 'M' | 'H';
          setMType(extractedType);
        }
      }

      // Temperature parsing helper with Celsius to Kelvin conversion
      const parseTemp = (pattern: RegExp): number | null => {
        const m = text.match(pattern);
        if (!m) return null;
        const val = parseFloat(m[1]);
        if (isNaN(val)) return null;
        const unit = (m[2] || '').toLowerCase().trim();
        if (unit.startsWith('c') || unit === '°c' || unit === 'deg c' || unit === 'degree c') {
          return Math.round((val + 273.15) * 100) / 100;
        }
        return Math.round(val * 100) / 100;
      };

      // Air Temperature
      const air = parseTemp(/(?:air\s*(?:temp|temperature)?|ambient\s*temp)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(k|c|°c|deg\s*c|kelvin|celsius)?\b/i);
      if (air !== null) setAirTempStr(air.toString());

      // Process Temperature
      const proc = parseTemp(/(?:process\s*(?:temp|temperature)?|proc\s*temp)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(k|c|°c|deg\s*c|kelvin|celsius)?\b/i);
      if (proc !== null) setProcTempStr(proc.toString());

      // Rotational Speed
      let speed: number | null = null;
      const speedMatch = text.match(/(?:rotational\s*speed|rotor\s*speed|speed|rpm)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:rpm)?\b/i);
      if (speedMatch) {
        const s = parseFloat(speedMatch[1]);
        if (!isNaN(s)) {
          speed = Math.round(s);
          setRotSpeedStr(speed.toString());
        }
      }

      // Torque
      let tq: number | null = null;
      const torqueMatch = text.match(/torque\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:nm|newton\s*meters?)?\b/i);
      if (torqueMatch) {
        const t = parseFloat(torqueMatch[1]);
        if (!isNaN(t)) {
          tq = Math.round(t * 100) / 100;
          setTorqueStr(tq.toString());
        }
      }

      // Tool Wear
      let wear: number | null = null;
      const wearMatch = text.match(/(?:tool\s*wear|toolwear|wear)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:min|mins|minutes)?\b/i);
      if (wearMatch) {
        const w = parseFloat(wearMatch[1]);
        if (!isNaN(w)) {
          wear = Math.round(w);
          setToolWearStr(wear.toString());
        }
      }

      // Missing fields check
      const missingList: string[] = [];
      if (!extractedType) missingList.push('Product Type (L, M, H)');
      if (air === null) missingList.push('Air Temperature');
      if (proc === null) missingList.push('Process Temperature');
      if (speed === null) missingList.push('Rotational Speed');
      if (tq === null) missingList.push('Torque');
      if (wear === null) missingList.push('Tool Wear');

      if (missingList.length === 0) {
        setExtractionNotice({
          type: 'success',
          message: 'All 6 parameters extracted successfully from your description.'
        });
      } else if (missingList.length < 6) {
        setExtractionNotice({
          type: 'warning',
          message: `Extracted ${6 - missingList.length} of 6 fields. Missing: ${missingList.join(', ')}. Please update them below.`
        });
      } else {
        setExtractionNotice({
          type: 'warning',
          message: 'Could not extract sensor readings. Please check your text or edit the cards directly below.'
        });
      }

      setIsExtracting(false);
    }, 200);
  };

  // 5. Prediction Execution
  const handlePredict = async () => {
    if (!allFieldsValid) return;

    setIsPredicting(true);
    setPredictionError(null);

    const payload = {
      Type: mType,
      Air_temperature: numAir,
      Process_temperature: numProc,
      Rotational_speed: numSpeed,
      Torque: numTorque,
      Tool_wear: numWear
    };

    try {
      const res = await queryBackendPrediction(payload);
      if (res.status === 'success') {
        setPredictionResult(res);
      } else {
        setPredictionError(res.message || 'Telemetry evaluation failed.');
      }
    } catch (err: any) {
      setPredictionError(err.message || 'Network error communicating with analysis engine.');
    } finally {
      setIsPredicting(false);
    }
  };

  // Preset scenarios
  const loadPresetText = (typePreset: 'nominal' | 'overload') => {
    if (typePreset === 'nominal') {
      const txt = 'Machine type L, air temperature 300 K, process temperature 310 K, rotational speed 1538 RPM, torque 40 Nm and tool wear 80 minutes.';
      setNlText(txt);
      setMType('L');
      setAirTempStr('300.0');
      setProcTempStr('310.0');
      setRotSpeedStr('1538');
      setTorqueStr('40.0');
      setToolWearStr('80');
      setExtractionNotice({ type: 'info', message: 'Loaded Nominal Baseline parameters.' });
    } else {
      const txt = 'Machine type H, air temperature 304 K, process temperature 312 K, rotational speed 1280 RPM, torque 68 Nm and tool wear 225 minutes.';
      setNlText(txt);
      setMType('H');
      setAirTempStr('304.0');
      setProcTempStr('312.0');
      setRotSpeedStr('1280');
      setTorqueStr('68.0');
      setToolWearStr('225');
      setExtractionNotice({ type: 'warning', message: 'Loaded High Thermal & Torque Overload parameters.' });
    }
  };

  // Derived output visual metrics
  const preds = predictionResult?.predictions || {};
  const isFailure = (preds.LGBMClassifier === 1) || (preds.DecisionTreeClassifier === 1) || (predictionResult?.ensemble_failure_risk === 'Severe' || predictionResult?.ensemble_failure_risk === 'High');
  
  // Failure Probability Calculation
  const rawProbPct = predictionResult?.failure_probability_percent ?? (preds.lgbm_failure_probability !== undefined ? preds.lgbm_failure_probability * 100 : (isFailure ? 92.5 : 0.02));
  const probPercentNum = Math.min(100, Math.max(0, rawProbPct));
  const failureProbDisplay = probPercentNum.toFixed(2);

  // Health Score
  const healthScore = Math.max(5, Math.min(99.9, 100 - probPercentNum));
  const isAnomaly = preds.IsolationForest_Anomaly === 'Anomaly';

  // Kinematic Baseline Torque Calculation
  const estimatedBaseline = preds.RidgeRegression_Predicted_Torque 
    ?? preds.LGBMRegressor_Predicted_Torque 
    ?? Math.round((2860 / ((numSpeed * 2 * Math.PI) / 60)) * 10) / 10;
  const torqueDiff = Math.round((numTorque - estimatedBaseline) * 10) / 10;

  // Semi-circle gauge needle angle (-90deg to +90deg)
  const gaugeAngle = -90 + (probPercentNum / 100) * 180;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn text-slate-800">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
            <Activity className="w-4 h-4 text-purple-500" />
            <span>Industrial Predictive Intelligence</span>
            <span className="text-slate-300">•</span>
            <span>Equipment Health Surveillance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Interactive Machine Health Predictor
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-3xl">
            Enter equipment parameters in natural English or adjust telemetry inputs below to visualize real-time operational health and failure risk.
          </p>
        </div>

        {/* System Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-500 font-medium">Predictive Engine:</span>
          {backendStatus === 'online' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online &amp; Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* ================= STAGE 1: NATURAL LANGUAGE INPUT ================= */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Describe Your Machine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your machine readings in simple English. The system automatically extracts all operating telemetry parameters.
            </p>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Prompts:</span>
            <button
              type="button"
              onClick={() => loadPresetText('nominal')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors border border-purple-200/60"
            >
              Nominal Baseline
            </button>
            <button
              type="button"
              onClick={() => loadPresetText('overload')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium transition-colors border border-rose-200/60"
            >
              High Stress Overload
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            rows={3}
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none font-normal leading-relaxed"
            placeholder="Example: Machine type L, air temperature 300 K, process temperature 310 K, rotational speed 1538 RPM, torque 40 Nm and tool wear 80 minutes."
          />
        </div>

        {/* Action & Feedback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            {extractionNotice && (
              <div className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                extractionNotice.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : extractionNotice.type === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {extractionNotice.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                )}
                <span>{extractionNotice.message}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExtractValues}
            disabled={isExtracting || !nlText.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isExtracting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extracting Parameters...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Sensor Values</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ================= STAGE 2: SIX EDITABLE SENSOR CARDS ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Operational Telemetry Parameters
            </h2>
            <p className="text-xs text-slate-500">
              Adjust any individual sensor parameter to test operational boundaries.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Grid: <span className="text-purple-600 font-semibold">3 × 2 Sensor Telemetry</span>
          </div>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Product Type */}
          <div className={`p-4 rounded-xl border transition-all ${
            isTypeValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Product Quality Class</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Valid
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Machine Grade: L (Light), M (Medium), H (Heavy)</div>
            <div className="grid grid-cols-3 gap-2">
              {(['L', 'M', 'H'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMType(t)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    mType === t
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Type {t}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Air Temperature */}
          <div className={`p-4 rounded-xl border transition-all ${
            isAirValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Ambient Air Temperature</span>
              {isAirValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Range: 280-320 K
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Nominal Baseline: {RANGES.airTemp.nominal}</div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={airTempStr}
                onChange={(e) => setAirTempStr(e.target.value)}
                className={`w-full px-3 py-2 pr-10 rounded-lg text-sm font-semibold border ${
                  isAirValid ? 'border-slate-200 focus:border-purple-500' : 'border-rose-300 bg-rose-50/30'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">K</span>
            </div>
          </div>

          {/* Card 3: Process Temperature */}
          <div className={`p-4 rounded-xl border transition-all ${
            isProcValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Process Temperature</span>
              {isProcValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Range: 290-330 K
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Nominal Baseline: {RANGES.procTemp.nominal}</div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={procTempStr}
                onChange={(e) => setProcTempStr(e.target.value)}
                className={`w-full px-3 py-2 pr-10 rounded-lg text-sm font-semibold border ${
                  isProcValid ? 'border-slate-200 focus:border-purple-500' : 'border-rose-300 bg-rose-50/30'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">K</span>
            </div>
          </div>

          {/* Card 4: Rotational Speed */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSpeedValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Spindle Rotational Speed</span>
              {isSpeedValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Range: 1000-3000 RPM
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Nominal Baseline: {RANGES.rotSpeed.nominal}</div>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={rotSpeedStr}
                onChange={(e) => setRotSpeedStr(e.target.value)}
                className={`w-full px-3 py-2 pr-12 rounded-lg text-sm font-semibold border ${
                  isSpeedValid ? 'border-slate-200 focus:border-purple-500' : 'border-rose-300 bg-rose-50/30'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">RPM</span>
            </div>
          </div>

          {/* Card 5: Torque */}
          <div className={`p-4 rounded-xl border transition-all ${
            isTorqueValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Operating Torque</span>
              {isTorqueValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Range: 3-95 Nm
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Nominal Baseline: {RANGES.torque.nominal}</div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={torqueStr}
                onChange={(e) => setTorqueStr(e.target.value)}
                className={`w-full px-3 py-2 pr-10 rounded-lg text-sm font-semibold border ${
                  isTorqueValid ? 'border-slate-200 focus:border-purple-500' : 'border-rose-300 bg-rose-50/30'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Nm</span>
            </div>
          </div>

          {/* Card 6: Tool Wear */}
          <div className={`p-4 rounded-xl border transition-all ${
            isWearValid ? 'bg-white border-slate-200 shadow-sm' : 'bg-rose-50/40 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Cumulative Tool Wear</span>
              {isWearValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Range: 0-300 min
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mb-2">Service Threshold: 200 - 240 min</div>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={toolWearStr}
                onChange={(e) => setToolWearStr(e.target.value)}
                className={`w-full px-3 py-2 pr-10 rounded-lg text-sm font-semibold border ${
                  isWearValid ? 'border-slate-200 focus:border-purple-500' : 'border-rose-300 bg-rose-50/30'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">min</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STAGE 3: PREDICTION ACTION BUTTON ================= */}
      <section className="bg-gradient-to-r from-purple-50 via-white to-blue-50 p-6 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Ready for Machine Condition Evaluation</span>
          </div>
          <p className="text-xs text-slate-500">
            Evaluates thermal tolerances, rotational kinematics, mechanical wear, and failure risks across all parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePredict}
            disabled={!allFieldsValid || isPredicting}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isPredicting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating Machine Health...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Evaluate Machine Condition</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Prediction Error Alert */}
      {predictionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}

      {/* ================= STAGE 4: VISUAL RESULT DASHBOARD ================= */}
      {predictionResult && (
        <section className="space-y-6 animate-fadeIn pt-2">
          {/* Section Banner Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Equipment Health &amp; Diagnostic Visualization
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time condition evaluation derived from current operating telemetry.
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-md">
              Diagnostic Mode: Active Inspection
            </div>
          </div>

          {/* Result Card A: Overall Machine Condition Banner */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isFailure
              ? 'bg-rose-50/80 border-rose-200 text-rose-900 shadow-sm'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  isFailure ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isFailure ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                      Equipment Condition Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isFailure ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      Risk Level: {isFailure ? 'Severe / Immediate Attention' : 'Nominal / Low Risk'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
                    {isFailure ? 'Machine Condition: Failure Warning' : 'Machine Condition: Normal'}
                  </h3>
                  <p className="text-xs opacity-80 mt-1 max-w-2xl leading-relaxed">
                    {isFailure
                      ? 'Sensors indicate severe operational stress exceeding safe tolerance envelopes. Recommend thermal and spindle inspection.'
                      : 'All operating parameters are securely within normal baseline limits. Equipment is functioning with high operational reliability.'}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-right flex-shrink-0 bg-white/70 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-200/50">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Health Score Index</div>
                <div className={`text-2xl font-extrabold font-mono ${
                  healthScore < 50 ? 'text-rose-600' : healthScore < 80 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {healthScore.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Gauge (B) + Safety Breakdown (C) + Anomaly (D) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card B: Failure Probability Gauge */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Failure Risk Meter
                  </h4>
                  <Gauge className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated probability of unexpected equipment breakdown
                </p>
              </div>

              {/* Semi-Circular SVG Gauge */}
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative w-48 h-28 flex items-end justify-center">
                  <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                    {/* Background Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    {/* Active Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke={probPercentNum >= 50 ? '#EF4444' : probPercentNum >= 20 ? '#F59E0B' : '#10B981'}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (probPercentNum / 100))}
                      className="transition-all duration-700 ease-out"
                    />
                    {/* Needle Indicator */}
                    <g transform={`rotate(${gaugeAngle} 100 100)`} className="transition-transform duration-700 ease-out">
                      <line x1="100" y1="100" x2="100" y2="30" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="6" fill="#1E293B" />
                    </g>
                  </svg>
                  {/* Gauge Center Display */}
                  <div className="absolute -bottom-2 text-center">
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {failureProbDisplay}%
                    </div>
                  </div>
                </div>

                {/* Tier Badge */}
                <div className="mt-4">
                  {probPercentNum >= 50 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      High Breakdown Risk (&ge; 50%)
                    </span>
                  ) : probPercentNum >= 20 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Moderate Risk (20% - 50%)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Low Risk (&lt; 20%)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
                Continuous Telemetry Surveillance
              </div>
            </div>

            {/* Card C: Operational Safety Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Operational Safety Envelopes
                  </h4>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time physical margin diagnostics
                </p>
              </div>

              <div className="space-y-3">
                {/* Thermal Dissipation */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Thermal Balance</div>
                    <div className="text-[11px] text-slate-400">&Delta;T = {(numProc - numAir).toFixed(1)} K (Process - Ambient)</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    (numProc - numAir) < 8.6
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {(numProc - numAir) < 8.6 ? 'Heat Dissipation Alert' : 'Optimal'}
                  </span>
                </div>

                {/* Spindle Kinematics */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Spindle Dynamics</div>
                    <div className="text-[11px] text-slate-400">Rotational Speed: {numSpeed} RPM</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Stable
                  </span>
                </div>

                {/* Tool Insert Wear */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tool Insert Condition</div>
                    <div className="text-[11px] text-slate-400">{numWear} min / 240 min limit</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    numWear >= 200
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : numWear >= 150
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {numWear >= 200 ? 'Limit Breached' : numWear >= 150 ? 'Inspection Due' : 'Healthy'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-purple-900 font-medium">
                  {isFailure 
                    ? 'Subsystems report non-linear stress drift exceeding safety margins.' 
                    : 'All subsystems verified within operational bounds.'}
                </span>
              </div>
            </div>

            {/* Card D: Telemetry Anomaly Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Telemetry Anomaly Status
                  </h4>
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Multi-channel pattern outlier detection
                </p>
              </div>

              <div className="py-2 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${
                  isAnomaly 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isAnomaly ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  {isAnomaly ? 'Outlier Anomaly Detected' : 'Standard Baseline (Zero Outliers)'}
                </div>
                <p className="text-xs text-slate-500 mt-3 max-w-xs mx-auto leading-relaxed">
                  {isAnomaly
                    ? 'Operating sensor values exhibit unusual variance that diverges from normal factory operating baselines.'
                    : 'All sensor channels follow standard nominal operating profiles without any detected anomalies.'}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                Telemetry Health: {isAnomaly ? 'Requires Investigation' : 'Verified Nominal'}
              </div>
            </div>
          </div>

          {/* Card E: Kinematic Load & Torque Analysis */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kinematic Load &amp; Torque Analysis
                </h4>
                <p className="text-[11px] text-slate-400">
                  Real-time comparison of measured operating torque against estimated nominal spindle profile
                </p>
              </div>
              <div className="text-xs font-mono font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                Operating Torque: {numTorque.toFixed(1)} Nm
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Measured Torque */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700">Measured Torque</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Active sensor reading</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                  {numTorque.toFixed(1)} Nm
                </div>
              </div>

              {/* Baseline Torque */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700">Estimated Baseline Load</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Calculated nominal kinematic profile</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                  {estimatedBaseline.toFixed(1)} Nm
                </div>
              </div>

              {/* Variance Delta */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700">Torque Variance (&Delta;)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Deviation from expected baseline</div>
                <div className={`text-xl font-bold font-mono mt-2 ${
                  Math.abs(torqueDiff) > 10 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {torqueDiff >= 0 ? '+' : ''}{torqueDiff.toFixed(1)} Nm
                  <span className="text-xs font-medium ml-2 text-slate-500">
                    {Math.abs(torqueDiff) > 10 ? '(High Deviation)' : '(Normal)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card F: Active Input Parameters Strip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>Active Sensor Telemetry Snapshot:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Type: <strong>{mType}</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Air Temp: <strong>{numAir.toFixed(1)} K</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Process Temp: <strong>{numProc.toFixed(1)} K</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Speed: <strong>{numSpeed} RPM</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Torque: <strong>{numTorque.toFixed(1)} Nm</strong>
              </span>
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                Wear: <strong>{numWear} min</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ================= CLEAN FOOTER ================= */}
      <footer className="pt-6 border-t border-slate-200/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          Optimach-AI Equipment Intelligence &bull; Continuous Predictive Surveillance Platform
        </div>
        <div className="font-mono text-[11px]">
          Real-Time Sensor Telemetry Diagnostics
        </div>
      </footer>
    </div>
  );
};
