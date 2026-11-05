import React, { useState } from 'react';
import { MachineEvent } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Wrench, 
  Activity, 
  CheckCircle2, 
  Check 
} from 'lucide-react';

interface MachineEventTimelineProps {
  events: MachineEvent[];
  machineId?: string;
  onAcknowledgeEvent?: (id: string) => void;
}

export const MachineEventTimeline: React.FC<MachineEventTimelineProps> = ({
  events,
  machineId,
  onAcknowledgeEvent
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState<boolean>(true);

  // Filter events
  const filteredEvents = events.filter(evt => {
    if (machineId && evt.machineId !== machineId) return false;
    if (filterType !== 'all' && evt.type !== filterType) return false;
    if (!showAcknowledged && evt.acknowledged) return false;
    return true;
  });

  const getEventBadge = (type: MachineEvent['type']) => {
    switch (type) {
      case 'prediction':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />,
          label: 'Condition Warning',
          color: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
        };
      case 'telemetry_anomaly':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-[#DC2626]" />,
          label: 'Sensor Alert',
          color: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />,
          label: 'System Error',
          color: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
        };
      case 'maintenance':
        return {
          icon: <Wrench className="w-3.5 h-3.5 text-[#059669]" />,
          label: 'Maintenance',
          color: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />,
          label: 'Log Entry',
          color: 'bg-[#F5F3FF] border-[#EDE9FE] text-[#7C3AED]'
        };
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-[#1E1B4B] text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C3AED]" />
            Machine Activity & Event Timeline
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Chronological audit trail of sensor anomalies, condition alerts, and completed servicing.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#FAF9FD] p-1 rounded-xl border border-[#EDE9FE]">
            {[
              { id: 'all', label: 'All' },
              { id: 'prediction', label: 'Warnings' },
              { id: 'telemetry_anomaly', label: 'Sensors' },
              { id: 'maintenance', label: 'Maintenance' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                  filterType === f.id
                    ? 'bg-[#FFFFFF] text-[#7C3AED] font-bold shadow-xs border border-[#EDE9FE]'
                    : 'text-[#64748B] hover:text-[#1E1B4B]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-[#64748B] cursor-pointer pl-1">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            <span>Show Ack</span>
          </label>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EDE9FE]">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No activity events found matching the selected filter.
          </div>
        ) : (
          filteredEvents.map(evt => {
            const badge = getEventBadge(evt.type);

            return (
              <div key={evt.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-[#FFFFFF] border-2 border-[#7C3AED] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  evt.acknowledged 
                    ? 'bg-[#FAF9FD] border-[#EDE9FE] opacity-75' 
                    : 'bg-[#FFFFFF] border-[#EDE9FE] shadow-xs hover:border-[#DDD6FE]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-1 border ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-[#7C3AED]">{evt.machineId}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                      <span>{evt.timestamp}</span>
                      {evt.acknowledged && (
                        <span className="text-[#059669] font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-xs text-[#1E1B4B]">
                    {evt.title}
                  </h4>

                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    {evt.description}
                  </p>

                  {!evt.acknowledged && onAcknowledgeEvent && (
                    <div className="mt-3 pt-2.5 border-t border-[#F5F3FF] flex justify-end">
                      <button
                        onClick={() => onAcknowledgeEvent(evt.id)}
                        className="px-3 py-1 rounded-lg bg-[#FAF9FD] hover:bg-[#F5F3FF] border border-[#EDE9FE] text-[#7C3AED] font-semibold text-xs transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
