from flask import Flask, request, jsonify
import numpy as np
import joblib
import tensorflow as tf

app = Flask(__name__)

# Load saved model and preprocessing objects
model = tf.keras.models.load_model("crop_model.h5")
scaler = joblib.load("scaler.pkl")
label_encoder = joblib.load("label_encoder.pkl")


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


if __name__ == "__main__":
    app.run(port=6000)