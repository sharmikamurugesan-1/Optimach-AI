import React from 'react';
import { X, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { MODEL_EVALUATION_METRICS } from '../services/mlEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#242139]/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-elevated flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-[#F3F0FF] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F3F0FF] border border-[#EAE5FF] flex items-center justify-center text-[#6D55E8]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#242139] text-base">
                System Diagnostics & Technical Pipeline
              </h3>
              <span className="text-[11px] text-[#77738C] font-mono">FactoryMind EPMS v2.6 · LightGBM PdM Ensemble</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#77738C] hover:text-[#242139] transition-colors p-1.5 rounded-lg hover:bg-[#F3F0FF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-[#77738C]">
          <div>
            <span className="text-[#242139] font-bold uppercase text-[11px] block mb-2 tracking-wider font-mono">
              Underlying Machine Learning Pipeline
            </span>
            <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF] space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#77738C]">Classifier Architecture:</span>
                <span className="text-[#242139] font-semibold">{MODEL_EVALUATION_METRICS.modelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77738C]">Prediction Horizon:</span>
                <span className="text-[#6D55E8] font-semibold">7 Calendar Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77738C]">Validation Area ROC-AUC:</span>
                <span className="text-[#159B70] font-semibold">{MODEL_EVALUATION_METRICS.rocAuc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77738C]">Precision / Recall:</span>
                <span className="text-[#242139] font-semibold">
                  {Math.round(MODEL_EVALUATION_METRICS.precision * 100)}% / {Math.round(MODEL_EVALUATION_METRICS.recall * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[#242139] font-bold uppercase text-[11px] block mb-1.5 tracking-wider font-mono">
              Health Score Index Calculation
            </span>
            <div className="bg-[#FAF9FF] p-4 rounded-xl border border-[#EAE5FF] text-[#77738C] leading-relaxed text-xs">
              Machine health percentages are computed from multivariate physical deviations between live telemetry (temperature, vibration, pressure, voltage, rotation speed) and calibrated industrial baseline envelopes derived from the Microsoft Azure Predictive Maintenance dataset.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#F3F0FF]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white font-semibold text-xs shadow-sm transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
