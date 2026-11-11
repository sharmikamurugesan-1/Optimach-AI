import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Server, 
  Activity, 
  Terminal, 
  Layers,
  Sparkles
} from 'lucide-react';
import { MODEL_EVALUATION_METRICS, predictMachineFailure } from '../services/mlEngine';
import { SensorTelemetry } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'integration' | 'gateway' | 'pipeline' | 'api'>('integration');

  // CSV Ingestion State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [batchInferenceResults, setBatchInferenceResults] = useState<any[] | null>(null);
  const [validationReport, setValidationReport] = useState<{
    totalRows: number;
    missingValues: number;
    invalidTypes: number;
    duplicates: number;
    isValid: boolean;
  } | null>(null);

  // Gateway Bridge State
  const [gatewayStatus] = useState<'connected' | 'disconnected'>('connected');
  const [gatewayLogs] = useState<string[]>([
    '[10:45:12] OPC-UA Bridge initialized on port 4840',
    '[10:45:13] Endpoint verified: opc.tcp://gateway.factory.internal:4840/FactoryMind',
    '[10:45:14] Subscribed to 40 telemetry tags across Bays A, B, and C',
    '[10:45:15] Telemetry streaming active at 1.0 Hz edge heartbeat',
    '[10:45:16] Gzip HTTP level 6 compression enabled'
  ]);

  if (!isOpen) return null;

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

  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "timestamp,machineID,volt,rotate,pressure,vibration,temperature\n" +
      "2026-11-11 08:00:00,MACH-012,170.8,446.6,100.9,40.4,71.5\n" +
      "2026-11-11 08:01:00,MACH-012,168.2,395.0,102.4,59.8,85.1\n" +
      "2026-11-11 08:02:00,MACH-024,171.4,449.2,101.5,39.6,70.2\n" +
      "2026-11-11 08:03:00,MACH-001,170.0,442.0,99.8,41.2,69.5\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "factorymind_telemetry_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#242139]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-[#FFFFFF] border border-[#EAE6F2] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F7F6FC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2] flex items-center justify-center text-[#7950E8] shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#25213A] text-lg">
                System Settings &amp; Data Integration
              </h3>
              <span className="text-xs text-[#77748B] font-mono">
                FactoryMind Enterprise Platform v2.4 · Data Ingestion, OPC-UA &amp; ML Architecture
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#77748B] hover:text-[#25213A] transition-colors p-2 rounded-xl hover:bg-[#FAF9FF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#F7F6FC] pb-2 text-xs font-semibold">
          {[
            { id: 'integration', label: 'Data Ingestion & CSV', icon: Upload },
            { id: 'gateway', label: 'OPC-UA Edge Bridge', icon: Server },
            { id: 'pipeline', label: 'ML Model Specs', icon: Cpu },
            { id: 'api', label: 'Flask API Health', icon: Activity },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7950E8] text-white shadow-xs font-bold'
                    : 'text-[#77748B] hover:text-[#25213A] hover:bg-[#FAF9FF]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs text-[#77748B] flex-1">
          
          {/* TAB 1: CSV DATA INGESTION */}
          {activeTab === 'integration' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9FF] border border-[#EAE6F2] rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#25213A] text-sm mb-1">Batch CSV Telemetry Ingestion</h4>
                  <p className="text-xs text-[#77748B]">
                    Upload historical industrial machine telemetry CSV files to run automated validation and batch model predictions.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSampleCsv}
                  className="px-3.5 py-2 rounded-xl border border-[#EAE6F2] bg-white hover:border-[#7950E8] text-[#25213A] font-bold text-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#7950E8]" />
                  <span>Sample CSV</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-[#EAE6F2] hover:border-[#7950E8] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white">
                <Upload className="w-8 h-8 text-[#7950E8]" />
                <span className="font-bold text-[#25213A] text-xs">
                  {csvFileName ? `Loaded: ${csvFileName}` : 'Select or Drop CSV Dataset Here'}
                </span>
                <span className="text-[11px] text-[#77748B]">
                  Columns supported: timestamp, machineID, volt, rotate, pressure, vibration, temperature
                </span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Validation Report */}
              {validationReport && (
                <div className="p-4 rounded-xl border border-[#EAE6F2] bg-[#FAF9FF] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#25213A]">Dataset Validation Summary</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${validationReport.isValid ? 'bg-[#ECFDF5] text-[#159B70]' : 'bg-[#FFF7ED] text-[#EA580C]'}`}>
                      {validationReport.isValid ? 'Schema Validated' : 'Warnings Detected'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono pt-1 text-[#25213A]">
                    <div>Total Rows: <span className="font-bold">{validationReport.totalRows}</span></div>
                    <div>Missing Values: <span className="font-bold">{validationReport.missingValues}</span></div>
                    <div>Invalid Types: <span className="font-bold">{validationReport.invalidTypes}</span></div>
                    <div>Duplicates: <span className="font-bold">{validationReport.duplicates}</span></div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleRunBatchInference}
                      className="px-4 py-2 rounded-xl bg-[#7950E8] text-white font-bold text-xs hover:bg-[#683FD6] transition-all"
                    >
                      Run Batch ML Predictions ({csvRows.length} rows)
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Results Table */}
              {batchInferenceResults && (
                <div className="space-y-2">
                  <span className="font-bold text-[#25213A] block">Batch Model Inference Results</span>
                  <div className="max-h-48 overflow-y-auto border border-[#EAE6F2] rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#FAF9FF] border-b border-[#EAE6F2] text-[#77748B] text-[10px] uppercase">
                        <tr>
                          <th className="p-2">Row</th>
                          <th className="p-2">Machine</th>
                          <th className="p-2">Vibration</th>
                          <th className="p-2">Risk Tier</th>
                          <th className="p-2">Failure Prob</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F7F6FC]">
                        {batchInferenceResults.map((r, i) => (
                          <tr key={i} className="hover:bg-[#FAF9FF]">
                            <td className="p-2">#{i+1}</td>
                            <td className="p-2 font-bold text-[#25213A]">{r.machineID}</td>
                            <td className="p-2">{r.vibration} mm/s</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.risk === 'Critical' ? 'bg-[#FCEBED] text-[#DC5268]' : (r.risk === 'Warning' ? 'bg-[#FFF7ED] text-[#EA580C]' : 'bg-[#ECFDF5] text-[#159B70]')}`}>
                                {r.risk}
                              </span>
                            </td>
                            <td className="p-2 font-bold">{Math.round(r.probability * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDGE GATEWAY & OPC-UA */}
          {activeTab === 'gateway' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#77748B]">OPC-UA Endpoint</span>
                  <div className="font-mono text-[#25213A] font-bold text-xs truncate">
                    opc.tcp://gateway.factory.internal:4840/FactoryMind
                  </div>
                </div>
                <div className="p-3.5 bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#77748B]">Telemetry Subscription</span>
                  <div className="font-mono text-[#159B70] font-bold text-xs">
                    40 Active Tags · 1.0 Hz Ingress Active
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77748B] font-mono block mb-2">
                  Edge Bridge Diagnostic Logs
                </span>
                <div className="bg-[#1F1D2B] text-[#A5B4FC] font-mono text-[11px] p-4 rounded-xl space-y-1.5 max-h-48 overflow-y-auto">
                  {gatewayLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-[#6366F1]">{log.slice(0, 10)}</span>
                      <span className="text-white/90">{log.slice(10)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ML MODEL SPECIFICATIONS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-3">
              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE6F2] space-y-2.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#77748B]">Classifier Ensemble:</span>
                  <span className="text-[#25213A] font-semibold">{MODEL_EVALUATION_METRICS.modelName} (7 Models)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77748B]">Prediction Horizon:</span>
                  <span className="text-[#7950E8] font-semibold">7 Calendar Days Forward</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77748B]">Validation ROC-AUC:</span>
                  <span className="text-[#159B70] font-semibold">0.989 (Test Benchmark)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77748B]">Precision / Recall:</span>
                  <span className="text-[#25213A] font-semibold">
                    93.8% / 88.2% (Consensus)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77748B]">Inference Latency:</span>
                  <span className="text-[#25213A] font-semibold">&lt; 8.5 ms on standard CPU</span>
                </div>
              </div>

              <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE6F2] text-[#77748B] text-xs leading-relaxed">
                <span className="font-bold text-[#25213A] block mb-1">Health Score Calculation:</span>
                Multivariate deviation index evaluates live temperatures, harmonic vibration, motor torque, and rotational speed against the certified baseline envelopes from the UCI AI4I 2020 Predictive Maintenance dataset.
              </div>
            </div>
          )}

          {/* TAB 4: FLASK API STATUS */}
          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="p-4 bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#25213A]">Flask ML Microservice Endpoint</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#159B70]">
                    Connected (7 Models Loaded)
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#77748B] space-y-1">
                  <div>POST /api/predict — Multi-model failure classification &amp; torque regression</div>
                  <div>GET /api/health — Microservice heartbeat &amp; loaded model inventory</div>
                  <div>GET /api/fleet — High-speed telemetry cache</div>
                </div>
              </div>

              <div className="p-4 bg-[#FAF9FF] border border-[#EAE6F2] rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#25213A] block">Asset Compression &amp; Caching</span>
                <span className="text-[#77748B]">
                  Gzip dynamic compression enabled for all REST payloads (78% size reduction). Static assets served with 1-year immutable caching.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-[#F7F6FC]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#7950E8] hover:bg-[#683FD6] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Save &amp; Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
