import React, { useState } from 'react';
import { Machine, SensorTelemetry, PredictionResult } from '../types';
import { predictMachineFailure } from '../services/mlEngine';
import { queryBackendPrediction } from '../services/backendApi';
import { 
  Upload, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Download, 
  Server,
  Sparkles,
  Database,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Terminal,
  Info
} from 'lucide-react';

interface DataCheckViewProps {
  machines: Machine[];
  onApplyManualTelemetry: (machineId: string, telemetry: SensorTelemetry) => void;
}

export const DataCheckView: React.FC<DataCheckViewProps> = ({
  machines,
  onApplyManualTelemetry
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv' | 'feed'>('manual');
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || 'MACH-012');

  // Manual Form State
  const [volt, setVolt] = useState<number>(170.8);
  const [rotate, setRotate] = useState<number>(446.6);
  const [pressure, setPressure] = useState<number>(100.9);
  const [vibration, setVibration] = useState<number>(40.4);
  const [temperature, setTemperature] = useState<number>(71.5);
  const [evalResult, setEvalResult] = useState<PredictionResult | null>(null);
  const [backendResult, setBackendResult] = useState<any>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // CSV State
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [batchInferenceResults, setBatchInferenceResults] = useState<any[] | null>(null);
  const [validationReport, setValidationReport] = useState<{
    totalRows: number;
    missingValues: number;
    invalidTypes: number;
    duplicates: number;
    isValid: boolean;
  } | null>(null);

  // Gateway Simulation State
  const [gatewayStatus, setGatewayStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  const [gatewayLogs, setGatewayLogs] = useState<string[]>([
    '[10:45:12] Bridge initialized on port 4840',
    '[10:45:13] OPC-UA Server endpoint verified: opc.tcp://gateway.factory.internal:4840/FactoryMind',
    '[10:45:14] Subscribed to 40 telemetry tags across Bays A, B, and C',
    '[10:45:15] Telemetry streaming active at 1.0 Hz edge heartbeat'
  ]);

  // Presets for rapid testing
  const loadPreset = (preset: 'healthy' | 'bearing' | 'hydraulic' | 'electrical') => {
    if (preset === 'healthy') {
      setVolt(171.2);
      setRotate(448.0);
      setPressure(101.5);
      setVibration(39.8);
      setTemperature(72.0);
    } else if (preset === 'bearing') {
      setVolt(169.5);
      setRotate(385.0);
      setPressure(102.0);
      setVibration(58.4);
      setTemperature(86.5);
    } else if (preset === 'hydraulic') {
      setVolt(170.0);
      setRotate(442.0);
      setPressure(136.8);
      setVibration(44.2);
      setTemperature(79.0);
    } else if (preset === 'electrical') {
      setVolt(204.5);
      setRotate(412.0);
      setPressure(98.0);
      setVibration(41.0);
      setTemperature(88.0);
    }
    setEvalResult(null);
  };

  const handleRunManualInference = () => {
    const telem: SensorTelemetry = {
      timestamp: new Date().toLocaleTimeString(),
      volt: Number(volt),
      rotate: Number(rotate),
      pressure: Number(pressure),
      vibration: Number(vibration),
      temperature: Number(temperature),
    };
    const pred = predictMachineFailure(selectedMachineId, telem, 8);
    setEvalResult(pred);
    onApplyManualTelemetry(selectedMachineId, telem);
  };

  const handleRunBackendInference = async () => {
    setIsLoadingBackend(true);
    try {
      const res = await queryBackendPrediction({
        Type: 'L',
        temperature: Number(temperature),
        rotate: Number(rotate),
        pressure: Number(pressure),
        vibration: Number(vibration),
        volt: Number(volt)
      });
      setBackendResult(res);
    } catch (e: any) {
      setBackendResult({ status: 'error', message: e.message });
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // CSV File Handler with Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const rawRows = lines.slice(1);

      let missing = 0;
      let invalidTypes = 0;
      const timestamps = new Set<string>();
      let duplicates = 0;

      const parsed = rawRows.slice(0, 15).map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        const rowObj: any = { id: idx + 1 };
        headers.forEach((h, hIdx) => {
          const val = parts[hIdx];
          if (!val || val === '') missing++;
          if (['volt', 'rotate', 'pressure', 'vibration'].includes(h)) {
            if (isNaN(Number(val))) invalidTypes++;
          }
          if (h === 'datetime' || h === 'timestamp') {
            if (timestamps.has(val)) duplicates++;
            else timestamps.add(val);
          }
          rowObj[h] = parts[hIdx];
        });
        return rowObj;
      });

      setCsvRows(parsed);
      setValidationReport({
        totalRows: rawRows.length,
        missingValues: missing,
        invalidTypes,
        duplicates,
        isValid: missing === 0 && invalidTypes === 0
      });
      setBatchInferenceResults(null);
    };
    reader.readAsText(file);
  };

  const handleRunBatchInference = () => {
    if (csvRows.length === 0) return;
    const results = csvRows.map(row => {
      const telem: SensorTelemetry = {
        timestamp: row.datetime || row.timestamp || '00:00:00',
        volt: Number(row.volt) || 170.8,
        rotate: Number(row.rotate) || 446.6,
        pressure: Number(row.pressure) || 100.9,
        vibration: Number(row.vibration) || 40.4,
        temperature: Number(row.temperature) || 71.5
      };
      const pred = predictMachineFailure(row.machineID || 'MACH-012', telem, 8);
      return {
        ...row,
        predictedFailure: pred.predictedFailure,
        probability: pred.probability,
        risk: pred.calibratedRisk
      };
    });
    setBatchInferenceResults(results);
  };

  const handleDownloadBatchResults = () => {
    if (!batchInferenceResults) return;
    const headers = 'datetime,machineID,volt,rotate,pressure,vibration,predictedFailure,probability,risk\n';
    const rows = batchInferenceResults.map(r => 
      `"${r.datetime || ''}","${r.machineID || ''}",${r.volt},${r.rotate},${r.pressure},${r.vibration},"${r.predictedFailure}",${r.probability},"${r.risk}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdm_batch_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleCsv = () => {
    const sampleContent = 
`datetime,machineID,volt,rotate,pressure,vibration,temperature
2026-11-04 08:00:00,MACH-012,170.8,446.6,100.9,40.4,71.5
2026-11-04 09:00:00,MACH-012,168.2,420.1,102.4,56.8,84.2
2026-11-04 10:00:00,MACH-024,171.4,445.0,128.5,41.2,73.0
2026-11-04 11:00:00,MACH-001,170.1,449.2,99.8,38.6,70.5
2026-11-04 12:00:00,MACH-048,198.4,410.5,101.2,42.5,75.1`;

    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telemetry_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePingGateway = () => {
    setGatewayStatus('testing');
    setTimeout(() => {
      setGatewayStatus('connected');
      setGatewayLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Ping round-trip: 11.4 ms to 192.168.1.100:4840`,
        `[${new Date().toLocaleTimeString()}] Telemetry packets acknowledged: 100%`,
        ...prev
      ]);
    }, 700);
  };

  return (
    <div className="flex flex-col gap-8 pb-16 text-[#242139]">
      {/* 1. Header & Workflow Switcher */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-subtle">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6D55E8] flex items-center gap-1.5 mb-1 font-mono">
            <Database className="w-3.5 h-3.5 text-[#6D55E8]" /> Ingestion & Validation Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#242139]">
            Data & Integrations
          </h1>
          <p className="text-xs sm:text-sm text-[#77738C] mt-1 max-w-2xl leading-relaxed">
            Ingest manual sensor observations, import batch CSV telemetry logs for offline inference, or inspect factory-floor gateway communication.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#FAF9FF] p-1.5 rounded-xl border border-[#EAE5FF]">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 text-xs rounded-lg transition-all flex items-center gap-2 font-medium ${
              activeTab === 'manual'
                ? 'bg-[#FFFFFF] text-[#6D55E8] font-bold shadow-sm border border-[#EAE5FF]'
                : 'text-[#77738C] hover:text-[#242139]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Manual Check
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-2 text-xs rounded-lg transition-all flex items-center gap-2 font-medium ${
              activeTab === 'csv'
                ? 'bg-[#FFFFFF] text-[#6D55E8] font-bold shadow-sm border border-[#EAE5FF]'
                : 'text-[#77738C] hover:text-[#242139]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> CSV Batch
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-2 text-xs rounded-lg transition-all flex items-center gap-2 font-medium ${
              activeTab === 'feed'
                ? 'bg-[#FFFFFF] text-[#6D55E8] font-bold shadow-sm border border-[#EAE5FF]'
                : 'text-[#77738C] hover:text-[#242139]'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Sensor Integration
          </button>
        </div>
      </div>

      {/* 2. Workflow A: Manual Machine Check */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Input Form */}
          <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 shadow-subtle flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#F3F0FF]">
              <div>
                <h3 className="font-display font-bold text-[#242139] text-base">
                  Manual Machine Sensor Calibration
                </h3>
                <p className="text-xs text-[#77738C] mt-0.5">
                  Adjust parameter values or load calibrated scenarios to evaluate model projections.
                </p>
              </div>

              {/* Machine Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#77738C] font-mono">Machine:</span>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D55E8]"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scenario Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#FAF9FF] rounded-xl border border-[#EAE5FF]">
              <span className="text-xs text-[#77738C] font-mono mr-1">
                Load Preset:
              </span>
              <button
                onClick={() => loadPreset('healthy')}
                className="px-3 py-1 text-xs rounded-lg bg-[#E8F7F2] hover:bg-[#D5EFE6] border border-[#A3E3CD] text-[#159B70] font-semibold transition-all"
              >
                Healthy Baseline
              </button>
              <button
                onClick={() => loadPreset('bearing')}
                className="px-3 py-1 text-xs rounded-lg bg-[#FCEBED] hover:bg-[#FADDE1] border border-[#F6B7C1] text-[#DC5268] font-semibold transition-all"
              >
                Bearing Spall (High Vib)
              </button>
              <button
                onClick={() => loadPreset('hydraulic')}
                className="px-3 py-1 text-xs rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold transition-all"
              >
                Hydraulic Pressure Surge
              </button>
              <button
                onClick={() => loadPreset('electrical')}
                className="px-3 py-1 text-xs rounded-lg bg-[#FEF6E9] hover:bg-[#FCEFD6] border border-[#F7D59A] text-[#D99117] font-semibold transition-all"
              >
                Voltage Imbalance
              </button>
            </div>

            {/* 5 Input Sliders & Number Boxes */}
            <div className="space-y-3.5">
              {/* Vibration */}
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[#6D55E8] uppercase tracking-wider font-mono">
                    Vibration — mm/s RMS
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#77738C] font-mono">Norm: 28 – 50</span>
                    <input
                      type="number"
                      step="0.1"
                      value={vibration}
                      onChange={(e) => setVibration(parseFloat(e.target.value) || 0)}
                      className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono font-bold text-xs rounded-lg px-2.5 py-1 w-20 text-right focus:outline-none focus:border-[#6D55E8]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="0.5"
                  value={vibration}
                  onChange={(e) => setVibration(parseFloat(e.target.value))}
                  className="w-full accent-[#6D55E8] cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[#DC5268] uppercase tracking-wider font-mono">
                    Core Temperature — °C
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#77738C] font-mono">Norm: 60 – 84</span>
                    <input
                      type="number"
                      step="0.5"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                      className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono font-bold text-xs rounded-lg px-2.5 py-1 w-20 text-right focus:outline-none focus:border-[#6D55E8]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  step="1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#DC5268] cursor-pointer"
                />
              </div>

              {/* Pressure */}
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider font-mono">
                    Fluid Pressure — PSI
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#77738C] font-mono">Norm: 85 – 118</span>
                    <input
                      type="number"
                      step="0.5"
                      value={pressure}
                      onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
                      className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono font-bold text-xs rounded-lg px-2.5 py-1 w-20 text-right focus:outline-none focus:border-[#6D55E8]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  step="1"
                  value={pressure}
                  onChange={(e) => setPressure(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Rotational Speed */}
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider font-mono">
                    Rotational Speed — RPM
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#77738C] font-mono">Norm: 375 – 515</span>
                    <input
                      type="number"
                      step="1"
                      value={rotate}
                      onChange={(e) => setRotate(parseFloat(e.target.value) || 0)}
                      className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono font-bold text-xs rounded-lg px-2.5 py-1 w-20 text-right focus:outline-none focus:border-[#6D55E8]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="250"
                  max="650"
                  step="5"
                  value={rotate}
                  onChange={(e) => setRotate(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Voltage */}
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[#159B70] uppercase tracking-wider font-mono">
                    Supply Voltage — Volts
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#77738C] font-mono">Norm: 150 – 192</span>
                    <input
                      type="number"
                      step="0.5"
                      value={volt}
                      onChange={(e) => setVolt(parseFloat(e.target.value) || 0)}
                      className="bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono font-bold text-xs rounded-lg px-2.5 py-1 w-20 text-right focus:outline-none focus:border-[#6D55E8]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="120"
                  max="240"
                  step="1"
                  value={volt}
                  onChange={(e) => setVolt(parseFloat(e.target.value))}
                  className="w-full accent-[#159B70] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={handleRunManualInference}
                className="flex-1 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Check Condition (Edge Gateway)
              </button>
              <button
                onClick={handleRunBackendInference}
                disabled={isLoadingBackend}
                className="flex-1 py-3 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                {isLoadingBackend ? 'Connecting Backend...' : 'Query Flask ML Models'}
              </button>
            </div>
          </div>

          {/* Right Col: Instant Assessment Outcome */}
          <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 shadow-subtle flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D55E8] block mb-1 font-mono">
                Diagnostic Assessment Outcome
              </span>
              <p className="text-xs text-[#77738C] mb-4">
                Immediate 7-day predictive projection for {selectedMachineId}:
              </p>

              {evalResult ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF9FF] border border-[#EAE5FF]">
                    <span className="text-[11px] text-[#77738C] uppercase block font-mono">Projected Risk</span>
                    <h4 className="text-sm font-bold text-[#242139] mt-1">
                      {evalResult.predictedFailure}
                    </h4>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xl font-mono font-bold text-[#242139]">
                        {evalResult.probability}% Chance
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        evalResult.calibratedRisk === 'Severe' ? 'bg-[#FCEBED] text-[#DC5268]' :
                        evalResult.calibratedRisk === 'High' ? 'bg-[#FEF6E9] text-[#D99117]' :
                        'bg-[#E8F7F2] text-[#159B70]'
                      }`}>
                        {evalResult.calibratedRisk} Risk
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[#77738C] block mb-2 font-mono">
                      Contributing Factors:
                    </span>
                    <div className="space-y-2">
                      {evalResult.contributingFactors.map((f, i) => (
                        <div key={i} className="text-xs bg-[#FAF9FF] p-2.5 rounded-lg border border-[#EAE5FF]">
                          <div className="flex justify-between text-[#242139]">
                            <span className="font-semibold">{f.label}</span>
                            <span className={f.status === 'critical' ? 'text-[#DC5268] font-bold font-mono' : f.status === 'warning' ? 'text-[#D99117] font-bold font-mono' : 'text-[#159B70] font-mono'}>
                              {f.currentValue} {f.unit}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#77738C] block mt-1">{f.observation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#77738C] bg-[#FAF9FF] rounded-xl border border-[#EAE5FF]">
                  Configure sensor readings on the left and click "Check Condition" to generate a live assessment.
                </div>
              )}

              {/* Optimach-AI Live Flask ML Response */}
              {backendResult && (
                <div className="mt-4 p-4 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE] text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1D4ED8] font-mono">Optimach-AI Flask ML Backend Output</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold border border-[#A7F3D0]">
                      Live Python API
                    </span>
                  </div>
                  {backendResult.status === 'success' ? (
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between py-0.5 border-b border-[#BFDBFE]/40">
                        <span className="text-[#64748B]">Ensemble Failure Risk:</span>
                        <span className="font-bold text-[#1E1B4B]">{backendResult.ensemble_failure_risk} ({backendResult.failure_probability_percent}%)</span>
                      </div>
                      {backendResult.predictions && Object.entries(backendResult.predictions).map(([model, val]: any) => (
                        <div key={model} className="flex justify-between py-0.5 border-b border-[#BFDBFE]/20">
                          <span className="text-[#64748B]">{model}:</span>
                          <span className="font-bold text-[#1E1B4B]">{typeof val === 'number' ? val : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#DC2626] font-medium text-[11px]">
                      {backendResult.message || 'Flask backend offline at http://127.0.0.1:5000'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F3F0FF] text-xs text-[#77738C]">
              Model pipeline calibrated to Microsoft Azure PdM benchmark specifications.
            </div>
          </div>
        </div>
      )}

      {/* 3. Workflow B: CSV Data Upload */}
      {activeTab === 'csv' && (
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 shadow-subtle flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#F3F0FF]">
            <div>
              <h3 className="font-display font-bold text-[#242139] text-base">
                Batch Historical Telemetry CSV Import
              </h3>
              <p className="text-xs text-[#77738C] mt-0.5">
                Upload historical machinery logs to run batch condition diagnostics and data validation checks.
              </p>
            </div>

            <button
              onClick={handleDownloadSampleCsv}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#F3F0FF] text-[#6D55E8] transition-all flex items-center gap-2 self-start border border-[#EAE5FF] shadow-sm"
            >
              <Download className="w-4 h-4 text-[#6D55E8]" /> Download Sample CSV
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-[#D6CEFB] hover:border-[#6D55E8] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-[#FAF9FF] text-center transition-all">
            <Upload className="w-10 h-10 text-[#6D55E8]" />
            <div>
              <h4 className="text-sm font-semibold text-[#242139]">
                {csvFileName ? `File Selected: ${csvFileName}` : 'Drag and drop your telemetry CSV file here'}
              </h4>
              <p className="text-xs text-[#77738C] mt-1 font-mono">
                Required Columns: datetime, machineID, volt, rotate, pressure, vibration
              </p>
            </div>
            <label className="mt-2 px-5 py-2.5 rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white text-xs font-bold cursor-pointer transition-all shadow-sm">
              Select CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Data Validation Report */}
          {validationReport && (
            <div className="bg-[#FAF9FF] border border-[#EAE5FF] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-4">
                <span>Rows Processed: <strong className="text-[#242139]">{validationReport.totalRows}</strong></span>
                <span>Missing Values: <strong className={validationReport.missingValues > 0 ? 'text-[#DC5268]' : 'text-[#159B70]'}>{validationReport.missingValues}</strong></span>
                <span>Type Errors: <strong className={validationReport.invalidTypes > 0 ? 'text-[#DC5268]' : 'text-[#159B70]'}>{validationReport.invalidTypes}</strong></span>
                <span>Duplicate Timestamps: <strong className={validationReport.duplicates > 0 ? 'text-[#D99117]' : 'text-[#159B70]'}>{validationReport.duplicates}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunBatchInference}
                  className="px-4 py-2 rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Run Batch Inference
                </button>
                {batchInferenceResults && (
                  <button
                    onClick={handleDownloadBatchResults}
                    className="px-3.5 py-2 rounded-xl bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Results CSV
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Parsed CSV Preview Table */}
          {csvRows.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#242139]">
                Import Preview ({csvRows.length} rows loaded):
              </span>

              <div className="overflow-x-auto rounded-xl border border-[#EAE5FF]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF9FF] text-[#77738C] uppercase text-[10px] tracking-wider border-b border-[#EAE5FF]">
                    <tr>
                      {Object.keys(csvRows[0]).map(k => (
                        <th key={k} className="py-2.5 px-3 font-semibold">{k}</th>
                      ))}
                      {batchInferenceResults && (
                        <>
                          <th className="py-2.5 px-3 font-semibold text-[#6D55E8]">Predicted Failure</th>
                          <th className="py-2.5 px-3 font-semibold text-[#6D55E8]">Risk</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5FF] bg-[#FFFFFF]">
                    {csvRows.map((r, i) => {
                      const res = batchInferenceResults ? batchInferenceResults[i] : null;
                      return (
                        <tr key={i} className="hover:bg-[#FAF9FF] transition-colors">
                          {Object.values(r).map((v: any, vIdx) => (
                            <td key={vIdx} className="py-2 px-3 text-[#242139]">
                              {String(v)}
                            </td>
                          ))}
                          {res && (
                            <>
                              <td className="py-2 px-3 text-[#6D55E8] font-semibold">{res.predictedFailure}</td>
                              <td className="py-2 px-3 font-bold">{res.risk}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Workflow C: Sensor Integration */}
      {activeTab === 'feed' && (
        <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 shadow-subtle flex flex-col gap-6">
          <div className="pb-3 border-b border-[#F3F0FF]">
            <h3 className="font-display font-bold text-[#242139] text-base">
              Live Edge Sensor Stream Configuration
            </h3>
            <p className="text-xs text-[#77738C] mt-0.5">
              Connect directly to OPC-UA, MQTT, or Modbus TCP factory floor gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FAF9FF] p-5 sm:p-6 rounded-2xl border border-[#EAE5FF] space-y-4">
              <div>
                <label className="text-[11px] uppercase text-[#77738C] block font-semibold mb-1 font-mono">
                  Protocol Type
                </label>
                <select className="w-full bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#6D55E8]">
                  <option>OPC-UA (Industrial Automation Standard)</option>
                  <option>MQTT (Industrial IoT Telemetry Broker)</option>
                  <option>Modbus TCP (PLC Fieldbus)</option>
                  <option>HTTP Webhook Ingress (REST API)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase text-[#77738C] block font-semibold mb-1 font-mono">
                  Server Endpoint Address
                </label>
                <input
                  type="text"
                  defaultValue="opc.tcp://gateway.factory.internal:4840/FactoryMind"
                  className="w-full bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#6D55E8]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase text-[#77738C] block font-semibold mb-1 font-mono">
                  Security Token / Certificate Key
                </label>
                <input
                  type="text"
                  defaultValue="auth-token-prod-bay-b"
                  className="w-full bg-[#FFFFFF] border border-[#EAE5FF] text-[#242139] font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#6D55E8]"
                />
              </div>
            </div>

            <div className="bg-[#FAF9FF] p-5 sm:p-6 rounded-2xl border border-[#EAE5FF] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6D55E8] block mb-2 font-mono">
                  Bridge Diagnostic Status
                </span>
                
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFFFF] border border-[#EAE5FF] mb-4 shadow-sm">
                  <div className={`w-3 h-3 rounded-full ${
                    gatewayStatus === 'connected' ? 'bg-[#159B70] shadow-[0_0_8px_rgba(21,155,112,0.6)] animate-pulse' :
                    gatewayStatus === 'testing' ? 'bg-[#D99117] animate-ping' :
                    'bg-[#DC5268]'
                  }`} />
                  <div>
                    <span className="text-xs font-bold text-[#242139] block">
                      {gatewayStatus === 'connected' ? 'Edge Bridge: Active (Demonstration Loop)' :
                       gatewayStatus === 'testing' ? 'Pinging Gateway Socket...' : 'Bridge Offline'}
                    </span>
                    <span className="text-[11px] text-[#77738C] font-mono">Latency: 11.4ms · Zero packet drops</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 text-[#77738C]">
                  <div className="flex justify-between">
                    <span>Telemetry Ingress:</span>
                    <strong className="text-[#159B70]">Continuous (1.0 Hz)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tags Monitored:</span>
                    <strong className="text-[#242139] font-mono">40 Channels</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePingGateway}
                disabled={gatewayStatus === 'testing'}
                className="w-full mt-6 py-2.5 rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gatewayStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Gateway Connection</span>
              </button>
            </div>
          </div>

          {/* Integration Logs Terminal */}
          <div className="bg-[#FAF9FF] border border-[#EAE5FF] p-4 rounded-xl">
            <span className="text-xs font-semibold text-[#77738C] flex items-center gap-1.5 mb-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-[#6D55E8]" /> Integration Log Stream
            </span>
            <div className="space-y-1 font-mono text-[11px] text-[#242139] max-h-36 overflow-y-auto custom-light-scrollbar">
              {gatewayLogs.map((log, idx) => (
                <div key={idx} className="text-[#77738C]">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
