<div align="center">

# ⚙️ Optimach-AI

### Enterprise Industrial Intelligence & Predictive Maintenance Platform
**Continuous Machinery Surveillance • Multi-Model Machine Learning • Closed-Loop Maintenance Workflows**

<br />

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-optimach--ai--1.onrender.com-7C3AED?style=for-the-badge&logo=render&logoColor=white)](https://optimach-ai-1.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Optimach--AI-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sharmikamurugesan-1/Optimach-AI)
[![License: MIT](https://img.shields.io/badge/License-MIT-059669?style=for-the-badge)](https://github.com/sharmikamurugesan-1/Optimach-AI/blob/main/LICENSE)

<br />

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.0%20REST%20API-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%20%26%20LightGBM-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Render](https://img.shields.io/badge/Deployment-Render%20Cloud-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-machine-learning-architecture">ML Architecture</a> •
  <a href="#-system-architecture">System Architecture</a> •
  <a href="#-quickstart-guide">Quickstart Guide</a> •
  <a href="#-api-documentation">API Reference</a> •
  <a href="#-github-about-section">GitHub About Setup</a>
</p>

---

</div>

## 📌 Executive Overview

**Optimach-AI** is an industrial predictive maintenance system engineered to eliminate unplanned machinery downtime across manufacturing plants. Designed for reliability leads, maintenance technicians, and plant managers, the platform bridges high-frequency IoT sensor telemetry, multi-model machine learning inference, and actionable field maintenance dispatch into a single unified operating console.

### The Three Operational Pillars:
1. **MONITOR:** Ingest and visualize live multi-sensor data streams (vibration RMS, core temperature, hydraulic pressure, rotational velocity, supply voltage) with automated z-score boundary detection.
2. **PREDICT:** Classify impending component fatigue and structural failure 7 days in advance using an ensemble of calibrated classification, anomaly detection, and regression algorithms.
3. **MAINTAIN:** Convert high-risk alerts directly into dispatchable maintenance work orders with technician checklists and persistent audit trails.

---

## 🚀 Live Deployment

The application is deployed as a unified full-stack service on Render:

🔗 **Production URL:** [https://optimach-ai-1.onrender.com](https://optimach-ai-1.onrender.com) (Mirror: [https://optimach-ai.onrender.com](https://optimach-ai.onrender.com))  
🔗 **API Health Endpoint:** [https://optimach-ai-1.onrender.com/api/health](https://optimach-ai-1.onrender.com/api/health)

---

## ⚡ Key Features

### 1. 🎛️ Command Centre & Fleet Overview
- **Fleet-Wide Health Snapshot:** Real-time KPI counters tracking total assets, normal machinery, assets needing attention, and critical alarms.
- **Machine Fleet Directory:** Dynamic, color-coded status cards highlighting vibration and thermal anomalies with rapid search, multi-bay filtering, and view mode switching (Card Grid vs. Tabular Matrix).
- **Recent Maintenance Activity Audit:** Instant log of acknowledged alerts, scheduled overhauls, and shift handovers.

### 2. 🔍 3D Machine CAD Visualizer & Component Inspection
- **High-Resolution Industrial Imaging:** Photorealistic CAD visualizer representing industrial assets (CNC milling centers, hydraulic presses, high-speed lathes, moulding cells).
- **Interactive Component Hotspots:** Clickable diagnostic points linking directly to sub-assemblies:
  - `COMP 1`: Drive Shaft & Harmonic Bearings
  - `COMP 2`: Hydraulic Seal & Valve Manifolds
  - `COMP 3`: Motor Stator & Rotor Windings
  - `COMP 4`: Cooling Assembly & Heat Exchanger
- **Thermal Heatmap Mode:** Switchable infrared thermal gradient view emphasizing friction hotspots.
- **Full-Screen Telemetry Trend:** High-resolution sensor historical wave analysis spanning full width with configurable 1h, 6h, 12h, and 24h analytical windows.

### 3. 🧠 Multi-Model Machine Learning Diagnostics
- **Calibrated Failure Predictions:** Computes calibrated 7-day failure risk percentages based on multi-sensor telemetry drift.
- **Feature Contribution Breakdown:** Highlights out-of-spec telemetry metrics against nominal baseline tolerances.
- **Actionable Maintenance Guidance:** Prescribes concrete engineering remedies (bearing replacement, lubrication flush, vibration dampening).

### 4. 🛠️ Closed-Loop Maintenance Management
- **One-Click Work Order Dispatch:** Convert predictive failure reports directly into recorded work orders stored in persistent local state.
- **Operator Field Checklists:** Step-by-step interactive inspection tasks for shopfloor technicians.
- **Status Lifecycle Tracking:** Work orders progress through *Pending*, *In Progress*, and *Completed* stages.

### 5. 📊 Data Diagnostics & Batch Validation
- **What-If Telemetry Simulation:** Real-time slider controls allowing engineers to simulate sensor boundary conditions (voltage spikes, bearing chatter, cooling loss).
- **Automatic Backend Inference:** Queries both the edge client heuristics and the Python Flask ML backend simultaneously.
- **Batch CSV Import:** Upload historical machinery CSV datasets with automatic header validation and record ingestion.

---

## 🧬 Machine Learning Architecture

Optimach-AI combines complementary machine learning algorithms to balance classification sensitivity with anomaly detection:

| Model | Algorithm | Architecture / Task | Input Features | Primary Function |
|---|---|---|---|---|
| **LGBMClassifier** | LightGBM | Gradient Boosted Decision Trees | Type, Temperatures, RPM, Torque, Wear | Primary 7-day component failure classification |
| **XGBClassifier** | XGBoost | Extreme Gradient Boosting | Type, Temperatures, RPM, Torque, Wear | Cross-ensemble classification validation |
| **DecisionTreeClassifier** | Scikit-Learn | CART Tree Classifier | Type, Temperatures, RPM, Torque, Wear | Fast interpretable rule-based prediction |
| **IsolationForest** | Scikit-Learn | Unsupervised Tree Ensembles | Standardized Sensor Telemetry | Out-of-distribution drift and multivariate anomaly detection |
| **RidgeRegression** | Scikit-Learn | L2-Regularized Linear Model | Process Variables (without Torque) | Physical torque estimation & mechanical stress benchmarking |
| **LGBMRegressor** | LightGBM | Non-Linear Gradient Regressor | Process Variables (without Torque) | High-accuracy non-linear mechanical torque estimation |
| **LSTM** | TensorFlow / Keras | Recurrent Neural Network | Sequential Time-Series Tensors | Multi-step temporal degradation trajectory scoring |

### Canonical Feature Normalization
Input features are normalized using AI4I benchmark parameters:
$$\hat{x}_i = \frac{x_i - \mu_i}{\sigma_i}$$
Where $\mu = [1.0, 300.0, 310.0, 1538.7, 39.98, 107.95]$ and $\sigma = [0.7, 2.0, 1.48, 179.28, 9.83, 63.65]$.

---

## 📐 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SHOPFLOOR SENSOR LAYER                          │
│     Vibration (RMS)  •  Core Temp  •  Fluid PSI  •  RPM  •  Voltage    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ 1.0 Hz Edge Telemetry Stream
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FLASK ML BACKEND API                            │
│                  (backend/app.py on port 5000)                         │
│                                                                        │
│   GET /api/health   GET /api/models   POST /api/predict   GET / (UI)  │
│                                                                        │
│   ┌───────────────────────────┬────────────────────────────────────┐   │
│   │   Trained Model Weights   │      Pre-processing Pipeline       │   │
│   │   • LightGBM (.joblib)    │      • LabelEncoder (Machine Type) │   │
│   │   • XGBoost (.joblib)     │      • AI4I Canonical Normalizer   │   │
│   │   • IsolationForest       │      • Feature Matrix Reshaper     │   │
│   │   • Ridge & LSTM (.h5)    │      • Ensemble Risk Aggregator    │   │
│   └───────────────────────────┴────────────────────────────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON REST Response / Static Bundle
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  REACT 19 + TYPESCRIPT CLIENT UI                       │
│                       (Vite 8 + Tailwind CSS)                          │
│                                                                        │
│   • Deep Purple Navigation Sidebar   • 3D Machine CAD Visualizer       │
│   • Fleet Status KPI Cards           • Full-Width Telemetry Charts     │
│   • Failure Prediction Evidence      • Work Order Dispatch Console     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Python 3.10+, Flask 3.0, Flask-CORS
- **Server:** Gunicorn (WSGI)
- **Machine Learning:** Scikit-Learn, LightGBM, XGBoost, TensorFlow, Joblib, NumPy, Pandas

### Frontend
- **Framework:** React 19, TypeScript
- **Tooling:** Vite 8, PostCSS, Autoprefixer
- **Styling:** Tailwind CSS 3.4 (Minimal Purple + Soft Blue Industrial Theme)
- **Icons:** Lucide React
- **Data Visualizations:** SVG Line Charts with Normal Operating Envelopes

---

## 💻 Quickstart Guide

### Prerequisites
- **Python:** 3.10, 3.11, or 3.12
- **Node.js:** 18.x, 20.x, or 22.x
- **Git**

---

### Option 1: Unified Production Mode (Fastest)

Run the Python backend which automatically serves the pre-built React frontend:

```bash
# 1. Clone the repository
git clone https://github.com/sharmikamurugesan-1/Optimach-AI.git
cd Optimach-AI

# 2. Set up virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the application
python app.py
```

Visit **`http://localhost:5000`** in your browser.

---

### Option 2: Full-Stack Development Mode

For live hot-reloading on both frontend and backend:

#### Terminal 1 — Flask ML Backend
```bash
cd Optimach-AI
python -m venv venv
.\venv\Scripts\activate   # or source venv/bin/activate
pip install -r requirements.txt
python backend/app.py
# Backend running at http://127.0.0.1:5000
```

#### Terminal 2 — Vite React Frontend
```bash
cd Optimach-AI/frontend
npm install
npm run dev
# Frontend dev server running at http://localhost:5173
```

---

## 🌐 API Documentation

### 1. Health Check
`GET /api/health`

Verifies that the API service is online and lists all loaded machine learning models.

```bash
curl -X GET https://optimach-ai.onrender.com/api/health
```

**Response (200 OK):**
```json
{
  "service": "Optimach-AI Predictive Maintenance Platform",
  "status": "online",
  "version": "2.4.0",
  "models_loaded": [
    "DecisionTreeClassifier",
    "LGBMClassifier",
    "IsolationForest",
    "RidgeRegression",
    "LGBMRegressor"
  ],
  "total_models": 5
}
```

---

### 2. Available Models & Features
`GET /api/models`

Lists input parameters and supported algorithms.

```bash
curl -X GET https://optimach-ai.onrender.com/api/models
```

---

### 3. Machine Failure Prediction
`POST /api/predict`

Accepts raw physical machinery parameters and returns ensemble classification, anomaly diagnosis, and predicted torque.

```bash
curl -X POST https://optimach-ai.onrender.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "L",
    "Air_temperature": 300.5,
    "Process_temperature": 310.8,
    "Rotational_speed": 1450.0,
    "Torque": 45.2,
    "Tool_wear": 95.0
  }'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "machine_type": "L",
  "ensemble_failure_risk": "Low",
  "failure_probability_percent": 0.0,
  "inputs": {
    "Air_temperature": 300.5,
    "Process_temperature": 310.8,
    "Rotational_speed": 1450.0,
    "Tool_wear": 95.0,
    "Torque": 45.2
  },
  "predictions": {
    "DecisionTreeClassifier": 0,
    "IsolationForest_Anomaly": "Normal",
    "LGBMClassifier": 0,
    "LGBMRegressor_Predicted_Torque": 44.21,
    "RidgeRegression_Predicted_Torque": 44.58
  }
}
```

---

## ☁️ Deployment Configuration (Render)

If deploying to [Render](https://render.com), use these settings:

| Setting | Value |
|---|---|
| **Environment** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && rm -rf backend/static && cp -r frontend/dist backend/static` |
| **Start Command** | `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

Alternatively, Render automatically detects the included `render.yaml` specification.

---

## 🏷️ GitHub "About" Section Setup

To configure the GitHub repository's **About** sidebar, use the following details:

- **Description:**
  > Enterprise Industrial Predictive Maintenance Platform powered by multi-model ML (LightGBM, XGBoost, Isolation Forest, LSTM) with 3D CAD inspection and automated work orders.
- **Website:**
  > `https://optimach-ai.onrender.com`
- **Topics / Tags:**
  > `predictive-maintenance` `industrial-iot` `machine-learning` `flask` `react19` `typescript` `lightgbm` `xgboost` `anomaly-detection` `industry-4-0` `render-deployment` `vite`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

---

## 👤 Author & Maintainer

**Sharmika Murugesan**  
- **GitHub:** [@sharmikamurugesan-1](https://github.com/sharmikamurugesan-1)  
- **Repository:** [Optimach-AI](https://github.com/sharmikamurugesan-1/Optimach-AI)  
- **Issues & Support:** [GitHub Issues](https://github.com/sharmikamurugesan-1/Optimach-AI/issues)
