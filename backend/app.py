import os
import joblib
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Serve React frontend from 'static' directory (built by Vite)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')
CORS(app)

# ==================================================
# 1. MODEL DIRECTORY SETUP
# ==================================================
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Model filenames
MODEL_FILES = {
    "Label Encoder": "label_encoder_type.joblib",
    "Decision Tree": "DecisionTreeClassifier_model.joblib",
    "XGBoost": "XGBClassifier_model.joblib",
    "LightGBM Classifier": "LGBMClassifier_model.joblib",
    "Isolation Forest": "IsolationForest_model.joblib",
    "Ridge Regression": "RidgeRegression_model.joblib",
    "LightGBM Regressor": "LGBMRegressor_model.joblib",
    "LSTM": "LSTM_model.h5",
    "Scaler": "scaler.joblib",
    "Logistic Regression": "LogisticRegression_model.joblib",
    "Random Forest": "RandomForestClassifier_model.joblib",
}

# ==================================================
# 2. LOAD PREPROCESSING OBJECTS & MODELS
# ==================================================
loaded_models = {}
label_encoder = None
scaler = None
lstm_model = None

# Load Label Encoder
le_path = os.path.join(MODEL_DIR, "label_encoder_type.joblib")
if os.path.isfile(le_path):
    try:
        label_encoder = joblib.load(le_path)
        print(f"[FOUND] Label Encoder loaded: classes = {getattr(label_encoder, 'classes_', ['H', 'L', 'M'])}")
    except Exception as e:
        print(f"[WARN] Could not load Label Encoder: {e}")

# Load Scaler or use Canonical AI4I Normalization
scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
if os.path.isfile(scaler_path):
    try:
        scaler = joblib.load(scaler_path)
        print("[FOUND] Scaler loaded successfully.")
    except Exception as e:
        print(f"[WARN] Could not load scaler: {e}")

# Fallback AI4I Standard Parameters (mean, std) for [Type, Air_temp, Process_temp, Speed, Torque, Tool_wear]
AI4I_MEANS = np.array([1.0, 300.0, 310.0, 1538.7, 39.98, 107.95])
AI4I_STDS = np.array([0.7, 2.0, 1.48, 179.28, 9.83, 63.65])

def scale_features(features_array):
    if scaler is not None:
        try:
            return scaler.transform(features_array)
        except Exception:
            pass
    # Canonical standardization
    return (features_array - AI4I_MEANS) / (AI4I_STDS + 1e-7)

# Load Scikit-Learn / XGBoost / LightGBM models
joblib_model_keys = {
    "DecisionTreeClassifier": "DecisionTreeClassifier_model.joblib",
    "XGBClassifier": "XGBClassifier_model.joblib",
    "LGBMClassifier": "LGBMClassifier_model.joblib",
    "IsolationForest": "IsolationForest_model.joblib",
    "RidgeRegression": "RidgeRegression_model.joblib",
    "LGBMRegressor": "LGBMRegressor_model.joblib",
    "LogisticRegression": "LogisticRegression_model.joblib",
    "RandomForestClassifier": "RandomForestClassifier_model.joblib"
}

for name, fname in joblib_model_keys.items():
    fpath = os.path.join(MODEL_DIR, fname)
    if os.path.isfile(fpath):
        try:
            loaded_models[name] = joblib.load(fpath)
            print(f"[LOADED] {name}")
        except Exception as e:
            print(f"[WARN] Could not load {name}: {e}")

# Load LSTM Model
lstm_path = os.path.join(MODEL_DIR, "LSTM_model.h5")
if os.path.isfile(lstm_path):
    try:
        import tensorflow as tf
        lstm_model = tf.keras.models.load_model(lstm_path, compile=False)
        print("[LOADED] LSTM Deep Learning Model")
    except Exception as e:
        print(f"[INFO] TensorFlow LSTM load skipped or deferred: {e}")

# ==================================================
# 3. API ENDPOINTS
# ==================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Optimach-AI Predictive Maintenance Platform",
        "version": "2.4.0",
        "models_loaded": list(loaded_models.keys()) + (["LSTM"] if lstm_model else []),
        "total_models": len(loaded_models) + (1 if lstm_model else 0)
    }), 200

# Serve React frontend
@app.route("/", methods=["GET"])
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(404)
def fallback(e):
    """Serve index.html for client-side routing (React Router)."""
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.isfile(index_path):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"error": "Not found"}), 404

@app.route("/api/models", methods=["GET"])
def list_models():
    return jsonify({
        "available_models": list(loaded_models.keys()) + (["LSTM"] if lstm_model else []),
        "features": [
            "Type (L, M, H)",
            "Air_temperature (K)",
            "Process_temperature (K)",
            "Rotational_speed (RPM)",
            "Torque (Nm)",
            "Tool_wear (min)"
        ]
    }), 200

@app.route("/predict", methods=["POST"])
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid JSON input."
            }), 400

        # Support both AI4I fields and Industrial Telemetry fields
        m_type = data.get("Type", data.get("type", "L"))
        if label_encoder is not None:
            try:
                encoded_type = float(label_encoder.transform([m_type])[0])
            except Exception:
                encoded_type = 1.0 if m_type == "L" else (2.0 if m_type == "M" else 0.0)
        else:
            encoded_type = 1.0 if m_type == "L" else (2.0 if m_type == "M" else 0.0)

        # Field resolution with defaults
        air_temp = float(data.get("Air_temperature", data.get("temperature", 300.0)))
        # In case temperature is passed in Celsius (e.g. 70°C), convert to Kelvin (~343K) or baseline
        if air_temp < 150:
            air_temp = air_temp + 273.15

        proc_temp = float(data.get("Process_temperature", air_temp + 10.0))
        rot_speed = float(data.get("Rotational_speed", data.get("rotate", 1500.0)))
        torque = float(data.get("Torque", data.get("torque", 40.0)))
        tool_wear = float(data.get("Tool_wear", data.get("vibration", 80.0)))

        features = [encoded_type, air_temp, proc_temp, rot_speed, torque, tool_wear]
        features_array = np.asarray(features, dtype=np.float64).reshape(1, -1)

        features_scaled = scale_features(features_array)
        results = {}

        # 1. Classification Predictions
        classifier_keys = ["LGBMClassifier", "XGBClassifier", "DecisionTreeClassifier", "RandomForestClassifier", "LogisticRegression"]
        failure_votes = []
        for name in classifier_keys:
            if name in loaded_models:
                try:
                    pred = int(loaded_models[name].predict(features_scaled)[0])
                    results[name] = pred
                    failure_votes.append(pred)
                except Exception as e:
                    results[name] = f"Error: {str(e)}"

        # 2. Anomaly Detection (Isolation Forest)
        if "IsolationForest" in loaded_models:
            try:
                iso_pred = int(loaded_models["IsolationForest"].predict(features_scaled)[0])
                results["IsolationForest_Anomaly"] = "Anomaly" if iso_pred == -1 else "Normal"
            except Exception:
                pass

        # 3. Regression (Predicted Torque without Torque input)
        features_reg = np.delete(features_array, 4, axis=1)
        if "RidgeRegression" in loaded_models:
            try:
                results["RidgeRegression_Predicted_Torque"] = round(float(loaded_models["RidgeRegression"].predict(features_reg)[0]), 2)
            except Exception:
                pass

        if "LGBMRegressor" in loaded_models:
            try:
                results["LGBMRegressor_Predicted_Torque"] = round(float(loaded_models["LGBMRegressor"].predict(features_reg)[0]), 2)
            except Exception:
                pass

        # 4. LSTM Prediction
        if lstm_model is not None:
            try:
                features_lstm = np.expand_dims(features_scaled, axis=1)
                lstm_out = lstm_model.predict(features_lstm, verbose=0)
                prob = float(np.asarray(lstm_out).reshape(-1)[0])
                results["LSTM_Failure_Probability"] = round(prob, 4)
                results["LSTM_Prediction"] = int(prob >= 0.5)
                failure_votes.append(int(prob >= 0.5))
            except Exception as e:
                results["LSTM_Error"] = str(e)

        # 5. Composite Risk Score & Failure Assessment
        failure_rate = (sum(failure_votes) / len(failure_votes)) if failure_votes else 0.0
        risk_level = "Severe" if failure_rate >= 0.6 else ("High" if failure_rate >= 0.3 else ("Moderate" if failure_rate > 0 else "Low"))

        return jsonify({
            "status": "success",
            "machine_type": m_type,
            "inputs": {
                "Air_temperature": air_temp,
                "Process_temperature": proc_temp,
                "Rotational_speed": rot_speed,
                "Torque": torque,
                "Tool_wear": tool_wear
            },
            "ensemble_failure_risk": risk_level,
            "failure_probability_percent": round(failure_rate * 100, 1),
            "predictions": results
        }), 200

    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

if __name__ == "__main__":
    print("\nStarting Optimach-AI Backend API on http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)
