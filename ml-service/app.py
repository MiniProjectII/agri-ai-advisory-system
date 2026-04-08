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
scaler = joblib.load("scaler.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# Load Soil Color Model
try:
    soil_model = joblib.load("soil_model.pkl")
    soil_encoder = joblib.load("soil_encoder.pkl")
except Exception as e:
    print("Warning: Soil model not found. Run train_soil.py first.")
    soil_model = None
    soil_encoder = None

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

        # Predict
        prediction = model.predict(input_scaled)
        predicted_class = np.argmax(prediction)
        crop_name = label_encoder.inverse_transform([predicted_class])[0]

        return jsonify({
            "recommended_crop": crop_name
        })

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/predict-soil", methods=["POST"])
def predict_soil():
    if not soil_model:
        return jsonify({"error": "Soil model not initialized"}), 500
        
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    try:
        file = request.files["image"]
        img = Image.open(file.stream).convert('RGB')
        img = img.resize((50, 50))  # resize to speed up
        pixels = np.array(img).reshape(-1, 3)
        avg_color = pixels.mean(axis=0)
        
        input_data = np.array([avg_color])
        prediction = soil_model.predict(input_data)
        soil_type = soil_encoder.inverse_transform(prediction)[0]
        
        ph_val = ph_mapping.get(soil_type, 6.5)
        
        return jsonify({
            "success": True,
            "soilType": soil_type,
            "ph": ph_val,
            "message": f"Detected {soil_type} with typical pH {ph_val}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001)