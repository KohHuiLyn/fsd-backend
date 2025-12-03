import argparse
import os
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
import sagemaker
from sagemaker.inputs import TrainingInput
from sagemaker.tensorflow import TensorFlow


def parse_args():
    parser = argparse.ArgumentParser(
        description="Trigger SageMaker training and deployment."
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=int(os.getenv("TRAIN_EPOCHS", "5")),
        help="Number of epochs to train for.",
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Wait for training and deployment jobs to finish before exiting.",
    )
    return parser.parse_args()


def build_training_input(bucket: str, prefix: str) -> TrainingInput:
    s3_uri = f"s3://{bucket}/{prefix}".rstrip("/")
    return TrainingInput(s3_data=s3_uri, content_type="application/x-image")


def ensure_endpoint_exists(session: sagemaker.Session, endpoint_name: str) -> bool:
    try:
        session.sagemaker_client.describe_endpoint(EndpointName=endpoint_name)
        return True
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        if error_code == "ValidationException":
            return False
        if error_code == "ResourceNotFound":
            return False
        raise


def main():
    args = parse_args()

    required_env = [
        "AWS_REGION",
        "SAGEMAKER_EXECUTION_ROLE",
        "TRAINING_DATA_BUCKET",
        "TRAINING_DATA_PREFIX",
        "MODEL_ARTIFACT_BUCKET",
        "SAGEMAKER_ENDPOINT",
        "TRAIN_INSTANCE_TYPE",
        "ENDPOINT_INSTANCE_TYPE",
    ]
    missing = [key for key in required_env if not os.getenv(key)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    region = os.environ["AWS_REGION"]
    role = os.environ["SAGEMAKER_EXECUTION_ROLE"]
    training_bucket = os.environ["TRAINING_DATA_BUCKET"]
    training_prefix = os.environ["TRAINING_DATA_PREFIX"]
    artifact_bucket = os.environ["MODEL_ARTIFACT_BUCKET"].rstrip("/")
    endpoint_name = os.environ["SAGEMAKER_ENDPOINT"]
    train_instance_type = os.environ["TRAIN_INSTANCE_TYPE"]
    endpoint_instance_type = os.environ["ENDPOINT_INSTANCE_TYPE"]
    model_artifact_prefix = os.getenv("MODEL_ARTIFACT_PREFIX", "plant-doctor/models")
    framework_version = os.getenv("TENSORFLOW_FRAMEWORK_VERSION", "2.12")
    py_version = os.getenv("TENSORFLOW_PY_VERSION", "py39")
    metric_definition = os.getenv("SAGEMAKER_METRIC_NAME", "val:accuracy")

    session = sagemaker.session.Session(
        boto_session=boto3.Session(region_name=region),
        sagemaker_client=boto3.client("sagemaker", region_name=region),
        sagemaker_runtime_client=boto3.client("sagemaker-runtime", region_name=region),
    )

    job_stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    training_job_name = f"plant-doctor-train-{job_stamp}"
    model_name = f"{training_job_name}-model"

    # NOTE: We do NOT pass any S3 model_dir hyperparameter.
    # SageMaker's TensorFlow container will inject its own --model_dir (S3),
    # but our train.py will ignore it and instead save to SM_MODEL_DIR (/opt/ml/model).
    estimator = TensorFlow(
        entry_point="train.py",
        source_dir=".",  # directory that contains train.py
        role=role,
        framework_version=framework_version,
        py_version=py_version,
        instance_type=train_instance_type,
        instance_count=int(os.getenv("TRAIN_INSTANCE_COUNT", "1")),
        hyperparameters={
            "epochs": args.epochs,
        },
        output_path=f"s3://{artifact_bucket}/{model_artifact_prefix}",
        base_job_name=training_job_name,
        metric_definitions=[
            {"Name": metric_definition, "Regex": r"accuracy: ([0-9\.]+)"}
        ],
        sagemaker_session=session,
    )

    training_input = {
        "training": build_training_input(training_bucket, training_prefix)
    }
    estimator.fit(inputs=training_input, job_name=training_job_name, wait=True)

    model = estimator.create_model(
        name=model_name,
        role=role,
        entry_point="inference.py",
        source_dir=".",
    )

    endpoint_exists = ensure_endpoint_exists(session, endpoint_name)
    predictor = model.deploy(
        initial_instance_count=int(os.getenv("ENDPOINT_INSTANCE_COUNT", "1")),
        instance_type=endpoint_instance_type,
        endpoint_name=endpoint_name,
        wait=args.wait,
        update_endpoint=endpoint_exists,
    )

    print(
        f"SageMaker training job '{training_job_name}' completed. "
        f"Model '{model_name}' deployed to endpoint '{predictor.endpoint_name}'."
    )


if __name__ == "__main__":
    main()
