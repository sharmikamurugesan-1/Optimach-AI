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
          text: 'text-[#DC5268]',
          bg: 'bg-[#FCEBED]',
          border: 'border-[#F6B7C1]',
          bar: 'bg-[#DC5268]',
        };
      case 'High':
        return {
          text: 'text-[#D99117]',
          bg: 'bg-[#FEF6E9]',
          border: 'border-[#F7D59A]',
          bar: 'bg-[#D99117]',
        };
      case 'Moderate':
        return {
          text: 'text-[#7055E8]',
          bg: 'bg-[#F0EBFF]',
          border: 'border-[#EAE6F2]',
          bar: 'bg-[#7055E8]',
        };
      default:
        return {
          text: 'text-[#159B70]',
          bg: 'bg-[#E8F7F2]',
          border: 'border-[#A3E3CD]',
          bar: 'bg-[#159B70]',
        };
    }
  };

  const riskTheme = getRiskTheme(prediction.calibratedRisk);

  return (
    <div className="w-full bg-white border border-[#EAE6F2] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-6">
      {/* Top Banner: Condition, Failure Category & Chance of Failure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-[#F7F6FC]">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-xl border ${riskTheme.border} ${riskTheme.bg} flex-shrink-0`}>
            {prediction.hasWarning ? (
              <AlertTriangle className={`w-5 h-5 ${riskTheme.text}`} />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#159B70]" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#FAF9FF] text-[#7055E8] border border-[#EAE6F2] font-mono">
                {machine.name} ({machine.id})
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${riskTheme.border} ${riskTheme.bg} ${riskTheme.text}`}>
                {prediction.calibratedRisk} Risk
              </span>
              <span className="text-[10px] text-[#77748B] bg-[#FAF9FF] border border-[#EAE6F2] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#7055E8]" /> Horizon: 7-Day Window
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-[#25213A]">
              {prediction.predictedFailure}
            </h3>

            <p className="text-xs text-[#77748B] mt-1 max-w-xl leading-relaxed">
              Multi-sensor evaluation against calibrated tolerance envelopes to prevent unscheduled stoppage.
            </p>
          </div>
        </div>

        {/* Circular Chance of Failure Gauge */}
        <div className="flex items-center gap-3.5 bg-[#FAF9FF] p-3.5 rounded-xl border border-[#EAE6F2] flex-shrink-0 self-start sm:self-auto shadow-2xs">
          <div className="text-right">
            <span className="text-[11px] font-medium text-[#77748B] block">Chance of Failure</span>
            <div className="text-2xl font-bold text-[#25213A] tabular-nums font-mono">
              {prediction.probability}%
            </div>
            <span className="text-[10px] text-[#77748B] font-mono">Within 7 days</span>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-[#EAE6F2] relative flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                className="text-[#F0EBFF]"
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
            <span className="text-[10px] font-mono font-bold text-[#25213A] absolute">
              {prediction.probability}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Action & Practical Checklist (Spacious & Clean) */}
      <div className="bg-[#FAF9FF] p-5 sm:p-6 rounded-xl border border-[#EAE6F2] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <span className="text-xs font-bold text-[#7055E8] flex items-center gap-1.5 tracking-wide font-mono">
            <Wrench className="w-3.5 h-3.5 text-[#7055E8]" /> Recommended Maintenance Action
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#25213A] border border-[#EAE6F2] shadow-2xs">
            Urgency: <strong className="text-[#7055E8] font-bold">{prediction.urgency}</strong>
          </span>
        </div>

        <p className="text-xs font-semibold text-[#25213A] leading-relaxed">
          {prediction.recommendedAction}
        </p>

        {/* Actionable Field Checklist */}
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-[10px] font-bold text-[#77748B] uppercase tracking-wider font-mono">
            Operator Inspection Checklist:
          </span>
          {prediction.actionChecklist.map((step, idx) => (
            <button
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-start gap-3 p-3 rounded-xl text-left text-xs transition-all border ${
                checkedItems[idx]
                  ? 'bg-[#E8F7F2] border-[#A3E3CD] text-[#159B70] line-through opacity-85'
                  : 'bg-white border-[#EAE6F2] text-[#25213A] hover:border-[#7055E8] hover:bg-[#FAF9FF]'
              }`}
            >
              {checkedItems[idx] ? (
                <CheckSquare className="w-4 h-4 text-[#159B70] flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-[#77748B] flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{step}</span>
            </button>
          ))}
        </div>

        {/* Work Order Dispatch Action */}
        <div className="mt-2 pt-4 border-t border-[#EAE6F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-[#77748B]">
            Directly registers in the Maintenance Management log
          </span>
          <button
            onClick={handleCreateOrder}
            disabled={workOrderCreated}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto ${
              workOrderCreated
                ? 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD] cursor-default'
                : 'bg-[#7055E8] hover:bg-[#5630A8] text-white shadow-xs'
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
      <div className="pt-2 border-t border-[#F7F6FC]">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-[#77748B] hover:text-[#7055E8] flex items-center gap-1.5 transition-colors font-medium py-1"
        >
          <Cpu className="w-3.5 h-3.5 text-[#7055E8]" />
          <span>{showTechnicalDetails ? 'Hide Model Details' : 'Show Technical Model Details'}</span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 p-4 rounded-xl bg-[#FAF9FF] border border-[#EAE6F2] text-xs font-mono text-[#77748B] space-y-2">
            <div className="flex justify-between py-1 border-b border-[#F7F6FC]">
              <span>Classifier:</span>
              <strong className="text-[#25213A]">{prediction.modelContext.modelName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F7F6FC]">
              <span>ROC-AUC Validation:</span>
              <strong className="text-[#159B70]">{prediction.modelContext.rocAuc}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F7F6FC]">
              <span>Precision:</span>
              <strong className="text-[#25213A]">{Math.round(prediction.modelContext.precision * 100)}%</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Recall:</span>
              <strong className="text-[#25213A]">{Math.round(prediction.modelContext.recall * 100)}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
