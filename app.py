
%%writefile app.py

import os
import joblib
import numpy as np
import tensorflow as tf

from flask import Flask, request, jsonify


app = Flask(__name__)

# ==================================================
# 1. MODEL DIRECTORY
# ==================================================

MODEL_DIR = "/content"


# ==================================================
# 2. REQUIRED MODEL FILES
# ==================================================

REQUIRED_FILES = {
    "Scaler": "scaler.joblib",
    "Label Encoder": "label_encoder_type.joblib",

    "Logistic Regression": "LogisticRegression_model.joblib",
    "Decision Tree": "DecisionTreeClassifier_model.joblib",
    "Random Forest": "RandomForestClassifier_model.joblib",
    "XGBoost": "XGBClassifier_model.joblib",
    "LightGBM Classifier": "LGBMClassifier_model.joblib",

    "Ridge Regression": "RidgeRegression_model.joblib",
    "LightGBM Regressor": "LGBMRegressor_model.joblib",

    "LSTM": "LSTM_model.h5"
}


# ==================================================
# 3. VERIFY ALL MODEL FILES
# ==================================================

def verify_model_files():

    print("\n" + "=" * 60)
    print("INDUSTRIAL PREDICTIVE MAINTENANCE")
    print("MODEL FILE VERIFICATION")
    print("=" * 60)

    missing_files = []

    for name, filename in REQUIRED_FILES.items():

        filepath = os.path.join(MODEL_DIR, filename)

        if os.path.isfile(filepath):

            print(f"[FOUND]   {name}: {filename}")

        else:

            print(f"[MISSING] {name}: {filename}")
            missing_files.append(filename)

    print("=" * 60)

    if missing_files:

        raise FileNotFoundError(
            "Missing required files: " +
            ", ".join(missing_files)
        )

    print("ALL 10 REQUIRED FILES VERIFIED")
    print("=" * 60)


verify_model_files()


# ==================================================
# 4. LOAD PREPROCESSING OBJECTS
# ==================================================

scaler = joblib.load(
    os.path.join(MODEL_DIR, "scaler.joblib")
)

label_encoder = joblib.load(
    os.path.join(MODEL_DIR, "label_encoder_type.joblib")
)


# ==================================================
# 5. LOAD MACHINE LEARNING MODELS
# ==================================================

models = {

    "LogisticRegression": joblib.load(
        os.path.join(MODEL_DIR, "LogisticRegression_model.joblib")
    ),

    "DecisionTreeClassifier": joblib.load(
        os.path.join(MODEL_DIR, "DecisionTreeClassifier_model.joblib")
    ),

    "RandomForestClassifier": joblib.load(
        os.path.join(MODEL_DIR, "RandomForestClassifier_model.joblib")
    ),

    "XGBClassifier": joblib.load(
        os.path.join(MODEL_DIR, "XGBClassifier_model.joblib")
    ),

    "LGBMClassifier": joblib.load(
        os.path.join(MODEL_DIR, "LGBMClassifier_model.joblib")
    ),

    "RidgeRegression": joblib.load(
        os.path.join(MODEL_DIR, "RidgeRegression_model.joblib")
    ),

    "LGBMRegressor": joblib.load(
        os.path.join(MODEL_DIR, "LGBMRegressor_model.joblib")
    )

}


# ==================================================
# 6. LOAD LSTM DEEP LEARNING MODEL
# ==================================================

lstm_model = tf.keras.models.load_model(
    os.path.join(MODEL_DIR, "LSTM_model.h5"),
    compile=False
)


print("\nALL 8 MODELS LOADED SUCCESSFULLY!")

for name in models:
    print(f"[LOADED] {name}")

print("[LOADED] LSTM")


# ==================================================
# 7. HOME / HEALTH ENDPOINT
# ==================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "status": "success",

        "service": "Industrial Predictive Maintenance System",

        "models_loaded": True,

        "total_models": 8,

        "classification_models": [
            "LogisticRegression",
            "DecisionTreeClassifier",
            "RandomForestClassifier",
            "XGBClassifier",
            "LGBMClassifier"
        ],

        "regression_models": [
            "RidgeRegression",
            "LGBMRegressor"
        ],

        "deep_learning_models": [
            "LSTM"
        ]

    }), 200


# ==================================================
# 8. PREDICTION ENDPOINT
# ==================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json(silent=True)

        if not isinstance(data, dict):

            return jsonify({
                "status": "error",
                "message": "Please provide valid JSON input."
            }), 400

        # ------------------------------------------
        # INPUT VALIDATION
        # ------------------------------------------

        required_inputs = [
            "Type",
            "Air_temperature",
            "Process_temperature",
            "Rotational_speed",
            "Torque",
            "Tool_wear"
        ]

        missing_inputs = [
            key for key in required_inputs
            if key not in data
        ]

        if missing_inputs:

            return jsonify({
                "status": "error",
                "message": "Missing required input fields.",
                "missing_fields": missing_inputs
            }), 400

        # ------------------------------------------
        # ENCODE MACHINE TYPE
        # ------------------------------------------

        encoded_type = label_encoder.transform(
            [data["Type"]]
        )[0]

        # ------------------------------------------
        # FEATURE EXTRACTION
        # ------------------------------------------

        features = [

            encoded_type,

            float(data["Air_temperature"]),

            float(data["Process_temperature"]),

            float(data["Rotational_speed"]),

            float(data["Torque"]),

            float(data["Tool_wear"])

        ]

        features_array = np.asarray(
            features,
            dtype=np.float64
        ).reshape(1, -1)

        if not np.all(np.isfinite(features_array)):

            raise ValueError(
                "Input contains invalid numeric values."
            )

        # ------------------------------------------
        # FEATURE SCALING
        # ------------------------------------------

        features_scaled = scaler.transform(
            features_array
        )

        results = {}

        # ==========================================
        # 9. CLASSIFICATION PREDICTIONS
        # ==========================================

        classifier_names = [

            "LogisticRegression",
            "DecisionTreeClassifier",
            "RandomForestClassifier",
            "XGBClassifier",
            "LGBMClassifier"

        ]

        for name in classifier_names:

            prediction = models[name].predict(
                features_scaled
            )[0]

            results[name] = int(prediction)

        # ==========================================
        # 10. REGRESSION PREDICTIONS
        # ==========================================

        # Remove Torque (index 4)
        # Predict Torque using remaining features

        features_reg = np.delete(
            features_array,
            4,
            axis=1
        )

        ridge_prediction = models[
            "RidgeRegression"
        ].predict(features_reg)[0]

        lgbm_prediction = models[
            "LGBMRegressor"
        ].predict(features_reg)[0]

        results["RidgeRegression_Predicted_Torque"] = float(
            ridge_prediction
        )

        results["LGBMRegressor_Predicted_Torque"] = float(
            lgbm_prediction
        )

        # ==========================================
        # 11. LSTM PREDICTION
        # ==========================================

        features_lstm = np.expand_dims(
            features_scaled,
            axis=1
        )

        lstm_output = lstm_model.predict(
            features_lstm,
            verbose=0
        )

        lstm_probability = float(
            np.asarray(lstm_output).reshape(-1)[0]
        )

        results["LSTM_Failure_Probability"] = (
            lstm_probability
        )

        results["LSTM_Prediction"] = int(
            lstm_probability >= 0.5
        )

        # ==========================================
        # 12. SUCCESS RESPONSE
        # ==========================================

        return jsonify({

            "status": "success",

            "total_models": 8,

            "predictions": results

        }), 200

    except Exception as e:

        app.logger.exception(
            "Prediction execution failed"
        )

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 400


# ==================================================
# 13. RUN FLASK APPLICATION
# ==================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
