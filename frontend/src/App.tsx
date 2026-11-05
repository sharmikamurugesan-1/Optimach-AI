import React, { useState, useEffect } from 'react';
import { Machine, SensorTelemetry, MachineEvent, MaintenanceRecord } from './types';
import { 
  INITIAL_MACHINES, 
  INITIAL_EVENTS, 
  INITIAL_MAINTENANCE_RECORDS, 
  generateMachineTelemetryHistory 
} from './data/mockMachines';
import { calculateHealthScore } from './services/mlEngine';
import { Sidebar, TopHeader } from './components/Navigation';
import { SettingsModal } from './components/SettingsModal';

// Views
import { OverviewView } from './views/OverviewView';
import { MachineIntelligenceView } from './views/MachineIntelligenceView';
import { LiveMonitorView } from './views/LiveMonitorView';
import { FailurePredictionView } from './views/FailurePredictionView';
import { DataCheckView } from './views/DataCheckView';
import { MaintenanceHistoryView } from './views/MaintenanceHistoryView';
import { MachineComparisonView } from './views/MachineComparisonView';

export const App: React.FC = () => {
  // 1. Persistent State with LocalStorage
  const [machines, setMachines] = useState<Machine[]>(() => {
    try {
      const saved = localStorage.getItem('factorymind_machines');
      return saved ? JSON.parse(saved) : INITIAL_MACHINES;
    } catch {
      return INITIAL_MACHINES;
    }
  });

  const [selectedMachineId, setSelectedMachineId] = useState<string>('MACH-012');
  const [activeView, setActiveView] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Streaming Simulation State
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);

  // Persistent Events & Maintenance Records
  const [events, setEvents] = useState<MachineEvent[]>(() => {
    try {
      const saved = localStorage.getItem('factorymind_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('factorymind_maintenance_records');
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
    } catch {
      return INITIAL_MAINTENANCE_RECORDS;
    }
  });

  // Synchronize state changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('factorymind_machines', JSON.stringify(machines));
    } catch (e) {
      console.warn('Could not persist machines to localStorage', e);
    }
  }, [machines]);

  useEffect(() => {
    try {
      localStorage.setItem('factorymind_events', JSON.stringify(events));
    } catch (e) {
      console.warn('Could not persist events to localStorage', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('factorymind_maintenance_records', JSON.stringify(maintenanceRecords));
    } catch (e) {
      console.warn('Could not persist maintenance records to localStorage', e);
    }
  }, [maintenanceRecords]);

  // Telemetry map: machineId -> SensorTelemetry[]
  const [histories] = useState<Record<string, SensorTelemetry[]>>(() => {
    const initial: Record<string, SensorTelemetry[]> = {};
    INITIAL_MACHINES.forEach(m => {
      initial[m.id] = generateMachineTelemetryHistory(m);
    });
    return initial;
  });

  // Current latest reading per machine
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, SensorTelemetry>>(() => {
    const initial: Record<string, SensorTelemetry> = {};
    INITIAL_MACHINES.forEach(m => {
      const hist = generateMachineTelemetryHistory(m);
      initial[m.id] = hist[hist.length - 1];
    });
    return initial;
  });

  // Rolling live buffer for the active machine (last 50 ticks)
  const [liveBuffer, setLiveBuffer] = useState<SensorTelemetry[]>(() => {
    const hist = histories['MACH-012'] || [];
    return hist.slice(-30);
  });

  // Active Machine Object
  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  // Update live buffer when machine changes
  useEffect(() => {
    const hist = histories[selectedMachineId] || [];
    setLiveBuffer(hist.slice(-30));
  }, [selectedMachineId, histories]);

  // Telemetry Simulation Loop (1Hz / streamSpeed)
  useEffect(() => {
    if (!isStreaming) return;

    const intervalTime = Math.max(200, 1000 / streamSpeed);

    const interval = setInterval(() => {
      setLatestTelemetry(prev => {
        const nextTelemetry = { ...prev };

        machines.forEach(m => {
          const curr = prev[m.id] || {
            volt: 170.8,
            rotate: 446.6,
            pressure: 100.9,
            vibration: 40.4,
            temperature: 71.5,
            timestamp: ''
          };

          let newVib = curr.vibration + (Math.random() - 0.5) * 0.4;
          let newPress = curr.pressure + (Math.random() - 0.5) * 0.6;
          let newRot = curr.rotate + (Math.random() - 0.5) * 2.5;
          let newVolt = curr.volt + (Math.random() - 0.5) * 0.3;
          let newTemp = curr.temperature + (Math.random() - 0.5) * 0.2;

          if (m.id === 'MACH-012') {
            newVib = Math.max(52, Math.min(68, newVib));
            newRot = Math.max(370, Math.min(410, newRot));
          } else if (m.status === 'normal') {
            newVib = Math.max(34, Math.min(46, newVib));
            newPress = Math.max(92, Math.min(108, newPress));
          }

          const now = new Date();
          const timestamp = now.toTimeString().slice(0, 8);

          const updatedReading: SensorTelemetry = {
            timestamp,
            volt: Math.round(newVolt * 10) / 10,
            rotate: Math.round(newRot),
            pressure: Math.round(newPress * 10) / 10,
            vibration: Math.round(newVib * 10) / 10,
            temperature: Math.round(newTemp * 10) / 10,
          };

          nextTelemetry[m.id] = updatedReading;

          if (m.id === selectedMachineId) {
            setLiveBuffer(b => {
              const updated = [...b, updatedReading];
              return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
            });
          }
        });

        return nextTelemetry;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed, selectedMachineId, machines]);

  // Inject Anomaly Handler
  const handleInjectAnomaly = (sensor: 'vibration' | 'pressure' | 'volt') => {
    setLatestTelemetry(prev => {
      const curr = prev[selectedMachineId];
      if (!curr) return prev;

      let mod = { ...curr };
      if (sensor === 'vibration') {
        mod.vibration = 64.2;
        mod.temperature += 4.5;
      } else if (sensor === 'pressure') {
        mod.pressure = 138.5;
      } else if (sensor === 'volt') {
        mod.volt = 212.0;
      }

      // Add high-priority event
      const newEvt: MachineEvent = {
        id: `EVT-${Math.floor(9050 + Math.random() * 500)}`,
        machineId: selectedMachineId,
        timestamp: 'Just now',
        type: 'telemetry_anomaly',
        code: `ALERT-${sensor.toUpperCase()}`,
        title: `Abnormal ${sensor.toUpperCase()} detected on ${selectedMachine.name}`,
        description: `Sensor reading exceeded normal operating threshold. Diagnostic review advised.`,
        severity: 'critical',
        acknowledged: false
      };

      setEvents(evts => [newEvt, ...evts]);

      // Update machine status
      setMachines(machs => machs.map(m => {
        if (m.id === selectedMachineId) {
          const newScore = calculateHealthScore(mod);
          return {
            ...m,
            healthScore: newScore,
            status: newScore < 60 ? 'critical' : newScore < 80 ? 'warning' : 'normal'
          };
        }
        return m;
      }));

      setLiveBuffer(b => [...b, mod]);

      return {
        ...prev,
        [selectedMachineId]: mod
      };
    });
  };

  // Event Acknowledgment
  const handleAcknowledgeEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, acknowledged: true } : e));
  };

  // Work order creation
  const handleCreateWorkOrder = (title: string, notes: string) => {
    const newRecord: MaintenanceRecord = {
      id: `WO-${Math.floor(8860 + Math.random() * 500)}`,
      machineId: selectedMachineId,
      date: new Date().toISOString().slice(0, 10),
      component: 'Target Sub-Assembly',
      technician: 'Assigned Field Tech',
      actionType: 'Bearing Replacement',
      issue: title,
      priority: 'Emergency',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      notes,
      status: 'Open',
      durationHours: 3.5,
      replacedParts: ['OEM Inspection Seal Kit']
    };

    setMaintenanceRecords(prev => [newRecord, ...prev]);

    const newEvt: MachineEvent = {
      id: `EVT-${Math.floor(9060 + Math.random() * 500)}`,
      machineId: selectedMachineId,
      timestamp: 'Just now',
      type: 'maintenance',
      code: 'WO-LOGGED',
      title: `Preventive Work Order Dispatched: ${title}`,
      description: `Technician assigned for field inspection under work order #${newRecord.id}.`,
      severity: 'info',
      acknowledged: true
    };
    setEvents(prev => [newEvt, ...prev]);
  };

  // Update Work Order Lifecycle Status
  const handleUpdateRecordStatus = (id: string, newStatus: MaintenanceRecord['status'], completionNotes?: string) => {
    setMaintenanceRecords(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: newStatus,
          completionNotes: completionNotes || r.completionNotes
        };
      }
      return r;
    }));
  };

  // Manual Telemetry Override from DataCheckView
  const handleApplyManualTelemetry = (machineId: string, telemetry: SensorTelemetry) => {
    setLatestTelemetry(prev => ({ ...prev, [machineId]: telemetry }));
    const score = calculateHealthScore(telemetry);
    setMachines(machs => machs.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          healthScore: score,
          status: score < 60 ? 'critical' : score < 80 ? 'warning' : 'normal'
        };
      }
      return m;
    }));
  };

  const activeAlertCount = events.filter(e => !e.acknowledged && (e.severity === 'critical' || e.severity === 'warning')).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9FF] text-[#242139] font-sans antialiased bg-ambient-light">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={(viewId) => setActiveView(viewId)}
        activeAlertCount={activeAlertCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader 
          activeView={activeView} 
          activeAlertCount={activeAlertCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNavigate={(v) => setActiveView(v)}
        />

        {/* Dynamic View Scrollport with Spacious Padding */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-9 custom-light-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {activeView === 'overview' && (
              <OverviewView
                machines={machines}
                events={events}
                latestTelemetry={latestTelemetry}
                isSimulatedStream={true}
                onSelectMachine={(id) => {
                  setSelectedMachineId(id);
                  setActiveView('machines');
                }}
                onNavigateToView={(v) => setActiveView(v)}
              />
            )}

            {activeView === 'machines' && (
              <MachineIntelligenceView
                machines={machines}
                selectedMachine={selectedMachine}
                telemetryHistory={histories[selectedMachineId] || []}
                currentTelemetry={latestTelemetry[selectedMachineId] || {
                  volt: 170.8, rotate: 446.6, pressure: 100.9, vibration: 40.4, temperature: 71.5, timestamp: ''
                }}
                events={events}
                onSelectMachine={(id) => setSelectedMachineId(id)}
                onAcknowledgeEvent={handleAcknowledgeEvent}
                onCreateWorkOrder={handleCreateWorkOrder}
              />
            )}

            {activeView === 'live' && (
              <LiveMonitorView
                machines={machines}
                selectedMachine={selectedMachine}
                liveBuffer={liveBuffer}
                onSelectMachine={(id) => setSelectedMachineId(id)}
                onInjectAnomaly={handleInjectAnomaly}
                isStreaming={isStreaming}
                onToggleStreaming={() => setIsStreaming(!isStreaming)}
                streamSpeed={streamSpeed}
                onSetStreamSpeed={(s) => setStreamSpeed(s)}
              />
            )}

            {activeView === 'predictions' && (
              <FailurePredictionView
                machines={machines}
                selectedMachine={selectedMachine}
                latestTelemetry={latestTelemetry[selectedMachineId] || {
                  volt: 170.8, rotate: 446.6, pressure: 100.9, vibration: 40.4, temperature: 71.5, timestamp: ''
                }}
                onSelectMachine={(id) => setSelectedMachineId(id)}
                onCreateWorkOrder={handleCreateWorkOrder}
              />
            )}

            {activeView === 'datacheck' && (
              <DataCheckView
                machines={machines}
                onApplyManualTelemetry={handleApplyManualTelemetry}
              />
            )}

            {activeView === 'maintenance' && (
              <MaintenanceHistoryView
                records={maintenanceRecords}
                machines={machines}
                onAddRecord={(r) => setMaintenanceRecords(prev => [r, ...prev])}
                onUpdateRecordStatus={handleUpdateRecordStatus}
              />
            )}

            {activeView === 'comparison' && (
              <MachineComparisonView
                machines={machines}
                latestTelemetry={latestTelemetry}
                onInspectMachine={(id) => {
                  setSelectedMachineId(id);
                  setActiveView('machines');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* System Settings & Model Info Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
