import { Machine, MachineEvent, MaintenanceRecord, SensorTelemetry } from '../types';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'MACH-012',
    name: 'CNC Milling Cell #12',
    type: 'CNC Machining Center',
    model: 'Model 3',
    age: 14,
    location: 'Bay B — Heavy Machining',
    status: 'critical',
    healthScore: 48,
    runningHours: 18450,
    installedDate: '2012-04-15',
    dataSource: 'simulated',
    specs: {
      maxRpm: 12000,
      voltageRating: '480V 3-Phase',
      operatingPressure: '105 PSI',
      ratedPower: '45 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'degraded', wearPercent: 88 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'fair', wearPercent: 42 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 24 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'fair', wearPercent: 55 },
    }
  },
  {
    id: 'MACH-024',
    name: 'Hydraulic Stamping Press #04',
    type: 'Hydraulic Press',
    model: 'Model 4',
    age: 11,
    location: 'Bay A — Press Line',
    status: 'warning',
    healthScore: 68,
    runningHours: 14200,
    installedDate: '2015-08-20',
    dataSource: 'simulated',
    specs: {
      maxRpm: 3600,
      voltageRating: '480V 3-Phase',
      operatingPressure: '130 PSI',
      ratedPower: '75 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'good', wearPercent: 28 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'degraded', wearPercent: 79 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 31 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'fair', wearPercent: 48 },
    }
  },
  {
    id: 'MACH-001',
    name: 'High-Speed Spindle Lathe #01',
    type: 'Turning Lathe',
    model: 'Model 1',
    age: 5,
    location: 'Bay C — Precision Turning',
    status: 'normal',
    healthScore: 94,
    runningHours: 6890,
    installedDate: '2021-02-10',
    dataSource: 'simulated',
    specs: {
      maxRpm: 15000,
      voltageRating: '400V 3-Phase',
      operatingPressure: '95 PSI',
      ratedPower: '30 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'good', wearPercent: 12 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'good', wearPercent: 15 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 18 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'good', wearPercent: 10 },
    }
  },
  {
    id: 'MACH-048',
    name: 'Injection Moulding Unit #08',
    type: 'Injection Moulding',
    model: 'Model 2',
    age: 8,
    location: 'Bay D — Polymers',
    status: 'warning',
    healthScore: 64,
    runningHours: 11340,
    installedDate: '2018-11-04',
    dataSource: 'simulated',
    specs: {
      maxRpm: 4500,
      voltageRating: '480V 3-Phase',
      operatingPressure: '115 PSI',
      ratedPower: '55 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'fair', wearPercent: 45 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'good', wearPercent: 25 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'degraded', wearPercent: 76 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'fair', wearPercent: 52 },
    }
  },
  {
    id: 'MACH-007',
    name: '5-Axis Machining Center #07',
    type: 'CNC Machining Center',
    model: 'Model 1',
    age: 6,
    location: 'Bay B — Aerospace Tooling',
    status: 'normal',
    healthScore: 91,
    runningHours: 8120,
    installedDate: '2020-05-18',
    dataSource: 'simulated',
    specs: {
      maxRpm: 18000,
      voltageRating: '400V 3-Phase',
      operatingPressure: '90 PSI',
      ratedPower: '37 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'good', wearPercent: 18 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'good', wearPercent: 21 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 14 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'good', wearPercent: 16 },
    }
  },
  {
    id: 'MACH-033',
    name: 'Industrial Air Compressor #02',
    type: 'Air Compressor',
    model: 'Model 3',
    age: 16,
    location: 'Auxiliary Utility Plant',
    status: 'critical',
    healthScore: 42,
    runningHours: 24100,
    installedDate: '2010-09-12',
    dataSource: 'simulated',
    specs: {
      maxRpm: 3000,
      voltageRating: '480V 3-Phase',
      operatingPressure: '145 PSI',
      ratedPower: '90 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'fair', wearPercent: 54 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'degraded', wearPercent: 86 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'fair', wearPercent: 62 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'degraded', wearPercent: 81 },
    }
  },
  {
    id: 'MACH-085',
    name: 'Robotic Pick & Place Gantry #03',
    type: 'Robotics',
    model: 'Model 2',
    age: 4,
    location: 'Bay A — Assembly Line 1',
    status: 'normal',
    healthScore: 96,
    runningHours: 5420,
    installedDate: '2022-01-30',
    dataSource: 'simulated',
    specs: {
      maxRpm: 6000,
      voltageRating: '400V 3-Phase',
      operatingPressure: '80 PSI',
      ratedPower: '22 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'good', wearPercent: 8 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'good', wearPercent: 10 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 12 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'good', wearPercent: 9 },
    }
  },
  {
    id: 'MACH-062',
    name: 'Continuous Extruder #05',
    type: 'Extrusion Line',
    model: 'Model 4',
    age: 9,
    location: 'Bay D — Polymers Extrusion',
    status: 'normal',
    healthScore: 86,
    runningHours: 12900,
    installedDate: '2017-06-14',
    dataSource: 'simulated',
    specs: {
      maxRpm: 2400,
      voltageRating: '480V 3-Phase',
      operatingPressure: '120 PSI',
      ratedPower: '60 kW',
    },
    components: {
      comp1: { name: 'Drive Bearings & Shaft', condition: 'good', wearPercent: 32 },
      comp2: { name: 'Hydraulic Seal & Manifold', condition: 'fair', wearPercent: 38 },
      comp3: { name: 'Motor Rotor & Stator Windings', condition: 'good', wearPercent: 29 },
      comp4: { name: 'Cooling Assembly & Radiator', condition: 'good', wearPercent: 34 },
    }
  }
];

// Generates 24-point realistic historical telemetry ending at current reading
export function generateMachineTelemetryHistory(machine: Machine): SensorTelemetry[] {
  const points: SensorTelemetry[] = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const progress = (24 - i) / 24; // 0 to 1

    let volt = 170.8 + (Math.sin(i * 0.4) * 5) + ((Math.random() - 0.5) * 4);
    let rotate = 446.6 + (Math.cos(i * 0.3) * 12) + ((Math.random() - 0.5) * 10);
    let pressure = 100.9 + (Math.sin(i * 0.2) * 4) + ((Math.random() - 0.5) * 3);
    let vibration = 40.4 + (Math.cos(i * 0.5) * 2) + ((Math.random() - 0.5) * 2);
    let temperature = 71.5 + (Math.sin(i * 0.25) * 3) + ((Math.random() - 0.5) * 1.5);

    if (machine.id === 'MACH-012') {
      // Degraded bearing signature (high vibration escalation over last 8 hours, speed drop)
      if (progress > 0.6) {
        const factor = (progress - 0.6) / 0.4;
        vibration += factor * 17.5; // reaches ~58 mm/s
        rotate -= factor * 48; // speed drag
        temperature += factor * 14.2; // frictional heat
      }
    } else if (machine.id === 'MACH-024') {
      // Hydraulic seal breach (pressure volatility and surge)
      if (progress > 0.5) {
        const factor = (progress - 0.5) / 0.5;
        pressure += factor * 26.0 * (Math.sin(i * 2.5) > 0 ? 1 : -0.7);
        temperature += factor * 8.0;
      }
    } else if (machine.id === 'MACH-048') {
      // Motor winding imbalance (volt instability)
      if (progress > 0.4) {
        const factor = (progress - 0.4) / 0.6;
        volt += (Math.sin(i * 3.0) > 0 ? 1 : -1) * factor * 22;
        temperature += factor * 11;
      }
    } else if (machine.id === 'MACH-033') {
      // Dual component breakdown (pressure + cooling collapse)
      if (progress > 0.3) {
        const factor = (progress - 0.3) / 0.7;
        temperature += factor * 21.0;
        pressure += factor * 22.0;
        vibration += factor * 9.0;
      }
    }

    points.push({
      timestamp,
      volt: Math.round(volt * 10) / 10,
      rotate: Math.round(rotate),
      pressure: Math.round(pressure * 10) / 10,
      vibration: Math.round(vibration * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
    });
  }

  return points;
}

export const INITIAL_EVENTS: MachineEvent[] = [
  {
    id: 'EVT-9041',
    machineId: 'MACH-012',
    timestamp: '12 mins ago',
    type: 'prediction',
    code: 'PRED-C1',
    title: 'Model Predicts Component 1 Failure Risk (88%)',
    description: 'Gradient boosted ensemble flagged high harmonic vibration (>54 mm/s) within 7-day prediction horizon.',
    severity: 'critical',
    acknowledged: false,
  },
  {
    id: 'EVT-9038',
    machineId: 'MACH-012',
    timestamp: '34 mins ago',
    type: 'telemetry_anomaly',
    code: 'WARN-VIB',
    title: 'Drive End Vibration Threshold Exceeded (55.4 mm/s)',
    description: 'Vibration z-score exceeded +2.6 sigma against historical baseline.',
    severity: 'critical',
    acknowledged: true,
  },
  {
    id: 'EVT-9032',
    machineId: 'MACH-024',
    timestamp: '1 hour ago',
    type: 'error',
    code: 'ERR-02',
    title: 'Hydraulic Manifold Pressure Modulation Fault',
    description: 'Cyclic pressure oscillation recorded between 82 and 128 PSI.',
    severity: 'warning',
    acknowledged: true,
  },
  {
    id: 'EVT-9025',
    machineId: 'MACH-048',
    timestamp: '2.5 hours ago',
    type: 'error',
    code: 'ERR-03',
    title: 'Supply Voltage Transients on Stator Phase B',
    description: 'Voltage ripple delta +24V observed during ramp-up cycle.',
    severity: 'warning',
    acknowledged: false,
  },
  {
    id: 'EVT-9014',
    machineId: 'MACH-001',
    timestamp: '5 hours ago',
    type: 'maintenance',
    code: 'MAINT-DONE',
    title: 'Routine Spindle Lubrication & Alignment Completed',
    description: 'Lead Technician R. Vance verified zero backlash and thermal equilibrium.',
    severity: 'info',
    acknowledged: true,
  },
  {
    id: 'EVT-9002',
    machineId: 'MACH-033',
    timestamp: '7 hours ago',
    type: 'prediction',
    code: 'PRED-C4',
    title: 'High Thermal Accumulation in Cooling Matrix',
    description: 'Cooling circuit delta temperature elevated by +18.4°C over 12 hours.',
    severity: 'critical',
    acknowledged: true,
  }
];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'WO-8821',
    machineId: 'MACH-012',
    date: '2026-10-24',
    component: 'Drive Bearings & Shaft',
    technician: 'Marcus Chen (Senior Mechanical)',
    actionType: 'Bearing Replacement',
    issue: 'Excessive high-frequency acoustic chatter on outboard drive race',
    priority: 'High',
    dueDate: '2026-10-25',
    notes: 'Replaced outboard bearing race following vibration alert. Packed with synthetic high-temp polyurea grease.',
    status: 'Completed',
    durationHours: 3.5,
    replacedParts: ['SKF 6208 Deep Groove Bearing', 'FKM Viton Shaft Seal'],
    completionNotes: 'Vibration dropped back to 38.2 mm/s baseline upon re-commissioning.'
  },
  {
    id: 'WO-8804',
    machineId: 'MACH-024',
    date: '2026-10-18',
    component: 'Hydraulic Seal & Manifold',
    technician: 'Sarah Al-Mansoor (Hydraulics Specialist)',
    actionType: 'Seal Overhaul',
    issue: 'Dynamic pressure fluctuations exceeding relief setpoint',
    priority: 'Medium',
    dueDate: '2026-10-20',
    notes: 'Flushed high-pressure manifold, replaced degraded PTFE backup rings. Pressure decay rate tested within 0.2 bar/min.',
    status: 'Completed',
    durationHours: 4.0,
    replacedParts: ['PTFE Dynamic Rod Seal Set', 'High-Pressure O-Ring Kit #4'],
    completionNotes: 'Line pressure stabilized at nominal 102 PSI under continuous stroke.'
  },
  {
    id: 'WO-8790',
    machineId: 'MACH-048',
    date: '2026-10-12',
    component: 'Motor Rotor & Stator Windings',
    technician: 'David Miller (Electrical Tech)',
    actionType: 'Motor Rewind',
    issue: 'Supply voltage transient surges causing phase imbalance',
    priority: 'High',
    dueDate: '2026-10-14',
    notes: 'Cleaned stator core, re-torqued motor terminal busbars. Insulation resistance measured at 120 M-Ohm.',
    status: 'Completed',
    durationHours: 6.0,
    replacedParts: ['Terminal Busbar Kit', 'Phase Surge Suppressors'],
    completionNotes: 'Phase imbalance reduced to 0.8%, well within 2.0% IEEE tolerance.'
  },
  {
    id: 'WO-8845',
    machineId: 'MACH-012',
    date: '2026-10-30',
    component: 'Drive Bearings & Shaft',
    technician: 'Pending Assignment',
    actionType: 'Bearing Replacement',
    issue: 'Predicted 7-day bearing race spall based on 4x harmonic vibration drift (88% probability)',
    priority: 'Emergency',
    dueDate: '2026-11-01',
    notes: 'Generated from Machine Intelligence Alert: 7-day failure risk at 88%. Urgent vibration FFT and shaft inspection.',
    status: 'Open',
    durationHours: 4.0,
    replacedParts: ['Drive Bearing Set B-12', 'Belleville Spring Washers']
  }
];
