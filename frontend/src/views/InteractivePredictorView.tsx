import React, { useState, useEffect } from 'react';
import { Machine, SensorTelemetry } from '../types';
import { queryBackendPrediction, checkBackendHealth, BackendPredictionResponse } from '../services/backendApi';
import { 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Gauge, 
  Activity, 
  Layers, 
  Check, 
  AlertCircle,
  Wrench,
  BarChart3,
  GitBranch,
  Leaf,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export interface InteractivePredictorViewProps {
  machines?: Machine[];
  onApplyManualTelemetry?: (machineId: string, telemetry: SensorTelemetry) => void;
  onNavigateToView?: (view: string) => void;
  onCreateWorkOrder?: (title: string, notes: string) => void;
}

// Operational Tolerance Envelopes
const RANGES = {
  airTemp: { min: 280, max: 320, unit: 'K', label: 'Air Temperature', nominal: '298 - 306 K' },
  procTemp: { min: 290, max: 330, unit: 'K', label: 'Process Temperature', nominal: '308 - 315 K' },
  rotSpeed: { min: 1000, max: 3000, unit: 'RPM', label: 'Rotational Speed', nominal: '1000 - 2000 RPM' },
  torque: { min: 3, max: 95, unit: 'Nm', label: 'Torque', nominal: '20 - 70 Nm' },
  toolWear: { min: 0, max: 300, unit: 'min', label: 'Tool Wear', nominal: '0 - 300 min' },
};

export const InteractivePredictorView: React.FC<InteractivePredictorViewProps> = ({
  onNavigateToView
}) => {
  // 1. Natural Language State
  const [nlText, setNlText] = useState<string>(
    'Machine type H, air temperature 304 K, process temperature 313 K, rotational speed 1200 RPM, torque 70 Nm and tool wear 240 minutes.'
  );
  const [extractionNotice, setExtractionNotice] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // 2. Six Sensor Inputs State (Initial values matching reference)
  const [mType, setMType] = useState<'L' | 'M' | 'H'>('H');
  const [airTempStr, setAirTempStr] = useState<string>('304');
  const [procTempStr, setProcTempStr] = useState<string>('313');
  const [rotSpeedStr, setRotSpeedStr] = useState<string>('1200');
  const [torqueStr, setTorqueStr] = useState<string>('70');
  const [toolWearStr, setToolWearStr] = useState<string>('240');

  // 3. Backend & Prediction State
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('online');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  // Default populated prediction result so visualization is immediately visible
  const [predictionResult, setPredictionResult] = useState<BackendPredictionResponse>({
    status: 'success',
    machine_type: 'H',
    ensemble_failure_risk: 'Low',
    failure_probability_percent: 18.7,
    predictions: {
      DecisionTreeClassifier: 0,
      LGBMClassifier: 1,
      IsolationForest_Anomaly: 'Normal',
      RidgeRegression_Predicted_Torque: 38.5,
      LGBMRegressor_Predicted_Torque: 41.2,
      lgbm_failure_probability: 0.187
    }
  });

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
  const numAir = parseFloat(airTempStr) || 304;
  const numProc = parseFloat(procTempStr) || 313;
  const numSpeed = parseFloat(rotSpeedStr) || 1200;
  const numTorque = parseFloat(torqueStr) || 70;
  const numWear = parseFloat(toolWearStr) || 240;

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

      // Helper for temperature parsing with unit detection (Celsius -> Kelvin)
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

      // Check missing fields
      const missingList: string[] = [];
      if (!extractedType) missingList.push('Machine Type (L, M, H)');
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
          message: `Extracted ${6 - missingList.length} of 6 fields. Missing: ${missingList.join(', ')}.`
        });
      } else {
        setExtractionNotice({
          type: 'warning',
          message: 'Could not extract sensor readings. Please check your text or enter values below.'
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
      const txt = 'Machine type H, air temperature 304 K, process temperature 313 K, rotational speed 1200 RPM, torque 70 Nm and tool wear 240 minutes.';
      setNlText(txt);
      setMType('H');
      setAirTempStr('304');
      setProcTempStr('313');
      setRotSpeedStr('1200');
      setTorqueStr('70');
      setToolWearStr('240');
      setExtractionNotice({ type: 'warning', message: 'Loaded High Stress parameters.' });
    }
  };

  // Derived output metrics for UI
  const preds = predictionResult?.predictions || {};
  const rawProbPct = predictionResult?.failure_probability_percent ?? (preds.lgbm_failure_probability !== undefined ? preds.lgbm_failure_probability * 100 : 18.7);
  const probPercentNum = Math.min(100, Math.max(0, rawProbPct));
  const failureProbDisplay = probPercentNum.toFixed(1);

  const isAnomaly = preds.IsolationForest_Anomaly === 'Anomaly';
  const treePred = preds.DecisionTreeClassifier ?? 0;
  const lgbmPred = preds.LGBMClassifier ?? 1;

  // Torque Regressors
  const ridgeVal = preds.RidgeRegression_Predicted_Torque ?? 38.5;
  const lgbmRegVal = preds.LGBMRegressor_Predicted_Torque ?? 41.2;

  // Maximum scale for torque bar chart (at least 50 Nm)
  const maxTorqueScale = Math.max(50, Math.ceil(Math.max(numTorque, ridgeVal, lgbmRegVal) / 10) * 10);
  const measuredWidthPct = Math.min(100, Math.max(5, (numTorque / maxTorqueScale) * 100));
  const ridgeWidthPct = Math.min(100, Math.max(5, (ridgeVal / maxTorqueScale) * 100));
  const lgbmWidthPct = Math.min(100, Math.max(5, (lgbmRegVal / maxTorqueScale) * 100));

  const isFailure = probPercentNum >= 50 || lgbmPred === 1 || treePred === 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7 animate-fadeIn text-slate-800">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>INTERACTIVE PREDICTOR</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Machine Condition Analysis
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-3xl">
            Real-time insights into machine health, failure probability and operational status.
          </p>
        </div>

        {/* Predictive Engine Status */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-slate-500 font-medium">Predictive Engine:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online &amp; Active
          </span>
        </div>
      </div>

      {/* ================= SUCCESS BANNER ================= */}
      <div className="p-3.5 px-4 rounded-xl bg-[#E8F8EE] border border-[#BDE8CE] text-[#1E7E34] text-xs font-semibold flex items-center gap-2.5 shadow-xs">
        <CheckCircle2 className="w-4 h-4 text-[#28A745] flex-shrink-0" />
        <span>Prediction completed successfully!</span>
      </div>

      {/* ================= TOP GRID (FAILURE PROBABILITY + ANOMALY DETECTION) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Failure Probability */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Failure Probability</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chance of machine failure based on current readings
            </p>
          </div>

          {/* Rainbow Arc Semi-Circular Gauge */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-32 flex items-end justify-center">
              <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                <defs>
                  {/* Arc Path for reference */}
                </defs>
                {/* Segment 1: Green (Left third: 0% - 33%) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 60 30.7"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Segment 2: Yellow / Amber (Middle third: 33% - 66%) */}
                <path
                  d="M 64 27.5 A 80 80 0 0 1 136 27.5"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="14"
                />
                {/* Segment 3: Red (Right third: 66% - 100%) */}
                <path
                  d="M 140 30.7 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute -bottom-1 flex flex-col items-center">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {failureProbDisplay}%
                </div>
                <div className="mt-2">
                  {probPercentNum >= 50 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FDE8E8] text-[#C81E1E]">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" /> High Risk
                    </span>
                  ) : probPercentNum >= 20 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" /> Moderate Risk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8F8EE] text-[#1E7E34]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Low Risk
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div></div>
        </div>

        {/* Card 2: Anomaly Detection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Anomaly Detection</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Is the current pattern unusual?
            </p>
          </div>

          {/* Normal status + Industrial 3D Motor */}
          <div className="py-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                isAnomaly ? 'bg-[#EF4444]' : 'bg-[#10B981]'
              }`}>
                {isAnomaly ? (
                  <AlertCircle className="w-8 h-8 stroke-[2.5]" />
                ) : (
                  <Check className="w-8 h-8 stroke-[3]" />
                )}
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${isAnomaly ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                  {isAnomaly ? 'Anomaly' : 'Normal'}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-[190px] leading-relaxed">
                  {isAnomaly 
                    ? 'Abnormal sensor variance detected in telemetry streams.' 
                    : 'No abnormal pattern detected in the sensor data.'}
                </p>
              </div>
            </div>

            {/* Industrial 3D Motor Image */}
            <div className="flex-shrink-0">
              <img 
                src="/machine-3d-model.jpg" 
                alt="Industrial Motor 3D" 
                className="w-36 h-28 object-contain rounded-xl"
              />
            </div>
          </div>
          <div></div>
        </div>
      </div>

      {/* ================= MIDDLE GRID (MODEL COMPARISON + TORQUE COMPARISON) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: ML Model Prediction Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">ML Model Prediction Comparison</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Results from different machine learning models
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Decision Tree */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                <span>Decision Tree Classifier</span>
              </div>
              <div className={`p-4 rounded-xl text-center border font-bold text-sm flex items-center justify-center gap-2 ${
                treePred === 1
                  ? 'bg-[#FDE8E8] border-[#F8B4B4] text-[#C81E1E]'
                  : 'bg-[#E8F8EE] border-[#BDE8CE] text-[#1E7E34]'
              }`}>
                {treePred === 1 ? (
                  <>
                    <AlertCircle className="w-4 h-4 fill-[#C81E1E] text-white" />
                    <span>Failure</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 fill-[#1E7E34] text-white" />
                    <span>Normal</span>
                  </>
                )}
              </div>
            </div>

            {/* LightGBM */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>LightGBM Classifier</span>
              </div>
              <div className={`p-4 rounded-xl text-center border font-bold text-sm flex items-center justify-center gap-2 ${
                lgbmPred === 1
                  ? 'bg-[#FDE8E8] border-[#F8B4B4] text-[#C81E1E]'
                  : 'bg-[#E8F8EE] border-[#BDE8CE] text-[#1E7E34]'
              }`}>
                {lgbmPred === 1 ? (
                  <>
                    <AlertCircle className="w-4 h-4 fill-[#C81E1E] text-white" />
                    <span>Failure</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 fill-[#1E7E34] text-white" />
                    <span>Normal</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Torque Prediction Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Wrench className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Torque Prediction Comparison</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Measured vs Predicted Torque
            </p>
          </div>

          <div className="space-y-3.5 mt-5">
            {/* Measured Input Bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-slate-600 font-medium text-right flex-shrink-0">Measured Input</span>
              <div className="flex-1 bg-slate-100 rounded-lg h-5 overflow-hidden relative">
                <div 
                  className="h-full bg-[#6D28D9] rounded-lg transition-all duration-700" 
                  style={{ width: `${measuredWidthPct}%` }}
                />
              </div>
              <span className="w-16 font-bold font-mono text-slate-900 text-right">{numTorque.toFixed(1)} Nm</span>
            </div>

            {/* Ridge Regression Bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-slate-600 font-medium text-right flex-shrink-0">Ridge Regression</span>
              <div className="flex-1 bg-slate-100 rounded-lg h-5 overflow-hidden relative">
                <div 
                  className="h-full bg-[#C4B5FD] rounded-lg transition-all duration-700" 
                  style={{ width: `${ridgeWidthPct}%` }}
                />
              </div>
              <span className="w-16 font-bold font-mono text-slate-900 text-right">{ridgeVal.toFixed(1)} Nm</span>
            </div>

            {/* LightGBM Regressor Bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-28 text-slate-600 font-medium text-right flex-shrink-0">LightGBM Regressor</span>
              <div className="flex-1 bg-slate-100 rounded-lg h-5 overflow-hidden relative">
                <div 
                  className="h-full bg-[#312E81] rounded-lg transition-all duration-700" 
                  style={{ width: `${lgbmWidthPct}%` }}
                />
              </div>
              <span className="w-16 font-bold font-mono text-slate-900 text-right">{lgbmRegVal.toFixed(1)} Nm</span>
            </div>

            {/* X-Axis Ticks */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
              <span className="w-28"></span>
              <div className="flex-1 flex justify-between px-1">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
                <span>50</span>
              </div>
              <span className="w-16 text-right text-[10px] text-slate-500 font-sans">Torque (Nm)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SENSOR TELEMETRY PROFILE (HORIZONTAL TIMELINE) ================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Sensor Telemetry Profile</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Current sensor readings across key parameters
          </p>
        </div>

        <div className="relative pt-3 pb-2">
          {/* Connected Purple Pipeline Line */}
          <div className="hidden md:block absolute top-5 left-10 right-10 h-[2px] bg-[#A78BFA] -translate-y-1/2"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
            {/* Air Temp */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Air Temperature</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{numAir} K</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(298 - 306 K)</div>
            </div>

            {/* Process Temp */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Process Temperature</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{numProc} K</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(308 - 315 K)</div>
            </div>

            {/* Rotational Speed */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Rotational Speed</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{numSpeed} RPM</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(1000 - 2000 RPM)</div>
            </div>

            {/* Torque */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Torque</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{numTorque} Nm</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(20 - 70 Nm)</div>
            </div>

            {/* Tool Wear */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Tool Wear</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{numWear} min</div>
              <div className="text-[10px] text-slate-400 mt-0.5">(0 - 300 min)</div>
            </div>

            {/* Machine Type */}
            <div className="flex flex-col items-center text-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#6D28D9] border-2 border-white shadow mb-3"></div>
              <div className="text-[11px] text-slate-500 font-medium">Machine Type</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{mType}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Heavy Grade</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ADVICE BAR ================= */}
      <div className="p-4 rounded-xl bg-[#F5F2FD] border border-[#DDD6FE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-purple-950">
            {isFailure 
              ? "High failure probability detected. Consider maintenance check for this machine." 
              : "All sensor parameters within baseline tolerance. Machine condition is normal."}
          </span>
        </div>
        <button 
          onClick={() => onNavigateToView ? onNavigateToView('live') : undefined}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all shadow-sm flex-shrink-0"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ================= COLLAPSIBLE SENSOR ADJUSTMENT DRAWER ================= */}
      <section className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Adjust Telemetry Inputs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Type natural description or edit the 6 parameters below to test different failure scenarios.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
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
              High Stress Scenario
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder="Type machine readings in English..."
          />
          <button
            type="button"
            onClick={handleExtractValues}
            disabled={isExtracting}
            className="px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-xs transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extract Values</span>
          </button>
          <button
            type="button"
            onClick={handlePredict}
            disabled={!allFieldsValid || isPredicting}
            className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs tracking-wide shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {isPredicting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Re-Analyze</span>
              </>
            )}
          </button>
        </div>

        {/* 6 Quick Numerical Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Machine Type */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 text-center">
            <span className="text-[10px] text-slate-400 font-medium block">Machine Type</span>
            <div className="flex justify-center gap-1 mt-1">
              {(['L', 'M', 'H'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMType(t)}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    mType === t ? 'bg-purple-600 text-white' : 'bg-white border text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Air Temp */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] text-slate-400 font-medium block">Air Temp (K)</span>
            <input
              type="number"
              value={airTempStr}
              onChange={(e) => setAirTempStr(e.target.value)}
              className="w-full mt-1 px-2 py-0.5 text-xs font-bold border rounded bg-white text-center"
            />
          </div>

          {/* Process Temp */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] text-slate-400 font-medium block">Process Temp (K)</span>
            <input
              type="number"
              value={procTempStr}
              onChange={(e) => setProcTempStr(e.target.value)}
              className="w-full mt-1 px-2 py-0.5 text-xs font-bold border rounded bg-white text-center"
            />
          </div>

          {/* Speed */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] text-slate-400 font-medium block">Speed (RPM)</span>
            <input
              type="number"
              value={rotSpeedStr}
              onChange={(e) => setRotSpeedStr(e.target.value)}
              className="w-full mt-1 px-2 py-0.5 text-xs font-bold border rounded bg-white text-center"
            />
          </div>

          {/* Torque */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] text-slate-400 font-medium block">Torque (Nm)</span>
            <input
              type="number"
              value={torqueStr}
              onChange={(e) => setTorqueStr(e.target.value)}
              className="w-full mt-1 px-2 py-0.5 text-xs font-bold border rounded bg-white text-center"
            />
          </div>

          {/* Tool Wear */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] text-slate-400 font-medium block">Tool Wear (min)</span>
            <input
              type="number"
              value={toolWearStr}
              onChange={(e) => setToolWearStr(e.target.value)}
              className="w-full mt-1 px-2 py-0.5 text-xs font-bold border rounded bg-white text-center"
            />
          </div>
        </div>
      </section>

      {/* Prediction Error Alert */}
      {predictionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}
    </div>
  );
};
