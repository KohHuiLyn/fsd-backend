## Deployment pipeline

This repository includes GitHub Actions workflows that automate building and deploying each service as a container to the ECS cluster.

For submission purposes, all workflows are **disabled** using `if: false`, but they are configured exactly as they would be in their respective service repositories. They have been consolidated under `.github/workflows` for easier review:

- `login-service-deploy.yml`
- `photo-service-deploy.yml`
- `proxy-service-deploy.yml`
- `reminder-service-deploy.yml`
- `scheduler-service-deploy.yml`
- `user-plants-service-deploy.yml`
- `user-service-deploy.yml`
