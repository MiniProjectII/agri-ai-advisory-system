from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import tensorflow as tf
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Load saved model and preprocessing objects
model = tf.keras.models.load_model("crop_model.h5")
rf_model = joblib.load("rf_model.pkl")
xgb_model = joblib.load("xgb_model.pkl")
svm_model = joblib.load("svm_model.pkl")
scaler = joblib.load("scaler.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# Load Soil CNN Model
try:
    soil_model = tf.keras.models.load_model("soil_model_cnn.h5")
    soil_classes = joblib.load("soil_classes.pkl")
except Exception as e:
    print("Warning: Soil CNN model or classes not found. Run train_soil_cnn.py first.")
    soil_model = None
    soil_classes = None

ph_mapping = {
    'Red Soil': 6.5,
    'Black Soil': 7.5,
    'Alluvial Soil': 6.8,
    'Laterite Soil': 5.5
}


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Extract input features
        features = [
            data["N"],
            data["P"],
            data["K"],
            data["temperature"],
            data["humidity"],
            data["ph"],
            data["rainfall"]
        ]

        # Convert to numpy array
        input_data = np.array([features])

        # Scale input
        input_scaled = scaler.transform(input_data)

        # Predict using all 4 models (Soft Voting Ensemble)
        ann_prob = model.predict(input_scaled)[0]
        rf_prob = rf_model.predict_proba(input_scaled)[0]
        xgb_prob = xgb_model.predict_proba(input_scaled)[0]
        svm_prob = svm_model.predict_proba(input_scaled)[0]

        # Average the probabilities
        ensemble_prob = (ann_prob + rf_prob + xgb_prob + svm_prob) / 4.0
        predicted_class = np.argmax(ensemble_prob)

        crop_name = label_encoder.inverse_transform([predicted_class])[0]

        return jsonify({
            "recommended_crop": crop_name
        })

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/predict-soil", methods=["POST"])
def predict_soil():
    if not soil_model or not soil_classes:
        return jsonify({"error": "Soil model not initialized"}), 500
        
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    try:
        file = request.files["image"]
        img = Image.open(file.stream).convert('RGB')
        img = img.resize((224, 224))  # Resize for ResNet50
        
        # Preprocess input as ResNet expects
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0) # Add batch dimension
        img_preprocessed = tf.keras.applications.resnet50.preprocess_input(img_array)
        
        # Predict using CNN
        prediction = soil_model.predict(img_preprocessed)
        predicted_class_index = np.argmax(prediction[0])
        soil_type = soil_classes.get(predicted_class_index, "Unknown Soil")
        
        # Assign a random plausible pH (as user requested)
        ph_val = round(np.random.uniform(5.5, 7.5), 1)
        
        return jsonify({
            "success": True,
            "soilType": soil_type,
            "ph": ph_val,
            "message": f"Detected {soil_type} from image. Plausible pH assigned: {ph_val}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001)