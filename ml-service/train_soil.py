import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Synthetic data for Soil Colors [R, G, B]
# We generate some noise around average colors.

X = []
y = []

def generate_samples(base_rgb, label, count=50, noise=20):
    for _ in range(count):
        r = np.clip(np.random.normal(base_rgb[0], noise), 0, 255)
        g = np.clip(np.random.normal(base_rgb[1], noise), 0, 255)
        b = np.clip(np.random.normal(base_rgb[2], noise), 0, 255)
        X.append([r, g, b])
        y.append(label)

generate_samples([180, 70, 50], 'Red Soil')
generate_samples([40, 40, 40], 'Black Soil')
generate_samples([150, 140, 120], 'Alluvial Soil')
generate_samples([160, 80, 60], 'Laterite Soil')

X = np.array(X)
y = np.array(y)

# Encode Labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Train Random Forest Classifier
clf = RandomForestClassifier(n_estimators=50, random_state=42)
clf.fit(X, y_encoded)

# Save the model
joblib.dump(clf, "soil_model.pkl")
joblib.dump(le, "soil_encoder.pkl")

print("Soil Model Trained successfully against Random Forest Classifier! Saved models to disk.")
