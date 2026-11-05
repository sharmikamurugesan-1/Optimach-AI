/**
 * Optimach-AI Backend Integration Service
 * Connects the React/Vite frontend to the Flask Machine Learning Backend (http://127.0.0.1:5000)
 */

export interface BackendHealthResponse {
  status: 'online' | 'offline';
  service?: string;
  version?: string;
  models_loaded?: string[];
  total_models?: number;
}

export interface BackendPredictionResponse {
  status: 'success' | 'error';
  machine_type?: string;
  ensemble_failure_risk?: 'Low' | 'Moderate' | 'High' | 'Severe';
  failure_probability_percent?: number;
  predictions?: {
    LGBMClassifier?: number;
    XGBClassifier?: number;
    DecisionTreeClassifier?: number;
    RandomForestClassifier?: number;
    LogisticRegression?: number;
    IsolationForest_Anomaly?: string;
    RidgeRegression_Predicted_Torque?: number;
    LGBMRegressor_Predicted_Torque?: number;
    LSTM_Failure_Probability?: number;
    LSTM_Prediction?: number;
    [key: string]: any;
  };
  message?: string;
}

const BACKEND_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Checks if the Optimach-AI Flask Backend is online and returns model metadata
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        status: 'online',
        service: data.service,
        version: data.version,
        models_loaded: data.models_loaded || [],
        total_models: data.total_models || (data.models_loaded ? data.models_loaded.length : 8)
      };
    }
    return { status: 'offline' };
  } catch {
    return { status: 'offline' };
  }
}

/**
 * Sends machine telemetry or AI4I parameters to Flask /predict endpoint
 */
export async function queryBackendPrediction(payload: {
  Type?: string;
  Air_temperature?: number;
  Process_temperature?: number;
  Rotational_speed?: number;
  Torque?: number;
  Tool_wear?: number;
  // Also accept industrial sensor names
  temperature?: number;
  rotate?: number;
  vibration?: number;
  pressure?: number;
  volt?: number;
}): Promise<BackendPredictionResponse> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { status: 'error', message: err.message || `HTTP ${res.status}` };
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Could not connect to Flask backend'
    };
  }
}
