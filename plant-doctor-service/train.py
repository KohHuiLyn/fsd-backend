import argparse
import os

import tensorflow as tf

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)

    # SageMaker's TensorFlow container will still pass a --model_dir argument
    # pointing at S3, but we will ignore it and instead use SM_MODEL_DIR.
    parser.add_argument("--model_dir", type=str, default=None)
    args = parser.parse_args()

    # Load training data from /opt/ml/input/data/training
    data_dir = "/opt/ml/input/data/training"
    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        image_size=(180, 180),
        batch_size=32,
        color_mode="rgb",
    )

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Rescaling(1.0 / 255, input_shape=(180, 180, 3)),
            tf.keras.layers.Conv2D(4, 3, activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(7, activation="softmax"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    class AccuracyLogger(tf.keras.callbacks.Callback):
        def on_epoch_end(self, epoch, logs=None):
            logs = logs or {}
            accuracy = logs.get("accuracy")
            if accuracy is not None:
                print(f"accuracy: {accuracy:.4f}")

    # Train only on a small subset for speed in demo
    model.fit(train_ds.take(2), epochs=args.epochs, callbacks=[AccuracyLogger()])

    # === IMPORTANT PART: save to a LOCAL directory ===
    # SageMaker sets SM_MODEL_DIR (usually /opt/ml/model),
    # and will automatically upload this folder to S3 after training.
    model_dir = os.environ.get("SM_MODEL_DIR", "/opt/ml/model")
    os.makedirs(model_dir, exist_ok=True)
    print(f"Saving model to local directory: {model_dir}")
    model.save(model_dir)
