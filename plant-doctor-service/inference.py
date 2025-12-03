import json
import os

import numpy as np
import tensorflow as tf


def model_fn(model_dir: str):
    model_path = os.path.join(model_dir, "model")
    return tf.keras.models.load_model(model_path)


def input_fn(request_body, content_type):
    if content_type == "application/json":
        payload = json.loads(request_body)
        instances = payload.get("instances")
        if instances is None:
            raise ValueError("Missing 'instances' key in request payload.")
        return np.array(instances, dtype=np.float32)
    raise ValueError(f"Unsupported content type: {content_type}")


def predict_fn(input_data, model):
    return model.predict(input_data)


def output_fn(prediction, content_type):
    if content_type == "application/json":
        return json.dumps({"predictions": prediction.tolist()})
    raise ValueError(f"Unsupported content type: {content_type}")
