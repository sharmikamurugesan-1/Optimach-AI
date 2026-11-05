# Optimach-AI — Industrial Predictive Maintenance Platform

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue?style=flat&logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20%2B%20CORS-green?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-black?style=flat&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Build%20Tool-Vite%208-646CFF?style=flat&logo=vite)](https://vitejs.dev/)

**Optimach-AI** is a full-stack, enterprise-grade Industrial Intelligence & Predictive Maintenance Platform. It connects high-frequency machinery sensor surveillance, multi-model machine learning inference (LightGBM, XGBoost, Decision Trees, Isolation Forest, Ridge Regression, LSTM Deep Learning), and automated maintenance workflows into an executive, operator-friendly industrial interface.

---

## Key Capabilities

* **Command Centre & Fleet Overview:**
  * Real-time surveillance across factory bays with 4 essential KPIs: *Total Machines*, *Healthy Fleet*, *Needs Attention*, and *Critical Machines*.
  * Mini gradient sparklines, 24-hour fleet health distribution, and recent activity audit logs.
  * AI Predictive Insight cards providing actionable failure prevention advisories.

* **Multi-Model Machine Learning Backend:**
  * **Classification Models:** LightGBM (`LGBMClassifier`), XGBoost (`XGBClassifier`), and Decision Trees (`DecisionTreeClassifier`) predicting multi-component failure probabilities.
  * **Anomaly Detection:** Unsupervised `IsolationForest` detecting anomalous multivariate sensor drifts.
  * **Regression Models:** `RidgeRegression` & `LGBMRegressor` estimating mechanical torque tolerances.
  * **Deep Learning:** `LSTM` neural network estimating 7-day failure risk probabilities.

* **Compact Interactive 3D Machine Inspection:**
  * Interactive 3D sub-assembly visualization (Three.js) with clickable component hotspots:
    1. *Drive Shaft & Bearings* (`comp1`)
    2. *Hydraulic Seal & Manifold* (`comp2`)
    3. *Motor Stator & Rotor* (`comp3`)
    4. *Cooling Assembly & Shroud* (`comp4`)
  * Dynamic thermal & mechanical stress heatmap overlays.
  * Sub-assembly wear level tracking, clearance diagnostics, and maintenance advisories.

* **Live Telemetry & Diagnostics:**
  * 1.0 Hz edge gateway streaming for Vibration (RMS), Core Temperature, Fluid Pressure, Rotational Speed (RPM), and Voltage.
  * Automated tolerance checks with visual z-score threshold alerts.
  * Interactive 24-hour SVG telemetry trend charts with normal operating bands.

* **Maintenance Management & Work Orders:**
  * Direct one-click work order creation from failure predictions.
  * Persistent maintenance records log stored with local audit trail.
  * Step-by-step operator inspection checklists for field technicians.

* **Data Ingestion & Integration Suite:**
  * Manual sensor parameter testing with immediate diagnostic feedback.
  * Direct live query bridge to the Python Flask ML backend (`POST /api/predict`).
  * Historical CSV telemetry batch import with automated schema validation.

---

## Visual Design System (Minimal Purple + Soft Blue)

* **Canvas Background:** Near-white (`#FAF9FD`)
* **Surfaces & Cards:** Crisp white surfaces (`#FFFFFF`) with soft borders (`#EDE9FE`)
* **Primary Identity:** Vibrant purple (`#7C3AED`) and soft lavender (`#F5F3FF` / `#EDE9FE`)
* **Secondary Accents:** Soft mild blue (`#3B82F6` / `#EFF6FF` / `#2563EB`)
* **Headings & Key Text:** Dark purple-slate (`#1E1B4B` / `#2E1065`)
* **Industrial Status:**
  * Normal / Healthy: `#059669` (`#ECFDF5`)
  * Attention / Warning: `#D97706` (`#FFFBEB`)
  * Critical Alert: `#DC2626` (`#FEF2F2`)

---

## Project Structure

```text
Optimach-AI/
├── backend/
│   ├── app.py                             # Flask REST API server with CORS
│   ├── requirements.txt                   # Backend Python dependencies
│   ├── DecisionTreeClassifier_model.joblib
│   ├── IsolationForest_model.joblib
│   ├── label_encoder_type.joblib
│   ├── LGBMClassifier_model.joblib
│   ├── LGBMRegressor_model.joblib
│   ├── LSTM_model.h5
│   ├── RidgeRegression_model.joblib
│   └── XGBClassifier_model.joblib
├── frontend/
│   ├── src/
│   │   ├── components/                    # 3D Viewer, Charts, Timelines, Nav
│   │   ├── views/                         # Overview, MachineFleet, DataCheck, etc.
│   │   ├── services/
│   │   │   ├── mlEngine.ts                # Client Edge Gateway ML Engine
│   │   │   └── backendApi.ts              # Flask REST API Client
│   │   ├── types/                         # TypeScript interfaces
│   │   ├── utils/                         # Status badge formatters
│   │   ├── App.tsx                        # Master full-stack layout
│   │   └── index.css                      # Tailwind styling & typography
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── app.py                                 # Root entrypoint for Python backend
├── requirements.txt                       # Root Python dependencies
└── README.md
```

---

## Quickstart Guide

### 1. Backend Setup (Flask API)

```bash
# Clone the repository
git clone https://github.com/sharmikamurugesan-1/Optimach-AI.git
cd Optimach-AI

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask API server (runs on http://127.0.0.1:5000)
python app.py
```

### 2. Frontend Setup (React + Vite)

In a separate terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## Backend API Documentation

### `GET /api/health`
Verifies backend status and returns loaded model metadata.

**Response:**
```json
{
  "status": "online",
  "service": "Optimach-AI Predictive Maintenance Platform",
  "version": "2.4.0",
  "models_loaded": [
    "DecisionTreeClassifier",
    "XGBClassifier",
    "LGBMClassifier",
    "IsolationForest",
    "RidgeRegression",
    "LGBMRegressor",
    "LSTM"
  ],
  "total_models": 7
}
```

### `POST /api/predict`
Accepts machinery parameters and returns multi-model failure predictions.

**Request Body:**
```json
{
  "Type": "L",
  "Air_temperature": 300.5,
  "Process_temperature": 310.8,
  "Rotational_speed": 1450.0,
  "Torque": 45.2,
  "Tool_wear": 95.0
}
```

**Response:**
```json
{
  "status": "success",
  "machine_type": "L",
  "ensemble_failure_risk": "Moderate",
  "failure_probability_percent": 14.3,
  "predictions": {
    "LGBMClassifier": 0,
    "XGBClassifier": 0,
    "DecisionTreeClassifier": 0,
    "IsolationForest_Anomaly": "Normal",
    "RidgeRegression_Predicted_Torque": 44.82,
    "LGBMRegressor_Predicted_Torque": 45.10,
    "LSTM_Failure_Probability": 0.1428,
    "LSTM_Prediction": 0
  }
}
```

---

## License

This project is licensed under the MIT License.
