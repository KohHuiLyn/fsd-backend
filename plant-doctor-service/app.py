from flask import Flask, request, jsonify
import boto3
import numpy as np
from PIL import Image
from io import BytesIO
import json
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env into os.environ

app = Flask(__name__)

# AWS SageMaker setup
REGION = os.environ["AWS_REGION"]
ENDPOINT_NAME = os.environ["SAGEMAKER_ENDPOINT"]


runtime = boto3.client("sagemaker-runtime", region_name=REGION)

# class labels (from your training order)
LABELS = [
    "complex",
    "frog_eye_leaf_spot",
    "healthy",
    "multiple_diseases",
    "powdery_mildew",
    "rust",
    "scab",
]


@app.route("/")
def home():
    return jsonify({"message": "🌿 Plant Doctor API is running!"})


@app.route("/plant_buddy/predict", methods=["POST"])
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    img = Image.open(BytesIO(file.read())).resize((180, 180))
    x = np.expand_dims(
        np.array(img), axis=0
    )  # no /255 if Rescaling(1/255) already in model
    payload = json.dumps({"instances": x.tolist()})

    try:
        response = runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME, ContentType="application/json", Body=payload
        )
        result = json.loads(response["Body"].read().decode())
        pred = result["predictions"][0]

        predicted_label = LABELS[np.argmax(pred)]
        confidence = float(np.max(pred))

        return jsonify(
            {
                "predicted_class": predicted_label,
                "confidence": round(confidence * 100, 2),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
