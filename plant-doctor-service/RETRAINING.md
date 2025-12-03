## Automated SageMaker Retraining

This service can now retrain and redeploy the Plant Doctor model automatically when:

- new commits land on the `main` branch (via GitHub Actions), or
- new training data is added to the configured S3 bucket (via an optional S3 → Lambda trigger).

### 1. Required AWS resources

- **S3 bucket** containing your training dataset (`TRAINING_DATA_BUCKET` + `TRAINING_DATA_PREFIX`).
- **S3 bucket** to store model artifacts (`MODEL_ARTIFACT_BUCKET`).
- **IAM execution role** with permissions for SageMaker training and deployment (`SAGEMAKER_EXECUTION_ROLE`).
- **Existing SageMaker endpoint name** that the Flask service calls (`SAGEMAKER_ENDPOINT`). The retraining flow updates this endpoint in place so the Flask lookup remains unchanged.

### 2. GitHub secrets

Populate the following repository secrets so `.github/workflows/retrain.yml` can run without manual input:

| Secret | Description |
| --- | --- |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | Temporary or long-lived credentials scoped for SageMaker |
| `AWS_REGION` | Region that hosts SageMaker and S3 resources |
| `SAGEMAKER_EXECUTION_ROLE` | Full ARN of the role for training/deployment |
| `TRAINING_DATA_BUCKET`, `TRAINING_DATA_PREFIX` | Location of training data |
| `MODEL_ARTIFACT_BUCKET`, `MODEL_ARTIFACT_PREFIX` | Where trained models are stored |
| `SAGEMAKER_ENDPOINT` | Name of the endpoint to update |
| `TRAIN_INSTANCE_TYPE`, `TRAIN_INSTANCE_COUNT` | SageMaker training configuration |
| `ENDPOINT_INSTANCE_TYPE`, `ENDPOINT_INSTANCE_COUNT` | Hosting configuration |
| `TRAIN_EPOCHS` | Default epochs (optional) |
| `TENSORFLOW_FRAMEWORK_VERSION`, `TENSORFLOW_PY_VERSION` | Framework currently `2.12` / `py39` |

Pushes to `main` (or manual `workflow_dispatch`) will:

1. Package the `plant-doctor-service` directory.
2. Start a SageMaker training job using `train.py`.
3. Save the new model artifacts to S3.
4. Deploy or update the configured endpoint with the new weights.

### 3. Optional dataset upload trigger

Use the `infra/dataset_upload_lambda.py` handler to kick off the same GitHub workflow whenever new data lands in S3.

1. Deploy the Lambda with an environment:
   - `GITHUB_TOKEN`: PAT with `repo` scope.
   - `GITHUB_OWNER`, `GITHUB_REPO`: repository coordinates.
   - `GITHUB_EVENT_TYPE`: defaults to `dataset-upload`.
2. Wire the Lambda to an S3 `ObjectCreated:*` notification on your training data bucket.
3. Add a second trigger block to `.github/workflows/retrain.yml` if you want distinct behaviour:

```yaml
on:
  repository_dispatch:
    types: [dataset-upload]
```

With the dispatch in place, every dataset upload will call the same SageMaker training + deployment flow. The Flask API automatically serves the refreshed model because the endpoint name is unchanged.

