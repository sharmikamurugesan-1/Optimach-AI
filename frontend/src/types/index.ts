export interface Machine {
  id: string;
  name: string;
  type?: string; // e.g. 'CNC Machining Center', 'Hydraulic Press', 'Rotary Screw Compressor'
  model: 'Model 1' | 'Model 2' | 'Model 3' | 'Model 4';
  age: number; // years
  location: string;
  status: 'normal' | 'warning' | 'critical';
  healthScore: number; // validated baseline index 0-100 based on Mahalanobis distance from normal sensor distribution
  runningHours: number;
  installedDate: string;
  dataSource?: 'live_edge' | 'simulated' | 'csv_import';
  specs: {
    maxRpm: number;
    voltageRating: string;
    operatingPressure: string;
    ratedPower: string;
  };
  components: {
    comp1: { name: 'Drive Bearings & Shaft'; condition: 'good' | 'fair' | 'degraded'; wearPercent: number };
    comp2: { name: 'Hydraulic Seal & Manifold'; condition: 'good' | 'fair' | 'degraded'; wearPercent: number };
    comp3: { name: 'Motor Rotor & Stator Windings'; condition: 'good' | 'fair' | 'degraded'; wearPercent: number };
    comp4: { name: 'Cooling Assembly & Radiator'; condition: 'good' | 'fair' | 'degraded'; wearPercent: number };
  };
}

export interface SensorTelemetry {
  timestamp: string;
  volt: number;       // Volts (nominal ~170V, norm 150-190)
  rotate: number;     // RPM (nominal ~445, norm 380-510)
  pressure: number;   // PSI (nominal ~100, norm 85-115)
  vibration: number;  // mm/s RMS (nominal ~40, norm 25-52)
  temperature: number;// °C (nominal ~72, norm 60-85)
}

export interface FactorContribution {
  feature: 'volt' | 'rotate' | 'pressure' | 'vibration' | 'temperature';
  label: string;
  currentValue: number;
  normalRange: string;
  unit: string;
  impactScore: number; // -100 to +100 (SHAP value representation)
  observation: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface PredictionResult {
  machineId: string;
  timestamp: string;
  predictionHorizon: '7 Days';
  hasWarning: boolean;
  predictedFailure: string; // e.g. "None (Normal)", "Component 1 (Drive Bearings)", etc.
  failureCategory: 'None' | 'Component 1' | 'Component 2' | 'Component 3' | 'Component 4';
  probability: number; // 0 - 100%
  calibratedRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  contributingFactors: FactorContribution[];
  recommendedAction: string;
  actionChecklist: string[];
  urgency: 'Routine Monitoring' | 'Inspect within 48 Hours' | 'Urgent Maintenance Required' | 'Immediate Shutdown Recommended';
  modelContext: {
    modelName: string;
    dataset: string;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
  };
}

export interface MachineEvent {
  id: string;
  machineId: string;
  timestamp: string;
  type: 'telemetry_anomaly' | 'error' | 'failure' | 'maintenance' | 'prediction';
  code: string; // e.g. 'ERR-02', 'WARN-VIB', 'MAINT-C1'
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
}

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  date: string;
  component: string;
  technician: string;
  actionType: 'Bearing Replacement' | 'Seal Overhaul' | 'Motor Rewind' | 'Coolant Flush' | 'Calibration & Lube' | string;
  issue?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Emergency';
  dueDate?: string;
  notes: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Scheduled';
  durationHours: number;
  replacedParts: string[];
  completionNotes?: string;
}
