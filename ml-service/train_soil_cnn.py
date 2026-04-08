import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
import joblib

# Set dataset paths - located in root directory
TRAIN_DATA_PATH = "../train_data"
TEST_DATA_PATH = "../test"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

def main():
    if not os.path.exists(TRAIN_DATA_PATH) or not os.path.exists(TEST_DATA_PATH):
        print(f"Dataset paths {TRAIN_DATA_PATH} or {TEST_DATA_PATH} not found. Please place them in the root folder before running.")
        return

    # Data Augmentation and Loading
    train_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.resnet50.preprocess_input,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )
    
    test_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.resnet50.preprocess_input
    )

    print("Loading training data...")
    train_generator = train_datagen.flow_from_directory(
        TRAIN_DATA_PATH,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    print("Loading validation (test) data...")
    validation_generator = test_datagen.flow_from_directory(
        TEST_DATA_PATH,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    if train_generator.samples == 0:
        print("No images found in the train folder. Make sure folders are organized by class.")
        return

    # Save the class indices so we can inverse map during prediction
    class_indices = train_generator.class_indices
    class_names = {v: k for k, v in class_indices.items()}
    joblib.dump(class_names, "soil_classes.pkl")
    print(f"Saved class mapping: {class_names}")

    num_classes = len(class_names)

    # Base Model (Transfer Learning from ResNet50)
    base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

    # Freeze base model layers initially
    for layer in base_model.layers:
        layer.trainable = False

    # Add custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(optimizer=Adam(learning_rate=0.001), loss='categorical_crossentropy', metrics=['accuracy'])

    print("Training model (head only)...")
    model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=validation_generator
    )

    print("Saving the CNN model...")
    model.save("soil_model_cnn.h5")
    print("Model saved to soil_model_cnn.h5 successfully.")

if __name__ == "__main__":
    main()
