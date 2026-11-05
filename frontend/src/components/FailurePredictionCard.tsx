import React, { useState } from 'react';
import { PredictionResult, Machine } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ClipboardCheck, 
  CheckSquare, 
  Square, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  Cpu 
} from 'lucide-react';

interface FailurePredictionCardProps {
  prediction: PredictionResult;
  machine: Machine;
  onCreateWorkOrder?: (taskTitle: string, actionText: string) => void;
}

export const FailurePredictionCard: React.FC<FailurePredictionCardProps> = ({
  prediction,
  machine,
  onCreateWorkOrder,
}) => {
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});
  const [workOrderCreated, setWorkOrderCreated] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCreateOrder = () => {
    setWorkOrderCreated(true);
    onCreateWorkOrder?.(
      `Preventive Inspection: ${prediction.predictedFailure}`,
      prediction.recommendedAction
    );
  };

  const getRiskTheme = (risk: PredictionResult['calibratedRisk']) => {
    switch (risk) {
      case 'Severe':
        return {
          text: 'text-[#DC2626]',
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
          bar: 'bg-[#DC2626]',
          glow: 'shadow-xs'
        };
      case 'High':
        return {
          text: 'text-[#D97706]',
          bg: 'bg-[#FFFBEB]',
          border: 'border-[#FDE68A]',
          bar: 'bg-[#D97706]',
          glow: 'shadow-xs'
        };
      case 'Moderate':
        return {
          text: 'text-[#7C3AED]',
          bg: 'bg-[#F5F3FF]',
          border: 'border-[#DDD6FE]',
          bar: 'bg-[#7C3AED]',
          glow: 'shadow-xs'
        };
      default:
        return {
          text: 'text-[#059669]',
          bg: 'bg-[#ECFDF5]',
          border: 'border-[#A7F3D0]',
          bar: 'bg-[#059669]',
          glow: 'shadow-xs'
        };
    }
  };

  const riskTheme = getRiskTheme(prediction.calibratedRisk);

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-5">
      {/* Top Banner: Condition, Failure Category & Chance of Failure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F3FF]">
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl border ${riskTheme.border} ${riskTheme.bg} flex-shrink-0`}>
            {prediction.hasWarning ? (
              <AlertTriangle className={`w-5 h-5 ${riskTheme.text}`} />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#059669]" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9FD] text-[#7C3AED] border border-[#EDE9FE] font-mono">
                {machine.name} ({machine.id})
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskTheme.border} ${riskTheme.bg} ${riskTheme.text}`}>
                {prediction.calibratedRisk} Risk
              </span>
              <span className="text-[10px] text-[#64748B] bg-[#FAF9FD] border border-[#EDE9FE] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#7C3AED]" /> Horizon: 7-Day Window
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-display font-bold text-[#1E1B4B]">
              {prediction.predictedFailure}
            </h3>

            <p className="text-xs text-[#64748B] mt-0.5 max-w-xl leading-relaxed">
              Multi-sensor evaluation against calibrated tolerance envelopes to prevent unscheduled stoppage.
            </p>
          </div>
        </div>

        {/* Circular Chance of Failure Gauge */}
        <div className="flex items-center gap-3 bg-[#FAF9FD] p-3 rounded-xl border border-[#EDE9FE] flex-shrink-0 self-start sm:self-auto shadow-xs">
          <div className="text-right">
            <span className="text-[11px] font-medium text-[#64748B] block">Chance of Failure</span>
            <div className="text-2xl font-display font-bold text-[#1E1B4B] tabular-nums">
              {prediction.probability}%
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono">Within 7 days</span>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-[#EDE9FE] relative flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                className="text-[#F5F3FF]"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * prediction.probability) / 100}
                className={`${riskTheme.text} transition-all duration-1000`}
              />
            </svg>
            <span className="text-[10px] font-mono font-bold text-[#1E1B4B] absolute">
              {prediction.probability}%
            </span>
          </div>
        </div>
      </div>

      {/* Feature Contributions Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
            Key Telemetry Contributing Factors
          </span>
          <span className="text-[11px] text-[#64748B] font-mono">Live Sensor Drift</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#EDE9FE]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FD] text-[#64748B] uppercase font-mono text-[10px] border-b border-[#EDE9FE]">
              <tr>
                <th className="py-2 px-3">Telemetry Metric</th>
                <th className="py-2 px-3">Current Observed</th>
                <th className="py-2 px-3">Baseline Limit</th>
                <th className="py-2 px-3">Condition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F3FF]">
              {prediction.contributingFactors.map((f, i) => (
                <tr key={i} className="hover:bg-[#FAF9FD] transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#1E1B4B]">{f.label}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1E1B4B]">{f.currentValue} {f.unit}</td>
                  <td className="py-2.5 px-3 font-mono text-[#64748B]">{f.normalRange} {f.unit}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.status === 'critical' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
                      f.status === 'warning' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
                      'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    }`}>
                      {f.status === 'critical' ? 'Out of Spec' : f.status === 'warning' ? 'Warning' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Action & Practical Checklist */}
      <div className="bg-[#FAF9FD] p-4 sm:p-5 rounded-xl border border-[#EDE9FE] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1.5 tracking-wide font-mono">
            <Wrench className="w-3.5 h-3.5 text-[#7C3AED]" /> Recommended Maintenance Action
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FFFFFF] text-[#1E1B4B] border border-[#EDE9FE] shadow-xs">
            Urgency: <strong className="text-[#7C3AED] font-bold">{prediction.urgency}</strong>
          </span>
        </div>

        <p className="text-xs font-medium text-[#1E1B4B] leading-relaxed">
          {prediction.recommendedAction}
        </p>

        {/* Actionable Field Checklist */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
            Operator Inspection Checklist:
          </span>
          {prediction.actionChecklist.map((step, idx) => (
            <button
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-all border ${
                checkedItems[idx]
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] line-through opacity-85'
                  : 'bg-[#FFFFFF] border-[#EDE9FE] text-[#1E1B4B] hover:border-[#7C3AED] hover:bg-[#FAF9FD]'
              }`}
            >
              {checkedItems[idx] ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#059669] flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
              )}
              <span>{step}</span>
            </button>
          ))}
        </div>

        {/* Work Order Dispatch Action */}
        <div className="mt-2 pt-3 border-t border-[#EDE9FE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#64748B]">
            Directly registers in the Maintenance Management log
          </span>
          <button
            onClick={handleCreateOrder}
            disabled={workOrderCreated}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto ${
              workOrderCreated
                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] cursor-default'
                : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs'
            }`}
          >
            {workOrderCreated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Work Order Dispatched
              </>
            ) : (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" /> Create Work Order
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Technical Model Information */}
      <div className="pt-2 border-t border-[#F5F3FF]">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-[#64748B] hover:text-[#7C3AED] flex items-center gap-1.5 transition-colors font-medium py-1"
        >
          <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{showTechnicalDetails ? 'Hide Model Details' : 'Show Technical Model Details'}</span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE] text-xs font-mono text-[#64748B] space-y-1.5">
            <div className="flex justify-between py-1 border-b border-[#F5F3FF]">
              <span>Classifier:</span>
              <strong className="text-[#1E1B4B]">{prediction.modelContext.modelName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F5F3FF]">
              <span>ROC-AUC Validation:</span>
              <strong className="text-[#059669]">{prediction.modelContext.rocAuc}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F5F3FF]">
              <span>Precision:</span>
              <strong className="text-[#1E1B4B]">{Math.round(prediction.modelContext.precision * 100)}%</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Recall:</span>
              <strong className="text-[#1E1B4B]">{Math.round(prediction.modelContext.recall * 100)}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
